/**
 * IncidentContextDrawer.jsx
 * Right slide-in context drawer (width 0→340px) showing entity details.
 * Tabs: Overview / Units / Timeline / Predictions
 */
import React, { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Clock, Zap, Users, BarChart2, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';
import { MASTER_INCIDENTS } from '../../../data/incidents';
import { getRealSingaporeLocation } from '../../common/SingaporeSatelliteMap';
import { STATUS_COLORS } from '../../../utils/statusColors';
import { INCIDENTS_API_URL } from '../../../config/api';

const TABS = ['Overview', 'Checklist', 'Units', 'Timeline', 'Predictions'];

const CHECKLIST_LABELS = {
  incidentVerified: 'Incident Verified',
  teamNotified:     'Response Team Notified',
  unitsDispatched:  'Units Dispatched',
  unitsArrived:     'Units Arrived On Scene',
  hospitalNotified: 'Hospital / Medical Notified',
  incidentResolved: 'Incident Resolved',
};
const CHECKLIST_KEYS = Object.keys(CHECKLIST_LABELS);

function formatElapsed(createdAt) {
  if (!createdAt) return '—';
  const sec = Math.floor((Date.now() - createdAt) / 1000);
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function IncidentContextDrawer({
  selectedEntity,
  activeQueue,
  vehiclesStateRef,
  onClose,
  onFlyTo,
  reasoningLogs = [],
}) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [elapsed, setElapsed] = useState('00:00');
  // Optimistic local checklist state — keyed by incident id
  const [localChecklist, setLocalChecklist] = useState({});

  const isOpen = !!selectedEntity;
  const inc = selectedEntity?.type === 'incident'
    ? activeQueue.find((i) => (i.uniqueId || i.instanceId || i.id) === selectedEntity.id || i.id === selectedEntity.id)
    : null;

  const incDef = inc ? (MASTER_INCIDENTS[inc.id] || inc) : null;
  const locInfo = inc ? getRealSingaporeLocation(inc.lat || 1.3323, inc.lng || 103.8580) : null;

  // Reset tab and local checklist when selection changes
  useEffect(() => { setActiveTab('Overview'); setLocalChecklist({}); }, [selectedEntity?.id]);

  // Sync local checklist whenever the incident's checklist from activeQueue changes
  useEffect(() => {
    if (inc?.checklist) setLocalChecklist(inc.checklist);
  }, [inc?.checklist]);

  // Elapsed timer
  useEffect(() => {
    if (!inc?.createdAt) return;
    const t = setInterval(() => setElapsed(formatElapsed(inc.createdAt)), 1000);
    setElapsed(formatElapsed(inc.createdAt));
    return () => clearInterval(t);
  }, [inc?.createdAt]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const hasPredictions = !!(incDef?.priorities?.length);
  const tabs = TABS.filter((t) => t !== 'Predictions' || hasPredictions);

  // Merged checklist — local (optimistic) overrides remote
  const mergedChecklist = CHECKLIST_KEYS.reduce((acc, k) => {
    const remoteVal = inc?.checklist?.[k] ?? false;
    acc[k] = localChecklist[k] !== undefined ? localChecklist[k] : remoteVal;
    return acc;
  }, {});
  const checkedCount = CHECKLIST_KEYS.filter((k) => mergedChecklist[k]).length;
  const checklistPct = Math.round((checkedCount / CHECKLIST_KEYS.length) * 100);

  const incId = inc?.uniqueId || inc?.id || selectedEntity?.id;

  const handleChecklistToggle = useCallback(async (key) => {
    const newVal = !mergedChecklist[key];
    // Optimistic update
    setLocalChecklist((prev) => ({ ...prev, [key]: newVal }));
    try {
      await fetch(`${INCIDENTS_API_URL}/${incId}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newVal }),
      });
      // Socket 'incident:phase-changed' will reconcile server state automatically
    } catch (_) {
      // Rollback optimistic update on network error
      setLocalChecklist((prev) => ({ ...prev, [key]: !newVal }));
    }
  }, [mergedChecklist, incId]);

  // Vehicles assigned to this incident
  const assignedVehicles = vehiclesStateRef?.current?.filter(
    (v) => v.incidentId === selectedEntity?.id || v.incidentId === inc?.uniqueId || v.incidentId === inc?.instanceId
  ) || [];

  // Timeline logs filtered to this incident
  const incLogs = reasoningLogs.filter((l) => !l.incidentId || l.incidentId === selectedEntity?.id || l.ambient);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const visibleLogs = showAllLogs ? reasoningLogs : incLogs;

  const sevColor = (s) => {
    if (!s) return '#EF4444';
    const u = s.toUpperCase();
    if (u === 'LOW' || u === 'NORMAL') return '#10B981';
    if (u === 'MEDIUM' || u === 'ELEVATED') return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div style={{
      position: 'absolute',
      right: 0, top: 0, bottom: 0,
      width: isOpen ? 340 : 0,
      opacity: isOpen ? 1 : 0,
      pointerEvents: isOpen ? 'auto' : 'none',
      transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
      overflow: 'hidden',
      zIndex: 440,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        width: 340,
        height: '100%',
        background: 'rgba(6,9,20,0.97)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <AlertTriangle size={13} color={inc ? sevColor(inc.severity || inc.status) : '#EF4444'} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#F1F5F9', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {incDef?.title || incDef?.name || inc?.name || 'Entity Details'}
              </span>
            </div>
            {inc && (
              <div style={{ fontSize: 9, color: '#64748B', fontFamily: 'monospace' }}>
                {inc.uniqueId || inc.instanceId || inc.id} · {locInfo?.district || ''}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4, flexShrink: 0, marginLeft: 8 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)',
          flexShrink: 0, padding: '0 14px',
        }}>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 10px', fontSize: 10, fontWeight: 700,
                fontFamily: 'monospace', cursor: 'pointer',
                border: 'none', borderBottom: `2px solid ${activeTab === tab ? '#33C8FF' : 'transparent'}`,
                color: activeTab === tab ? '#33C8FF' : '#64748B',
                background: 'none',
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {activeTab === 'Overview' && inc && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Status badge */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: `${sevColor(inc.severity || inc.status)}20`, border: `1px solid ${sevColor(inc.severity || inc.status)}50`, color: sevColor(inc.severity || inc.status), fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}>
                  {inc.severity || inc.status || 'HIGH'}
                </span>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(51,200,255,0.1)', border: '1px solid rgba(51,200,255,0.3)', color: '#33C8FF', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}>
                  {inc.stage || inc.status || 'ACTIVE'}
                </span>
              </div>

              {/* Key/value rows */}
              {[
                { label: 'Road', value: locInfo?.road, icon: MapPin },
                { label: 'Expressway', value: locInfo?.expressway, icon: null },
                { label: 'District', value: locInfo?.district, icon: null },
                { label: 'Landmark', value: locInfo?.landmark, icon: null },
                { label: 'Nearest Hospital', value: locInfo?.hospital, icon: null },
                { label: 'Nearest Police', value: locInfo?.police, icon: null },
                { label: 'Nearest Fire', value: locInfo?.fire, icon: null },
                { label: 'Elapsed', value: elapsed, icon: Clock },
                { label: 'Est. Resolution', value: inc.resolutionTime || incDef?.resolutionTime || '—', icon: null },
              ].map(({ label, value }) => value ? (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  padding: '5px 8px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <span style={{ fontSize: 9, color: '#64748B', fontFamily: 'monospace', flexShrink: 0, marginRight: 8 }}>{label}</span>
                  <span style={{ fontSize: 9, color: '#E2E8F0', fontFamily: 'monospace', fontWeight: 600, textAlign: 'right' }}>{value}</span>
                </div>
              ) : null)}

              {/* Fly to button */}
              <button
                onClick={() => onFlyTo?.(inc.lat, inc.lng)}
                style={{
                  marginTop: 4, padding: '7px 12px', borderRadius: 8,
                  background: 'rgba(51,200,255,0.12)', border: '1px solid rgba(51,200,255,0.3)',
                  color: '#33C8FF', fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                  cursor: 'pointer',
                }}
              >
                📍 Fly to Incident
              </button>
            </div>
          )}

          {/* ── CHECKLIST ─────────────────────────────────────────────────── */}
          {activeTab === 'Checklist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Progress summary */}
              <div style={{
                padding: '8px 10px', borderRadius: 8,
                background: checklistPct === 100 ? 'rgba(16,185,129,0.1)' : 'rgba(51,200,255,0.07)',
                border: `1px solid ${checklistPct === 100 ? 'rgba(16,185,129,0.35)' : 'rgba(51,200,255,0.2)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 9, color: '#64748B', fontFamily: 'monospace', fontWeight: 700 }}>MISSION CHECKLIST</span>
                  <span style={{
                    fontSize: 9, fontFamily: 'monospace', fontWeight: 800,
                    color: checklistPct === 100 ? '#10B981' : '#33C8FF',
                  }}>{checkedCount} / {CHECKLIST_KEYS.length} — {checklistPct}%</span>
                </div>
                {/* Progress bar */}
                <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${checklistPct}%`,
                    background: checklistPct === 100
                      ? 'linear-gradient(90deg,#10B981,#34D399)'
                      : 'linear-gradient(90deg,#1FA2FF,#33C8FF)',
                    borderRadius: 2,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>

              {/* Checklist rows */}
              {CHECKLIST_KEYS.map((key) => {
                const checked = mergedChecklist[key];
                const label = CHECKLIST_LABELS[key];
                const isAuto = key === 'incidentVerified' || key === 'teamNotified' || key === 'unitsDispatched' || key === 'incidentResolved';
                return (
                  <div
                    key={key}
                    onClick={() => !isAuto && handleChecklistToggle(key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '7px 10px', borderRadius: 8,
                      background: checked ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${checked ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`,
                      cursor: isAuto ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 0 }}>
                      {/* Toggle pill */}
                      <div style={{
                        width: 28, height: 15, borderRadius: 8, flexShrink: 0,
                        background: checked ? '#10B981' : 'rgba(255,255,255,0.1)',
                        border: `1px solid ${checked ? '#10B981' : 'rgba(255,255,255,0.15)'}`,
                        position: 'relative',
                        transition: 'background 0.2s, border-color 0.2s',
                        opacity: isAuto ? 0.6 : 1,
                      }}>
                        <div style={{
                          width: 9, height: 9, borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: 2,
                          left: checked ? 15 : 2,
                          transition: 'left 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        }} />
                      </div>
                      <span style={{ fontSize: 10, color: checked ? '#E2E8F0' : '#94A3B8', fontFamily: 'monospace', fontWeight: checked ? 700 : 400, lineHeight: 1.3 }}>
                        {label}
                      </span>
                    </div>
                    {isAuto && (
                      <span style={{ fontSize: 8, color: '#475569', fontFamily: 'monospace', flexShrink: 0, marginLeft: 4 }}>AUTO</span>
                    )}
                    {checked && (
                      <CheckCircle2 size={12} color="#10B981" style={{ flexShrink: 0 }} />
                    )}
                  </div>
                );
              })}

              {!inc && (
                <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'monospace', textAlign: 'center', padding: '20px 0' }}>
                  Select an active incident to manage its checklist.
                </div>
              )}
            </div>
          )}

          {/* ── UNITS ────────────────────────────────────────────────────── */}
          {activeTab === 'Units' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 9, color: '#64748B', fontFamily: 'monospace', marginBottom: 4 }}>
                {assignedVehicles.length} units assigned
              </div>
              {(inc?.dispatchedUnits || []).map((du, i) => {
                const v = assignedVehicles.find((vh) => vh.assignedUnitId?.endsWith(`_${i}`));
                const state = v?.state || 'Ready';
                const stateColor = STATUS_COLORS[state] || '#94A3B8';
                const progress = v?.segmentProgress || 0;
                return (
                  <div key={i} style={{
                    padding: '8px 10px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid rgba(255,255,255,0.07)`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: '#E2E8F0', fontFamily: 'monospace' }}>{du.icon} {du.name}</span>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: stateColor, display: 'inline-block' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 9, color: '#64748B', fontFamily: 'monospace' }}>From: {du.stationName || '—'}</span>
                      <span style={{ fontSize: 9, color: stateColor, fontFamily: 'monospace', fontWeight: 700 }}>{state}</span>
                    </div>
                    {v && v.state === 'DISPATCHED' && (
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${(v.segmentProgress || 0) * 100}%`, background: '#33C8FF', borderRadius: 2, transition: 'width 0.5s' }} />
                      </div>
                    )}
                  </div>
                );
              })}
              {(!inc?.dispatchedUnits || inc.dispatchedUnits.length === 0) && (
                <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', textAlign: 'center', padding: '20px 0' }}>
                  No units dispatched yet.
                </div>
              )}
            </div>
          )}

          {/* ── TIMELINE ─────────────────────────────────────────────────── */}
          {activeTab === 'Timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 9, color: '#64748B', fontFamily: 'monospace' }}>
                  {visibleLogs.length} events
                </span>
                {reasoningLogs.length > incLogs.length && (
                  <button
                    onClick={() => setShowAllLogs(!showAllLogs)}
                    style={{ fontSize: 9, color: '#33C8FF', fontFamily: 'monospace', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showAllLogs ? 'Show Incident Only' : 'Show All'}
                  </button>
                )}
              </div>
              {visibleLogs.map((log, i) => (
                <div
                  key={i}
                  onClick={() => log.lat && onFlyTo?.(log.lat, log.lng)}
                  style={{
                    padding: '6px 8px', borderRadius: 6,
                    background: log.ambient ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${log.ambient ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.08)'}`,
                    cursor: log.lat ? 'pointer' : 'default',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}
                >
                  <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', flexShrink: 0, marginTop: 1 }}>{log.time}</span>
                  <span style={{ fontSize: 10, color: log.ambient ? '#475569' : '#CBD5E1', fontFamily: 'monospace', lineHeight: 1.4 }}>{log.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── PREDICTIONS ──────────────────────────────────────────────── */}
          {activeTab === 'Predictions' && incDef?.priorities && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {incDef.priorities.map((p, i) => (
                <div key={i} style={{
                  padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(124,92,255,0.07)',
                  border: '1px solid rgba(124,92,255,0.2)',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#E2E8F0', fontFamily: 'monospace', marginBottom: 4 }}>
                    #{p.rank || i + 1} — {p.title}
                  </div>
                  <div style={{ fontSize: 9, color: '#94A3B8', fontFamily: 'monospace', marginBottom: 4, lineHeight: 1.4 }}>
                    {p.reason}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {p.impact && <span style={{ fontSize: 9, color: '#10B981', fontFamily: 'monospace' }}>Impact: {p.impact}</span>}
                    {p.aiTime && <span style={{ fontSize: 9, color: '#7C5CFF', fontFamily: 'monospace' }}>AI: {p.aiTime}</span>}
                    {p.agents && <span style={{ fontSize: 9, color: '#F59E0B', fontFamily: 'monospace' }}>{p.agents}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!inc && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569', fontSize: 11, fontFamily: 'monospace' }}>
              Select an incident, vehicle, or<br />station marker on the map
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
