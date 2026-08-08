import Incident from '../models/Incident.js';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

let ioInstance = null;

export function setIoInstance(io) {
  ioInstance = io;
  logger.info('[IncidentService] Socket.io instance initialized for real-time event broadcasting.');
}

function broadcastEvent(eventName, payload) {
  if (ioInstance) {
    ioInstance.emit(eventName, payload);
    logger.info(`[Socket.io Broadcast] Emitted event '${eventName}' for incident '${payload.id || payload.incident?.id || 'all'}'`);
  }
}

// Master incident definitions for the 8 supported emergency types
const MASTER_INCIDENT_DEFS = {
  traffic: {
    id: 'traffic', type: 'Traffic Accident', name: 'Traffic Accident',
    title: 'Traffic Collision on Expressway Corridor', severity: 'HIGH',
    assignedAgents: ['Traffic', 'Healthcare', 'Pulse'],
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
    lat: 1.3323, lng: 103.8580, vehicleIcon: '🚑', vehicleName: 'ALS Ambulance #12', destination: 'Tan Tock Seng Hospital', action: 'Redirect traffic to expressway detour corridor'
  },
  fire: {
    id: 'fire', type: 'Fire Outbreak', name: 'Fire Outbreak',
    title: 'Industrial Chemical Blaze', severity: 'HIGH',
    assignedAgents: ['Fire', 'Traffic', 'Healthcare'],
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
    lat: 1.3150, lng: 103.7050, vehicleIcon: '🚒', vehicleName: 'Hazmat Fire Engine Unit', destination: 'Industrial SCADA Complex', action: 'Dispatch foam tender & establish 500m perimeter'
  },
  medical: {
    id: 'medical', type: 'Medical Emergency', name: 'Medical Emergency',
    title: 'Mass Casualty Triage Dispatch', severity: 'ELEVATED',
    assignedAgents: ['Healthcare', 'Traffic'],
    detectionEvents: [
      { source: '911 Dispatch', detail: 'Mass casualty report at Transit Hub', realTime: '4 sec' },
      { source: 'Hospital Network', detail: 'ICU occupancy high across region', realTime: '6 sec' }
    ],
    resolutionTime: '6–9 min',
    fieldResponse: [
      { unit: 'Ambulance', eta: '5–9 min', icon: '🚑' },
      { unit: 'Nearest Hospital', eta: '8–12 min transit', icon: '🏥' }
    ],
    priorities: [
      { title: 'Dispatch Advanced Life Support Ambulances', reason: 'Delivers immediate triage for casualties.', impact: 'Patients Triaged', aiTime: '0.9s', agents: 'Healthcare Agent', rank: 3 }
    ],
    lat: 1.3048, lng: 103.8318, vehicleIcon: '🚑', vehicleName: 'ALS Ambulance Fleet', destination: 'Regional Trauma Hospital', action: 'Dispatch ALS Ambulances & alert trauma surgeons'
  },
  power: {
    id: 'power', type: 'Power Grid Failure', name: 'Power Grid Failure',
    title: 'Substation Transformer Outage', severity: 'CRITICAL',
    assignedAgents: ['Infrastructure', 'Healthcare'],
    detectionEvents: [
      { source: 'Grid Frequency Sensor', detail: 'Substation cascade trip detected', realTime: '2 sec' }
    ],
    resolutionTime: '18–25 min',
    fieldResponse: [
      { unit: 'Power Restoration Team', eta: '12–25 min', icon: '⚡' }
    ],
    priorities: [
      { title: 'Reroute High-Voltage Feeders from Substation', reason: 'Restores power to hospitals and water facilities.', impact: 'Feed Restored', aiTime: '1.1s', agents: 'Infrastructure Agent', rank: 1 }
    ],
    lat: 1.2820, lng: 103.8590, vehicleIcon: '⚡', vehicleName: 'Grid Repair Crew Unit', destination: 'Substation Control Hub', action: 'Reroute feeder line & dispatch mobile generator'
  },
  hospital: {
    id: 'hospital', type: 'Hospital Power Failure', name: 'Hospital Power Failure',
    title: 'Hospital Primary Power Feeder Outage', severity: 'CRITICAL',
    assignedAgents: ['Healthcare', 'Infrastructure'],
    detectionEvents: [
      { source: 'Hospital Monitoring', detail: 'Main power feed lost at City General', realTime: '4 sec' }
    ],
    resolutionTime: '18–25 min',
    fieldResponse: [
      { unit: 'Generator Team', eta: '12–18 min', icon: '⛽' }
    ],
    priorities: [
      { title: 'Restore Hospital Primary Power Feed & Dispatch Fuel', reason: 'Replenishes diesel generators before depletion.', impact: 'Power Restored', aiTime: '1.4s', agents: 'Healthcare & Infra', rank: 1 }
    ],
    lat: 1.2796, lng: 103.8347, vehicleIcon: '⛽', vehicleName: 'Generator Fuel Tanker', destination: 'Singapore General Hospital (SGH)', action: 'Dispatch diesel tanker & restore primary power feed'
  },
  hazmat: {
    id: 'hazmat', type: 'Hazardous Material Spill', name: 'Hazardous Material Spill',
    title: 'Chemical Toxic Spill at Logistics Depot', severity: 'CRITICAL',
    assignedAgents: ['Fire', 'Healthcare', 'Infrastructure'],
    detectionEvents: [
      { source: 'Gas Sensor Array', detail: 'Toxic vapor concentration elevated', realTime: '3 sec' }
    ],
    resolutionTime: '25–35 min',
    fieldResponse: [
      { unit: 'Hazmat Decon Unit', eta: '8–12 min', icon: '☣️' }
    ],
    priorities: [
      { title: 'Deploy Chemical Neutralizer & Evacuate Depot', reason: 'Neutralizes toxic vapor plume.', impact: 'Contamination Sealed', aiTime: '1.1s', agents: 'Fire & Hazmat Agent', rank: 1 }
    ],
    lat: 1.3000, lng: 103.7200, vehicleIcon: '☣️', vehicleName: 'Hazmat Containment Unit', destination: 'Jurong Chemical Depot', action: 'Deploy chemical neutralizer & seal vapor plume'
  },
  safety: {
    id: 'safety', type: 'Public Safety Incident', name: 'Public Safety Incident',
    title: 'Unattended Package & Station Breach', severity: 'HIGH',
    assignedAgents: ['Cyber', 'Traffic'],
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
    lat: 1.3040, lng: 103.8319, vehicleIcon: '🐕', vehicleName: 'Tactical K9 Security Unit', destination: 'Orchard Central MRT', action: 'Evacuate concourse & deploy scanning robot'
  },
  rain: {
    id: 'rain', type: 'Heavy Rain', name: 'Heavy Rain',
    title: 'Torrential Monsoon Rainfall Alert', severity: 'ELEVATED',
    assignedAgents: ['Weather', 'Infrastructure'],
    detectionEvents: [
      { source: 'Weather API', detail: 'Rainfall rate 65mm/hr detected', realTime: '5 sec' }
    ],
    resolutionTime: '12–18 min',
    fieldResponse: [
      { unit: 'Drainage Pump Team', eta: '6–10 min', icon: '🔧' }
    ],
    priorities: [
      { title: 'Activate Stormwater Drainage Pumps', reason: 'Prevents canal overflow.', impact: 'Canal Normal', aiTime: '0.9s', agents: 'Weather Agent', rank: 4 }
    ],
    lat: 1.3300, lng: 103.7800, vehicleIcon: '🏗️', vehicleName: 'Public Works Pump Truck', destination: 'Bukit Timah Underpass', action: 'Deploy drainage pumps'
  }
};

