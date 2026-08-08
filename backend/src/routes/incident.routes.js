import express from 'express';
import { incidentService } from '../services/incidentService.js';

const router = express.Router();

const applyServerRoleFilter = (incidents, role) => {
  if (!role || role === 'all' || role === 'admin') return incidents;

  if (role === 'operator') {
    return incidents.filter(i => i.status === 'AWAITING_APPROVAL' || i.status === 'APPROVED' || i.status === 'RESOLVED');
  }

  if (role === 'authority') {
    return incidents.filter(i => i.severity === 'HIGH' || i.severity === 'CRITICAL' || i.status === 'AWAITING_APPROVAL' || i.status === 'APPROVED');
  }

  if (role === 'hospital') {
    return incidents.filter(i => {
      const typeStr = (i.type || '').toLowerCase();
      const idStr = (i.id || '').toLowerCase();
      if (typeStr.includes('medical') || typeStr.includes('hospital') || idStr.includes('medical') || idStr.includes('hospital')) {
        return true;
      }
      if (Array.isArray(i.dispatchedUnits)) {
        return i.dispatchedUnits.some(u => (u.category || '').toLowerCase() === 'hospital');
      }
      return false;
    });
  }

  if (role === 'reviewer') {
    return incidents.filter(i => i.status === 'AWAITING_APPROVAL' || i.status === 'APPROVED' || (i.priorities && i.priorities.length > 0));
  }

  if (role === 'investigator') {
    return incidents.filter(i => i.status === 'RESOLVED' || i.status === 'REJECTED');
  }

  if (role === 'user') {
    return incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'REJECTED');
  }

  return incidents;
};

// GET /api/incidents - List all incidents
router.get('/', async (req, res, next) => {
  try {
    let incidents = await incidentService.getAllIncidents();
    if (req.query.role) {
      incidents = applyServerRoleFilter(incidents, req.query.role);
    }
    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (err) {
    next(err);
  }
});

// GET /api/incidents/active - List active incidents
router.get('/active', async (req, res, next) => {
  try {
    let incidents = await incidentService.getActiveIncidents();
    if (req.query.role) {
      incidents = applyServerRoleFilter(incidents, req.query.role);
    }
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

// PATCH /api/incidents/:id/checklist - Merge a partial checklist update
router.patch('/:id/checklist', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await incidentService.updateChecklist(id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});


export default router;
