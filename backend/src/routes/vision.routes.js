import express from 'express';
import { aiVisionBackendService } from '../services/aiVisionBackendService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// GET /api/vision/status — Get current backend vision engine status & latest detection
router.get('/status', (req, res) => {
  try {
    const statusData = aiVisionBackendService.getVisionStatus();
    res.json({ success: true, data: statusData });
  } catch (err) {
    logger.error(`[VisionRoutes] Failed to fetch status: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/vision/scan — Trigger backend CCTV inference scan & incident creation
router.post('/scan', async (req, res) => {
  try {
    const { camId } = req.body || {};
    const result = await aiVisionBackendService.triggerCameraDetection(camId);

    // Broadcast socket event if IO available
    const io = req.app.get('io');
    if (io) {
      io.emit('vision:detection', result);
      io.emit('incident:created', result.incident);
    }

    res.json({ success: true, data: result });
  } catch (err) {
    logger.error(`[VisionRoutes] Failed to run scan: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
