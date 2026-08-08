/* ═══════════════════════════════════════════════════════════
   VYRAION CANONICAL INCIDENT & CITY DATA MODULE
   Single Source of Truth for Dashboard & Map Components
   (8 Supported Emergency Incident Types)
 ═══════════════════════════════════════════════════════════ */

export const SINGAPORE_HOTSPOTS = [
  { name: 'Orchard', lat: 1.3048, lng: 103.8318 },
  { name: 'Marina Bay', lat: 1.2820, lng: 103.8590 },
  { name: 'Jurong', lat: 1.3337, lng: 103.7431 },
  { name: 'Changi', lat: 1.3644, lng: 103.9915 },
  { name: 'Woodlands', lat: 1.4420, lng: 103.7850 },
  { name: 'Tampines', lat: 1.3530, lng: 103.9400 },
  { name: 'Paya Lebar', lat: 1.3180, lng: 103.8830 },
  { name: 'Yishun', lat: 1.4280, lng: 103.8380 },
  { name: 'Bishan', lat: 1.3526, lng: 103.8352 },
  { name: 'Sentosa', lat: 1.2494, lng: 103.8303 }
];

export const EXPRESSWAY_ZONES = [
  { name: 'PIE Junction 14 (Central)', lat: 1.3323, lng: 103.8580 },
  { name: 'AYE Clementi Corridor', lat: 1.2950, lng: 103.7500 },
  { name: 'CTE Paterson Flyover', lat: 1.3048, lng: 103.8318 },
  { name: 'KPE Paya Lebar Tunnel', lat: 1.3500, lng: 103.8900 },
  { name: 'TPE Tampines Exit', lat: 1.3750, lng: 103.9500 },
  { name: 'BKE Kranji Way', lat: 1.3800, lng: 103.7700 }
];

export const INDUSTRIAL_ZONES = [
  { name: 'Jurong Industrial SCADA Complex', lat: 1.3150, lng: 103.7050 },
  { name: 'Tuas Mega Port Corridor', lat: 1.3190, lng: 103.6360 },
  { name: 'Jurong Chemical Logistics Depot', lat: 1.3000, lng: 103.7200 },
  { name: 'Paya Lebar Industrial Estate', lat: 1.3180, lng: 103.8830 }
];

export const HOSPITAL_ZONES = [
  { name: 'Singapore General Hospital (SGH)', lat: 1.2796, lng: 103.8347 },
  { name: 'Ng Teng Fong General Hospital', lat: 1.3337, lng: 103.7431 },
  { name: 'Tan Tock Seng Hospital (TTSH)', lat: 1.3214, lng: 103.8458 },
  { name: 'National University Hospital (NUH)', lat: 1.2937, lng: 103.7833 },
  { name: 'Khoo Teck Puat Hospital (KTPH)', lat: 1.3868, lng: 103.8338 },
  { name: 'Changi General Hospital (CGH)', lat: 1.3400, lng: 103.9580 },
  { name: 'Sengkang General Hospital (SKH)', lat: 1.3957, lng: 103.8932 }
];

export const FLOOD_PRONE_ZONES = [
  { name: 'Bukit Timah Drainage Canal', lat: 1.3300, lng: 103.7800 },
  { name: 'Marina Bay Barrage Underpass', lat: 1.2820, lng: 103.8590 },
  { name: 'Dunearn Road Canal Corridor', lat: 1.3250, lng: 103.8080 },
  { name: 'Bedok Canal Basin', lat: 1.3250, lng: 103.9400 }
];

export const PORT_INDUSTRIAL_ZONES = [
  { name: 'Jurong Island Chemical Hub', lat: 1.2720, lng: 103.6950 },
  { name: 'Tuas Industrial Chemical Depot', lat: 1.3000, lng: 103.7200 },
  { name: 'Tanjong Pagar Terminal Complex', lat: 1.2700, lng: 103.8400 }
];

