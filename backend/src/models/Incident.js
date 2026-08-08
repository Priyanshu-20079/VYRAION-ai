import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  uniqueId: { type: String },
  type: { type: String, required: true },
  name: { type: String, required: true },
  title: { type: String },
  severity: { type: String, enum: ['LOW', 'ELEVATED', 'HIGH', 'CRITICAL'], default: 'HIGH' },
  status: { type: String, default: 'AWAITING_APPROVAL' },
  phase: { type: Number, default: 1, min: 1, max: 5 },
  detectedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  missionDurationMs: { type: Number },
  missionEndTime: { type: Number },
  liveStage: { type: String },
  operator: { type: String },
  timeDetected: { type: String },
  hotspot: { type: String },
  assignedAgents: [{ type: String }],
  detectionEvents: [{
    source: String,
    detail: String,
    realTime: String
  }],
  resolutionTime: { type: String },
  fieldResponse: { type: mongoose.Schema.Types.Mixed },
  dispatchedUnits: { type: mongoose.Schema.Types.Mixed },
  priorities: [{
    title: String,
    reason: String,
    impact: String,
    aiTime: String,
    agents: String,
    rank: Number
  }],
  lat: { type: Number },
  lng: { type: Number },
  vehicleIcon: { type: String },
  vehicleName: { type: String },
  destination: { type: String },
  action: { type: String },
  checklist: {
    type: mongoose.Schema.Types.Mixed,
    default: () => ({
      incidentVerified: false,
      teamNotified:     false,
      unitsDispatched:  false,
      unitsArrived:     false,
      hospitalNotified: false,
      incidentResolved: false
    })
  }
}, {
  timestamps: true
});

const Incident = mongoose.models.Incident || mongoose.model('Incident', incidentSchema);

export default Incident;
