/**
 * useVehicleMotionEngine.js
 * Single requestAnimationFrame loop driving all vehicle motion.
 * Vehicle positions are written directly to Leaflet marker objects (no React state per frame).
 * React state is only updated on discrete phase transitions.
 */
import { useEffect, useRef, useCallback } from 'react';
import { CITY_FACILITIES } from '../../../data/incidents';
import { getAmbulanceIcon, getCustomIcon } from '../MarkerFactory';
import L from 'leaflet';

const CRUISE_SPEED = 0.22;   // route-fraction per second at cruise (~10s total transit)
const WAYPOINT_PAUSE_MIN = 150; // ms pause at intermediate waypoints
const WAYPOINT_PAUSE_MAX = 300;


function computeBearing(lat1, lng1, lat2, lng2) {
  const dLng = lng2 - lng1;
  const dLat = lat2 - lat1;
  return ((Math.atan2(dLng, dLat) * 180 / Math.PI) + 360) % 360;
}

function easeSpeed(segProgress) {
  // Ease-out first 10%, cruise 10-90%, ease-in last 10%
  if (segProgress < 0.1) return CRUISE_SPEED * (0.3 + 7 * segProgress); // ramp up
  if (segProgress > 0.9) return CRUISE_SPEED * (1 - 6 * (segProgress - 0.9)); // ramp down
  return CRUISE_SPEED;
}

/**
 * @param {object} opts
 * @param {React.MutableRefObject} opts.vehicleLayerGroupRef  — Leaflet LayerGroup ref
 * @param {React.MutableRefObject} opts.vehiclesStateRef      — Array of vehicle state objects (ref, mutable)
 * @param {Array}  opts.activeQueue                           — current active incidents
 * @param {string|null} opts.selectedEntityId                — currently selected incident id (for follow)
 * @param {React.MutableRefObject} opts.followRef             — useRef(false) for follow-mode flag
 * @param {React.MutableRefObject} opts.mapRef                — Leaflet map instance ref
 * @param {function} opts.onPhaseChange                       — (vehicleId, phase) callback (for UI updates)
 * @param {boolean} opts.reducedMotion                        — respect prefers-reduced-motion
 */
