import express from 'express';
import { incidentService } from '../services/incidentService.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

const applyServerRoleFilter = (incidents, role) => {
  if (!role || role === 'all') return incidents;

  if (role === 'operator') {
    return incidents.filter(i => i.status === 'AWAITING_APPROVAL' || i.status === 'APPROVED' || i.status === 'RESOLVED');
  }

  if (role === 'authority') {
    const sevWeight = { 'CRITICAL': 3, 'HIGH': 2, 'ELEVATED': 1, 'LOW': 0 };
    return [...incidents].sort((a, b) => {
      const wa = sevWeight[a.severity] ?? -1;
      const wb = sevWeight[b.severity] ?? -1;
      return wb - wa;
    });
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

  if (role === 'investigator' || role === 'reviewer') {
    return incidents.filter(i => i.status === 'RESOLVED');
  }

  return incidents;
};

// GET /api/incidents - List all incidents
router.get('/', protect, async (req, res, next) => {
  try {
    let incidents = await incidentService.getAllIncidents();
    const role = req.user?.role || req.query.role;
    if (role) {
      incidents = applyServerRoleFilter(incidents, role);
    }
    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (err) {
    next(err);
  }
});

// GET /api/incidents/active - List active incidents
router.get('/active', protect, async (req, res, next) => {
  try {
    let incidents = await incidentService.getActiveIncidents();
    const role = req.user?.role || req.query.role;
    if (role) {
      incidents = applyServerRoleFilter(incidents, role);
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
    console.log('[DEBUG POST /api/incidents] req.body:', req.body);
    console.log('[DEBUG POST /api/incidents] created incident:', incident);
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