// Centralized In-Memory incident store & Knowledge Base report repository
const inMemoryIncidents = new Map();
const inMemoryReports = [];

class IncidentService {
  constructor() {
    this.startStateEngine();
  }

  // Universal State Engine: Handles phase progression & 60-120s auto-completion
  startStateEngine() {
    setInterval(async () => {
      const now = Date.now();
      for (const [id, inc] of inMemoryIncidents.entries()) {
        if (inc.status !== 'RESOLVED' && inc.status !== 'REJECTED') {
          // Pause at Phase 3 (Human Operator Approval Required) for ALL incident types
          if (inc.phase === 3 && inc.status !== 'APPROVED') {
            if (inc.status !== 'AWAITING_APPROVAL') {
              inc.status = 'AWAITING_APPROVAL';
              broadcastEvent('incident:phase-changed', { id, phase: inc.phase, status: inc.status, incident: inc });
            }
            continue;
          }

          if (inc.phase < 4 && inc.status !== 'AWAITING_APPROVAL') {
            inc.phase += 1;
            if (inc.phase === 2) inc.status = 'PROCESSING';
            if (inc.phase === 3) inc.status = 'AWAITING_APPROVAL';

            logger.info(`[IncidentEngine] Incident '${id}' advanced to Phase ${inc.phase} (${inc.status})`);
            broadcastEvent('incident:phase-changed', { id, phase: inc.phase, status: inc.status, incident: inc });
          }

          // Automatic Mission Completion Engine (60s - 120s timer post-approval)
          if (inc.status === 'APPROVED' && inc.phase === 4 && inc.missionEndTime) {
            const approvedTime = new Date(inc.approvedAt).getTime();
            const elapsedSec = Math.round((now - approvedTime) / 1000);
            const totalSec = Math.round(inc.missionDurationMs / 1000);

            let oldStage = inc.liveStage;
            if (elapsedSec < Math.round(totalSec * 0.3)) {
              inc.liveStage = 'En Route';
            } else if (elapsedSec < Math.round(totalSec * 0.7)) {
              inc.liveStage = 'On Scene';
            } else if (now < inc.missionEndTime) {
              inc.liveStage = 'Situation Stabilized';
            } else {
              inc.liveStage = 'Mission Complete';
              await this.resolveIncident(id, inc.operator || 'Nova AI Engine');
              logger.info(`[IncidentEngine] Automatic Mission Completion executed for '${id}' after ${elapsedSec}s`);
              continue;
            }

            if (oldStage !== inc.liveStage) {
              broadcastEvent('incident:phase-changed', { id, phase: inc.phase, status: inc.status, liveStage: inc.liveStage, incident: inc });
            }
          }

          try {
            if (mongoose.connection.readyState === 1) {
              await Incident.findOneAndUpdate({ id }, { phase: inc.phase, status: inc.status, liveStage: inc.liveStage, dispatchedUnits: inc.dispatchedUnits }, { upsert: true });
            }
          } catch (e) {
            logger.error(`[IncidentService DB Error] Failed to update incident '${id}':`, e.message);
          }
        }
      }
    }, 1500);
  }

