import express from 'express';

const router = express.Router();

// Root route (GET /)
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Vyraion Backend',
    version: '0.1.0',
    health: '/health'
  });
});

// Health route (GET /health)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Vyraion Backend',
    version: '0.1.0'
  });
});

export default router;
