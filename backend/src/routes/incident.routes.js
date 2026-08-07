import express from 'express';
import { incidentService } from '../services/incidentService.js';

const router = express.Router();

// GET /api/incidents - List all incidents
router.get('/', async (req, res, next) => {
  try {
    const incidents = await incidentService.getAllIncidents();
    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (err) {
    next(err);
  }
});

// GET /api/incidents/active - List active incidents
router.get('/active', async (req, res, next) => {
  try {
    const incidents = await incidentService.getActiveIncidents();
    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (err) {
    next(err);
  }
});

// POST /api/incidents - Trigger or add an incident
router.post('/', async (req, res, next) => {
  try {
    const { id, type } = req.body;
    const typeOrId = id || type;
    if (!typeOrId) {
      return res.status(400).json({ success: false, message: 'Incident ID/Type is required' });
    }
    const incident = await incidentService.triggerIncident(typeOrId, req.body);
    res.status(201).json({ success: true, message: `Incident ${typeOrId} triggered`, data: incident });
  } catch (err) {
    next(err);
  }
});

// POST /api/incidents/reset - Reset city state & clear all incidents
router.post('/reset', async (req, res, next) => {
  try {
    const result = await incidentService.resetAllIncidents();
    res.json({ success: true, message: 'City reset to normal state', data: result });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/incidents/:id/resolve - Mark incident as resolved
router.patch('/:id/resolve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const incident = await incidentService.resolveIncident(id);
    res.json({ success: true, message: `Incident ${id} resolved`, data: incident });
  } catch (err) {
    next(err);
  }
});

export default router;