  async getAllIncidents() {
    try {
      if (mongoose.connection.readyState === 1) {
        const dbIncidents = await Incident.find().sort({ detectedAt: -1 });
        if (dbIncidents && dbIncidents.length > 0) {
          // Sync memory store from DB source of truth
          dbIncidents.forEach((inc) => inMemoryIncidents.set(inc.id, inc.toObject ? inc.toObject() : inc));
          return dbIncidents;
        }
      }
    } catch (e) {
      logger.error('[IncidentService DB Error] Failed to fetch incidents from MongoDB:', e.message);
    }
    return Array.from(inMemoryIncidents.values());
  }

  async getActiveIncidents() {
    const all = await this.getAllIncidents();
    return all.filter((inc) => inc.status !== 'RESOLVED' && inc.status !== 'REJECTED');
  }

  async getIncidentById(id) {
    try {
      if (mongoose.connection.readyState === 1) {
        const query = [{ id }, { uniqueId: id }];
        if (mongoose.Types.ObjectId.isValid(id)) {
          query.push({ _id: id });
        }
        const dbInc = await Incident.findOne({ $or: query });
        if (dbInc) {
          const obj = dbInc.toObject ? dbInc.toObject() : dbInc;
          inMemoryIncidents.set(obj.id || id, obj);
          return obj;
        }
      }
    } catch (e) {
      logger.error(`[IncidentService DB Error] Failed to find incident '${id}':`, e.message);
    }
    if (inMemoryIncidents.has(id)) return inMemoryIncidents.get(id);
    for (const inc of inMemoryIncidents.values()) {
      if (inc.uniqueId === id || inc.id === id || String(inc._id) === String(id)) return inc;
    }
    return null;
  }

