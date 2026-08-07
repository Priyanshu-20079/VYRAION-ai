import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const AI_URL = config.aiServiceUrl || 'http://localhost:8000';

// Fallback in-memory documents for local Node offline mode
const memoryDocs = [
  { name: 'Traffic Incident Coordinated Response Protocol.md', category: 'Expressway Operations', chunks: 3, uploaded_at: 'System Startup', status: 'Indexed & Vectorized' },
  { name: 'Hospital Emergency Power & Grid Backup Protocol.md', category: 'Critical Infrastructure', chunks: 3, uploaded_at: 'System Startup', status: 'Indexed & Vectorized' },
  { name: 'Industrial Fire & Hazmat Containment SOP.md', category: 'Fire & Rescue', chunks: 3, uploaded_at: 'System Startup', status: 'Indexed & Vectorized' },
  { name: 'Monsoon Flood & Stormwater Drainage Protocol.md', category: 'PUB Water Infrastructure', chunks: 3, uploaded_at: 'System Startup', status: 'Indexed & Vectorized' },
  { name: 'Public Safety Transit Station Lockdown Protocol.md', category: 'Security & Counter-Terrorism', chunks: 3, uploaded_at: 'System Startup', status: 'Indexed & Vectorized' }
];

/* ═══════════════════════════════════════════════════════════
   GET /api/knowledge/documents
═══════════════════════════════════════════════════════════ */
router.get('/documents', async (req, res) => {
  try {
    const aiRes = await fetch(`${AI_URL}/api/knowledge/documents`);
    if (aiRes.ok) {
      const data = await aiRes.json();
      return res.json(data);
    }
  } catch (err) {
    logger.warn('[Knowledge Route] AI microservice unreachable. Serving memory fallback docs:', err.message);
  }

  const totalChunks = memoryDocs.reduce((acc, d) => acc + d.chunks, 0);
  return res.json({
    success: true,
    documents: memoryDocs,
    total_documents: memoryDocs.length,
    total_chunks: totalChunks,
    isFallback: true
  });
});

/* ═══════════════════════════════════════════════════════════
   POST /api/knowledge/search
═══════════════════════════════════════════════════════════ */
router.post('/search', async (req, res) => {
  const { query, top_k = 5 } = req.body;
  
  try {
    const aiRes = await fetch(`${AI_URL}/api/knowledge/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k })
    });
    
    if (aiRes.ok) {
      const data = await aiRes.json();
      return res.json(data);
    }
  } catch (err) {
    logger.warn('[Knowledge Route] AI microservice search failed:', err.message);
  }

  // Fallback memory search
  const q = (query || '').toLowerCase();
  const results = memoryDocs
    .filter(d => d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q) || q.length === 0)
    .map(d => ({
      id: `fallback_${d.name}`,
      title: d.name,
      category: d.category,
      score: 94.2,
      similarity: 0.942,
      snippet: `Standard operating emergency procedure for ${d.name}. Coordinated field team dispatch protocol.`
    }));

  return res.json({
    success: true,
    query,
    results,
    total_results: results.length,
    isFallback: true
  });
});

/* ═══════════════════════════════════════════════════════════
   POST /api/knowledge/upload
═══════════════════════════════════════════════════════════ */
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded.' });
  }

  try {
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname);
    if (req.body.category) {
      formData.append('category', req.body.category);
    }

    const aiRes = await fetch(`${AI_URL}/api/knowledge/upload`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders()
    });

    if (aiRes.ok) {
      const data = await aiRes.json();
      return res.json(data);
    }
  } catch (err) {
    logger.warn('[Knowledge Route] AI microservice upload failed:', err.message);
  }

  // Fallback document insert into memory
  const newDoc = {
    name: req.file.originalname,
    category: req.body.category || 'Standard Protocol',
    chunks: Math.ceil(req.file.size / 500) || 1,
    uploaded_at: new Date().toISOString(),
    status: 'Indexed & Vectorized'
  };
  memoryDocs.unshift(newDoc);

  return res.json({
    success: true,
    message: `Document '${req.file.originalname}' indexed successfully (local memory fallback).`,
    document: newDoc,
    isFallback: true
  });
});

export default router;