const INCIDENT_ZONE_MAP = {
  traffic: EXPRESSWAY_ZONES,
  fire: INDUSTRIAL_ZONES,
  hazmat: PORT_INDUSTRIAL_ZONES,
  hospital: HOSPITAL_ZONES,
  rain: FLOOD_PRONE_ZONES,
  medical: SINGAPORE_HOTSPOTS,
  safety: SINGAPORE_HOTSPOTS,
  power: SINGAPORE_HOTSPOTS
};

let lastGeneratedLocation = null;

export const randomIncidentLocation = (type = 'traffic', lastLoc = lastGeneratedLocation) => {
  // If first parameter is an object (legacy call pass-through), swap parameters
  if (typeof type === 'object' && type !== null) {
    lastLoc = type;
    type = 'traffic';
  }
  const zoneSet = INCIDENT_ZONE_MAP[type] || SINGAPORE_HOTSPOTS;
  let selected = null;
  let attempts = 0;
  let finalLat = 0;
  let finalLng = 0;

  do {
    const idx = Math.floor(Math.random() * zoneSet.length);
    selected = zoneSet[idx];
    const offsetLat = (Math.random() - 0.5) * 0.024;
    const offsetLng = (Math.random() - 0.5) * 0.024;

    finalLat = Number(Math.max(1.2400, Math.min(1.4700, selected.lat + offsetLat)).toFixed(5));
    finalLng = Number(Math.max(103.6000, Math.min(104.0500, selected.lng + offsetLng)).toFixed(5));

    attempts++;
    if (!lastLoc) break;

    const dist = Math.hypot(finalLat - lastLoc.lat, finalLng - lastLoc.lng);
    if (dist >= 0.005 || attempts > 10) break;
  } while (true);

  lastGeneratedLocation = { lat: finalLat, lng: finalLng, name: selected.name };
  return { lat: finalLat, lng: finalLng, hotspot: selected.name };
};

export const DISPATCH_UNITS = {
  traffic: [
    { type: 'ambulance', name: 'ALS Ambulance', icon: '🚑', category: 'hospital' },
    { type: 'police', name: 'Police Car', icon: '🚔', category: 'police' }
  ],
  fire: [
    { type: 'fire', name: 'Fire Engine', icon: '🚒', category: 'fire' },
    { type: 'ambulance', name: 'Ambulance', icon: '🚑', category: 'hospital' },
    { type: 'police', name: 'Police Patrol', icon: '🚔', category: 'police' }
  ],
  medical: [
    { type: 'ambulance', name: 'Ambulance', icon: '🚑', category: 'hospital' },
    { type: 'medical_unit', name: 'Medical Response Unit', icon: '🩺', category: 'hospital' }
  ],
  hospital: [
    { type: 'ambulance', name: 'ALS Ambulance', icon: '🚑', category: 'hospital' },
    { type: 'medical_unit', name: 'Medical Response Unit', icon: '🩺', category: 'hospital' },
    { type: 'police', name: 'Police Coordination', icon: '🚔', category: 'police' }
  ],
  safety: [
    { type: 'police', name: 'Police Patrol', icon: '🚔', category: 'police' },
    { type: 'crowd_control', name: 'Crowd Control Unit', icon: '🛡️', category: 'police' }
  ],
  hazmat: [
    { type: 'hazmat', name: 'Hazmat Team', icon: '☣️', category: 'fire' },
    { type: 'fire', name: 'Fire Engine', icon: '🚒', category: 'fire' },
    { type: 'ambulance', name: 'Ambulance', icon: '🚑', category: 'hospital' }
  ],
  power: [
    { type: 'utility', name: 'Power Utility Team', icon: '⚡', category: 'infrastructure' },
    { type: 'generator', name: 'Grid Substation Crew', icon: '⚡', category: 'infrastructure' }
  ],
  rain: [
    { type: 'rescue', name: 'Rescue Unit', icon: '🚤', category: 'police' },
    { type: 'ambulance', name: 'Ambulance', icon: '🚑', category: 'hospital' }
  ]
};

