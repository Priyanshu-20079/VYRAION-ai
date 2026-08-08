/**
 * IncidentChecklistPanel.jsx
 * Standalone dashboard panel showing per-incident action checklists.
 * Rendered directly in the right sidebar of DashboardPage so judges/operators
 * can immediately discover and interact with it without touching the map.
 *
 * Styling: inline-only (no Tailwind), matching existing VYRAION design tokens.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Circle, ClipboardList, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { INCIDENTS_API_URL } from '../../config/api';

/* ── Checklist definition ─────────────────────────────────────────────────── */
const CHECKLIST_ITEMS = [
  { key: 'incidentVerified',  label: 'Incident Verified',              auto: true  },
  { key: 'teamNotified',      label: 'Response Team Notified',         auto: true  },
  { key: 'unitsDispatched',   label: 'Emergency Units Dispatched',     auto: true  },
  { key: 'unitsArrived',      label: 'Units Arrived On Scene',         auto: true  },
  { key: 'hospitalNotified',  label: 'Hospital / Medical Notified',    auto: true  },
  { key: 'incidentResolved',  label: 'Incident Resolved',              auto: true  },
];

const EMPTY_CHECKLIST = {
  incidentVerified:  false,
  teamNotified:      false,
  unitsDispatched:   false,
  unitsArrived:      false,
  hospitalNotified:  false,
  incidentResolved:  false,
};

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function computeProgress(cl) {
  const vals = Object.values({ ...EMPTY_CHECKLIST, ...cl });
  const done  = vals.filter(Boolean).length;
  const total = CHECKLIST_ITEMS.length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

function getIncidentId(inc) {
  return inc.uniqueId || inc.instanceId || inc.id;
}

function getIncidentName(inc) {
  return inc.title || inc.name || inc.type || 'Incident';
}

/* ── Single incident checklist card ─────────────────────────────────────────*/
function ChecklistCard({ inc, onChecklistUpdate }) {
  const incId = getIncidentId(inc);
  const [localCl, setLocalCl]   = useState({ ...EMPTY_CHECKLIST, ...(inc.checklist || {}) });
  const [expanded, setExpanded] = useState(true);
  const [toggling, setToggling] = useState(null); // key currently being patched

  /* Sync when parent receives updated incident (socket reconcile) */
  useEffect(() => {
    if (inc.checklist) {
      setLocalCl(prev => ({ ...EMPTY_CHECKLIST, ...inc.checklist }));
    }
  }, [JSON.stringify(inc.checklist)]);

  const { done, total, pct } = computeProgress(localCl);
  const isComplete = done === total;

  const handleToggle = useCallback(async (key, isAuto) => {
    if (isAuto || toggling) return; // auto items are read-only; prevent double-tap
    const newVal = !localCl[key];

    /* Optimistic update */
    setLocalCl(prev => ({ ...prev, [key]: newVal }));
    setToggling(key);

    try {
      const res = await fetch(`${INCIDENTS_API_URL}/${incId}/checklist`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ [key]: newVal }),
      });
      if (!res.ok) throw new Error('PATCH failed');
      const data = await res.json();
      if (data?.data?.checklist) {
        setLocalCl({ ...EMPTY_CHECKLIST, ...data.data.checklist });
        onChecklistUpdate?.(incId, data.data.checklist);
      }
    } catch {
      /* Rollback on error */
      setLocalCl(prev => ({ ...prev, [key]: !newVal }));
    } finally {
      setToggling(null);
    }
  }, [localCl, incId, toggling, onChecklistUpdate]);

  /* Severity colour */
  const sevColor =
    inc.severity === 'CRITICAL' ? '#EF4444' :
    inc.severity === 'HIGH'     ? '#FBBF24' :
    inc.severity === 'ELEVATED' ? '#1FA2FF' : '#10B981';

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${isComplete ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)'}`,
      background: isComplete ? 'rgba(16,185,129,0.06)' : 'rgba(6,9,20,0.7)',
      overflow: 'hidden',
      transition: 'border-color 0.3s',
    }}>
      {/* Card header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: '10px 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid rgba(255,255,255,0.07)' : 'none',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{
            fontSize: 8, fontWeight: 800, fontFamily: 'monospace', padding: '2px 7px',
            borderRadius: 5, background: `${sevColor}22`, border: `1px solid ${sevColor}55`,
            color: sevColor, flexShrink: 0,
          }}>{inc.severity || 'HIGH'}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#E2E8F0', fontFamily: 'monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{getIncidentName(inc)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{
            fontSize: 9, fontWeight: 800, fontFamily: 'monospace',
            color: isComplete ? '#10B981' : '#33C8FF',
          }}>{done}/{total}</span>
          {expanded ? <ChevronUp size={12} color="#64748B" /> : <ChevronDown size={12} color="#64748B" />}
        </div>
      </div>

      {/* Progress bar (always visible) */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: isComplete
            ? 'linear-gradient(90deg,#10B981,#34D399)'
            : 'linear-gradient(90deg,#1FA2FF,#33C8FF)',
          transition: 'width 0.4s ease',
        }} />
      </div>

      {/* Expanded checklist body */}
      {expanded && (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {/* Summary line */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 4,
          }}>
            <span style={{ fontSize: 9, color: '#64748B', fontFamily: 'monospace', fontWeight: 700 }}>
              INCIDENT ACTION CHECKLIST
            </span>
            <span style={{
              fontSize: 9, fontFamily: 'monospace', fontWeight: 800,
              color: isComplete ? '#10B981' : '#33C8FF',
            }}>
              {done} / {total} — {pct}%
            </span>
          </div>

          {/* Completion banner */}
          {isComplete && (
            <div style={{
              padding: '6px 10px', borderRadius: 7,
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)',
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
            }}>
              <CheckCircle2 size={12} color="#10B981" />
              <span style={{ fontSize: 9, fontWeight: 800, color: '#10B981', fontFamily: 'monospace' }}>
                INCIDENT RESPONSE CHECKLIST COMPLETE
              </span>
            </div>
          )}

          {/* Rows */}
          {CHECKLIST_ITEMS.map(({ key, label, auto }) => {
            const checked   = localCl[key] ?? false;
            const isLoading = toggling === key;

            return (
              <div
                key={key}
                onClick={() => handleToggle(key, auto)}
                title={auto ? 'Updated automatically by the system' : 'Click to toggle'}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', borderRadius: 7,
                  background: checked ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${checked ? 'rgba(16,185,129,0.22)' : 'rgba(255,255,255,0.06)'}`,
                  cursor: auto ? 'default' : 'pointer',
                  transition: 'background 0.2s, border-color 0.2s',
                  opacity: isLoading ? 0.6 : 1,
                }}
              >
                {/* Toggle pill */}
                <div style={{
                  width: 26, height: 14, borderRadius: 7, flexShrink: 0, position: 'relative',
                  background: checked ? '#10B981' : 'rgba(255,255,255,0.08)',
                  border: `1px solid ${checked ? '#10B981' : 'rgba(255,255,255,0.12)'}`,
                  transition: 'background 0.2s',
                  opacity: auto ? 0.65 : 1,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: checked ? 14 : 2,
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  }} />
                </div>

                {/* Label */}
                <span style={{
                  fontSize: 10, fontFamily: 'monospace', flex: 1,
                  color: checked ? '#D1FAE5' : '#94A3B8',
                  fontWeight: checked ? 600 : 400,
                  textDecoration: checked ? 'none' : 'none',
                }}>
                  {label}
                </span>

                {/* Right-side chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {auto && (
                    <span style={{
                      fontSize: 7, fontFamily: 'monospace', fontWeight: 700,
                      color: '#475569', padding: '1px 4px', borderRadius: 3,
                      background: 'rgba(255,255,255,0.04)',
                    }}>AUTO</span>
                  )}
                  {isLoading
                    ? <RefreshCw size={10} color="#33C8FF" style={{ animation: 'spin 1s linear infinite' }} />
                    : checked
                      ? <CheckCircle2 size={11} color="#10B981" />
                      : <Circle size={11} color="#334155" />
                  }
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────────────── */
export default function IncidentChecklistPanel({ activeQueue, onChecklistUpdate }) {
  if (!activeQueue || activeQueue.length === 0) return null;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      {/* Panel header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <ClipboardList size={14} color="#33C8FF" />
          <span style={{
            fontSize: 11, fontWeight: 800, color: '#F1F5F9',
            fontFamily: 'monospace', letterSpacing: '0.02em',
          }}>Incident Action Checklist</span>
        </div>
        <span style={{
          fontSize: 9, fontFamily: 'monospace', fontWeight: 700,
          color: '#64748B', background: 'rgba(255,255,255,0.04)',
          padding: '2px 7px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.08)',
        }}>{activeQueue.length} Active</span>
      </div>

      {/* One card per active incident */}
      {activeQueue.map((inc) => (
        <ChecklistCard
          key={getIncidentId(inc)}
          inc={inc}
          onChecklistUpdate={onChecklistUpdate}
        />
      ))}
    </div>
  );
}
