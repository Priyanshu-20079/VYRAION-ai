import { incidentService } from './incidentService.js';
import { logger } from '../utils/logger.js';

/* ═══════════════════════════════════════════════════════════
   BACKEND AI VISION ENGINE & CAMERA FEED ANALYZER
   Executes CCTV Analysis, YOLO Inference Simulation, and Risk Classification
 ═══════════════════════════════════════════════════════════ */

const BACKEND_CCTV_CAMERAS = [
  {
    id: 'cam_01',
    cameraName: 'Cam 01: CTE Expressway Corridor',
    locationName: 'Central Expressway (CTE) Junction 14',
    lat: 1.3323,
    lng: 103.8580,
    incidentType: 'traffic',
    incidentName: 'Traffic Accident',
    riskLevel: 'HIGH',
    confidence: 96.4,
    recommendedAgencies: ['Traffic Police', 'SCDF ALS Ambulance', 'LTA Heavy Tow'],
    label: 'Highway Collision & Structural Debris'
  },
  {
    id: 'cam_02',
    cameraName: 'Cam 02: Jurong SCADA Industrial Depot',
    locationName: 'Jurong Chemical Complex',
    lat: 1.3150,
    lng: 103.7050,
    incidentType: 'fire',
    incidentName: 'Fire Outbreak',
    riskLevel: 'CRITICAL',
    confidence: 98.2,
    recommendedAgencies: ['SCDF Hazmat Fire Engine', 'Trauma Unit', 'Police Patrol'],
    label: 'Industrial Chemical Thermal Anomaly (780°C)'
  },
  {
    id: 'cam_03',
    cameraName: 'Cam 03: Orchard MRT Station Platform 2',
    locationName: 'Orchard Central Hub',
    lat: 1.3048,
    lng: 103.8318,
    incidentType: 'safety',
    incidentName: 'Public Safety Incident',
    riskLevel: 'MEDIUM',
    confidence: 91.5,
    recommendedAgencies: ['Transit Security K9 Unit', 'SPF Tactical Unit'],
    label: 'Station Breach & Unattended Baggage'
  },
  {
    id: 'cam_04',
    cameraName: 'Cam 04: Rochor Canal Sluice Gate 3',
    locationName: 'Rochor Canal Sector',
    lat: 1.3300,
    lng: 103.7800,
    incidentType: 'rain',
    incidentName: 'Heavy Rain',
    riskLevel: 'LOW',
    confidence: 89.1,
    recommendedAgencies: ['PUB Drainage Works', 'LTA Maintenance'],
    label: 'Monsoon Waterlogging & Canal Surge'
  },
  {
    id: 'cam_05',
    cameraName: 'Cam 05: SGH Primary Substation 12',
    locationName: 'Singapore General Hospital Substation',
    lat: 1.2796,
    lng: 103.8347,
    incidentType: 'hospital',
    incidentName: 'Hospital Power Failure',
    riskLevel: 'CRITICAL',
    confidence: 97.6,
    recommendedAgencies: ['EMA Power Utility', 'SGH Engineering', 'Emergency Fuel Tanker'],
    label: 'Hospital Primary Feeder Power Arc'
  }
];

class AIVisionBackendService {
  constructor() {
    this.totalAnalysesCount = 48291;
    this.camerasOnline = 12;
    this.latestDetection = {
      ...BACKEND_CCTV_CAMERAS[0],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    this.startBackendVisionEngine();
  }

  // Continuous background vision engine loop (Simulates 24/7 CCTV ingestion)
  startBackendVisionEngine() {
    setInterval(() => {
      this.totalAnalysesCount += Math.floor(Math.random() * 5) + 2;
    }, 3000);
  }

  getVisionStatus() {
    return {
      status: 'ONLINE',
      engineState: 'ACTIVE',
      camerasOnline: this.camerasOnline,
      totalCameras: 12,
      totalAnalyses24h: this.totalAnalysesCount,
      aiModel: 'NeuralVision-v9 (Backend-Inference)',
      latestDetection: this.latestDetection
    };
  }

  // Trigger camera detection in backend & push to Nova + Incident lifecycle
  async triggerCameraDetection(camId = null) {
    const selected = camId
      ? BACKEND_CCTV_CAMERAS.find((c) => c.id === camId) || BACKEND_CCTV_CAMERAS[0]
      : BACKEND_CCTV_CAMERAS[Math.floor(Math.random() * BACKEND_CCTV_CAMERAS.length)];

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    this.latestDetection = {
      ...selected,
      timestamp: timeStr,
      confidence: Number((Math.random() * (98.8 - 91.0) + 91.0).toFixed(1))
    };

    logger.info(`[AIVisionBackendEngine] Detected ${this.latestDetection.riskLevel} Risk '${selected.incidentName}' at ${selected.cameraName}`);

    // Create incident in incidentService
    const createdInc = await incidentService.triggerIncident(selected.incidentType);

    return {
      success: true,
      detection: this.latestDetection,
      incident: createdInc
    };
  }
}

export const aiVisionBackendService = new AIVisionBackendService();
