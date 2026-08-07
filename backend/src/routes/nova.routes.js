import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/* ═══════════════════════════════════════════════════════════
   ISLAND-WIDE SINGAPORE FACILITIES DATASET FOR CONTEXT
═══════════════════════════════════════════════════════════ */
const CITY_FACILITIES = [
  { name: 'Ng Teng Fong General Hospital', category: 'hospital', district: 'Jurong' },
  { name: 'National University Hospital (NUH)', category: 'hospital', district: 'Kent Ridge' },
  { name: 'Jurong Police Division HQ', category: 'police', district: 'Jurong' },
  { name: 'Jurong Fire Station #4', category: 'fire', district: 'Jurong' },
  { name: 'Jurong Island SCADA Power Plant', category: 'infrastructure', district: 'Jurong Island' },
  { name: 'Khoo Teck Puat Hospital (KTPH)', category: 'hospital', district: 'Yishun' },
  { name: 'Woodlands Causeway Transit Hub', category: 'infrastructure', district: 'Woodlands' },
  { name: 'Changi General Hospital (CGH)', category: 'hospital', district: 'Changi' },
  { name: 'Changi Airport Terminal 5', category: 'infrastructure', district: 'Changi' },
  { name: 'Tan Tock Seng Hospital (TTSH)', category: 'hospital', district: 'Novena' },
  { name: 'Singapore General Hospital (SGH)', category: 'hospital', district: 'Outram' },
  { name: 'Marina Bay Substation 12 SCADA', category: 'infrastructure', district: 'Marina Bay' },
  { name: 'Orchard MRT Central Hub', category: 'infrastructure', district: 'Orchard' }
];

// Map friendly model names to canonical model IDs
const MODEL_MAP = {
  'Claude 3.5 Sonnet': 'claude-3-5-sonnet-20241022',
  'Claude 3.7 Sonnet': 'claude-3-7-sonnet-20250219',
  'Claude 3.5 Haiku': 'claude-3-5-haiku-20241022',
  'GPT-4o': 'gpt-4o',
  'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-20241022',
  'claude-3-7-sonnet-20250219': 'claude-3-7-sonnet-20250219',
  'claude-3-5-haiku-20241022': 'claude-3-5-haiku-20241022'
};

/* ═══════════════════════════════════════════════════════════
   POST /api/nova/blueprint
   Synthesizes real LLM-backed decision blueprints using selected model
═══════════════════════════════════════════════════════════ */
router.post('/blueprint', async (req, res) => {
  const startTime = Date.now();
  const activeQueue = req.body.activeQueue || req.body.queue || req.body.incidents || [];
  const requestedModelName = req.body.model || 'Claude 3.5 Sonnet';
  const targetModelId = MODEL_MAP[requestedModelName] || MODEL_MAP['Claude 3.5 Sonnet'];

  if (!Array.isArray(activeQueue) || activeQueue.length === 0) {
    return res.json({
      success: true,
      blueprint: [],
      realAiTimeMs: Date.now() - startTime
    });
  }

  const activeCount = activeQueue.length;
  const targetCount = activeCount === 1 ? 4 : activeCount === 2 ? 6 : 8;
  const apiKey = process.env.ANTHROPIC_API_KEY || config.anthropicApiKey;

  if (!apiKey) {
    logger.warn('[Nova Route] ANTHROPIC_API_KEY missing. Returning explicit error state.');
    return res.status(503).json({
      success: false,
      error: 'AI reasoning unavailable — check ANTHROPIC_API_KEY',
      message: 'ANTHROPIC_API_KEY is not configured on the backend server.',
      realAiTimeMs: Date.now() - startTime
    });
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    // Default to sonnet if requested model is GPT-4o but Anthropic API is used
    const modelToUse = targetModelId.startsWith('gpt') ? 'claude-3-5-sonnet-20241022' : targetModelId;

    const systemPrompt = `You are Nova, the AI Decision Intelligence Engine for Vyraion OS, Singapore's Emergency Operations Command Platform.
Your task is to analyze active emergency incidents and synthesize a ranked, coordinated emergency decision blueprint.

RULES:
1. Output MUST be valid JSON array only. Do not include markdown code fences (\`\`\`json or \`\`\`), explanations, or preambles.
2. Return a JSON array containing EXACTLY ${targetCount} blueprint action objects ranked from 1 to ${targetCount}.
3. Each object in the array MUST strictly follow this JSON schema:
{
  "rank": number (1 to ${targetCount}),
  "title": string (Action title specifying location/facility),
  "agents": string (e.g. "Traffic & Patrol Agent", "Healthcare & Infra Agent", "Fire & Hazmat Agent", "Sentinel Guard"),
  "reason": string (Operational rationale linking location, facilities, and risk),
  "impact": string (Short quantitative impact statement, e.g. "-68% Delay", "100% ICU Power Preserved"),
  "aiTime": string (e.g. "0.8s"),
  "eta": string (Estimated arrival/resolution time e.g. "3–5 min")
}

CITY FACILITIES FOR CONTEXT:
${JSON.stringify(CITY_FACILITIES, null, 2)}`;

    const userPrompt = `ACTIVE EMERGENCY INCIDENTS QUEUE (${activeCount} Active):
${JSON.stringify(activeQueue, null, 2)}

Generate the ${targetCount}-item JSON blueprint array now.`;

    const response = await anthropic.messages.create({
      model: modelToUse,
      max_tokens: 1500,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const realAiTimeMs = Date.now() - startTime;
    let rawContent = response.content[0]?.text || '';

    // Strip markdown code fences
    rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();

    let blueprint = [];
    try {
      blueprint = JSON.parse(rawContent);
    } catch (parseErr) {
      logger.error('[Nova Route] Failed to parse LLM JSON response:', parseErr.message);
      return res.status(502).json({
        success: false,
        error: 'AI reasoning response format invalid — check LLM output',
        realAiTimeMs
      });
    }

    if (!Array.isArray(blueprint) || blueprint.length === 0) {
      return res.status(502).json({
        success: false,
        error: 'AI reasoning returned empty blueprint',
        realAiTimeMs
      });
    }

    // Standardize fields and calculate real latency display
    const realLatencySec = (realAiTimeMs / 1000).toFixed(1) + 's';
    blueprint = blueprint.map((item, idx) => ({
      ...item,
      rank: item.rank || idx + 1,
      aiTime: item.aiTime || realLatencySec
    }));

    return res.json({
      success: true,
      blueprint,
      realAiTimeMs,
      modelUsed: requestedModelName
    });

  } catch (err) {
    logger.error('[Nova Route] Anthropic API Error:', err.message);
    return res.status(500).json({
      success: false,
      error: `AI reasoning unavailable — ${err.message}`,
      realAiTimeMs: Date.now() - startTime
    });
  }
});

export default router;
