import express from 'express';
import { incidentService } from '../services/incidentService.js';
import { protect } from '../middleware/auth.middleware.js';
import {
  generateJSONReport,
  generateCSVReport,
  generateHTMLReport,
  generatePDFReportStream
} from '../services/reportGenerator.js';

const router = express.Router();

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ROLE-AWARE INCIDENT FILTERING (BACKEND SOURCE OF TRUTH)
 * MUST REMAIN IN SYNC WITH frontend/src/utils/incidentRoleFilters.js
 *
 * Supported Roles (7):
 * 1. operator     : Incidents awaiting or under dispatch (AWAITING_APPROVAL, APPROVED, RESOLVED)
 * 2. authority    : All incidents, sorted by severity
 * 3. hospital     : Incidents involving medical/hospital response (category===hospital or type medical/hospital)
 * 4. investigator : Resolved and rejected incidents only (RESOLVED, REJECTED)
 * 5. reviewer     : Incidents with AI-generated response blueprints (AWAITING_APPROVAL, APPROVED, priorities)
 * 6. admin        : Full unrestricted incident visibility (sorted by severity)
 * 7. user         : Active, non-resolved incidents (excludes RESOLVED, REJECTED)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export function isHospitalIncident(i) {
  if (!i) return false;

  const typeStr = String(i.type || i.name || i.id || '').toLowerCase();
  const catStr = String(i.category || '').toLowerCase();

  // 1. Incident defined type/category match
  if (
    typeStr.match(/medical|hospital|ambulance|injury|casualty|patient/) ||
    catStr.match(/medical|hospital/)
  ) {
    return true;
  }

  // 2. Dispatched units match
  if (Array.isArray(i.dispatchedUnits)) {
    return i.dispatchedUnits.some((u) => {
      const uCat = String(u.category || '').toLowerCase();
      const uType = String(u.type || '').toLowerCase();
      const uName = String(u.name || '').toLowerCase();
      const uIcon = String(u.icon || '');
      return (
        uCat === 'hospital' ||
        uCat === 'medical' ||
        uType.includes('ambulance') ||
        uType.includes('medical') ||
        uName.includes('ambulance') ||
        uIcon.includes('🚑')
      );
    });
  }

  return false;
}

const applyServerRoleFilter = (incidents, role) => {
  if (!incidents || !Array.isArray(incidents)) return [];
  if (!role || role === 'all' || role === 'admin') {
    const sevWeight = { CRITICAL: 3, HIGH: 2, ELEVATED: 1, LOW: 0 };
    return [...incidents].sort((a, b) => {
      const wa = sevWeight[a.severity] ?? -1;
      const wb = sevWeight[b.severity] ?? -1;
      return wb - wa;
    });
  }

  if (role === 'operator') {
    return incidents.filter(
      (i) => i.status === 'AWAITING_APPROVAL' || i.status === 'APPROVED' || i.status === 'RESOLVED'
    );
  }

  if (role === 'authority') {
    const sevWeight = { CRITICAL: 3, HIGH: 2, ELEVATED: 1, LOW: 0 };
    return [...incidents].sort((a, b) => {
      const wa = sevWeight[a.severity] ?? -1;
      const wb = sevWeight[b.severity] ?? -1;
      return wb - wa;
    });
  }

  if (role === 'hospital') {
    return incidents.filter(isHospitalIncident);
  }

  if (role === 'reviewer') {
    return incidents.filter(
      (i) =>
        i.status === 'AWAITING_APPROVAL' ||
        i.status === 'APPROVED' ||
        (i.priorities && i.priorities.length > 0)
    );
  }

  if (role === 'investigator') {
    return incidents.filter((i) => i.status === 'RESOLVED' || i.status === 'REJECTED');
  }

  if (role === 'user') {
    return incidents.filter((i) => i.status !== 'RESOLVED' && i.status !== 'REJECTED');
  }

  return incidents;
};

const getRequestRole = (req) => {
  if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret);
      if (decoded && decoded.email) {
        const cleanEmail = decoded.email.toLowerCase().trim();
        if (cleanEmail === 'operator@vyraion.ai' || cleanEmail === 'operator@vyraion.demo') return 'operator';
        if (cleanEmail === 'police@vyraion.demo') return 'authority';
        if (cleanEmail === 'hospital@vyraion.demo') return 'hospital';
        if (cleanEmail === 'investigator@vyraion.demo') return 'investigator';
        if (cleanEmail === 'reviewer@vyraion.demo') return 'reviewer';
        if (cleanEmail === 'user@vyraion.demo') return 'user';
        return 'admin';
      }
      if (decoded && decoded.role) return decoded.role;
    } catch (e) {}
  }
  return req.query ? req.query.role : null;
};

// GET /api/incidents - List all incidents
router.get('/', async (req, res, next) => {
  try {
    let incidents = await incidentService.getAllIncidents();
    const role = getRequestRole(req);
    if (role) {
      incidents = applyServerRoleFilter(incidents, role);
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
    const role = getRequestRole(req);
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

// GET /api/incidents/:id/report - Download/generate single-incident report (pdf, csv, html, json)
router.get('/:id/report', async (req, res, next) => {
  try {
    const { id } = req.params;
    const format = (req.query.format || 'pdf').toLowerCase();

    const incident = await incidentService.getIncidentById(id);
    if (!incident) {
      return res.status(404).json({ success: false, message: `Incident '${id}' not found in MongoDB Atlas` });
    }

    if (format === 'json') {
      const jsonReport = generateJSONReport(incident);
      return res.json(jsonReport);
    }

    if (format === 'csv') {
      const csvReport = generateCSVReport(incident);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="incident-report-${incident.uniqueId || id}.csv"`);
      return res.send(csvReport);
    }

    if (format === 'html') {
      const htmlReport = generateHTMLReport(incident);
      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlReport);
    }

    if (format === 'pdf') {
      return generatePDFReportStream(incident, res);
    }

    return res.status(400).json({ success: false, message: `Unsupported format '${format}'. Supported: pdf, csv, html, json.` });
  } catch (err) {
    next(err);
  }
});

export default router;
