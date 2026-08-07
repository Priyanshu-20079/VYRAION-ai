import express from 'express';
import { incidentService } from '../services/incidentService.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { isOperatorOnline } from '../services/sessionManager.js';

const router = express.Router();

/* ═══════════════════════════════════════════════════════════
   GET /api/operator/status — Get Operator Online Status
═══════════════════════════════════════════════════════════ */
router.get('/status', protect, async (req, res) => {
  return res.json({
    success: true,
    online: isOperatorOnline()
  });
});

/* ═══════════════════════════════════════════════════════════
   GET /api/operator/pending — Active Incidents Pending Operator Action
═══════════════════════════════════════════════════════════ */
router.get('/pending', protect, requireRole('operator'), async (req, res) => {
  try {
    const active = await incidentService.getActiveIncidents();
    // Return both AWAITING_APPROVAL (needs decision) and APPROVED (active mission,
    // awaiting operator "Mission Complete" confirmation or auto-timer expiry).
    const pending = active.filter(
      (inc) => inc.status === 'AWAITING_APPROVAL' || inc.status === 'APPROVED'
    );
    return res.json({
      success: true,
      data: pending
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   GET /api/operator/reports — Completed Incident Knowledge Base Reports
═══════════════════════════════════════════════════════════ */
router.get('/reports', protect, requireRole('operator'), async (req, res) => {
  try {
    const reports = await incidentService.getKnowledgeReports();
    return res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/operator/approve/:id — Operator Approves Mission
═══════════════════════════════════════════════════════════ */
router.post('/approve/:id', protect, requireRole('operator'), async (req, res) => {
  try {
    const { id } = req.params;
    const operatorName = req.user?.name || 'Priyanshu (Operator)';
    const updated = await incidentService.approveIncident(id, operatorName);
    return res.json({
      success: true,
      message: `Mission '${id}' APPROVED by Operator. AI Dispatch engaged.`,
      data: updated
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/operator/reject/:id — Operator Rejects Mission
═══════════════════════════════════════════════════════════ */
router.post('/reject/:id', protect, requireRole('operator'), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await incidentService.rejectIncident(id);
    return res.json({
      success: true,
      message: `Mission '${id}' REJECTED by Operator.`,
      data: updated
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/operator/resolve/:id — Close Case & Archive Incident
═══════════════════════════════════════════════════════════ */
router.post('/resolve/:id', protect, requireRole('operator'), async (req, res) => {
  try {
    const { id } = req.params;
    const operatorName = req.user?.name || 'Priyanshu (Operator)';
    const updated = await incidentService.resolveIncident(id, operatorName);
    return res.json({
      success: true,
      message: `Mission '${id}' RESOLVED and archived.`,
      data: updated
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
