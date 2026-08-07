import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass, RotateCcw, ShieldAlert, CheckCircle2, EyeOff,
  AlertTriangle, Navigation, Radio, MapPin, Maximize2, Minimize2,
  Plus, Minus, Layers, Cpu, Activity, Clock, ShieldCheck, Play, History,
  ChevronRight, Sparkles, X, Truck, Hospital, Siren, ArrowRight, Loader2, Target,
  ChevronUp, ChevronDown, Filter, SlidersHorizontal, Cloud, CloudRain, Locate
} from 'lucide-react';

import { MASTER_INCIDENTS, CITY_FACILITIES, EXPRESSWAYS, SINGAPORE_HOTSPOTS, randomIncidentLocation, DISPATCH_UNITS } from '../../data/incidents';

// Sub-components & hooks
import LayersDock, { DEFAULT_CONFIG, loadConfig } from '../map/ui/LayersDock';
import IncidentContextDrawer from '../map/ui/IncidentContextDrawer';
import TimelineStrip from '../map/ui/TimelineStrip';
import MapInsightsBar from '../map/ui/MapInsightsBar';
import ContextMenu from '../map/ui/ContextMenu';
import { useVehicleMotionEngine } from '../map/hooks/useVehicleMotionEngine';
import {
  getHospitalIcon, getFireIcon, getPoliceIcon, getInfraIcon,
  getWeatherSensorIcon, getIncidentIcon, getHazmatIcon, getCCTVIcon,
  getParksIcon, getClusterIcon, getSelectionRingIcon, getDispatchTicketIcon,
  getAmbulanceIcon, getCustomIcon,
} from '../map/MarkerFactory';

// ─── CCTV Feed data from aiVisionEngine ─────────────────────────────────────
let CCTV_FEEDS_DATA = [];
try {
  const mod = require('../../utils/aiVisionEngine');
  if (mod && mod.CCTV_FEEDS) CCTV_FEEDS_DATA = mod.CCTV_FEEDS;
} catch (_) { /* optional dep */ }

// Singapore Expanded Geographic Bounds
const SINGAPORE_BOUNDS = [
  [1.05, 103.45],
  [1.58, 104.18]
];

/* ═══════════════════════════════════════════════════════════
   EXPORTED UTILITY FUNCTIONS (signatures preserved)
═══════════════════════════════════════════════════════════ */
export const findNearestResponders = (incLat, incLng) => {
  let nearestHospital = null, minHospDist = Infinity;
  let nearestPolice = null, minPoliceDist = Infinity;
  let nearestFire = null, minFireDist = Infinity;
  let nearestMrt = null, minMrtDist = Infinity;

  CITY_FACILITIES.forEach((fac) => {
    const dist = Math.hypot(fac.lat - incLat, fac.lng - incLng);
    if (fac.category === 'hospital' && dist < minHospDist) { minHospDist = dist; nearestHospital = fac; }
    else if (fac.category === 'police' && dist < minPoliceDist) { minPoliceDist = dist; nearestPolice = fac; }
    else if (fac.category === 'fire' && dist < minFireDist) { minFireDist = dist; nearestFire = fac; }
    else if (fac.category === 'infrastructure' && dist < minMrtDist) { minMrtDist = dist; nearestMrt = fac; }
  });

  return {
    hospital: nearestHospital || CITY_FACILITIES[0],
    police: nearestPolice || CITY_FACILITIES[2],
    fire: nearestFire || CITY_FACILITIES[3],
    mrt: nearestMrt || CITY_FACILITIES[5],
    hospDistanceKm: (minHospDist * 111).toFixed(1),
    policeDistanceKm: (minPoliceDist * 111).toFixed(1),
    fireDistanceKm: (minFireDist * 111).toFixed(1)
  };
};

export const getRealSingaporeLocation = (lat, lng) => {
  const responders = findNearestResponders(lat, lng);
  let road = 'Pan Island Expressway (PIE)', expressway = 'Central Expressway (CTE)',
      direction = 'Eastbound (Changi Corridor)', district = 'Sector 9 — Central Downtown',
      landmark = 'Marina Bay Financial Hub';

  if (lng < 103.72) {
    road = 'Tuas View Highway / Jurong Road'; expressway = 'Ayer Rajah Expressway (AYE Tuas)';
    direction = 'Westbound (Tuas Gateway)'; district = 'Sector 1 — Tuas Industrial Zone'; landmark = 'Tuas Mega Port & SCADA Complex';
  } else if (lng < 103.78) {
    if (lat > 1.38) {
      road = 'Woodlands Ave 12 / Kranji Expy'; expressway = 'Bukit Timah Expressway (BKE Exit 9)';
      direction = 'Northbound (Woodlands Causeway)'; district = 'Sector 5 — Woodlands Border Hub'; landmark = 'Woodlands Checkpoint Hub';
    } else {
      road = 'Ayer Rajah Expwy'; expressway = 'Pan Island Expressway (PIE Exit 28)';
      direction = 'Westbound (Jurong Lake District)'; district = 'Sector 4 — Jurong Commercial Hub'; landmark = 'Ng Teng Fong General Hospital';
    }
  } else if (lng < 103.85) {
    if (lat > 1.40) {
      road = 'Yishun Ave 2 / Sembawang Rd'; expressway = 'Seletar Expressway (SLE Exit 5)';
      direction = 'Northbound (Yishun Corridor)'; district = 'Sector 6 — Yishun Regional Hub'; landmark = 'Khoo Teck Puat Hospital';
    } else if (lat < 1.31) {
      road = 'Ayer Rajah Expwy'; expressway = 'Ayer Rajah Expressway (AYE Terminus)';
      direction = 'Southbound (Port Corridor)'; district = 'Sector 2 — Tanjong Pagar Maritime'; landmark = 'Singapore General Hospital (SGH)';
    } else {
      road = 'Orchard Rd / Paterson Flyover'; expressway = 'Central Expressway (CTE Junction 14)';
      direction = 'Central Corridor (City Hub)'; district = 'Sector 9 — Orchard Commercial District'; landmark = 'Ion Orchard & Tan Tock Seng';
    }
  } else if (lng < 103.92) {
    if (lat > 1.38) {
      road = 'Punggol Central / Sengkang East Rd'; expressway = 'Kallang-Paya Lebar Expressway (KPE Exit 10)';
      direction = 'North-East Corridor (Digital District)'; district = 'Sector 11 — Punggol Digital District'; landmark = 'Sengkang General Hospital';
    } else {
      road = 'Serangoon Rd / Paya Lebar Way'; expressway = 'Pan Island Expressway (PIE Exit 13)';
      direction = 'Central-East Corridor'; district = 'Sector 8 — Paya Lebar Regional Hub'; landmark = 'Paya Lebar SCADA Hub';
    }
  } else {
    road = 'Tampines Ave 4 / Changi Coast Rd'; expressway = 'Pan Island Expressway (PIE Eastbound)';
    direction = 'Eastbound (Changi Airport)'; district = 'Sector 12 — Changi Aviation Hub'; landmark = 'Jewel Changi Airport & CGH';
  }

  return {
    road, expressway, direction, district, landmark,
    hospital: `${responders.hospital.name} [${responders.hospDistanceKm} km]`,
    police: `${responders.police.name} [${responders.policeDistanceKm} km]`,
    fire: `${responders.fire.name} [${responders.fireDistanceKm} km]`,
    mrt: `${responders.mrt.name}`
  };
};