export const MASTER_INCIDENTS = {
  traffic: {
    id: 'traffic',
    name: 'Traffic Accident',
    title: 'Traffic Collision on Expressway Corridor',
    severity: 'HIGH',
    status: 'CRITICAL',
    agents: ['Traffic', 'Healthcare', 'Pulse'],
    agent: 'Traffic & Patrol Agent',
    detectionEvents: [
      { source: 'Traffic Camera', detail: 'Congestion spike detected at Junction 14', realTime: '12 sec' },
      { source: 'Road Sensor', detail: 'Impact vibration confirmed on Lane 3', realTime: '3 sec' },
      { source: '911 Call Center', detail: 'Multiple collision reports received', realTime: '8 sec' }
    ],
    resolutionTime: '8–10 min',
    fieldResponse: [
      { unit: 'Traffic Police', eta: '4–7 min', icon: '🚔' },
      { unit: 'Ambulance', eta: '5–9 min', icon: '🚑' },
      { unit: 'Tow Service', eta: '10–15 min', icon: '🛻' }
    ],
    priorities: [
      { title: 'Redirect Ambulance Corridor via Expressway Bypass', reason: 'Reduces ambulance transit delay by 14 mins.', impact: '-52% Congestion', aiTime: '1.2s', agents: 'Traffic & Medical', rank: 3 },
      { title: 'Deploy Traffic Police Units to Expressway Junction', reason: 'Manually overrides signal bottleneck 4.2x faster.', impact: 'Speed +40%', aiTime: '0.8s', agents: 'Traffic Agent', rank: 5 }
    ],
    lat: 1.3323,
    lng: 103.8580,
    type: 'Traffic Accident',
    vehicleIcon: '🚑',
    vehicleName: 'ALS Ambulance #12',
    route: [[1.3700, 103.8400], [1.3450, 103.8520], [1.3323, 103.8580]],
    destination: 'Tan Tock Seng Hospital',
    eta: '8–10 min',
    action: 'Redirect traffic to expressway detour corridor & clear emergency lane'
  },
  fire: {
    id: 'fire',
    name: 'Fire Outbreak',
    title: 'Industrial Chemical Blaze',
    severity: 'HIGH',
    status: 'CRITICAL',
    agents: ['Fire', 'Traffic', 'Healthcare'],
    agent: 'Fire Response Agent',
    detectionEvents: [
      { source: 'Smoke Detector IoT', detail: 'Industrial zone smoke alarm triggered', realTime: '3 sec' },
      { source: 'Thermal Camera', detail: 'Heat signature 800°C confirmed', realTime: '5 sec' },
      { source: '911 Call Center', detail: 'Workers reporting visible flames', realTime: '7 sec' }
    ],
    resolutionTime: '15–20 min',
    fieldResponse: [
      { unit: 'Fire Department', eta: '6–10 min', icon: '🚒' },
      { unit: 'Ambulance', eta: '5–9 min', icon: '🚑' },
      { unit: 'Traffic Police', eta: '4–7 min', icon: '🚔' }
    ],
    priorities: [
      { title: 'Dispatch Fire Station Hazmat Engine & Foam Tender', reason: 'Contains blaze before chemical tank breach.', impact: 'Fire Contained', aiTime: '1.0s', agents: 'Fire Response Agent', rank: 2 },
      { title: 'Establish 500m Safety Perimeter & Clear Fire Corridor', reason: 'Protects workers from toxic smoke.', impact: 'Perimeter Secure', aiTime: '0.8s', agents: 'Traffic & Sentinel', rank: 4 }
    ],
    lat: 1.3150,
    lng: 103.7050,
    type: 'Fire Outbreak',
    vehicleIcon: '🚒',
    vehicleName: 'Hazmat Fire Engine Unit',
    route: [[1.3340, 103.7070], [1.3200, 103.7060], [1.3150, 103.7050]],
    destination: 'Industrial SCADA Complex',
    eta: '15–20 min',
    action: 'Dispatch foam tender & establish 500m perimeter'
  },
  medical: {
    id: 'medical',
    name: 'Medical Emergency',
    title: 'Mass Casualty Triage Dispatch',
    severity: 'ELEVATED',
    status: 'CRITICAL',
    agents: ['Healthcare', 'Traffic'],
    agent: 'Healthcare Agent',
    detectionEvents: [
      { source: '911 Dispatch', detail: 'Mass casualty report at Transit Hub', realTime: '4 sec' },
      { source: 'Hospital Network', detail: 'ICU occupancy high across region', realTime: '6 sec' },
      { source: 'Ambulance GPS', detail: 'Multiple ALS units available in radius', realTime: '3 sec' }
    ],
    resolutionTime: '6–9 min',
    fieldResponse: [
      { unit: 'Ambulance', eta: '5–9 min', icon: '🚑' },
      { unit: 'Nearest Hospital', eta: '8–12 min transit', icon: '🏥' }
    ],
    priorities: [
      { title: 'Dispatch Advanced Life Support Ambulances', reason: 'Delivers immediate triage for casualties.', impact: 'Patients Triaged', aiTime: '0.9s', agents: 'Healthcare Agent', rank: 3 },
      { title: 'Enable Automated Green-Wave Signals for Convoy', reason: 'Guarantees zero traffic stops for convoy.', impact: 'Transit Time -60%', aiTime: '0.7s', agents: 'Traffic Agent', rank: 5 }
    ],
    lat: 1.3048,
    lng: 103.8318,
    type: 'Medical Emergency',
    vehicleIcon: '🚑',
    vehicleName: 'ALS Ambulance Fleet',
    route: [[1.3040, 103.8319], [1.3048, 103.8318]],
    destination: 'Regional Trauma Hospital',
    eta: '6–9 min',
    action: 'Dispatch ALS Ambulances & alert trauma surgeons'
  },
  power: {
    id: 'power',
    name: 'Power Grid Failure',
    title: 'Substation Transformer Outage',
    severity: 'CRITICAL',
    status: 'HIGH',
    agents: ['Infrastructure', 'Healthcare'],
    agent: 'Infrastructure Agent',
    detectionEvents: [
      { source: 'Grid Frequency Sensor', detail: 'Substation cascade trip detected', realTime: '2 sec' },
      { source: 'SCADA Monitor', detail: 'Feeder voltage dropped to 0V', realTime: '3 sec' },
      { source: 'Hospital Alert', detail: 'Regional Hospital switched to generator', realTime: '5 sec' }
    ],
    resolutionTime: '18–25 min',
    fieldResponse: [
      { unit: 'Power Restoration Team', eta: '12–25 min', icon: '⚡' },
      { unit: 'Mobile Generator Unit', eta: '15–20 min', icon: '🔋' },
      { unit: 'Traffic Signal Crew', eta: '8–12 min', icon: '🚦' }
    ],
    priorities: [
      { title: 'Reroute High-Voltage Feeders from Substation', reason: 'Restores power to hospitals and water facilities.', impact: 'Feed Restored', aiTime: '1.1s', agents: 'Infrastructure Agent', rank: 1 },
      { title: 'Inject Municipal Emergency Battery Storage', reason: 'Stabilizes grid frequency at 60Hz.', impact: 'Frequency 60Hz', aiTime: '0.8s', agents: 'Nova & Infra', rank: 3 }
    ],
    lat: 1.2820,
    lng: 103.8590,
    type: 'Power Grid Failure',
    vehicleIcon: '⚡',
    vehicleName: 'Grid Repair Crew Unit',
    route: [[1.2920, 103.8490], [1.2838, 103.8591], [1.2820, 103.8590]],
    destination: 'Substation Control Hub',
    eta: '18–25 min',
    action: 'Reroute feeder line & dispatch mobile generator'
  },
  hospital: {
    id: 'hospital',
    name: 'Hospital Power Failure',
    title: 'Hospital Primary Power Feeder Outage',
    severity: 'CRITICAL',
    status: 'CRITICAL',
    agents: ['Healthcare', 'Infrastructure'],
    agent: 'Healthcare & Infra Agent',
    detectionEvents: [
      { source: 'Hospital Monitoring', detail: 'Main power feed lost at Regional General Hospital', realTime: '4 sec' },
      { source: 'Generator Sensor', detail: 'Backup diesel fuel at 35 min reserve', realTime: '2 sec' },
      { source: 'ICU Alert System', detail: 'Ventilator battery backup engaged', realTime: '6 sec' }
    ],
    resolutionTime: '18–25 min',
    fieldResponse: [
      { unit: 'Generator Team', eta: '12–18 min', icon: '⛽' },
      { unit: 'Power Utility Crew', eta: '15–25 min', icon: '⚡' },
      { unit: 'Hospital Engineering', eta: '8–12 min', icon: '🏥' }
    ],
    priorities: [
      { title: 'Restore Hospital Primary Power Feed & Dispatch Fuel', reason: 'Replenishes diesel generators before 35m depletion.', impact: 'Power Restored', aiTime: '1.4s', agents: 'Healthcare & Infra', rank: 1 },
      { title: 'Transfer High-Risk ICU Patients to Regional Medical Center', reason: 'Secures ventilator stability for critical patients.', impact: '100% Patient Safety', aiTime: '1.1s', agents: 'Healthcare Agent', rank: 2 }
    ],
    lat: 1.2796,
    lng: 103.8347,
    type: 'Hospital Power Failure',
    vehicleIcon: '⛽',
    vehicleName: 'Generator Fuel Tanker',
    route: [[1.2850, 103.8000], [1.2820, 103.8200], [1.2796, 103.8347]],
    destination: 'Singapore General Hospital (SGH)',
    eta: '18–25 min',
    action: 'Dispatch diesel tanker & prioritize power feed restoration'
  },
  hazmat: {
    id: 'hazmat',
    name: 'Hazardous Material Spill',
    title: 'Chemical Toxic Spill at Logistics Depot',
    severity: 'CRITICAL',
    status: 'CRITICAL',
    agents: ['Fire', 'Healthcare', 'Infrastructure'],
    agent: 'Fire & Hazmat Agent',
    detectionEvents: [
      { source: 'Gas Sensor Array', detail: 'Toxic vapor concentration elevated', realTime: '3 sec' },
      { source: 'Facility Alert', detail: 'Chemical storage vessel rupture', realTime: '5 sec' }
    ],
    resolutionTime: '25–35 min',
    fieldResponse: [
      { unit: 'Hazmat Decon Unit', eta: '8–12 min', icon: '☣️' },
      { unit: 'Medical Triage', eta: '6–10 min', icon: '🚑' }
    ],
    priorities: [
      { title: 'Deploy Chemical Neutralizer & Evacuate Depot', reason: 'Neutralizes toxic vapor plume.', impact: 'Contamination Sealed', aiTime: '1.1s', agents: 'Fire & Hazmat Agent', rank: 1 }
    ],
    lat: 1.3000,
    lng: 103.7200,
    type: 'Hazardous Material Spill',
    vehicleIcon: '☣️',
    vehicleName: 'Hazmat Containment Unit',
    route: [[1.3100, 103.7100], [1.3000, 103.7200]],
    destination: 'Jurong Chemical Depot',
    eta: '25–35 min',
    action: 'Deploy chemical neutralizer & seal vapor plume'
  },
  safety: {
    id: 'safety',
    name: 'Public Safety Incident',
    title: 'Unattended Package & Station Breach',
    severity: 'HIGH',
    status: 'HIGH',
    agents: ['Cyber', 'Traffic'],
    agent: 'Security Agent',
    detectionEvents: [
      { source: 'AI CCTV Camera', detail: 'Unattended bag detected on Platform 2', realTime: '4 sec' }
    ],
    resolutionTime: '10–15 min',
    fieldResponse: [
      { unit: 'Bomb Squad / Canine Unit', eta: '5–8 min', icon: '🐕' }
    ],
    priorities: [
      { title: 'Evacuate Concourse & Deploy X-Ray Robot', reason: 'Scans package safely.', impact: 'Station Secure', aiTime: '0.7s', agents: 'Security Agent', rank: 2 }
    ],
    lat: 1.3040,
    lng: 103.8319,
    type: 'Public Safety Incident',
    vehicleIcon: '🐕',
    vehicleName: 'Tactical K9 Security Unit',
    route: [[1.3000, 103.8300], [1.3040, 103.8319]],
    destination: 'Orchard Central MRT',
    eta: '10–15 min',
    action: 'Evacuate concourse & deploy scanning robot'
  },
  rain: {
    id: 'rain',
    name: 'Heavy Rain',
    title: 'Torrential Monsoon Rainfall Alert',
    severity: 'ELEVATED',
    status: 'ELEVATED',
    agents: ['Weather', 'Infrastructure'],
    agent: 'Weather & Drainage Agent',
    detectionEvents: [
      { source: 'Weather API', detail: 'Rainfall rate 65mm/hr detected', realTime: '5 sec' },
      { source: 'Stormwater Sensor', detail: 'Canal level rising rapidly', realTime: '8 sec' }
    ],
    resolutionTime: '12–18 min',
    fieldResponse: [
      { unit: 'Drainage Pump Team', eta: '6–10 min', icon: '🔧' }
    ],
    priorities: [
      { title: 'Activate Automated Stormwater Drainage Pumps', reason: 'Prevents canal overflow.', impact: 'Canal Normal', aiTime: '0.9s', agents: 'Weather Agent', rank: 4 }
    ],
    lat: 1.3300,
    lng: 103.7800,
    type: 'Heavy Rain',
    vehicleIcon: '🏗️',
    vehicleName: 'Public Works Pump Truck',
    route: [[1.3547, 103.7764], [1.3300, 103.7800]],
    destination: 'Bukit Timah Drainage Underpass',
    eta: '12–18 min',
    action: 'Deploy drainage pumps & activate stormwater runoff telemetry'
  }
};

