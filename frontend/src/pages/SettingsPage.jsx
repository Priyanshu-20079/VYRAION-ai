import React, { useState, useEffect } from 'react';
import {
  Settings,
  Brain,
  Sliders,
  Maximize2,
  Save,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const SUPPORTED_MODELS = [
  { name: 'Claude 3.5 Sonnet', id: 'Claude 3.5 Sonnet', desc: 'Anthropic High-Throughput Reasoning (Default)' },
  { name: 'Claude 3.7 Sonnet', id: 'Claude 3.7 Sonnet', desc: 'Anthropic Hybrid Extended Thinking Engine' },
  { name: 'Claude 3.5 Haiku', id: 'Claude 3.5 Haiku', desc: 'Ultra Low-Latency Instant Response' },
  { name: 'GPT-4o', id: 'GPT-4o', desc: 'OpenAI Multi-modal Operations Engine' },
  { name: 'Nova Decision Engine (Local)', id: 'Offline Simulation Engine', desc: 'Pre-configured local emergency response strategies (No LLM key required)' }
];

export default function SettingsPage() {
  const [model, setModel] = useState(() => localStorage.getItem('vyraion_selected_model') || 'Claude 3.5 Sonnet');
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [density, setDensity] = useState('comfortable');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('vyraion_selected_model', model);
    if (model === 'Offline Simulation Engine') {
      localStorage.setItem('vyraion_disable_live_ai', 'true');
    } else {
      localStorage.setItem('vyraion_disable_live_ai', 'false');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      
      {/* Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#33C8FF]/10 border border-[#33C8FF]/20 text-[#33C8FF] text-xs font-mono font-bold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>AI OS CONFIGURATION</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            System & AI Engine Settings
          </h1>
          <p className="text-sm text-slate-400">
            Configure neural model selection, confidence thresholds, and display density. Built-in theme: <strong className="text-white font-semibold">Vyraion Command</strong>.
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Model Selection */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#7C5CFF]" />
              Primary Neural Reasoning Model
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Wired to /api/nova/blueprint
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SUPPORTED_MODELS.map((m) => (
              <div
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  model === m.id
                    ? 'bg-[#33C8FF]/15 border-[#33C8FF] text-white shadow-md shadow-[#33C8FF]/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-100">{m.name}</p>
                  {model === m.id && (
                    <span className="w-2 h-2 rounded-full bg-[#33C8FF] animate-pulse"></span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#33C8FF]" />
              Prediction Confidence Threshold
            </h2>
            <span className="text-xs font-mono font-bold text-[#33C8FF] bg-[#33C8FF]/10 px-2.5 py-1 rounded-lg border border-[#33C8FF]/20">
              {confidenceThreshold}%
            </span>
          </div>

          <input
            type="range"
            min="50"
            max="99"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(e.target.value)}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-[#33C8FF]"
          />
        </div>

        {/* UI Density Selector */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-[#33C8FF]" />
              UI Layout Density
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Theme: <span className="text-[#33C8FF] font-bold">Vyraion Command</span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 font-mono text-xs">
            {['compact', 'comfortable', 'spacious'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDensity(d)}
                className={`py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer capitalize ${
                  density === d
                    ? 'bg-[#33C8FF]/15 border-[#33C8FF] text-[#33C8FF] shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl font-bold bg-[#33C8FF] hover:bg-[#33C8FF]/90 text-slate-950 transition-all shadow-md shadow-[#33C8FF]/20 flex items-center gap-2 cursor-pointer text-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>

          {saved && (
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4" /> Active model saved: <strong>{model}</strong>
            </span>
          )}
        </div>

      </form>

    </div>
  );
}