export function useVehicleMotionEngine({
  vehicleLayerGroupRef,
  vehiclesStateRef,
  activeQueue,
  selectedEntityId,
  followRef,
  mapRef,
  onPhaseChange,
  reducedMotion = false,
  vehiclesVisible = true,
}) {
  const rafRef = useRef(null);
  const lastTsRef = useRef(null);
  // Map<vehicleId, { marker: L.Marker, ticketMarker: L.Marker|null }>
  const markerMapRef = useRef(new Map());
  const prevVehiclesVisibleRef = useRef(vehiclesVisible);
  // Track which incident IDs were previously approved to detect dispatch moment
  const prevApprovedRef = useRef(new Set());
  // idle parking offsets per station
  const idleCountsRef = useRef({});

  // ─── Sync vehicles from activeQueue (called when activeQueue changes) ────
  const syncVehicles = useCallback(() => {
    const activeIncKeys = new Set();

    activeQueue.forEach((inc) => {
      const incKey = inc.uniqueId || inc.instanceId || inc.id;
      activeIncKeys.add(incKey);
      const isApproved = inc.status === 'APPROVED' || (inc.phase != null && inc.phase >= 4);

      (inc.dispatchedUnits || []).forEach((du, duIdx) => {
        const assignedUnitId = `${incKey}_${duIdx}`;

        // Already assigned?
        let v = vehiclesStateRef.current.find((vh) => vh.assignedUnitId === assignedUnitId);

        if (!v) {
          // Find an idle vehicle of matching category
          const stationFac = CITY_FACILITIES.find((f) => f.name === du.stationName);
          const stationId = stationFac?.id;

          v = vehiclesStateRef.current.find(
            (vh) => vh.state === 'IDLE' && vh.category === du.category && vh.stationId === stationId
          ) || vehiclesStateRef.current.find(
            (vh) => vh.state === 'IDLE' && vh.category === du.category
          );

          if (v) {
            v.state = isApproved ? 'DISPATCHED' : 'STATIONARY_ALERT';
            v.assignedUnitId = assignedUnitId;
            v.incidentId = incKey;
            v.route = du.route || inc.route || [[1.3521, 103.8198], [1.3521, 103.8198]];
            v.segmentIndex = 0;
            v.segmentProgress = 0;
            v.waypointPauseMs = 0;
            v.bearing = 0;
            v.phase = isApproved ? 'departing' : 'stationary';
            v.eta = inc.eta || du.eta || '~8 min';
          }
        } else {
          // Existing vehicle — check if just approved
          if (isApproved && (v.state === 'STATIONARY_ALERT' || v.state === 'IDLE')) {
            v.state = 'DISPATCHED';
            v.phase = 'departing';
            onPhaseChange?.(v.id, 'departing');
          }
        }
      });
    });

    // Return vehicles whose incidents are now gone
    vehiclesStateRef.current.forEach((v) => {
      if (v.state === 'IDLE' || v.state === 'RETURNING') return;
      if (!activeIncKeys.has(v.incidentId)) {
        if (v.state === 'STATIONARY_ALERT') {
          v.state = 'IDLE';
          v.phase = 'idle';
          v.assignedUnitId = null;
          v.incidentId = null;
          v.route = null;
          // Remove marker so it redraws at station
          const entry = markerMapRef.current.get(v.id);
          if (entry && vehicleLayerGroupRef.current) {
            vehicleLayerGroupRef.current.removeLayer(entry.marker);
            markerMapRef.current.delete(v.id);
          }
        } else if (v.state === 'ON_SCENE' || v.state === 'DISPATCHED') {
          v.state = 'RETURNING';
          v.phase = 'returning';
          if (v.route && v.route.length > 1) {
            v.route = [...v.route].reverse();
            v.segmentIndex = 0;
            v.segmentProgress = 0;
          }
        }
      }
    });

    // Push vehicle state snapshot to parent immediately after sync
    // This ensures DashboardPage liveVehicles is populated right away,
    // not just on discrete phase transitions (departing → onscene → idle).
    onPhaseChange?.(null, 'sync');
  }, [activeQueue, vehicleLayerGroupRef, vehiclesStateRef, onPhaseChange]);

  // ─── Handle vehiclesVisible toggle ─────────────────────────────────────
  useEffect(() => {
    if (!prevVehiclesVisibleRef.current && vehiclesVisible) {
      // Toggled back on -> force resync
      syncVehicles();
    } else if (prevVehiclesVisibleRef.current && !vehiclesVisible) {
      // Toggled off -> remove all vehicle markers
      if (vehicleLayerGroupRef.current) {
        vehicleLayerGroupRef.current.clearLayers();
      }
      markerMapRef.current.clear();
    }
    prevVehiclesVisibleRef.current = vehiclesVisible;
  }, [vehiclesVisible, syncVehicles, vehicleLayerGroupRef]);

  // ─── Ensure a Leaflet marker exists for a vehicle, create if not ─────────
  const ensureMarker = useCallback((v, lat, lng) => {
    if (!vehicleLayerGroupRef.current || !vehiclesVisible) return null;
    const isMoving = v.state === 'DISPATCHED' || v.state === 'RETURNING';
    const icon = getAmbulanceIcon({
      bearing: Math.round((v.bearing || 0) / 15) * 15,
      phase: v.phase || 'idle',
      label: isMoving ? v.name : '',
    });
    const marker = L.marker([lat, lng], { icon, zIndexOffset: isMoving ? 700 : 300 });
    marker.addTo(vehicleLayerGroupRef.current);
    markerMapRef.current.set(v.id, { marker });
    return marker;
  }, [vehicleLayerGroupRef, vehiclesVisible]);

  // ─── Single rAF tick ─────────────────────────────────────────────────────
  const tick = useCallback((timestamp) => {
    rafRef.current = requestAnimationFrame(tick);
    if (!vehicleLayerGroupRef.current || !vehiclesVisible) return;

    if (!lastTsRef.current) lastTsRef.current = timestamp;
    const dt = Math.min((timestamp - lastTsRef.current) / 1000, 0.15); // cap delta
    lastTsRef.current = timestamp;

    if (reducedMotion) return; // reduced-motion: skip all animation, positions drawn by static render

    const idleCounts = {};

    vehiclesStateRef.current.forEach((v) => {
      // ── IDLE / STATIONARY_ALERT: ensure parked marker ─────────────────
      if (v.state === 'IDLE' || v.state === 'STATIONARY_ALERT') {
        const station = CITY_FACILITIES.find((f) => f.id === v.stationId);
        if (!station) return;
        const k = idleCounts[v.stationId] || 0;
        idleCounts[v.stationId] = k + 1;
        const angle = k * 0.95;
        const r = 0.0006;
        const lat = station.lat + r * Math.cos(angle);
        const lng = station.lng + r * Math.sin(angle);

        if (!markerMapRef.current.has(v.id)) {
          ensureMarker(v, lat, lng);
        }
        return;
      }

      // ── ON_SCENE: static marker, no motion ────────────────────────────
      if (v.state === 'ON_SCENE') return;

      // ── DISPATCHED / RETURNING ────────────────────────────────────────
      const route = v.route;
      if (!route || route.length < 2) return;
      const totalSegments = route.length - 1;

      // Waypoint pause
      if (v.waypointPauseMs > 0) {
        v.waypointPauseMs -= dt * 1000;
        return;
      }

      const segIdx = Math.min(v.segmentIndex || 0, totalSegments - 1);
      const subT = v.segmentProgress || 0;
      const speed = easeSpeed(subT);

      v.segmentProgress = Math.min(1.0, subT + dt * speed);

      if (v.segmentProgress >= 1.0) {
        const nextSeg = segIdx + 1;

        if (nextSeg >= totalSegments) {
          // Arrived at destination
          v.segmentProgress = 1.0;
          const p = route[totalSegments];
          const marker = markerMapRef.current.get(v.id)?.marker;
          if (marker) marker.setLatLng([p[0], p[1]]);

          if (v.state === 'DISPATCHED') {
            v.state = 'ON_SCENE';
            v.phase = 'onscene';
            // Bounce animation
            if (marker?._icon) {
              marker._icon.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
              marker._icon.style.transform = 'scale(1.5)';
              setTimeout(() => { if (marker._icon) { marker._icon.style.transform = 'scale(1)'; } }, 420);
            }
            onPhaseChange?.(v.id, 'onscene');
          } else if (v.state === 'RETURNING') {
            v.state = 'IDLE';
            v.phase = 'idle';
            v.assignedUnitId = null;
            v.incidentId = null;
            v.route = null;
            v.segmentIndex = 0;
            v.segmentProgress = 0;
            onPhaseChange?.(v.id, 'idle');
            // Fade out and remove marker
            const entry = markerMapRef.current.get(v.id);
            if (entry && vehicleLayerGroupRef.current) {
              if (entry.marker._icon) {
                entry.marker._icon.style.transition = 'opacity 0.4s';
                entry.marker._icon.style.opacity = '0';
              }
              setTimeout(() => {
                if (vehicleLayerGroupRef.current) {
                  vehicleLayerGroupRef.current.removeLayer(entry.marker);
                }
                markerMapRef.current.delete(v.id);
              }, 420);
            }
          }
          return;
        }

        v.segmentProgress = 0;
        v.segmentIndex = nextSeg;
        v.waypointPauseMs = WAYPOINT_PAUSE_MIN + Math.random() * (WAYPOINT_PAUSE_MAX - WAYPOINT_PAUSE_MIN);
      }

      // Compute current lat/lng
      const curSeg = Math.min(v.segmentIndex || 0, totalSegments - 1);
      const p1 = route[curSeg];
      const p2 = route[curSeg + 1] || route[curSeg];
      const t = v.segmentProgress || 0;
      const lat = p1[0] + (p2[0] - p1[0]) * t;
      const lng = p1[1] + (p2[1] - p1[1]) * t;

      // Update or create marker
      let marker = markerMapRef.current.get(v.id)?.marker;
      if (!marker) {
        marker = ensureMarker(v, lat, lng);
      } else {
        marker.setLatLng([lat, lng]);
      }

      // Update bearing
      const newBearing = computeBearing(p1[0], p1[1], p2[0], p2[1]);
      const bearingDiff = Math.abs(((newBearing - (v.bearing || 0) + 540) % 360) - 180);
      if (bearingDiff > 10 && marker) {
        v.bearing = newBearing;
        const snapBear = Math.round(newBearing / 15) * 15;
        marker.setIcon(getAmbulanceIcon({ bearing: snapBear, phase: v.phase || 'dispatched', label: v.name }));
      }

      // Follow mode: check both selected incident ID and selected vehicle ID
      const isTracked = selectedEntityId && (selectedEntityId === v.incidentId || selectedEntityId === v.id);
      if (followRef?.current && isTracked && mapRef?.current) {
        mapRef.current.panTo([lat, lng], { animate: true, duration: 0.5 });
      }
    });
  }, [vehicleLayerGroupRef, vehiclesStateRef, selectedEntityId, followRef, mapRef, onPhaseChange, reducedMotion, ensureMarker, vehiclesVisible]);

  // ── Start/stop rAF loop ──────────────────────────────────────────────────
  useEffect(() => {
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [tick]);

  // ── Sync vehicle assignments when activeQueue changes ────────────────────
  useEffect(() => {
    syncVehicles();
  }, [activeQueue, syncVehicles]);

  // ── Expose marker map for external access (e.g. selection highlighting) ──
  return { markerMapRef, syncVehicles };
}