/* ═══════ Road Network Route Graph & Builder ═══════ */
const SINGAPORE_ROAD_GRAPH = [
  { id: 'tuas_pie', lat: 1.3190, lng: 103.6360, links: ['jurong_pie', 'tuas_aye'] },
  { id: 'tuas_aye', lat: 1.3150, lng: 103.6600, links: ['tuas_pie', 'clementi_aye'] },
  { id: 'jurong_pie', lat: 1.3340, lng: 103.7070, links: ['tuas_pie', 'bukit_timah_pie', 'clementi_aye'] },
  { id: 'clementi_aye', lat: 1.2950, lng: 103.7500, links: ['tuas_aye', 'jurong_pie', 'harbourfront_aye', 'bukit_timah_pie'] },
  { id: 'woodlands_sle', lat: 1.4350, lng: 103.7800, links: ['yishun_sle', 'bukit_timah_pie'] },
  { id: 'yishun_sle', lat: 1.4150, lng: 103.8200, links: ['woodlands_sle', 'ang_mo_kio_cte', 'sengkang_tpe'] },
  { id: 'bukit_timah_pie', lat: 1.3300, lng: 103.7800, links: ['jurong_pie', 'clementi_aye', 'central_pie', 'woodlands_sle'] },
  { id: 'ang_mo_kio_cte', lat: 1.3700, lng: 103.8400, links: ['yishun_sle', 'central_pie'] },
  { id: 'central_pie', lat: 1.3323, lng: 103.8580, links: ['bukit_timah_pie', 'ang_mo_kio_cte', 'tampines_pie', 'downtown_cte', 'punggol_kpe'] },
  { id: 'sengkang_tpe', lat: 1.3950, lng: 103.9000, links: ['yishun_sle', 'punggol_kpe', 'changi_tpe'] },
  { id: 'punggol_kpe', lat: 1.4000, lng: 103.9000, links: ['sengkang_tpe', 'central_pie', 'changi_tpe'] },
  { id: 'tampines_pie', lat: 1.3400, lng: 103.9580, links: ['central_pie', 'changi_tpe', 'bedok_ecp'] },
  { id: 'changi_tpe', lat: 1.3650, lng: 103.9880, links: ['tampines_pie', 'sengkang_tpe', 'bedok_ecp'] },
  { id: 'bedok_ecp', lat: 1.3250, lng: 103.9400, links: ['tampines_pie', 'changi_tpe', 'marina_ecp'] },
  { id: 'downtown_cte', lat: 1.2920, lng: 103.8490, links: ['central_pie', 'marina_ecp', 'harbourfront_aye'] },
  { id: 'marina_ecp', lat: 1.2820, lng: 103.8590, links: ['downtown_cte', 'bedok_ecp', 'harbourfront_aye'] },
  { id: 'harbourfront_aye', lat: 1.2750, lng: 103.8380, links: ['clementi_aye', 'downtown_cte', 'marina_ecp'] }
];

export const buildRoadNetworkRoute = (startLat, startLng, destLat, destLng) => {
  let closestStart = SINGAPORE_ROAD_GRAPH[0], minStartDist = Infinity;
  let closestDest = SINGAPORE_ROAD_GRAPH[0], minDestDist = Infinity;

  SINGAPORE_ROAD_GRAPH.forEach((node) => {
    const dStart = Math.hypot(node.lat - startLat, node.lng - startLng);
    if (dStart < minStartDist) { minStartDist = dStart; closestStart = node; }
    const dDest = Math.hypot(node.lat - destLat, node.lng - destLng);
    if (dDest < minDestDist) { minDestDist = dDest; closestDest = node; }
  });

  const queue = [[closestStart]];
  const visited = new Set([closestStart.id]);
  let foundPath = [closestStart];

  while (queue.length > 0) {
    const path = queue.shift();
    const curr = path[path.length - 1];
    if (curr.id === closestDest.id) { foundPath = path; break; }
    curr.links.forEach((neighborId) => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        const neighborNode = SINGAPORE_ROAD_GRAPH.find((n) => n.id === neighborId);
        if (neighborNode) queue.push([...path, neighborNode]);
      }
    });
  }

  const roadWaypoints = foundPath.map((n) => [n.lat, n.lng]);
  return [[startLat, startLng], ...roadWaypoints, [destLat, destLng]];
};

export const getDynamicIncidentLocation = (type, activeQueue = []) => {
  const lastLoc = activeQueue.length > 0 ? activeQueue[activeQueue.length - 1] : null;
  return randomIncidentLocation(lastLoc);
};

export const createDynamicIncident = (type, activeQueue = []) => {
  const def = MASTER_INCIDENTS[type] || MASTER_INCIDENTS.traffic;
  const dynLoc = getDynamicIncidentLocation(type, activeQueue);
  const responders = findNearestResponders(dynLoc.lat, dynLoc.lng);
  const unitSpecs = DISPATCH_UNITS[type] || DISPATCH_UNITS.traffic;

  const dispatchedUnits = unitSpecs.map((u, idx) => {
    let station = responders.police;
    if (u.category === 'hospital') station = responders.hospital;
    else if (u.category === 'fire') station = responders.fire;
    else if (u.category === 'infrastructure') station = CITY_FACILITIES.find(f => f.category === 'infrastructure') || responders.police;
    const route = buildRoadNetworkRoute(station.lat, station.lng, dynLoc.lat, dynLoc.lng);
    return { unitId: `unit_${type}_${idx}_${Date.now()}`, name: u.name, type: u.type, icon: u.icon, stationName: station.name, originLat: station.lat, originLng: station.lng, route };
  });

  const primaryUnit = dispatchedUnits[0] || { icon: '🚑', name: 'Emergency Response' };
  const uniqueIncId = `INC-${Date.now().toString().slice(-6)}-${type.toUpperCase()}`;

  return {
    ...def, instanceId: uniqueIncId, id: type, uniqueId: uniqueIncId,
    lat: dynLoc.lat, lng: dynLoc.lng, hotspot: dynLoc.hotspot,
    dispatchedUnits, route: primaryUnit.route, vehicleIcon: primaryUnit.icon,
    vehicleName: primaryUnit.name,
    nearestHospital: responders.hospital.name, nearestPolice: responders.police.name,
    nearestFire: responders.fire.name, nearestMrt: responders.mrt.name,
    status: 'AWAITING_APPROVAL', stage: 'NEW',
    detectedAtTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    createdAt: Date.now()
  };
};

/* ═══════ Internal constants ═══════ */
const CCTV_CAMERAS = [
  { id: 'cam_01', name: 'CAM-01 (CTE/PIE Interchange)', lat: 1.3323, lng: 103.8580, facing: 45 },
  { id: 'cam_02', name: 'CAM-02 (Orchard Crossing)', lat: 1.3048, lng: 103.8318, facing: 180 },
  { id: 'cam_03', name: 'CAM-03 (Marina Bay Boulevard)', lat: 1.2820, lng: 103.8590, facing: 90 },
  { id: 'cam_04', name: 'CAM-04 (Jurong Gateway)', lat: 1.3337, lng: 103.7431, facing: 0 },
  { id: 'cam_05', name: 'CAM-05 (Changi Coast Road)', lat: 1.3644, lng: 103.9915, facing: 270 },
  { id: 'cam_06', name: 'CAM-06 (Woodlands Checkpoint)', lat: 1.4420, lng: 103.7850, facing: 0 },
  { id: 'cam_07', name: 'CAM-07 (Tampines Ave 4)', lat: 1.3530, lng: 103.9400, facing: 135 },
  { id: 'cam_08', name: 'CAM-08 (Yishun Ring Rd)', lat: 1.4280, lng: 103.8380, facing: 210 },
  { id: 'cam_09', name: 'CAM-09 (Bishan Junction)', lat: 1.3526, lng: 103.8352, facing: 315 },
  { id: 'cam_10', name: 'CAM-10 (Sentosa Gateway)', lat: 1.2494, lng: 103.8303, facing: 60 },
];

