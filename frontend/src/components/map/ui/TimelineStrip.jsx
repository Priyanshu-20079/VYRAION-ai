/**
 * TimelineStrip.jsx
 * Bottom collapsible timeline strip.
 * Collapsed: 40px single latest event line
 * Expanded: 180px scrollable log list
 * Clicking a log entry with lat/lng flies the map to that location.
 * Idle synthetic trickle when activeQueue is empty.
 */
import React, { useRef, useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, Sparkles, Activity } from 'lucide-react';

const IDLE_LOGS = [
  { text: 'Sensor sweep complete — All 10 cameras nominal', time: null, ambient: true },
  { text: 'Traffic flow nominal — PIE/CTE free-flow corridor active', time: null, ambient: true },
  { text: 'Weather telemetry synced — Bukit Timah runoff nominal', time: null, ambient: true },
  { text: 'SCADA grid load stable — Marina Bay substation 98.2%', time: null, ambient: true },
  { text: 'Border telemetry: Woodlands Checkpoint cleared for operations', time: null, ambient: true },
  { text: 'AI patrol sweep: no anomalies detected in eastern corridor', time: null, ambient: true },
  { text: 'Nova idle — decision engine in standby mode', time: null, ambient: true },
];

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export default function TimelineStrip({
  logs = [],
  activeQueue = [],
  selectedIncidentId = null,
  onFlyTo,
  reducedMotion = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [ambientLogs, setAmbientLogs] = useState([]);
  const scrollRef = useRef(null);

  // Build ambient idle trickle
  useEffect(() => {
    if (activeQueue.length > 0) { setAmbientLogs([]); return; }
    let idx = 0;
    const first = { ...IDLE_LOGS[0], time: now() };
    setAmbientLogs([first]);
    const timer = setInterval(() => {
      idx = (idx + 1) % IDLE_LOGS.length;
      setAmbientLogs((prev) => [{ ...IDLE_LOGS[idx], time: now() }, ...prev].slice(0, 20));
    }, 15000 + Math.random() * 15000);
    return () => clearInterval(timer);
  }, [activeQueue.length]);

  // Combine real logs + ambient, optionally filter by selected incident
  const incLogs = selectedIncidentId
    ? logs.filter((l) => !l.incidentId || l.incidentId === selectedIncidentId)
    : logs;

  const allLogs = activeQueue.length === 0
    ? ambientLogs
    : [...incLogs];

  const latestLog = allLogs[0] || { time: now(), text: 'System online — awaiting events', ambient: true };

  // Auto-scroll to top when expanded
  useEffect(() => {
    if (isExpanded && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [isExpanded, allLogs.length]);

  const isAllClear = activeQueue.length === 0;

  return (
    <div style={{
      position: 'absolute',
      bottom: 0, left: 56, right: 0, // left offset = dock width
      height: isExpanded ? 182 : 40,
      transition: reducedMotion ? 'none' : 'height 0.25s cubic-bezier(0.4,0,0.2,1)',
      background: 'rgba(6,9,20,0.95)',
      backdropFilter: 'blur(14px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      zIndex: 430,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header bar */}
      <div
        style={{
          height: 40, flexShrink: 0,
          display: 'flex', alignItems: 'center',
          padding: '0 14px', gap: 8,
          cursor: 'pointer', userSelect: 'none',
          borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.07)' : 'none',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isAllClear
          ? <span style={{ fontSize: 10, color: '#10B981' }}>●</span>
          : <Sparkles size={12} color="#33C8FF" style={reducedMotion ? {} : { animation: 'spin 3s linear infinite' }} />
        }

        <span style={{
          fontSize: 9, fontWeight: 700, color: isAllClear ? '#10B981' : '#33C8FF',
          fontFamily: 'monospace', letterSpacing: '0.05em', whiteSpace: 'nowrap',
        }}>
          {isAllClear ? 'CITY STATUS: NORMAL' : 'LIVE EOC TIMELINE'}
        </span>

        {/* Latest event preview (collapsed mode) */}
        {!isExpanded && (
          <span style={{
            fontSize: 10, color: latestLog.ambient ? '#475569' : '#94A3B8',
            fontFamily: 'monospace', flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {latestLog.time && <span style={{ color: '#475569', marginRight: 6 }}>{latestLog.time}</span>}
            {latestLog.text}
          </span>
        )}

        <div style={{ marginLeft: 'auto', flexShrink: 0, color: '#475569' }}>
          {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </div>

      {/* Scrollable log list */}
      {isExpanded && (
        <div
          ref={scrollRef}
          style={{
            flex: 1, overflowY: 'auto',
            padding: '8px 14px',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}
        >
          {allLogs.length === 0 && (
            <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', padding: '10px 0', textAlign: 'center' }}>
              No events yet…
            </div>
          )}
          {allLogs.map((log, i) => (
            <div
              key={i}
              onClick={() => log.lat && onFlyTo?.(log.lat, log.lng)}
              style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
                padding: '4px 8px', borderRadius: 6,
                background: log.ambient
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${log.ambient ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)'}`,
                cursor: log.lat ? 'pointer' : 'default',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', flexShrink: 0, marginTop: 1, minWidth: 52 }}>
                {log.time || now()}
              </span>
              <span style={{
                fontSize: 10, color: log.ambient ? '#475569' : '#CBD5E1',
                fontFamily: 'monospace', lineHeight: 1.4,
              }}>
                {log.text}
              </span>
              {log.lat && (
                <span style={{ fontSize: 9, color: '#33C8FF', fontFamily: 'monospace', flexShrink: 0, marginLeft: 'auto' }}>
                  📍
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
