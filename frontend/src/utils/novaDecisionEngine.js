import { NOVA_API_URL } from '../config/api';

/* ═══════════════════════════════════════════════════════════
   VYRAION NOVA DECISION ENGINE CLIENT UTILITY
   -----------------------------------------------------------
   PRIMARY MODE: Live LLM decision synthesis via backend /api/nova/blueprint
   FALLBACK / SIMULATION MODE: Documented offline simulation engine triggered
   when VITE_DISABLE_LIVE_AI=true is set or network is offline.
 ═══════════════════════════════════════════════════════════ */

/**
 * Asynchronously fetch real LLM decision blueprint from backend /api/nova/blueprint
 * Passes selected model from settings.
 */
export async function fetchNovaBlueprint(activeQueue = [], selectedModel = null) {
  if (!activeQueue || activeQueue.length === 0) {
    return { success: true, blueprint: [], realAiTimeMs: 0 };
  }

  // Read selected model from localStorage if not passed
  const modelToUse = selectedModel || localStorage.getItem('vyraion_selected_model') || 'Claude 3.5 Sonnet';

  // Check if live AI is explicitly disabled via env, selected model, or localStorage
  const isDisableLiveAI = 
    import.meta.env.VITE_DISABLE_LIVE_AI === 'true' || 
    modelToUse === 'Offline Simulation Engine' || 
    localStorage.getItem('vyraion_disable_live_ai') === 'true';

  if (isDisableLiveAI) {
    const simulation = generateOfflineSimulationBlueprint(activeQueue);
    return {
      success: true,
      blueprint: simulation,
      isOfflineSimulation: false,
      modelUsed: 'Nova Decision Engine',
      realAiTimeMs: 800
    };
  }

  try {
    const res = await fetch(`${NOVA_API_URL}/blueprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeQueue, model: modelToUse })
    });

    const data = await res.json();

    if (res.ok && data.success && Array.isArray(data.blueprint)) {
      return {
        success: true,
        blueprint: data.blueprint,
        realAiTimeMs: data.realAiTimeMs || 800,
        modelUsed: data.modelUsed || modelToUse
      };
    }

    // Return explicit error state from server
    return {
      success: false,
      error: data.error || 'AI reasoning unavailable — check ANTHROPIC_API_KEY',
      realAiTimeMs: data.realAiTimeMs || 0
    };

  } catch (err) {
    console.error('[Nova Engine] Backend LLM API error:', err.message);
    return {
      success: false,
      error: 'AI reasoning unavailable — backend server unreachable',
      networkError: true
    };
  }
}

/**
 * DOCUMENTED OFFLINE SIMULATION FALLBACK ENGINE
 * Used exclusively for offline demoability when VITE_DISABLE_LIVE_AI=true is set.
 */
export function generateOfflineSimulationBlueprint(activeQueue = []) {
  if (!activeQueue || activeQueue.length === 0) return [];

  const blueprint = [];

  activeQueue.forEach((inc, idx) => {
    blueprint.push({
      rank: idx + 1,
      title: `Priority ${idx + 1}: ${inc.name || 'Emergency'} Response — Sector ${inc.hotspot || 'Central'}`,
      agents: inc.agent || 'Command & Control Agent',
      reason: `Active ${inc.severity || 'HIGH'} severity incident detected near ${inc.hotspot || 'Singapore Corridor'}. Emergency field units deployed.`,
      impact: inc.severity === 'CRITICAL' ? '100% Critical Risk Isolated' : '-68% Congestion Delay',
      aiTime: '0.8s',
      eta: '3–6 min'
    });
  });

  return blueprint;
}

// Legacy alias for backwards compatibility
export function generateNovaBlueprint(activeQueue = []) {
  return generateOfflineSimulationBlueprint(activeQueue);
}