const WEATHER_RAIN_CELLS = [
  { name: 'Monsoon Rain Cell A (West Region)', coords: [[1.3500,103.6800],[1.3800,103.7200],[1.3300,103.7600],[1.2900,103.7100]] },
  { name: 'Monsoon Rain Cell B (East Region)', coords: [[1.3800,103.9200],[1.4100,103.9600],[1.3500,104.0100],[1.3200,103.9500]] },
];

const WEATHER_SENSORS = [
  { name: 'West Sensor (Jurong)', lat: 1.3300, lng: 103.7200, temp: 28, humidity: 85, wind: '12 kt SW' },
  { name: 'Central Sensor (Bishan)', lat: 1.3500, lng: 103.8400, temp: 29, humidity: 80, wind: '9 kt S' },
  { name: 'East Sensor (Changi)', lat: 1.3600, lng: 103.9800, temp: 27, humidity: 88, wind: '15 kt SSW' },
];

const SEVERITY_RADIUS = { LOW: 400, NORMAL: 400, MEDIUM: 650, ELEVATED: 650, HIGH: 900, CRITICAL: 1200 };
const SEV_COLOR = { LOW: '#10B981', NORMAL: '#10B981', MEDIUM: '#F59E0B', ELEVATED: '#F59E0B', HIGH: '#EF4444', CRITICAL: '#EF4444' };

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function SingaporeSatelliteMap({ activeQueue = [], onVehicleStateChange }) {
  // ─── Refs ──────────────────────────────────────────────────────────────────
  const mapElementRef = useRef(null);
  const cardSlotRef = useRef(null);
  const portalSlotRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  // Layer groups (one per layer type)
  const stationLayerRef = useRef(null);
  const incidentLayerRef = useRef(null);
  const haloLayerRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const weatherLayerRef = useRef(null);
  const cctvLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const selectionRingRef = useRef(null);
  const coverageOverlayRef = useRef([]);
  const vehicleLayerGroupRef = useRef(null);
  const vehiclesStateRef = useRef([]);
  const followRef = useRef(false);
  const longPressTimerRef = useRef(null);

  // ─── State ─────────────────────────────────────────────────────────────────
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [baseTileStyle, setBaseTileStyle] = useState('satellite');
  const [selectedEntity, setSelectedEntity] = useState(null); // {type, id}
  const [expandedDock, setExpandedDock] = useState(null);
  const [layerConfig, setLayerConfig] = useState(loadConfig);
  const [contextMenu, setContextMenu] = useState(null);
  const [resolvedGhosts, setResolvedGhosts] = useState([]);
  const [isFollowActive, setIsFollowActive] = useState(false);
  const [showLiveRoutes, setShowLiveRoutes] = useState(true);
  const [showIncidentLabels, setShowIncidentLabels] = useState(true);
  const [, forceUpdate] = useState(0); // for periodic re-render of layers

  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  ).current;

  const [weather] = useState({ tempC: 29, condition: 'Cloudy' });
  const [currentTime, setCurrentTime] = useState(new Date());

  // ─── Derived ───────────────────────────────────────────────────────────────
  const selectedIncidentId = selectedEntity?.type === 'incident' ? selectedEntity.id : null;

  // ─── Time updates ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ─── Reasoning logs (synth from current state) ────────────────────────────
  const reasoningLogs = useMemo(() => {
    const logs = [];
    activeQueue.forEach((inc) => {
      const incKey = inc.uniqueId || inc.instanceId || inc.id;
      const loc = getRealSingaporeLocation(inc.lat || 1.3323, inc.lng || 103.8580);
      logs.push(
        { time: inc.detectedAtTime || '—', text: `Incident detected: ${inc.name || inc.id} at ${loc.road}`, incidentId: incKey, lat: inc.lat, lng: inc.lng },
        { time: inc.detectedAtTime || '—', text: `Nearest responders: Hospital ${loc.hospital}, Fire ${loc.fire}`, incidentId: incKey },
        { time: inc.detectedAtTime || '—', text: `Dispatch blueprint generated by Nova Decision Engine`, incidentId: incKey },
      );
    });
    return logs;
  }, [activeQueue]);

  // ─── Create map element ────────────────────────────────────────────────────
  if (typeof window !== 'undefined' && !mapElementRef.current) {
    const el = document.createElement('div');
    el.style.cssText = 'width:100%;height:100%;position:relative;min-height:100%;background:#070B14';
    mapElementRef.current = el;
  }

  // ─── Keyboard listeners ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (isFullScreen) setIsFullScreen(false);
        else if (selectedEntity) setSelectedEntity(null);
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullScreen, selectedEntity]);

  // ─── DOM re-parenting for fullscreen ───────────────────────────────────────
  useEffect(() => {
    const mapEl = mapElementRef.current;
    if (!mapEl) return;
    if (isFullScreen && portalSlotRef.current) portalSlotRef.current.appendChild(mapEl);
    else if (!isFullScreen && cardSlotRef.current) cardSlotRef.current.appendChild(mapEl);
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 50);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 200);
    }
  }, [isFullScreen]);

  // ─── Initialize Leaflet map ONCE ───────────────────────────────────────────
  useEffect(() => {
    const mapEl = mapElementRef.current;
    if (!mapEl || mapInstanceRef.current) return;
    if (cardSlotRef.current && !mapEl.parentNode) cardSlotRef.current.appendChild(mapEl);

    const map = L.map(mapEl, {
      center: [1.3521, 103.8198], zoom: 11, minZoom: 9, maxZoom: 18,
      maxBounds: SINGAPORE_BOUNDS, maxBoundsViscosity: 0.3,
      zoomControl: false, scrollWheelZoom: true, doubleClickZoom: true, touchZoom: true, dragging: true,
    });

    const esriTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 18, attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS'
    });
    esriTile.on('tileloadstart', () => setIsMapLoading(true));
    esriTile.on('load', () => setIsMapLoading(false));
    esriTile.on('tileerror', () => setIsMapLoading(false));
    esriTile.addTo(map);
    tileLayerRef.current = esriTile;

    // Create all layer groups
    stationLayerRef.current = L.layerGroup().addTo(map);
    incidentLayerRef.current = L.layerGroup().addTo(map);
    haloLayerRef.current = L.layerGroup().addTo(map);
    trafficLayerRef.current = L.layerGroup().addTo(map);
    weatherLayerRef.current = L.layerGroup().addTo(map);
    cctvLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    heatmapLayerRef.current = L.layerGroup().addTo(map);
    vehicleLayerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Click empty map → deselect
    map.on('click', (e) => {
      if (!e.originalEvent.defaultPrevented) {
        setSelectedEntity(null);
        setContextMenu(null);
      }
    });

    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, []);

  // ─── Initialize vehicle fleet ──────────────────────────────────────────────
  useEffect(() => {
    if (vehiclesStateRef.current.length > 0) return;
    vehiclesStateRef.current = [
      { id: 'v_ntf_1', name: 'Ambulance NTF-1', icon: '🚑', category: 'hospital', stationId: 'ng_teng_fong', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_ntf_2', name: 'Ambulance NTF-2', icon: '🚑', category: 'hospital', stationId: 'ng_teng_fong', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_nuh_1', name: 'Ambulance NUH-1', icon: '🚑', category: 'hospital', stationId: 'nuh', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_sgh_1', name: 'Ambulance SGH-1', icon: '🚑', category: 'hospital', stationId: 'sgh', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_sgh_2', name: 'Battery Truck SGH', icon: '🔋', category: 'infrastructure', stationId: 'sgh', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_ttsh_1', name: 'Ambulance TTSH-1', icon: '🚑', category: 'hospital', stationId: 'ttsh', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_ktph_1', name: 'Ambulance KTPH-1', icon: '🚑', category: 'hospital', stationId: 'ktph', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_cgh_1', name: 'Ambulance CGH-1', icon: '🚑', category: 'hospital', stationId: 'changi_gen', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_skh_1', name: 'Ambulance SKH-1', icon: '🚑', category: 'hospital', stationId: 'sengkang_gen', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_jfs_1', name: 'Fire Engine JFS-1', icon: '🚒', category: 'fire', stationId: 'jurong_fire', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_jfs_2', name: 'Hazmat Engine JFS-2', icon: '☣️', category: 'fire', stationId: 'jurong_fire', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_tfs_1', name: 'Foam Tender TFS-1', icon: '🚒', category: 'fire', stationId: 'tuas_fire', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_cfs_1', name: 'Fire Engine CFS-1', icon: '🚒', category: 'fire', stationId: 'central_fire', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_yfs_1', name: 'Fire Engine YFS-1', icon: '🚒', category: 'fire', stationId: 'yishun_fire', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_sfs_1', name: 'Rescue Bike SFS-1', icon: '🏍️', category: 'fire', stationId: 'sengkang_fire', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_chf_1', name: 'Crash Tender CHF-1', icon: '🚒', category: 'fire', stationId: 'changi_fire', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_jpl_1', name: 'Patrol Cruiser Jpl-1', icon: '🚔', category: 'police', stationId: 'jurong_police', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_jpl_2', name: 'Patrol Cruiser Jpl-2', icon: '🚔', category: 'police', stationId: 'jurong_police', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_bpl_1', name: 'Patrol Cruiser Bpl-1', icon: '🚔', category: 'police', stationId: 'bedok_police', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_wpl_1', name: 'Patrol Cruiser Wpl-1', icon: '🚔', category: 'police', stationId: 'woodlands_police', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_ppl_1', name: 'Drone Carrier Ppl-1', icon: '🚔', category: 'police', stationId: 'punggol_police', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_util_1', name: 'SCADA Power Crew', icon: '⚡', category: 'infrastructure', stationId: 'jurong_island_scada', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
      { id: 'v_util_2', name: 'Grid Substation Crew', icon: '⚡', category: 'infrastructure', stationId: 'marina_scada', state: 'IDLE', segmentProgress: 0, segmentIndex: 0, bearing: 0, phase: 'idle' },
    ];
  }, []);

  // ─── Vehicle Motion Engine ─────────────────────────────────────────────────
  const handlePhaseChange = useCallback((vehicleId, phase) => {
    onVehicleStateChange?.([...vehiclesStateRef.current]);
    forceUpdate((n) => n + 1); // trigger re-render for UI state updates
  }, [onVehicleStateChange]);

  useVehicleMotionEngine({
    vehicleLayerGroupRef,
    vehiclesStateRef,
    activeQueue,
    selectedEntityId: selectedEntity?.id || selectedIncidentId,
    followRef,
    mapRef: mapInstanceRef,
    onPhaseChange: handlePhaseChange,
    reducedMotion,
    vehiclesVisible: layerConfig.vehicles?.visible ?? true,
  });

  // ─── Tile switcher ─────────────────────────────────────────────────────────
  const handleToggleBaseTile = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    if (baseTileStyle === 'satellite') {
      const darkTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 18, subdomains: 'abcd', attribution: '&copy; CartoDB' }).addTo(map);
      tileLayerRef.current = darkTile;
      setBaseTileStyle('dark');
    } else {
      const esriTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 18, attribution: 'Tiles &copy; Esri' }).addTo(map);
      tileLayerRef.current = esriTile;
      setBaseTileStyle('satellite');
    }
  }, [baseTileStyle]);

  // ─── Map actions ───────────────────────────────────────────────────────────
  const handleResetMap = useCallback(() => { mapInstanceRef.current?.setView([1.3521, 103.8198], 11, { animate: true }); }, []);
  const handleZoomIn = useCallback(() => { mapInstanceRef.current?.zoomIn(); }, []);
  const handleZoomOut = useCallback(() => { mapInstanceRef.current?.zoomOut(); }, []);
  const handleLocate = useCallback(() => {
    if (activeQueue.length > 0 && selectedIncidentId) {
      const inc = activeQueue.find((i) => (i.uniqueId || i.instanceId || i.id) === selectedIncidentId || i.id === selectedIncidentId);
      if (inc) mapInstanceRef.current?.setView([inc.lat || 1.3323, inc.lng || 103.8580], 14.5, { animate: true });
    } else { handleResetMap(); }
  }, [activeQueue, selectedIncidentId, handleResetMap]);

  const handleCenterIncident = useCallback(() => {
    const selectedInc = activeQueue.find((i) => (i.uniqueId || i.instanceId || i.id) === selectedIncidentId || i.id === selectedIncidentId);
    if (selectedInc) {
      mapInstanceRef.current?.flyTo([selectedInc.lat || 1.3323, selectedInc.lng || 103.8580], 14.5, { animate: true, duration: 0.8 });
    } else if (activeQueue.length > 0) {
      const firstInc = activeQueue[0];
      mapInstanceRef.current?.flyTo([firstInc.lat || 1.3323, firstInc.lng || 103.8580], 14.5, { animate: true, duration: 0.8 });
    }
  }, [activeQueue, selectedIncidentId]);

  const handleToggleFollow = useCallback(() => {
    followRef.current = !followRef.current;
    setIsFollowActive(followRef.current);
  }, []);

  const handleFlyTo = useCallback((lat, lng) => {
    if (lat && lng && mapInstanceRef.current) mapInstanceRef.current.flyTo([lat, lng], 14, { animate: true, duration: 0.8 });
  }, []);

  // ─── Context menu actions ──────────────────────────────────────────────────
  const handleContextAction = useCallback((entityType, entityId, actionId) => {
    if (actionId === 'view' || actionId === 'roster') {
      setSelectedEntity({ type: entityType, id: entityId });
    } else if (actionId === 'recall') {
      const v = vehiclesStateRef.current.find((vh) => vh.id === entityId);
      if (v && v.route) {
        v.state = 'RETURNING';
        v.phase = 'returning';
        v.route = [...v.route].reverse();
        v.segmentIndex = 0;
        v.segmentProgress = 0;
      }
    } else if (actionId === 'escalate') {
      // Bump severity in local state (visual only)
      const inc = activeQueue.find((i) => (i.uniqueId || i.instanceId || i.id) === entityId);
      if (inc) inc.severity = 'CRITICAL';
      forceUpdate((n) => n + 1);
    } else if (actionId === 'false_alarm') {
      // Mark resolved → ghost
      const inc = activeQueue.find((i) => (i.uniqueId || i.instanceId || i.id) === entityId);
      if (inc) {
        inc.status = 'RESOLVED';
        inc.stage = 'RESOLVED';
        setResolvedGhosts((prev) => [...prev, { ...inc, ghostAt: Date.now() }]);
        setTimeout(() => {
          setResolvedGhosts((prev) => prev.filter((g) => g.ghostAt !== inc.ghostAt));
        }, 60000);
      }
      forceUpdate((n) => n + 1);
    }
  }, [activeQueue]);

  // ─── Bind right-click handler helper ───────────────────────────────────────
  const bindContextMenuHandler = useCallback((marker, entityType, entityId) => {
    marker.on('contextmenu', (e) => {
      e.originalEvent.preventDefault();
      setContextMenu({ x: e.originalEvent.clientX, y: e.originalEvent.clientY, entityType, entityId });
    });
    // Long press (touch)
    marker.on('mousedown', (e) => {
      if (e.originalEvent.button !== 0) return;
      longPressTimerRef.current = setTimeout(() => {
        const rect = mapInstanceRef.current?.getContainer()?.getBoundingClientRect();
        if (rect) {
          setContextMenu({
            x: e.originalEvent.clientX || (rect.left + rect.width / 2),
            y: e.originalEvent.clientY || (rect.top + rect.height / 2),
            entityType, entityId
          });
        }
      }, 500);
    });
    marker.on('mouseup', () => { clearTimeout(longPressTimerRef.current); });
    marker.on('mouseleave', () => { clearTimeout(longPressTimerRef.current); });
  }, []);

  // ─── RENDER STATIC LAYERS (stations, incidents, traffic, weather, cctv, heatmap, routes, halos) ───
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear all managed layers
    stationLayerRef.current?.clearLayers();
    incidentLayerRef.current?.clearLayers();
    haloLayerRef.current?.clearLayers();
    trafficLayerRef.current?.clearLayers();
    weatherLayerRef.current?.clearLayers();
    cctvLayerRef.current?.clearLayers();
    routeLayerRef.current?.clearLayers();
    heatmapLayerRef.current?.clearLayers();
    if (selectionRingRef.current) { map.removeLayer(selectionRingRef.current); selectionRingRef.current = null; }

    const zoom = map.getZoom();

    // ── 1. STATIONS & FACILITIES ─────────────────────────────────────────
    // Clustering below zoom 13
    if (zoom < 13) {
      const clusters = {};
      CITY_FACILITIES.forEach((fac) => {
        const cfgKey = fac.category === 'parks' ? 'weather' : fac.category;
        if (!layerConfig[cfgKey]?.visible) return;

        const clusterKey = `${fac.category}_${Math.round(fac.lat * 20)}_${Math.round(fac.lng * 20)}`;
        if (!clusters[clusterKey]) clusters[clusterKey] = { category: fac.category, items: [] };
        clusters[clusterKey].items.push(fac);
      });

      Object.values(clusters).forEach((cluster) => {
        if (cluster.items.length === 1) {
          const fac = cluster.items[0];
          renderStationMarker(fac, stationLayerRef.current);
        } else {
          const avgLat = cluster.items.reduce((s, f) => s + f.lat, 0) / cluster.items.length;
          const avgLng = cluster.items.reduce((s, f) => s + f.lng, 0) / cluster.items.length;
          const m = L.marker([avgLat, avgLng], {
            icon: getClusterIcon({ category: cluster.category, count: cluster.items.length }),
            zIndexOffset: 90,
          }).addTo(stationLayerRef.current);
          m.on('click', () => map.setView([avgLat, avgLng], 13.5, { animate: true }));
        }
      });
    } else {
      CITY_FACILITIES.forEach((fac) => {
        const cfgKey = fac.category === 'parks' ? 'weather' : fac.category;
        if (!layerConfig[cfgKey]?.visible) return;
        renderStationMarker(fac, stationLayerRef.current);
      });
    }

    // ── 2. INCIDENTS + HALOS ─────────────────────────────────────────────
    if (layerConfig.incidents?.visible) {
      activeQueue.forEach((inc) => {
        if (inc.status === 'RESOLVED' || inc.stage === 'RESOLVED' || inc.status === 'ARCHIVED') return;
        const lat = inc.lat || 1.3323;
        const lng = inc.lng || 103.8580;
        const incKey = inc.uniqueId || inc.instanceId || inc.id;
        const isSelected = selectedIncidentId === incKey || selectedIncidentId === inc.id;
        const sev = (inc.severity || inc.status || 'HIGH').toUpperCase();
        const sevColor = SEV_COLOR[sev] || '#EF4444';

        // Halo
        const haloRadius = SEVERITY_RADIUS[sev] || 650;
        L.circle([lat, lng], { radius: haloRadius, color: sevColor, weight: 0, fillColor: sevColor, fillOpacity: isSelected ? 0.15 : 0.08 }).addTo(haloLayerRef.current);
        L.circle([lat, lng], {
          radius: haloRadius * 0.6, color: sevColor, weight: 1.5, fill: false,
          dashArray: (inc.status === 'AWAITING_APPROVAL') ? '4,4' : null, opacity: 0.4,
        }).addTo(haloLayerRef.current);

        // Incident marker
        const unitsCount = (inc.dispatchedUnits || []).length || 1;
        const locInfo = getRealSingaporeLocation(lat, lng);
        const markerLabel = showIncidentLabels ? locInfo.road.split('/')[0].trim() : '';
        const m = L.marker([lat, lng], {
          icon: getIncidentIcon({ severity: sev, status: inc.status, isSelected, count: unitsCount, label: markerLabel }),
          zIndexOffset: 1000,
        }).addTo(incidentLayerRef.current);

        m.on('click', (e) => { e.originalEvent.preventDefault(); setSelectedEntity({ type: 'incident', id: incKey }); });
        bindContextMenuHandler(m, 'incident', incKey);

        // Selection ring
        if (isSelected) {
          selectionRingRef.current = L.marker([lat, lng], {
            icon: getSelectionRingIcon(), zIndexOffset: 1100, interactive: false,
          }).addTo(incidentLayerRef.current);
        }

        // Team response polyline styling
        if (showLiveRoutes && (layerConfig.vehicles?.visible ?? true)) {
          const incVehicles = vehiclesStateRef.current.filter((v) => v.incidentId === incKey);
          incVehicles.forEach((v) => {
            if (v.route && v.route.length > 1 && (v.state === 'DISPATCHED' || v.state === 'RETURNING' || v.state === 'ON_SCENE')) {
              const routeOpacity = isSelected ? 0.85 : 0.4;
              const categoryColorMap = {
                police: '#1FA2FF',
                fire: '#EF4444',
                hospital: '#22C55E',
                infrastructure: '#FBBF24',
                traffic: '#F97316',
              };
              const routeColor = v.state === 'RETURNING' ? '#64748B' : (categoryColorMap[v.category] || '#06B6D4');
              const pl = L.polyline(v.route, {
                color: routeColor, weight: isSelected ? 3.5 : 2.5,
                dashArray: '6,6', opacity: routeOpacity,
              }).addTo(routeLayerRef.current);
              if (isSelected) {
                pl.bindTooltip(`🚨 ${v.name} Emergency Route`, { sticky: true });
              }

              // Floating Responding Label at start of route during dispatch
              if (v.state === 'DISPATCHED' && v.segmentProgress < 0.2) {
                const startPos = v.route[0];
                L.marker([startPos[0], startPos[1]], {
                  icon: getDispatchTicketIcon(v.name, v.eta || '~8 min'),
                  zIndexOffset: 1200,
                  interactive: false,
                }).addTo(routeLayerRef.current);
              }
            }
          });
        }
      });

      // Ghost markers for recently resolved
      resolvedGhosts.forEach((ghost) => {
        L.marker([ghost.lat || 1.3323, ghost.lng || 103.8580], {
          icon: getCustomIcon('✅', '#22C55E', false, true, 'Resolved'), zIndexOffset: 50, opacity: 0.2,
        }).addTo(incidentLayerRef.current);
      });
    }

    // ── 3. TRAFFIC ───────────────────────────────────────────────────────
    if (layerConfig.traffic?.visible) {
      const tOpacity = layerConfig.traffic.opacity || 0.4;
      const hour = new Date().getHours();
      const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);

      EXPRESSWAYS.forEach((exp) => {
        const hasNearbyIncident = activeQueue.some((inc) => {
          const lat = inc.lat || 1.3323;
          const lng = inc.lng || 103.8580;
          return exp.coords.some((c) => Math.hypot(c[0] - lat, c[1] - lng) < 0.015);
        });

        const color = hasNearbyIncident ? '#EF4444' : isPeak ? '#F97316' : '#22C55E';
        L.polyline(exp.coords, {
          color, weight: hasNearbyIncident ? 3.5 : 2,
          dashArray: hasNearbyIncident ? '3,3' : '6,6',
          opacity: tOpacity * (hasNearbyIncident ? 1.5 : 1),
        }).addTo(trafficLayerRef.current)
          .bindTooltip(`${exp.name} — ${hasNearbyIncident ? '🔴 CONGESTED' : isPeak ? '🟠 PEAK TRAFFIC' : '🟢 FREE FLOW'}`, { sticky: true });
      });
    }

    // ── 4. WEATHER ───────────────────────────────────────────────────────
    if (layerConfig.weather?.visible) {
      const wOpacity = layerConfig.weather.opacity || 0.8;
      WEATHER_RAIN_CELLS.forEach((cell) => {
        L.polygon(cell.coords, {
          color: '#38BDF8', weight: 1, fillColor: '#0284c7', fillOpacity: 0.12 * wOpacity, dashArray: '4,4',
        }).addTo(weatherLayerRef.current).bindTooltip(cell.name, { sticky: true });
      });
      WEATHER_SENSORS.forEach((s) => {
        const m = L.marker([s.lat, s.lng], {
          icon: getWeatherSensorIcon({ isRaining: s.humidity > 84, label: `${s.name}: ${s.temp}°C` }),
          zIndexOffset: 120,
        }).addTo(weatherLayerRef.current);
      });
    }

    // ── 5. CCTV (Requirement 2 & 9: Only visible at zoom >= 14 or active nearby incident) ──────────
    if (layerConfig.cctv?.visible) {
      CCTV_CAMERAS.forEach((cam) => {
        const hasInc = activeQueue.some((inc) => Math.hypot(cam.lat - (inc.lat || 1.3323), cam.lng - (inc.lng || 103.8580)) < 0.0135);
        
        // Show camera only if zoom >= 14 or active nearby incident
        if (zoom < 14 && !hasInc) return;

        const cctvFeed = CCTV_FEEDS_DATA.find((f) => f.id === cam.id);

        const m = L.marker([cam.lat, cam.lng], {
          icon: getCCTVIcon({ isActive: !!cctvFeed, hasIncident: hasInc, label: hasInc ? '🎥 TARGET ACQUIRED' : cam.name }),
          zIndexOffset: 200,
        }).addTo(cctvLayerRef.current);


        // FoV wedge on hover
        let fovPoly = null;
        m.on('mouseover', () => {
          const facing = (cam.facing || 0) * Math.PI / 180;
          const spread = 30 * Math.PI / 180;
          const r = 0.004;
          const p1 = [cam.lat + r * Math.cos(facing - spread), cam.lng + r * Math.sin(facing - spread)];
          const p2 = [cam.lat + r * Math.cos(facing + spread), cam.lng + r * Math.sin(facing + spread)];
          fovPoly = L.polygon([[cam.lat, cam.lng], p1, p2], {
            color: hasInc ? '#EF4444' : '#22D3EE', fillOpacity: 0.12, weight: 1,
          }).addTo(cctvLayerRef.current);
        });
        m.on('mouseout', () => { if (fovPoly) { cctvLayerRef.current.removeLayer(fovPoly); fovPoly = null; } });

        // Click popup with video if available
        if (cctvFeed?.videoSrc) {
          const popupHtml = `<div style="font-family:monospace;font-size:10px;color:#fff;width:240px;background:#070B14;border:1px solid #33C8FF;padding:6px;border-radius:8px;">
            <div style="font-weight:bold;color:#33C8FF;margin-bottom:4px;display:flex;justify-content:space-between"><span>📹 ${cam.name}</span><span style="color:#EF4444">● REC</span></div>
            <video src="${cctvFeed.videoSrc}" autoplay muted loop playsinline style="width:100%;height:120px;object-fit:cover;border-radius:4px;border:1px solid #1e293b"></video>
            <div style="margin-top:4px;display:flex;justify-content:space-between"><span>Status:</span><strong style="color:${hasInc ? '#EF4444' : '#10B981'}">${hasInc ? 'ALERT' : 'ACTIVE'}</strong></div>
          </div>`;
          m.bindPopup(popupHtml, { className: 'custom-leaflet-popup', maxWidth: 260 });
        } else {
          m.bindPopup(`<div style="font-family:monospace;font-size:10px;color:#fff;background:#070B14;padding:6px;border-radius:6px;border:1px solid #33C8FF"><b>${cam.name}</b><br/>Status: ${hasInc ? 'ALERT' : 'NOMINAL'}</div>`, { className: 'custom-leaflet-popup' });
        }
        bindContextMenuHandler(m, 'station', cam.id);
      });
    }

    // ── 6. HEATMAP (simple circle-based KDE approximation) ───────────────
    if (layerConfig.heatmap?.visible) {
      const hOpacity = layerConfig.heatmap.opacity || 0.7;

      // Live risk from active incidents
      activeQueue.forEach((inc) => {
        if (inc.status === 'RESOLVED' || inc.stage === 'RESOLVED') return;
        const lat = inc.lat || 1.3323;
        const lng = inc.lng || 103.8580;
        const sev = (inc.severity || 'HIGH').toUpperCase();
        const weight = (sev === 'CRITICAL' ? 4 : sev === 'HIGH' ? 3 : sev === 'MEDIUM' || sev === 'ELEVATED' ? 2 : 1);
        const radius = 800 + weight * 200;
        const color = SEV_COLOR[sev] || '#EF4444';

        // Multi-stop gradient approximation
        L.circle([lat, lng], { radius, color, weight: 0, fillColor: color, fillOpacity: 0.06 * hOpacity * weight }).addTo(heatmapLayerRef.current);
        L.circle([lat, lng], { radius: radius * 0.5, color, weight: 0, fillColor: color, fillOpacity: 0.12 * hOpacity * weight }).addTo(heatmapLayerRef.current);
        L.circle([lat, lng], { radius: radius * 0.25, color, weight: 0, fillColor: color, fillOpacity: 0.18 * hOpacity * weight }).addTo(heatmapLayerRef.current);
      });

      // Historical placeholder from SINGAPORE_HOTSPOTS
      // NOTE: This is placeholder data pending a real historical incidents API
      SINGAPORE_HOTSPOTS.forEach((spot) => {
        L.circle([spot.lat, spot.lng], { radius: 2000, color: '#7C5CFF', weight: 0, fillColor: '#7C5CFF', fillOpacity: 0.03 * hOpacity }).addTo(heatmapLayerRef.current);
      });
    }

    // ── Listen for zoom changes to re-cluster ────────────────────────────
    const onZoomEnd = () => forceUpdate((n) => n + 1);
    map.on('zoomend', onZoomEnd);
    return () => { map.off('zoomend', onZoomEnd); };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerConfig, activeQueue, selectedIncidentId, resolvedGhosts, showLiveRoutes, showIncidentLabels]);

  // Helper: render a single station marker
  function renderStationMarker(fac, layerGroup) {
    let icon;
    const isAlert = fac.status === 'Critical' || fac.status === 'Responding';
    const deployedCount = vehiclesStateRef.current.filter((v) => v.stationId === fac.id && v.state !== 'IDLE').length;
    const totalCount = vehiclesStateRef.current.filter((v) => v.stationId === fac.id).length;
    const available = totalCount - deployedCount;

    switch (fac.category) {
      case 'hospital':
        icon = getHospitalIcon({ available, total: totalCount || 1, isAlert, label: fac.name });
        break;
      case 'fire':
        icon = getFireIcon({ isAlert, isResponding: fac.status === 'Responding', label: fac.name });
        break;
      case 'police':
        icon = getPoliceIcon({ isAlert, label: fac.name });
        break;
      case 'infrastructure':
        icon = getInfraIcon({ isAlert, label: fac.name });
        break;
      case 'parks':
        icon = getParksIcon({ label: fac.name });
        break;
      default:
        icon = getCustomIcon(fac.icon, '#64748B', false, false, fac.name);
    }

    const m = L.marker([fac.lat, fac.lng], { icon, zIndexOffset: 100 }).addTo(layerGroup);
    m.on('click', () => setSelectedEntity({ type: 'station', id: fac.id }));
    bindContextMenuHandler(m, 'station', fac.id);

    // Popup
    const color = fac.status === 'Critical' ? '#EF4444' : fac.status === 'Responding' ? '#F59E0B' : '#22C55E';
    m.bindPopup(`<div style="font-family:monospace;font-size:11px;color:#E2E8F0;padding:4px;min-width:180px">
      <div style="font-weight:bold;font-size:12px;color:#33C8FF;margin-bottom:2px">${fac.name}</div>
      <div style="color:#94A3B8;font-size:10px;margin-bottom:4px">${fac.category.toUpperCase()} · ${fac.agent}</div>
      <div style="display:flex;justify-content:space-between;margin-bottom:3px"><span>Status:</span><strong style="color:${color}">● ${fac.status.toUpperCase()}</strong></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:3px"><span>Capacity:</span><strong>${fac.capacity}</strong></div>
      <div style="display:flex;justify-content:space-between"><span>Units:</span><strong style="color:#33C8FF">${available}/${totalCount} available</strong></div>
    </div>`, { className: 'custom-leaflet-popup' });
  }

  // ─── Format time ───────────────────────────────────────────────────────────
  const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  // Elapsed timer for selected incident
  const selectedInc = activeQueue.find((i) => (i.uniqueId || i.instanceId || i.id) === selectedIncidentId);
  const elapsedStr = selectedInc?.createdAt
    ? (() => { const s = Math.floor((Date.now() - selectedInc.createdAt) / 1000); return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`; })()
    : null;

  // ─── Fullscreen portal ─────────────────────────────────────────────────────
  const renderFullScreenPortal = () => {
    if (typeof document === 'undefined' || !isFullScreen) return null;
    return createPortal(
      <AnimatePresence>
        {isFullScreen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] w-screen h-screen bg-[#070B14]"
            style={{ display: 'flex', flexDirection: 'column' }}
          >
            {/* Fullscreen map slot */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              <div ref={portalSlotRef} style={{ width: '100%', height: '100%' }} />

              {/* All overlays inside fullscreen */}
              <LayersDock layerConfig={layerConfig} setLayerConfig={setLayerConfig} expandedDock={expandedDock} setExpandedDock={setExpandedDock} />
              <IncidentContextDrawer selectedEntity={selectedEntity} activeQueue={activeQueue} vehiclesStateRef={vehiclesStateRef} onClose={() => setSelectedEntity(null)} onFlyTo={handleFlyTo} reasoningLogs={reasoningLogs} />
              <TimelineStrip logs={reasoningLogs} activeQueue={activeQueue} selectedIncidentId={selectedIncidentId} onFlyTo={handleFlyTo} reducedMotion={reducedMotion} />
              <MapInsightsBar activeQueue={activeQueue} vehiclesStateRef={vehiclesStateRef} mapRef={mapInstanceRef} coverageOverlayRef={coverageOverlayRef} />

              {/* Top-left: style pill */}
              <div style={{ position: 'absolute', top: 12, left: 64, zIndex: 460, display: 'flex', gap: 6 }}>
                <button onClick={handleToggleBaseTile} style={{
                  padding: '5px 12px', borderRadius: 20,
                  background: 'rgba(6,9,20,0.9)', backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.12)', color: '#E2E8F0',
                  fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Layers size={12} color="#33C8FF" />
                  {baseTileStyle === 'satellite' ? 'Satellite' : 'Dark Command'}
                </button>
              </div>

              {/* Top-right: health chip */}
              <div style={{
                position: 'absolute', top: 12, right: 12, zIndex: 460,
                padding: '6px 12px', borderRadius: 14,
                background: 'rgba(6,9,20,0.9)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 11, fontFamily: 'monospace', color: '#E2E8F0',
              }}>
                <CloudRain size={14} color="#33C8FF" />
                <span style={{ fontWeight: 700 }}>{weather.tempC}°C</span>
                <span style={{ color: '#64748B', fontSize: 9 }}>{weather.condition}</span>
                <span style={{ color: '#64748B', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 8, fontSize: 10 }}>
                  {timeStr}
                </span>
                {elapsedStr && <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 10 }}>⏱ {elapsedStr}</span>}
              </div>

              {/* Right-center: zoom & toolbar controls */}
              <div style={{
                position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)',
                zIndex: 460, display: 'flex', flexDirection: 'column', gap: 0,
                borderRadius: 14, overflow: 'hidden',
                background: 'rgba(6,9,20,0.9)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {[
                  { icon: Locate, fn: handleLocate, title: 'Locate Target', active: false },
                  { icon: Target, fn: handleCenterIncident, title: 'Center Incident', active: false },
                  { icon: Navigation, fn: handleToggleFollow, title: 'Follow Unit', active: isFollowActive },
                  { icon: Radio, fn: () => setShowLiveRoutes((p) => !p), title: 'Toggle Live Routes', active: showLiveRoutes },
                  { icon: MapPin, fn: () => setShowIncidentLabels((p) => !p), title: 'Toggle Incident Labels', active: showIncidentLabels },
                  { icon: Plus, fn: handleZoomIn, title: 'Zoom In', active: false },
                  { icon: Minus, fn: handleZoomOut, title: 'Zoom Out', active: false },
                  { icon: RotateCcw, fn: handleResetMap, title: 'Reset View', active: false },
                  { icon: Minimize2, fn: () => setIsFullScreen(false), title: 'Exit Fullscreen', active: false },
                ].map(({ icon: Icon, fn, title, active }, i, arr) => (
                  <button key={title} onClick={fn} title={title} style={{
                    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? 'rgba(51,200,255,0.2)' : 'none',
                    border: 'none',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                    color: title === 'Exit Fullscreen' ? '#EF4444' : active ? '#33C8FF' : '#E2E8F0',
                    cursor: 'pointer',
                  }}>
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  };

  /* ═══════ RENDER ═══════ */
  return (
    <>
      {/* Standard card view */}
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#070B14' }}>
        {/* Map canvas */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/8.5' }}>
          <div ref={cardSlotRef} style={{ width: '100%', height: '100%', background: '#070B14' }} />

          {/* Loading spinner */}
          {isMapLoading && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 500,
              background: 'rgba(7,11,20,0.8)', backdropFilter: 'blur(6px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: '#fff', fontFamily: 'monospace', fontSize: 12, pointerEvents: 'none',
            }}>
              <Loader2 size={28} color="#33C8FF" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Loading Live City Map…</span>
            </div>
          )}

          {/* Left dock */}
          <LayersDock layerConfig={layerConfig} setLayerConfig={setLayerConfig} expandedDock={expandedDock} setExpandedDock={setExpandedDock} />

          {/* Right drawer */}
          <IncidentContextDrawer selectedEntity={selectedEntity} activeQueue={activeQueue} vehiclesStateRef={vehiclesStateRef} onClose={() => setSelectedEntity(null)} onFlyTo={handleFlyTo} reasoningLogs={reasoningLogs} />

          {/* Bottom timeline */}
          <TimelineStrip logs={reasoningLogs} activeQueue={activeQueue} selectedIncidentId={selectedIncidentId} onFlyTo={handleFlyTo} reducedMotion={reducedMotion} />

          {/* Bottom-left insights */}
          <MapInsightsBar activeQueue={activeQueue} vehiclesStateRef={vehiclesStateRef} mapRef={mapInstanceRef} coverageOverlayRef={coverageOverlayRef} />

          {/* Context menu */}
          <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} onAction={handleContextAction} />

          {/* Floating Top Glass Toolbar */}
          <div style={{
            position: 'absolute', top: 12, left: 64, right: 12, zIndex: 460,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            pointerEvents: 'none',
          }}>
            {/* Top-Left Title & Toggle Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto' }}>
              <div style={{
                padding: '5px 12px', borderRadius: 20,
                background: 'rgba(6,11,20,0.92)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(31,162,255,0.4)',
                color: '#1FA2FF', fontSize: 10, fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif',
                letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', animation: 'spin 2s linear infinite' }}></span>
                LIVE CITY MAP
              </div>

              {/* Layer Toggles */}
              <button
                onClick={() => setExpandedDock((prev) => prev === 'layers' ? null : 'layers')}
                style={{
                  padding: '5px 10px', borderRadius: 16,
                  background: expandedDock === 'layers' ? 'rgba(31,162,255,0.25)' : 'rgba(6,11,20,0.85)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${expandedDock === 'layers' ? '#1FA2FF' : 'rgba(255,255,255,0.12)'}`,
                  color: expandedDock === 'layers' ? '#1FA2FF' : '#E2E8F0',
                  fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <Layers size={12} color={expandedDock === 'layers' ? '#1FA2FF' : '#94A3B8'} />
                Layers
              </button>

              <button
                onClick={() => setLayerConfig((prev) => ({ ...prev, heatmap: { ...prev.heatmap, visible: !prev.heatmap?.visible } }))}
                style={{
                  padding: '5px 10px', borderRadius: 16,
                  background: layerConfig.heatmap?.visible ? 'rgba(31,162,255,0.25)' : 'rgba(6,11,20,0.85)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${layerConfig.heatmap?.visible ? '#1FA2FF' : 'rgba(255,255,255,0.12)'}`,
                  color: layerConfig.heatmap?.visible ? '#1FA2FF' : '#E2E8F0',
                  fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <Activity size={12} color={layerConfig.heatmap?.visible ? '#1FA2FF' : '#94A3B8'} />
                Heatmap
              </button>

              <button
                onClick={() => setLayerConfig((prev) => ({ ...prev, traffic: { ...prev.traffic, visible: !prev.traffic?.visible } }))}
                style={{
                  padding: '5px 10px', borderRadius: 16,
                  background: layerConfig.traffic?.visible ? 'rgba(31,162,255,0.25)' : 'rgba(6,11,20,0.85)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${layerConfig.traffic?.visible ? '#1FA2FF' : 'rgba(255,255,255,0.12)'}`,
                  color: layerConfig.traffic?.visible ? '#1FA2FF' : '#E2E8F0',
                  fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <Navigation size={12} color={layerConfig.traffic?.visible ? '#1FA2FF' : '#94A3B8'} />
                Traffic
              </button>

              <button
                onClick={() => setLayerConfig((prev) => ({ ...prev, weather: { ...prev.weather, visible: !prev.weather?.visible } }))}
                style={{
                  padding: '5px 10px', borderRadius: 16,
                  background: layerConfig.weather?.visible ? 'rgba(31,162,255,0.25)' : 'rgba(6,11,20,0.85)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${layerConfig.weather?.visible ? '#1FA2FF' : 'rgba(255,255,255,0.12)'}`,
                  color: layerConfig.weather?.visible ? '#1FA2FF' : '#E2E8F0',
                  fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <CloudRain size={12} color={layerConfig.weather?.visible ? '#1FA2FF' : '#94A3B8'} />
                Weather
              </button>
            </div>

            {/* Top-Right Weather & Tile Mode */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto' }}>
              <button onClick={handleToggleBaseTile} style={{
                padding: '5px 10px', borderRadius: 16,
                background: 'rgba(6,11,20,0.85)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.12)', color: '#E2E8F0',
                fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                {baseTileStyle === 'satellite' ? '🛰️ Satellite' : '🌆 Dark Mode'}
              </button>

              <button onClick={() => setIsFullScreen(true)} title="Fullscreen" style={{
                padding: '5px 10px', borderRadius: 16,
                background: 'rgba(6,11,20,0.85)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.12)', color: '#E2E8F0',
                fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <Maximize2 size={12} color="#1FA2FF" />
                Fullscreen
              </button>
            </div>
          </div>

          {/* Right-center: zoom & camera controls */}
          <div style={{
            position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)',
            zIndex: 460, display: 'flex', flexDirection: 'column',
            borderRadius: 12, overflow: 'hidden',
            background: 'rgba(6,11,20,0.92)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            {[
              { icon: Locate, fn: handleLocate, title: 'Locate Target', active: false },
              { icon: Target, fn: handleCenterIncident, title: 'Center Incident', active: false },
              { icon: Navigation, fn: handleToggleFollow, title: 'Follow Unit', active: isFollowActive },
              { icon: Radio, fn: () => setShowLiveRoutes((p) => !p), title: 'Toggle Live Routes', active: showLiveRoutes },
              { icon: MapPin, fn: () => setShowIncidentLabels((p) => !p), title: 'Toggle Incident Labels', active: showIncidentLabels },
              { icon: Plus, fn: handleZoomIn, title: 'Zoom In', active: false },
              { icon: Minus, fn: handleZoomOut, title: 'Zoom Out', active: false },
              { icon: RotateCcw, fn: handleResetMap, title: 'Reset View', active: false },
              { icon: Maximize2, fn: () => setIsFullScreen(true), title: 'Fullscreen', active: false },
            ].map(({ icon: Icon, fn, title, active }, i, arr) => (
              <button key={title} onClick={fn} title={title} style={{
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'rgba(51,200,255,0.2)' : 'none', border: 'none',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
                color: active ? '#33C8FF' : '#E2E8F0', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = active ? 'rgba(51,200,255,0.3)' : 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = active ? 'rgba(51,200,255,0.2)' : 'none'; }}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Fullscreen portal */}
      {renderFullScreenPortal()}
    </>
  );
}
