/**
 * LayersDock.jsx
 * Left-side 56px collapsed icon dock that expands to 280px panels.
 * One panel open at a time. Persists layer config to localStorage.
 */
import React, { useEffect, useRef, useCallback } from 'react';
import { Layers, Activity, Navigation, Cloud, Eye, RotateCcw, ChevronRight } from 'lucide-react';

const LS_KEY = 'vyraion_layer_config_v2';

const DEFAULT_CONFIG = {
  hospital:       { visible: true, opacity: 1.0 },
  fire:           { visible: true, opacity: 1.0 },
  police:         { visible: true, opacity: 1.0 },
  infrastructure: { visible: true, opacity: 1.0 },
  vehicles:       { visible: true, opacity: 1.0 },
  incidents:      { visible: true, opacity: 1.0 },
  cctv:           { visible: true, opacity: 1.0 },
  heatmap:        { visible: false, opacity: 0.7 },
  traffic:        { visible: true, opacity: 0.4 },
  weather:        { visible: true, opacity: 0.8 },
};

const DOCK_ITEMS = [
  {
    id: 'layers',
    icon: Layers,
    label: 'Layers',
    groups: [
      {
        title: 'Base',
        rows: [
          { key: 'hospital',       label: 'Hospitals',       hasOpacity: false },
          { key: 'fire',           label: 'Fire Stations',   hasOpacity: false },
          { key: 'police',         label: 'Police',          hasOpacity: false },
          { key: 'infrastructure', label: 'Infrastructure',  hasOpacity: false },
        ],
      },
      {
        title: 'Operational',
        rows: [
          { key: 'vehicles',  label: 'Vehicles',   hasOpacity: false },
          { key: 'incidents', label: 'Incidents',  hasOpacity: false },
        ],
      },
      {
        title: 'Sensors',
        rows: [
          { key: 'cctv', label: 'CCTV Cameras', hasOpacity: false },
        ],
      },
    ],
  },
  {
    id: 'heatmap',
    icon: Activity,
    label: 'Heatmap',
    groups: [
      {
        title: 'Analytical',
        rows: [
          { key: 'heatmap', label: 'Risk Heatmap', hasOpacity: true },
        ],
      },
    ],
  },
  {
    id: 'traffic',
    icon: Navigation,
    label: 'Traffic',
    groups: [
      {
        title: 'Traffic',
        rows: [
          { key: 'traffic', label: 'Expressways', hasOpacity: true },
        ],
      },
    ],
  },
  {
    id: 'weather',
    icon: Cloud,
    label: 'Weather',
    groups: [
      {
        title: 'Environmental',
        rows: [
          { key: 'weather', label: 'Weather Sensors', hasOpacity: true },
        ],
      },
    ],
  },
  {
    id: 'cctv',
    icon: Eye,
    label: 'CCTV',
    groups: [
      {
        title: 'Sensors',
        rows: [
          { key: 'cctv', label: 'Camera Network', hasOpacity: false },
        ],
      },
    ],
  },
];

function loadConfig() {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
  } catch (_) { /* ignore */ }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(cfg) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch (_) { /* ignore */ }
}