/* ═══════════════════════════════════════════════════════════
   ISLAND-WIDE SINGAPORE FACILITIES (ALL 5 REGIONS)
 ═══════════════════════════════════════════════════════════ */
export const CITY_FACILITIES = [
  { id: 'ng_teng_fong', name: 'Ng Teng Fong General Hospital', category: 'hospital', lat: 1.3337, lng: 103.7431, icon: '🏥', status: 'Normal', capacity: '88% Occupied', agent: 'Healthcare Agent' },
  { id: 'nuh', name: 'National University Hospital (NUH)', category: 'hospital', lat: 1.2937, lng: 103.7833, icon: '🏥', status: 'Normal', capacity: 'Trauma Unit Active', agent: 'Healthcare Agent' },
  { id: 'jurong_police', name: 'Jurong Police Division HQ', category: 'police', lat: 1.3347, lng: 103.7410, icon: '🚓', status: 'Normal', capacity: '24 Patrol Units Active', agent: 'Traffic & Patrol Agent' },
  { id: 'jurong_fire', name: 'Jurong Fire Station #4', category: 'fire', lat: 1.3340, lng: 103.7070, icon: '🚒', status: 'Responding', capacity: 'Hazmat Engine Dispatched', agent: 'Fire Response Agent' },
  { id: 'tuas_fire', name: 'Tuas View Fire Station', category: 'fire', lat: 1.3190, lng: 103.6360, icon: '🚒', status: 'Normal', capacity: 'Heavy Foam Tender Ready', agent: 'Fire Response Agent' },
  { id: 'jurong_island_scada', name: 'Jurong Island SCADA Power Plant', category: 'infrastructure', lat: 1.2720, lng: 103.6950, icon: '⚡', status: 'Normal', capacity: 'Grid Generation 4200MW', agent: 'Infrastructure Agent' },

  { id: 'ktph', name: 'Khoo Teck Puat Hospital (KTPH)', category: 'hospital', lat: 1.3868, lng: 103.8338, icon: '🏥', status: 'Normal', capacity: 'Emergency Care 100%', agent: 'Healthcare Agent' },
  { id: 'woodlands_police', name: 'Woodlands North Regional Police', category: 'police', lat: 1.4420, lng: 103.7850, icon: '🚓', status: 'Normal', capacity: '16 Patrol Units Standby', agent: 'Patrol Agent' },
  { id: 'yishun_fire', name: 'Yishun Fire Station', category: 'fire', lat: 1.4280, lng: 103.8380, icon: '🚒', status: 'Normal', capacity: 'Rescue Tender Standby', agent: 'Fire Response Agent' },
  { id: 'woodlands_checkpoint', name: 'Woodlands Causeway Transit Hub', category: 'infrastructure', lat: 1.4470, lng: 103.7690, icon: '🚇', status: 'Normal', capacity: 'Border Telemetry Active', agent: 'Sentinel Guard' },

  { id: 'sengkang_gen', name: 'Sengkang General Hospital (SKH)', category: 'hospital', lat: 1.3957, lng: 103.8932, icon: '🏥', status: 'Normal', capacity: 'Trauma Bay Ready', agent: 'Healthcare Agent' },
  { id: 'punggol_police', name: 'Punggol Regional Command HQ', category: 'police', lat: 1.4050, lng: 103.9020, icon: '🚓', status: 'Normal', capacity: 'Autonomous Drone Fleet Active', agent: 'Patrol Agent' },
  { id: 'sengkang_fire', name: 'Sengkang Fire Station', category: 'fire', lat: 1.3910, lng: 103.8960, icon: '🚒', status: 'Normal', capacity: 'Fast Response Bikes Ready', agent: 'Fire Response Agent' },

  { id: 'changi_gen', name: 'Changi General Hospital (CGH)', category: 'hospital', lat: 1.3400, lng: 103.9580, icon: '🏥', status: 'Normal', capacity: 'Emergency Readiness 100%', agent: 'Healthcare Agent' },
  { id: 'bedok_police', name: 'Bedok Police Division HQ', category: 'police', lat: 1.3250, lng: 103.9310, icon: '🚓', status: 'Normal', capacity: '20 Patrol Units Active', agent: 'Traffic & Patrol Agent' },
  { id: 'changi_fire', name: 'Changi Airport Aircraft Rescue Fire Station', category: 'fire', lat: 1.3650, lng: 103.9880, icon: '🚒', status: 'Normal', capacity: 'Panther Crash Tender Ready', agent: 'Fire Response Agent' },
  { id: 'changi_airport', name: 'Changi International Airport Terminal 5', category: 'infrastructure', lat: 1.3644, lng: 103.9915, icon: '✈️', status: 'Normal', capacity: 'Airspace & Runway Secured', agent: 'Sentinel Guard' },

  { id: 'ttsh', name: 'Tan Tock Seng Hospital (TTSH)', category: 'hospital', lat: 1.3214, lng: 103.8458, icon: '🏥', status: 'Normal', capacity: 'NCID Isolation Ready', agent: 'Healthcare Agent' },
  { id: 'sgh', name: 'Singapore General Hospital (SGH)', category: 'hospital', lat: 1.2796, lng: 103.8347, icon: '🏥', status: 'Critical', capacity: 'Backup Fuel 35m', agent: 'Healthcare & Infra Agent' },
  { id: 'central_fire', name: 'Central Fire Station HQ (Heritage Site)', category: 'fire', lat: 1.2920, lng: 103.8490, icon: '🚒', status: 'Normal', capacity: 'Heavy Appliances Standby', agent: 'Fire Response Agent' },
  { id: 'marina_scada', name: 'Marina Bay Substation 12 SCADA', category: 'infrastructure', lat: 1.2820, lng: 103.8590, icon: '⚡', status: 'Normal', capacity: 'HV Grid 230kV Active', agent: 'Infrastructure Agent' },
  { id: 'mrt_orchard', name: 'Orchard MRT Central Hub', category: 'infrastructure', lat: 1.3040, lng: 103.8319, icon: '🚇', status: 'Normal', capacity: 'Passes 14,000/hr', agent: 'Transit Agent' },
  { id: 'gardens_bay', name: 'Gardens by the Bay Park', category: 'parks', lat: 1.2815, lng: 103.8636, icon: '🌳', status: 'Normal', capacity: 'Supertrees Clear', agent: 'Environmental Agent' },
  { id: 'bukit_timah_park', name: 'Bukit Timah Nature Reserve', category: 'parks', lat: 1.3547, lng: 103.7764, icon: '🌲', status: 'Elevated', capacity: 'Runoff Monitored', agent: 'Environmental Agent' }
];