  // Trigger ANY incident: Instantly creates & pushes into Operator Approval Workflow (Phase 3)
  async triggerIncident(typeOrId, payload = {}) {
    const typeKey = payload.type || typeOrId;
    const def = MASTER_INCIDENT_DEFS[typeKey] || MASTER_INCIDENT_DEFS[typeOrId];
    if (!def) throw new Error(`Unknown incident type/ID: ${typeOrId}`);

    const uniqueId = payload.uniqueId || `${def.id}_${Date.now()}`;
    const now = new Date();

    const newInc = {
      ...def,
      ...payload,
      id: uniqueId,
      uniqueId: uniqueId,
      type: def.type,
      name: def.name,
      status: 'AWAITING_APPROVAL',
      phase: 3,
      lat: payload.lat || def.lat,
      lng: payload.lng || def.lng,
      hotspot: payload.hotspot || 'Expressway Corridor',
      dispatchedUnits: payload.dispatchedUnits || def.fieldResponse,
      detectedAt: now,
      timeDetected: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      checklist: {
        incidentVerified: true,
        teamNotified:     false,
        unitsDispatched:  false,
        unitsArrived:     false,
        hospitalNotified: false,
        incidentResolved: false
      }
    };

    inMemoryIncidents.set(uniqueId, newInc);

    try {
      if (mongoose.connection.readyState === 1) {
        const savedDoc = await Incident.create(newInc);
        if (savedDoc) {
          newInc._id = savedDoc._id;
          logger.info(`[IncidentService] Saved to MongoDB Atlas with _id: ${savedDoc._id}`);
        }
      }
    } catch (e) {
      logger.error(`[IncidentService DB Error] Failed to insert triggered incident '${uniqueId}':`, e.stack || e.message);
    }

    logger.info(`[IncidentService] Dynamic Incident Created: '${uniqueId}' -> AWAITING_APPROVAL (Phase 3)`);
    broadcastEvent('incident:created', newInc);
    return newInc;
  }

  async approveIncident(id, operatorName = 'Priyanshu (Operator)') {
    let inc = await this.getIncidentById(id);
    if (!inc) throw new Error(`Incident '${id}' not found`);

    const targetId = inc.id || id;
    const now = Date.now();
    const randomDurationMs = Math.floor(Math.random() * (120000 - 60000 + 1)) + 60000;

    inc.status = 'APPROVED';
    inc.phase = 4;
    inc.approvedAt = new Date(now);
    inc.missionDurationMs = randomDurationMs;
    inc.missionEndTime = now + randomDurationMs;
    // Patch in-memory checklist for approve
    if (!inc.checklist) inc.checklist = {};
    inc.checklist.teamNotified = true;
    inc.checklist.unitsDispatched = true;

    // Auto-set hospitalNotified when medical/ambulance units are among the dispatched units.
    // This covers Traffic Accident (ambulance), Medical Emergency, Fire (ambulance), Hospital, Hazmat.
    const units = inc.dispatchedUnits || [];
    const hasMedical = units.some((u) => {
      const cat = (u.category || u.type || u.unit || '').toLowerCase();
      return cat.includes('hospital') || cat.includes('medical') || cat.includes('ambulance') || cat.includes('health');
    }) || ['medical', 'hospital', 'traffic', 'fire', 'hazmat'].includes(
      inc.id && inc.id.includes('_') ? inc.id.split('_')[0] : (inc.id || '')
    );
    if (hasMedical) {
      inc.checklist.hospitalNotified = true;
    }

    inc.liveStage = 'En Route';
    inc.operator = operatorName;

    inMemoryIncidents.set(targetId, inc);

    try {
      if (mongoose.connection.readyState === 1) {
        const checklistPersist = {
          'checklist.teamNotified': true,
          'checklist.unitsDispatched': true,
        };
        if (inc.checklist.hospitalNotified) {
          checklistPersist['checklist.hospitalNotified'] = true;
        }
        await Incident.findOneAndUpdate({ $or: [{ id: targetId }, { uniqueId: targetId }] }, {
          status: 'APPROVED',
          phase: 4,
          approvedAt: inc.approvedAt,
          missionDurationMs: randomDurationMs,
          missionEndTime: inc.missionEndTime,
          liveStage: inc.liveStage,
          operator: inc.operator,
          dispatchedUnits: inc.dispatchedUnits,
          ...checklistPersist
        }, { upsert: true });
      }
    } catch (e) {
      logger.error(`[IncidentService DB Error] Failed to approve incident '${targetId}':`, e.message);
    }

    logger.info(`[IncidentService] Operator APPROVED incident '${targetId}' (Phase 4 Dispatched, Auto-completion in ${Math.round(randomDurationMs/1000)}s)`);
    broadcastEvent('incident:approved', inc);
    broadcastEvent('incident:phase-changed', { id: targetId, phase: 4, status: 'APPROVED', incident: inc });
    return inc;
  }

