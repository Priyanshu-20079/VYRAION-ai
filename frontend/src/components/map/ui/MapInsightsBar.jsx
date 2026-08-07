/**
 * MapInsightsBar.jsx
 * Bottom-left collapsible mini-dashboard with 4 stat chips.
 * Chips: Active Incidents | Units Deployed | Avg ETA | Coverage Gaps
 * Coverage Gaps = districts with zero available responder within 5km.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { AlertTriangle, Truck, Clock, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import L from 'leaflet';
import { CITY_FACILITIES } from '../../../data/incidents';

// Singapore districts/sectors — central points for coverage gap analysis
const SECTORS = [
  { name: 'Tuas', lat: 1.3190, lng: 103.6360 },
  { name: 'Jurong', lat: 1.3337, lng: 103.7431 },
  { name: 'Woodlands', lat: 1.4420, lng: 103.7850 },
  { name: 'Yishun', lat: 1.4280, lng: 103.8380 },
  { name: 'Central', lat: 1.3323, lng: 103.8580 },
  { name: 'Paya Lebar', lat: 1.3180, lng: 103.8830 },
  { name: 'Sengkang', lat: 1.3957, lng: 103.8932 },
  { name: 'Tampines', lat: 1.3530, lng: 103.9400 },
  { name: 'Changi', lat: 1.3644, lng: 103.9915 },
  { name: 'Marina Bay', lat: 1.2820, lng: 103.8590 },
];

function distKm(lat1, lng1, lat2, lng2) {
  return Math.hypot(lat1 - lat2, lng1 - lng2) * 111;
}

export default function MapInsightsBar({
  activeQueue = [],
  vehiclesStateRef,
  mapRef,
  coverageOverlayRef,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [highlightedChip, setHighlightedChip] = useState(null);

  // Compute stats
  const stats = useMemo(() => {
    const activeIncidents = activeQueue.filter(
      (i) => i.status !== 'RESOLVED' && i.status !== 'ARCHIVED' && i.stage !== 'RESOLVED'
    ).length;

    const vehicles = vehiclesStateRef?.current || [];
    const deployed = vehicles.filter(
      (v) => v.state === 'DISPATCHED' || v.state === 'ON_SCENE' || v.state === 'RETURNING'
    ).length;

    // Average ETA (simple estimate based on progress of dispatched vehicles)
    const dispatched = vehicles.filter((v) => v.state === 'DISPATCHED');
    let avgEta = '—';
    if (dispatched.length > 0) {
      const avgProgress = dispatched.reduce((s, v) => s + (v.segmentProgress || 0), 0) / dispatched.length;
      const remaining = Math.max(1, Math.round((1 - avgProgress) * 8)); // rough ~8 min baseline
      avgEta = `~${remaining} min`;
    }

    // Coverage gaps: sectors where no idle responder station is within 5km
    const idleStationIds = new Set(
      vehicles.filter((v) => v.state === 'IDLE').map((v) => v.stationId)
    );
    const availableFacilities = CITY_FACILITIES.filter(
      (f) => (f.category === 'hospital' || f.category === 'fire' || f.category === 'police') && idleStationIds.has(f.id)
    );

    const gaps = SECTORS.filter((sector) => {
      return !availableFacilities.some((f) => distKm(sector.lat, sector.lng, f.lat, f.lng) < 5);
    });

    return { activeIncidents, deployed, avgEta, gaps, gapCount: gaps.length };
  }, [activeQueue, vehiclesStateRef]);

  // Chip click handlers
  const handleChipClick = useCallback((chipId) => {
    setHighlightedChip((prev) => (prev === chipId ? null : chipId));
    const map = mapRef?.current;
    if (!map) return;

    // Remove existing coverage overlays
    if (coverageOverlayRef?.current) {
      coverageOverlayRef.current.forEach((layer) => map.removeLayer(layer));
      coverageOverlayRef.current = [];
    }

    if (chipId === 'gaps' && stats.gaps.length > 0) {
      const layers = stats.gaps.map((sector) =>
        L.circle([sector.lat, sector.lng], {
          radius: 5000,
          color: '#EF4444',
          weight: 1,
          fillColor: '#EF4444',
          fillOpacity: 0.08,
          dashArray: '6,4',
        }).addTo(map).bindTooltip(`⚠ Coverage Gap: ${sector.name}`, { sticky: true })
      );
      if (coverageOverlayRef) coverageOverlayRef.current = layers;
      // Auto-clear after 10s
      setTimeout(() => {
        layers.forEach((l) => { try { map.removeLayer(l); } catch (_) {} });
        if (coverageOverlayRef) coverageOverlayRef.current = [];
        setHighlightedChip(null);
      }, 10000);
    }
  }, [mapRef, coverageOverlayRef, stats.gaps]);

  const chips = [
    {
      id: 'incidents',
      icon: AlertTriangle,
      label: 'Active Incidents',
      value: stats.activeIncidents,
      color: stats.activeIncidents > 0 ? '#EF4444' : '#10B981',
    },
    {
      id: 'deployed',
      icon: Truck,
      label: 'Units Deployed',
      value: stats.deployed,
      color: stats.deployed > 0 ? '#33C8FF' : '#64748B',
    },
    {
      id: 'eta',
      icon: Clock,
      label: 'Avg ETA',
      value: stats.avgEta,
      color: '#F59E0B',
    },
    {
      id: 'gaps',
      icon: ShieldAlert,
      label: 'Coverage Gaps',
      value: stats.gapCount,
      color: stats.gapCount > 0 ? '#EF4444' : '#10B981',
    },
  ];

  if (isCollapsed) {
    return (
      <div
        onClick={() => setIsCollapsed(false)}
        style={{
          position: 'absolute',
          bottom: 48, left: 64, zIndex: 420,
          padding: '5px 10px', borderRadius: 8,
          background: 'rgba(6,9,20,0.9)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.08)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          color: '#64748B', fontSize: 9, fontFamily: 'monospace',
        }}
      >
        <ChevronUp size={10} /> Map Insights
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 48, left: 64, zIndex: 420,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {/* Collapse toggle */}
      <div
        onClick={() => setIsCollapsed(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          cursor: 'pointer', color: '#64748B', fontSize: 9, fontFamily: 'monospace',
          padding: '0 4px',
        }}
      >
        <ChevronDown size={10} /> Collapse
      </div>

      {/* Chips row */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {chips.map((chip) => {
          const Icon = chip.icon;
          const isActive = highlightedChip === chip.id;
          return (
            <div
              key={chip.id}
              onClick={() => handleChipClick(chip.id)}
              style={{
                padding: '6px 10px', borderRadius: 10,
                background: isActive ? `${chip.color}15` : 'rgba(6,9,20,0.92)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${isActive ? `${chip.color}50` : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={12} color={chip.color} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: chip.color, fontFamily: 'monospace', lineHeight: 1 }}>
                  {chip.value}
                </div>
                <div style={{ fontSize: 8, color: '#64748B', fontFamily: 'monospace', marginTop: 1 }}>
                  {chip.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