export default function LayersDock({ layerConfig, setLayerConfig, expandedDock, setExpandedDock }) {
  const dockRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (expandedDock && dockRef.current && !dockRef.current.contains(e.target)) {
        setExpandedDock(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expandedDock, setExpandedDock]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setExpandedDock(null); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [setExpandedDock]);

  const toggleVisible = useCallback((key) => {
    setLayerConfig((prev) => {
      const next = { ...prev, [key]: { ...prev[key], visible: !prev[key]?.visible } };
      saveConfig(next);
      return next;
    });
  }, [setLayerConfig]);

  const setOpacity = useCallback((key, val) => {
    setLayerConfig((prev) => {
      const next = { ...prev, [key]: { ...prev[key], opacity: parseFloat(val) } };
      saveConfig(next);
      return next;
    });
  }, [setLayerConfig]);

  const resetConfig = useCallback(() => {
    setLayerConfig({ ...DEFAULT_CONFIG });
    saveConfig({ ...DEFAULT_CONFIG });
  }, [setLayerConfig]);

  const activeDock = DOCK_ITEMS.find((d) => d.id === expandedDock);

  return (
    <div
      ref={dockRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 450,
        display: 'flex',
        pointerEvents: 'none',
      }}
    >
      {/* Icon rail */}
      <div style={{
        width: 56,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 12,
        gap: 6,
        background: 'rgba(6,9,20,0.9)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        pointerEvents: 'auto',
      }}>
        {DOCK_ITEMS.map(({ id, icon: Icon, label }) => {
          const isOpen = expandedDock === id;
          return (
            <button
              key={id}
              title={label}
              onClick={() => setExpandedDock(isOpen ? null : id)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: `1px solid ${isOpen ? 'rgba(51,200,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                background: isOpen ? 'rgba(51,200,255,0.15)' : 'rgba(255,255,255,0.04)',
                color: isOpen ? '#33C8FF' : '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
            >
              <Icon size={18} />
            </button>
          );
        })}

        {/* Reset button at bottom */}
        <div style={{ flex: 1 }} />
        <button
          title="Reset All Layers"
          onClick={resetConfig}
          style={{
            width: 40, height: 40, borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.04)',
            color: '#64748B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Expanded panel */}
      <div style={{
        width: activeDock ? 280 : 0,
        overflow: 'hidden',
        transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: activeDock ? 'auto' : 'none',
      }}>
        {activeDock && (
          <div style={{
            width: 280,
            height: '100%',
            background: 'rgba(6,9,20,0.95)',
            backdropFilter: 'blur(16px)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            overflowY: 'auto',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#E2E8F0', fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                {activeDock.label}
              </span>
              <button
                onClick={() => setExpandedDock(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 2 }}
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Layer groups */}
            {activeDock.groups.map((group) => (
              <div key={group.title}>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: '#475569',
                  fontFamily: 'monospace', letterSpacing: '0.08em',
                  textTransform: 'uppercase', marginBottom: 6,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  paddingBottom: 4,
                }}>
                  {group.title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {group.rows.map(({ key, label, hasOpacity }) => {
                    const cfg = layerConfig[key] || { visible: true, opacity: 1 };
                    return (
                      <div key={key} style={{
                        display: 'flex', flexDirection: 'column', gap: 4,
                        padding: '6px 8px', borderRadius: 8,
                        background: cfg.visible ? 'rgba(51,200,255,0.07)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${cfg.visible ? 'rgba(51,200,255,0.2)' : 'rgba(255,255,255,0.07)'}`,
                        transition: 'all 0.15s',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, color: cfg.visible ? '#E2E8F0' : '#64748B', fontFamily: 'monospace' }}>
                            {label}
                          </span>
                          {/* Toggle */}
                          <button
                            onClick={() => toggleVisible(key)}
                            style={{
                              width: 28, height: 16, borderRadius: 8,
                              border: 'none', cursor: 'pointer',
                              background: cfg.visible ? '#33C8FF' : '#1E293B',
                              position: 'relative', transition: 'background 0.2s',
                            }}
                          >
                            <div style={{
                              width: 12, height: 12, borderRadius: '50%', background: '#fff',
                              position: 'absolute', top: 2,
                              left: cfg.visible ? 14 : 2,
                              transition: 'left 0.2s',
                            }} />
                          </button>
                        </div>
                        {hasOpacity && cfg.visible && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 9, color: '#64748B', fontFamily: 'monospace', minWidth: 36 }}>
                              Opacity
                            </span>
                            <input
                              type="range" min="0.05" max="1" step="0.05"
                              value={cfg.opacity}
                              onChange={(e) => setOpacity(key, e.target.value)}
                              style={{ flex: 1, accentColor: '#33C8FF', height: 4 }}
                            />
                            <span style={{ fontSize: 9, color: '#94A3B8', fontFamily: 'monospace', minWidth: 28 }}>
                              {Math.round(cfg.opacity * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Reset to default */}
            <button
              onClick={resetConfig}
              style={{
                marginTop: 'auto', padding: '7px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#94A3B8', fontSize: 10, fontWeight: 700,
                fontFamily: 'monospace', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <RotateCcw size={12} /> Reset to Default View
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { DEFAULT_CONFIG, loadConfig };