/* ═══════════════════════════════════════════════════════════
   SINGAPORE FULL EXPRESSWAY NETWORK (9 MAJOR CORRIDORS)
 ═══════════════════════════════════════════════════════════ */
export const EXPRESSWAYS = [
  { name: 'Pan Island Expressway (PIE)', color: '#7C5CFF', coords: [[1.3190, 103.6360], [1.3340, 103.7070], [1.3300, 103.7800], [1.3323, 103.8580], [1.3400, 103.9580], [1.3650, 103.9880]] },
  { name: 'Central Expressway (CTE)', color: '#33C8FF', coords: [[1.3900, 103.8550], [1.3700, 103.8400], [1.3450, 103.8520], [1.3323, 103.8580], [1.3214, 103.8458], [1.2920, 103.8490]] },
  { name: 'Ayer Rajah Expressway (AYE)', color: '#22C55E', coords: [[1.3150, 103.6600], [1.2950, 103.7500], [1.2850, 103.8000], [1.2796, 103.8347], [1.2750, 103.8380], [1.2820, 103.8590]] },
  { name: 'Seletar Expressway (SLE)', color: '#F59E0B', coords: [[1.4350, 103.7800], [1.4150, 103.8200], [1.3900, 103.8550]] },
  { name: 'Kallang-Paya Lebar Expressway (KPE)', color: '#EC4899', coords: [[1.4000, 103.9000], [1.3500, 103.8900], [1.3000, 103.8700], [1.2950, 103.8650]] },
  { name: 'East Coast Parkway (ECP)', color: '#06B6D4', coords: [[1.2820, 103.8590], [1.3000, 103.9000], [1.3250, 103.9400], [1.3644, 103.9915]] },
  { name: 'Tampines Expressway (TPE)', color: '#8B5CF6', coords: [[1.3900, 103.8550], [1.3950, 103.9000], [1.3750, 103.9500], [1.3650, 103.9880]] },
  { name: 'Bukit Timah Expressway (BKE)', color: '#10B981', coords: [[1.4400, 103.7750], [1.3800, 103.7700], [1.3300, 103.7800]] },
  { name: 'Marina Coastal Expressway (MCE)', color: '#6366F1', coords: [[1.2720, 103.8400], [1.2750, 103.8550], [1.2820, 103.8590]] }
];
