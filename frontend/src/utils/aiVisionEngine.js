/* ═══════════════════════════════════════════════════════════
   VYRAION AI VISION EMERGENCY RISK DETECTION ENGINE
   Continuous Camera Feed Analysis, Risk Classification & Object Detection
 ═══════════════════════════════════════════════════════════ */

export const CCTV_FEEDS = [
  {
    id: 'cam_01',
    name: 'Cam 01: CTE Expressway Corridor',
    location: 'Central Expressway (CTE) Junction 14',
    lat: 1.3323,
    lng: 103.8580,
    type: 'traffic',
    riskLevel: 'HIGH',
    confidence: 94.8,
    label: 'Highway Multi-Vehicle Collision',
    detectedObjects: [
      { label: 'Vehicle Impact Debris', x: 22, y: 38, width: 32, height: 28, confidence: 96.2, color: '#EF4444' },
      { label: 'Blocked Emergency Lane', x: 58, y: 45, width: 28, height: 35, confidence: 93.4, color: '#F59E0B' }
    ],
    recommendedAgencies: ['Traffic Police', 'SCDF ALS Ambulance', 'LTA Heavy Tow'],
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-traffic-on-a-highway-at-night-4228-large.mp4',
    description: 'High-speed multi-car impact on express lane 3 with structural debris and traffic blockage.'
  },
  {
    id: 'cam_02',
    name: 'Cam 02: Jurong SCADA Chemical Plant',
    location: 'Jurong Island SCADA Industrial Depot',
    lat: 1.3150,
    lng: 103.7050,
    type: 'fire',
    riskLevel: 'HIGH',
    confidence: 97.4,
    label: 'Industrial Chemical Thermal Anomaly',
    detectedObjects: [
      { label: 'Thermal Plume (780°C)', x: 30, y: 20, width: 42, height: 48, confidence: 98.1, color: '#EF4444' },
      { label: 'Toxic Vapor Plume', x: 15, y: 12, width: 68, height: 38, confidence: 96.7, color: '#F59E0B' }
    ],
    recommendedAgencies: ['SCDF Hazmat Fire Station', 'SGH Trauma Unit', 'Police Patrol'],
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-fire-burning-in-a-dark-room-41584-large.mp4',
    description: 'Thermal camera confirmed 780°C blaze at chemical storage vat 4 with vapor plume.'
  },
  {
    id: 'cam_03',
    name: 'Cam 03: Orchard MRT Station Concourse',
    location: 'Orchard Central MRT Station',
    lat: 1.3048,
    lng: 103.8318,
    type: 'safety',
    riskLevel: 'MEDIUM',
    confidence: 91.2,
    label: 'Station Breach & Unattended Baggage',
    detectedObjects: [
      { label: 'Unattended Object (Platform 2)', x: 44, y: 52, width: 18, height: 22, confidence: 93.1, color: '#F59E0B' },
      { label: 'Crowd Bottleneck Density', x: 20, y: 35, width: 45, height: 30, confidence: 89.4, color: '#33C8FF' }
    ],
    recommendedAgencies: ['Transit Security K9 Unit', 'SPF Tactical Unit'],
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-subway-station-with-people-moving-fast-41566-large.mp4',
    description: 'AI vision detected stationary unattended bag on platform 2 with rising passenger density.'
  },
  {
    id: 'cam_04',
    name: 'Cam 04: Rochor Canal Drainage Sluice',
    location: 'Rochor Canal Sluice Gate 3',
    lat: 1.3300,
    lng: 103.7800,
    type: 'rain',
    riskLevel: 'LOW',
    confidence: 88.5,
    label: 'Monsoon Waterlogging & High Canal Flow',
    detectedObjects: [
      { label: 'High Water Level (+1.4m)', x: 10, y: 48, width: 80, height: 40, confidence: 90.2, color: '#10B981' },
      { label: 'Debris Strainer Clog', x: 62, y: 60, width: 22, height: 25, confidence: 86.8, color: '#33C8FF' }
    ],
    recommendedAgencies: ['PUB Drainage Works', 'LTA Maintenance'],
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-rain-drops-on-a-window-pane-41581-large.mp4',
    description: 'Water level sensor and camera confirmed elevated canal waterlogging during monsoon downpour.'
  },
  {
    id: 'cam_05',
    name: 'Cam 05: SGH Primary Power Substation',
    location: 'Singapore General Hospital Substation 12',
    lat: 1.2796,
    lng: 103.8347,
    type: 'hospital',
    riskLevel: 'HIGH',
    confidence: 96.1,
    label: 'Hospital Primary Power Feeder Arc',
    detectedObjects: [
      { label: 'HV Transformer Fault', x: 35, y: 25, width: 35, height: 40, confidence: 97.5, color: '#EF4444' },
      { label: 'Backup Gen Startup', x: 12, y: 55, width: 30, height: 28, confidence: 94.7, color: '#33C8FF' }
    ],
    recommendedAgencies: ['EMA Power Utility', 'SGH Engineering', 'Emergency Fuel Tanker'],
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-lights-flashing-on-a-control-panel-41580-large.mp4',
    description: 'Visual spark arc detected at primary feeder line supplying Regional General Hospital.'
  }
];

/* ═══════════════════════════════════════════════════════════
   RISK CLASSIFICATION LOGIC & LIFECYCLE RULES
 ═══════════════════════════════════════════════════════════ */

export const classifyVisionRisk = (riskLevel) => {
  switch (riskLevel) {
    case 'LOW':
      return {
        level: 'LOW',
        color: '#10B981', // Green
        badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        cardBg: 'bg-emerald-950/30 border-emerald-500/30',
        requiresApproval: false,
        autoApprove: true,
        emergencyMode: false,
        markerColor: '#10B981',
        description: 'Auto-resolved background telemetry. No human operator intervention required.'
      };
    case 'MEDIUM':
      return {
        level: 'MEDIUM',
        color: '#F59E0B', // Orange / Amber
        badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        cardBg: 'bg-amber-950/30 border-amber-500/30',
        requiresApproval: true,
        autoApprove: false,
        emergencyMode: false,
        markerColor: '#F59E0B',
        description: 'Notified Operator Console. Awaiting human command authorization.'
      };
    case 'HIGH':
    case 'CRITICAL':
    default:
      return {
        level: 'HIGH',
        color: '#EF4444', // Red
        badgeBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
        cardBg: 'bg-rose-950/40 border-rose-500/50 shadow-rose-900/30',
        requiresApproval: true,
        autoApprove: false,
        emergencyMode: true,
        markerColor: '#EF4444',
        description: 'CRITICAL EMERGENCY MODE TRIGGERED. Instant push to Operator Console & Nova Blueprint generation.'
      };
  }
};