  async rejectIncident(id) {
    let inc = await this.getIncidentById(id);
    if (!inc) throw new Error(`Incident '${id}' not found`);

    inc.status = 'REJECTED';
    inc.phase = 0;
    inMemoryIncidents.set(id, inc);

    try {
      if (mongoose.connection.readyState === 1) {
        await Incident.findOneAndUpdate({ id }, { status: 'REJECTED', phase: 0 });
      }
    } catch (e) {
      logger.error(`[IncidentService DB Error] Failed to reject incident '${id}':`, e.message);
    }

    logger.info(`[IncidentService] Operator REJECTED incident '${id}'`);
    broadcastEvent('incident:phase-changed', { id, phase: 0, status: 'REJECTED', incident: inc });
    return inc;
  }

  async resolveIncident(id, operatorName = 'System Operator') {
    let inc = await this.getIncidentById(id);
    if (!inc) throw new Error(`Incident '${id}' not found`);

    inc.status = 'RESOLVED';
    inc.phase = 5;
    inc.resolvedAt = new Date();
    inc.liveStage = 'Mission Complete';

    // Derive the base type key (e.g. 'traffic', 'fire') from the uniqueId or type string
    // so the Dashboard can unlock the exact trigger button for this incident.
    const typeKey = inc.id && inc.id.includes('_') ? inc.id.split('_')[0] : (inc.id || 'unknown');

    // Patch in-memory checklist for resolve
    if (!inc.checklist) inc.checklist = {};
    inc.checklist.incidentResolved = true;

    const report = this.generateKnowledgeReport(inc, operatorName || inc.operator);
    inMemoryReports.unshift(report);

    inMemoryIncidents.set(id, inc);

    try {
      if (mongoose.connection.readyState === 1) {
        await Incident.findOneAndUpdate({ $or: [{ id }, { uniqueId: id }] }, {
          status: 'RESOLVED', phase: 5, resolvedAt: inc.resolvedAt,
          'checklist.incidentResolved': true
        });
      }
    } catch (e) {
      logger.error(`[IncidentService DB Error] Failed to resolve incident '${id}':`, e.message);
    }

    logger.info(`[IncidentService] RESOLVED & ARCHIVED incident '${id}' (Knowledge Report generated)`);
    // Broadcast phase-changed FIRST so checklist panels see incidentResolved=true before the
    // incident:resolved event causes the Dashboard to remove the card from activeQueue.
    broadcastEvent('incident:phase-changed', { id, phase: 5, status: 'RESOLVED', incident: inc });
    // Then broadcast the resolved event for cleanup (removes card, unlocks trigger button, etc.)
    broadcastEvent('incident:resolved', { incident: inc, report, typeKey, id });
    return inc;
  }

