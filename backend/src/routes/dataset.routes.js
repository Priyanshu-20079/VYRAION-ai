import express from 'express';
import mongoose from 'mongoose';
import Incident from '../models/Incident.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/dataset/incidents (and GET /dataset/incidents)
router.get(['/', '/incidents'], async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database disconnected: Cannot generate dataset. MongoDB Atlas connection is required.'
      });
    }

    // Query real MongoDB Atlas documents from vyraion.incidents
    const rawIncidents = await Incident.find().sort({ createdAt: -1 });

    const schema = [
      { key: '_id', label: 'MongoDB ObjectId' },
      { key: 'id', label: 'Incident ID' },
      { key: 'uniqueId', label: 'Unique ID' },
      { key: 'title', label: 'Incident Title' },
      { key: 'name', label: 'Incident Name' },
      { key: 'type', label: 'Category Type' },
      { key: 'severity', label: 'Severity Level' },
      { key: 'status', label: 'Workflow Status' },
      { key: 'phase', label: 'Phase Number' },
      { key: 'hotspot', label: 'Location / Zone' },
      { key: 'lat', label: 'Latitude' },
      { key: 'lng', label: 'Longitude' },
      { key: 'destination', label: 'Destination Facility' },
      { key: 'resolutionTime', label: 'Est. Resolution Time' },
      { key: 'timeDetected', label: 'Time Detected' },
      { key: 'assignedAgentsCount', label: 'Assigned Agents Count' },
      { key: 'dispatchedUnitsCount', label: 'Dispatched Units Count' },
      { key: 'detectionEventsCount', label: 'Detection Events Count' },
      { key: 'fieldResponseCount', label: 'Field Response Count' },
      { key: 'prioritiesCount', label: 'AI Priorities Count' },
      { key: 'createdAt', label: 'Created At (ISO)' },
      { key: 'updatedAt', label: 'Updated At (ISO)' }
    ];

    // Flatten Useful Fields for Clean Tabular Dataset View
    const records = rawIncidents.map((doc) => {
      const inc = doc.toObject ? doc.toObject() : doc;
      return {
        _id: inc._id ? inc._id.toString() : '',
        id: inc.id || '',
        uniqueId: inc.uniqueId || inc.id || '',
        title: inc.title || inc.name || 'Emergency Incident',
        name: inc.name || inc.type || 'Incident',
        type: inc.type || inc.name || 'General Emergency',
        severity: inc.severity || 'HIGH',
        status: inc.status || 'AWAITING_APPROVAL',
        phase: typeof inc.phase === 'number' ? inc.phase : 3,
        hotspot: inc.hotspot || 'Expressway Corridor',
        lat: typeof inc.lat === 'number' ? inc.lat : 1.3521,
        lng: typeof inc.lng === 'number' ? inc.lng : 103.8198,
        destination: inc.destination || 'Central Station',
        resolutionTime: inc.resolutionTime || '10-15 min',
        timeDetected: inc.timeDetected || new Date(inc.createdAt || Date.now()).toLocaleTimeString(),
        assignedAgentsCount: Array.isArray(inc.assignedAgents) ? inc.assignedAgents.length : 0,
        dispatchedUnitsCount: Array.isArray(inc.dispatchedUnits) ? inc.dispatchedUnits.length : 0,
        detectionEventsCount: Array.isArray(inc.detectionEvents) ? inc.detectionEvents.length : 0,
        fieldResponseCount: Array.isArray(inc.fieldResponse) ? inc.fieldResponse.length : 0,
        prioritiesCount: Array.isArray(inc.priorities) ? inc.priorities.length : 0,
        createdAt: inc.createdAt ? new Date(inc.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: inc.updatedAt ? new Date(inc.updatedAt).toISOString() : new Date().toISOString(),
        rawDoc: inc
      };
    });

    const dbName = mongoose.connection.db ? mongoose.connection.db.databaseName : 'vyraion';
    const colName = Incident.collection ? Incident.collection.name : 'incidents';

    const metadata = {
      datasetName: 'VYRAION Emergency Incidents Dataset',
      source: 'MongoDB Atlas',
      database: dbName,
      collection: colName,
      totalRecords: records.length,
      generatedAt: new Date().toISOString(),
      schema
    };

    logger.info(`[Dataset API] Successfully generated real dataset from MongoDB Atlas '${dbName}.${colName}' (${records.length} records)`);

    return res.json({
      success: true,
      database: dbName,
      collection: colName,
      total: records.length,
      metadata,
      records
    });
  } catch (error) {
    logger.error(`[Dataset API Error]: ${error.stack || error.message}`);
    return next(error);
  }
});

export default router;