  // ─── CHECKLIST UPDATE ────────────────────────────────────────────────────
  async updateChecklist(id, checklistPatch) {
    let inc = await this.getIncidentById(id);
    if (!inc) throw new Error(`Incident '${id}' not found`);

    const targetId = inc.id || id;

    // Merge patch into in-memory checklist
    if (!inc.checklist) inc.checklist = {};
    Object.assign(inc.checklist, checklistPatch);
    inMemoryIncidents.set(targetId, inc);

    try {
      if (mongoose.connection.readyState === 1) {
        // Build $set payload with dot-notation keys so we only touch changed fields
        const setPayload = {};
        for (const [key, value] of Object.entries(checklistPatch)) {
          setPayload[`checklist.${key}`] = value;
        }
        const updated = await Incident.findOneAndUpdate(
          { $or: [{ id: targetId }, { uniqueId: targetId }] },
          { $set: setPayload },
          { new: true }
        );

        // Timeline event
        const entries = Object.entries(checklistPatch).map(([k, v]) => `${k} = ${v}`).join(', ');
        logger.info(`[IncidentService] ☑ Checklist updated for '${targetId}': ${entries}`);

        // Audit log
        logger.info(`[AuditLog] action=CHECKLIST_UPDATED incidentId=${targetId} patch=${JSON.stringify(checklistPatch)}`);

        // Broadcast so all connected clients reconcile their state (include phase+status so handleIncidentChange merges correctly)
        const finalInc = updated ? (updated.toObject ? updated.toObject() : updated) : inc;
        broadcastEvent('incident:phase-changed', { id: targetId, phase: finalInc.phase, status: finalInc.status, incident: finalInc });

        return updated ? (updated.toObject ? updated.toObject() : updated) : inc;
      }
    } catch (e) {
      logger.error(`[IncidentService DB Error] Failed to update checklist for '${targetId}':`, e.message);
    }

    // Offline fallback — broadcast with in-memory data
    broadcastEvent('incident:phase-changed', { id: targetId, incident: inc });
    return inc;
  }

  async resetAllIncidents() {
    inMemoryIncidents.clear();
    logger.info(`[IncidentService] Reset City executed: Live simulation state reset. Historical MongoDB documents preserved.`);
    // Use the dedicated incident:reset event so Dashboard and Operator Console
    // clear live UI state (activeQueue, timeline, phase, trigger buttons) atomically.
    broadcastEvent('incident:reset', { id: 'all', reset: true });
    return { success: true, message: 'All live incidents reset to normal city status.' };
  }

  generateKnowledgeReport(inc, operatorName = 'System Operator') {
    const outcomeMessages = {
      traffic: 'Traffic congestion cleared. Emergency corridor reopened.',
      fire: 'Industrial chemical blaze contained and extinguished.',
      medical: 'Medical patients triaged and transported to hospital.',
      power: 'Substation feeder rerouted. Grid primary power restored.',
      hospital: 'City General primary power feed restored. ICU systems nominal.',
      hazmat: 'Chemical spill neutralized. Contamination containment verified.',
      safety: 'Perimeter secured. Crowd safety protocols established.',
      rain: 'Torrential rainfall advisory lifted. Drainage systems clear.'
    };

    const outcome = outcomeMessages[inc.id] || `${inc.name || 'Incident'} resolved successfully.`;
    const approvedAt = inc.approvedAt ? new Date(inc.approvedAt) : new Date();
    const durationSec = inc.approvedAt ? Math.max(1, Math.round((Date.now() - approvedAt.getTime()) / 1000)) : 75;

    return {
      id: `rep_${inc.id}_${Date.now()}`,
      incidentId: inc.id,
      incidentType: inc.type || inc.name || 'Emergency Incident',
      title: inc.title || inc.name,
      approvalTime: approvedAt.toISOString(),
      dispatchTime: approvedAt.toISOString(),
      completionTime: new Date().toISOString(),
      operator: operatorName || 'Priyanshu (Operator)',
      aiStrategy: inc.priorities && inc.priorities.length > 0 ? inc.priorities[0].title : 'Multi-Agent Autonomous Dispatch',
      durationSeconds: durationSec,
      outcome: outcome,
      createdAt: new Date().toISOString()
    };
  }

  async getKnowledgeReports() {
    return inMemoryReports;
  }
}

export const incidentService = new IncidentService();
