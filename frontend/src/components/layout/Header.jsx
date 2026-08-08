import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useViewRole } from '../../context/ViewRoleContext';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../utils/incidentRoleFilters';
import {
  Search, Bell, Cpu, Database, Activity, Sparkles, Sun, Moon,
  ChevronDown, User, Shield, Palette, BellRing, ScrollText,
  BarChart3, HelpCircle, Info, LogOut, X, Clock, Building2,
  Wifi, AlertTriangle, ExternalLink, ChevronRight,
  CheckCheck, Trash2, Check, CircleAlert, Zap, Server, CheckCircle2, ShieldCheck
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   USER DATA
═══════════════════════════════════════════════════════════ */
const getDynamicUser = (authUser, viewRole) => {
  const baseName = authUser?.name || 'Operator';
  const roleDisplay = viewRole === 'authority' ? 'Police Command'
    : viewRole === 'hospital' ? 'Hospital Ops'
    : viewRole === 'operator' ? 'Lead Operations Engineer'
    : 'System Administrator';

  return {
    name: baseName,
    fullName: authUser?.email ? baseName : 'Priyanshu Tiwari',
    initials: baseName.substring(0, 2).toUpperCase(),
    role: roleDisplay,
    org: 'Vyraion City Command',
    shift: 'Alpha Shift • 18:00 – 06:00',
    lastLogin: 'Session Active',
  };
};

/* ═══════════════════════════════════════════════════════════
   INITIAL NOTIFICATIONS WITH CREATION TIMESTAMPS
═══════════════════════════════════════════════════════════ */
const nowMs = Date.now();
const INITIAL_NOTIFICATIONS = [
  {
    id: 1, read: false,
    icon: CircleAlert, iconColor: 'text-amber-400',
    title: 'Memory Bottleneck Forecast',
    detail: 'AI model cache nearing 89% capacity. Recommend purge.',
    time: '2m ago',
    type: 'warning',
    expiry: 'acknowledge', // Expires immediately on acknowledge/read
    createdAt: nowMs - 2 * 60 * 1000
  },
  {
    id: 2, read: false,
    icon: CheckCircle2, iconColor: 'text-emerald-400',
    title: 'ChromaDB Index Synced',
    detail: 'Vector index rebuilt successfully. 1,204 embeddings updated.',
    time: '5m ago',
    type: 'success',
    expiry: '30min', // Auto-expires 30 min after creation
    createdAt: nowMs - 5 * 60 * 1000
  },
  {
    id: 3, read: false,
    icon: Zap, iconColor: 'text-[#7C5CFF]',
    title: 'Swarm Agent #4 Rebalanced Queue',
    detail: 'Task queue redistributed across 7 agents. Latency normalized.',
    time: '12m ago',
    type: 'info',
    expiry: '30min', // Auto-expires 30 min after creation
    createdAt: nowMs - 12 * 60 * 1000
  },
  {
    id: 4, read: false,
    icon: Server, iconColor: 'text-[#EF4444]',
    title: 'Emergency Alert: Power Grid Failure',
    detail: 'Substation 12 cascade failure detected. Nova response queued.',
    time: '18m ago',
    type: 'emergency',
    expiry: 'resolved', // Expires when emergency is resolved
    createdAt: nowMs - 18 * 60 * 1000
  },
];

/* ═══════════════════════════════════════════════════════════
   MODAL WRAPPER
═══════════════════════════════════════════════════════════ */
function Modal({ title, onClose, children, width = 'max-w-md' }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${width} glass-panel rounded-3xl border border-white/15 shadow-2xl shadow-black/60 animate-fade-in`}>
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <h2 className="text-base font-extrabold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LOGOUT CONFIRM
═══════════════════════════════════════════════════════════ */
function LogoutConfirm({ onCancel, onConfirm }) {
  return (
    <Modal title="Switch Department" onClose={onCancel} width="max-w-sm">
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-slate-300 leading-relaxed">
            Return to the department selection menu to select another operational environment?
          </p>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors cursor-pointer">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer">
            <Building2 className="w-4 h-4" /> Switch Department
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   MY PROFILE MODAL
═══════════════════════════════════════════════════════════ */
function ProfileModal({ onClose }) {
  const fields = [
    { label: 'Full Name', value: USER.fullName },
    { label: 'Role', value: USER.role },
    { label: 'Organization', value: USER.org },
    { label: 'Current Shift', value: USER.shift },
    { label: 'Last Login', value: USER.lastLogin },
    { label: 'Clearance Level', value: 'Level 4 — Command Access' },
    { label: 'Employee ID', value: 'VYR-OPS-00412' },
  ];
  return (
    <Modal title="👤 My Profile" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[var(--th-primary)]/10 to-[var(--th-accent)]/10 border border-white/10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[var(--th-primary)] to-[var(--th-accent)] flex items-center justify-center font-black text-xl text-white shadow-lg">{USER.initials}</div>
          <div>
            <p className="font-extrabold text-white text-base">{USER.fullName}</p>
            <p className="text-xs font-mono" style={{ color: 'var(--th-primary)' }}>{USER.role}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] text-emerald-400 font-mono">Online</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">{f.label}</span>
              <span className="text-slate-200 font-semibold">{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACCOUNT SETTINGS MODAL
═══════════════════════════════════════════════════════════ */
function AccountSettingsModal({ onClose }) {
  const [twofa, setTwofa] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const primary = 'var(--th-primary)';
  return (
    <Modal title="🔐 Account Settings" onClose={onClose}>
      <div className="space-y-4 text-sm font-mono">
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security</p>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-xs">Two-Factor Authentication</span>
            <button onClick={() => setTwofa(!twofa)} className="w-10 h-5 rounded-full transition-colors relative cursor-pointer" style={{ backgroundColor: twofa ? primary : '#374151' }}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${twofa ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300 text-xs">Session Timeout</span>
            <select value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 cursor-pointer">
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="0">Never</option>
            </select>
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Password</p>
          <button className="w-full py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer" style={{ backgroundColor: `color-mix(in srgb, var(--th-primary) 15%, transparent)`, color: primary, borderColor: `color-mix(in srgb, var(--th-primary) 30%, transparent)` }}>Change Password</button>
          <button className="w-full py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer">Manage API Keys</button>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   APPEARANCE MODAL — FULL THEME SELECTOR
═══════════════════════════════════════════════════════════ */
function AppearanceModal({ onClose }) {
  const { theme } = useTheme();
  const [density, setDensity] = useState('comfortable');

  return (
    <Modal title="🎨 Appearance & UI Density" onClose={onClose} width="max-w-md">
      <div className="space-y-5 font-mono text-xs">
        <div className="p-3.5 rounded-2xl border border-[#33C8FF]/20 bg-[#33C8FF]/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-base">{theme.emoji}</span>
            <div>
              <p className="font-bold text-white text-xs">{theme.name}</p>
              <p className="text-[10px] text-[#33C8FF]">System Standard Theme</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-900/60 px-2 py-1 rounded-md border border-slate-700">Built-in</span>
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">UI Density</p>
          <div className="grid grid-cols-3 gap-2">
            {['compact', 'comfortable', 'spacious'].map((d) => (
              <button key={d} onClick={() => setDensity(d)}
                className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer capitalize ${density === d ? 'text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'}`}
                style={density === d ? { backgroundColor: `color-mix(in srgb, var(--th-primary) 15%, #111827)`, borderColor: 'var(--th-primary)', color: 'var(--th-primary)' } : {}}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS SETTINGS MODAL
═══════════════════════════════════════════════════════════ */
function NotificationsSettingsModal({ onClose }) {
  const [prefs, setPrefs] = useState({ criticalAlerts: true, aiUpdates: true, systemHealth: false, shiftSummary: true, emailDigest: false });
  const toggle = (k) => setPrefs((p) => ({ ...p, [k]: !p[k] }));
  const items = [
    { key: 'criticalAlerts', label: 'Critical Incident Alerts', desc: 'CRITICAL and HIGH severity events' },
    { key: 'aiUpdates', label: 'AI Agent Updates', desc: 'Nova strategy and agent completions' },
    { key: 'systemHealth', label: 'System Health Alerts', desc: 'CPU, memory, latency warnings' },
    { key: 'shiftSummary', label: 'Shift Summary', desc: 'End-of-shift report digest' },
    { key: 'emailDigest', label: 'Email Digest', desc: 'Daily summary to registered email' },
  ];
  return (
    <Modal title="🔔 Notifications" onClose={onClose}>
      <div className="space-y-2 font-mono text-xs">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div>
              <p className="text-slate-200 font-semibold">{label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
            </div>
            <button onClick={() => toggle(key)} className="w-10 h-5 rounded-full transition-colors relative shrink-0 cursor-pointer" style={{ backgroundColor: prefs[key] ? 'var(--th-primary)' : '#374151' }}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${prefs[key] ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   ACTIVITY LOGS MODAL
═══════════════════════════════════════════════════════════ */
function ActivityLogsModal({ onClose }) {
  const logs = [
    { time: '22:42', action: 'Logged in from 192.168.1.12', type: 'auth' },
    { time: '22:45', action: 'Triggered Traffic Accident simulation', type: 'sim' },
    { time: '22:46', action: 'Nova generated 3-action blueprint', type: 'ai' },
    { time: '22:47', action: 'Approved field dispatch for Sector 9', type: 'command' },
    { time: '22:49', action: 'Added Hospital Power Failure to queue', type: 'sim' },
    { time: '22:51', action: 'Viewed AI Collaboration Workflow', type: 'view' },
  ];
  const colors = { auth: 'text-[#33C8FF]', sim: 'text-amber-400', ai: 'text-[#7C5CFF]', command: 'text-emerald-400', view: 'text-slate-400' };
  return (
    <Modal title="📜 Activity Logs" onClose={onClose} width="max-w-lg">
      <div className="space-y-1.5 font-mono text-xs max-h-80 overflow-y-auto pr-1">
        {logs.map((l, i) => (
          <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-500 shrink-0 mt-0.5">{l.time}</span>
            <span className={`font-semibold ${colors[l.type]}`}>{l.action}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   STATISTICS MODAL
═══════════════════════════════════════════════════════════ */
function StatisticsModal({ onClose }) {
  const stats = [
    { label: 'Incidents Handled', value: '247', unit: 'this month', color: 'text-[#33C8FF]' },
    { label: 'Avg. AI Response', value: '4.1s', unit: 'per incident', color: 'text-[#7C5CFF]' },
    { label: 'Dispatches Approved', value: '189', unit: 'this month', color: 'text-emerald-400' },
    { label: 'Critical Incidents', value: '31', unit: 'resolved', color: 'text-[#EF4444]' },
    { label: 'Shift Hours', value: '164h', unit: 'this month', color: 'text-amber-400' },
    { label: 'Nova Blueprints', value: '212', unit: 'approvals', color: 'text-[#33C8FF]' },
  ];
  return (
    <Modal title="📊 My Statistics" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2.5 font-mono">
        {stats.map((s) => (
          <div key={s.label} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-0.5">
            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] font-bold text-slate-300">{s.label}</p>
            <p className="text-[9px] text-slate-500">{s.unit}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   HELP MODAL
═══════════════════════════════════════════════════════════ */
function HelpModal({ onClose }) {
  const articles = [
    { title: 'Getting Started with Vyraion OS', tag: 'Guide' },
    { title: 'Understanding Nova Decision Engine', tag: 'AI' },
    { title: 'Multi-Incident Orchestration Workflow', tag: 'Operations' },
    { title: 'AI Agent Configuration Reference', tag: 'Agents' },
    { title: 'Emergency Response Protocols', tag: 'EOC' },
  ];
  return (
    <Modal title="❓ Help & Documentation" onClose={onClose}>
      <div className="space-y-2 font-mono text-xs">
        {articles.map((a, i) => (
          <button key={i} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-white/20 transition-all cursor-pointer text-left group">
            <span className="font-semibold text-slate-200 group-hover:text-white">{a.title}</span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[9px] px-1.5 py-0.5 rounded border" style={{ backgroundColor: 'color-mix(in srgb, var(--th-primary) 12%, transparent)', color: 'var(--th-primary)', borderColor: 'color-mix(in srgb, var(--th-primary) 30%, transparent)' }}>{a.tag}</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   ABOUT MODAL
═══════════════════════════════════════════════════════════ */
function AboutModal({ onClose }) {
  return (
    <Modal title="ℹ About Vyraion" onClose={onClose} width="max-w-sm">
      <div className="space-y-4 font-mono text-xs text-center">
        <div className="p-4 rounded-2xl border border-white/10 space-y-2" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--th-primary) 8%, transparent), color-mix(in srgb, var(--th-accent) 8%, transparent))' }}>
          <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, var(--th-primary), var(--th-accent))` }}>
            <Activity className="w-6 h-6 text-white" />
          </div>
          <p className="text-base font-extrabold text-white">Vyraion OS</p>
          <p className="text-[11px] font-mono" style={{ color: 'var(--th-primary)' }}>Decision Intelligence Platform</p>
        </div>
        <div className="space-y-1.5 text-left">
          {[
            { k: 'Version', v: 'v1.0.0 — Neural Ops' },
            { k: 'Build', v: 'Production • Aug 2026' },
            { k: 'AI Engine', v: 'Nova v3.2 + Sentinel Guard' },
            { k: 'License', v: 'Proprietary — Vyraion Inc.' },
          ].map(({ k, v }) => (
            <div key={k} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400">{k}</span>
              <span className="text-slate-200 font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* ═══════════════════════════════════════════════════════════
   NOTIFICATION CENTER DROPDOWN (Enforces Expiry Timers)
═══════════════════════════════════════════════════════════ */
function NotificationCenter({ onClose }) {
  const { notifications, markRead, dismissNotification, markAllRead, clearAll } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [now, setNow] = useState(Date.now());

  // 1-second live ticker for remaining time display
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getExpiryLabel = (n) => {
    if (n.expiry === 'acknowledge') return 'Expires on acknowledge';
    if (n.expiry === 'resolved') return 'Expires when resolved';
    if (n.expiry === '30min') {
      const ageMs = now - (n.createdAt || now);
      const remainingMs = Math.max(0, 30 * 60 * 1000 - ageMs);
      const mins = Math.floor(remainingMs / (60 * 1000));
      const secs = Math.floor((remainingMs % (60 * 1000)) / 1000);
      return `Expires in ${mins}m ${secs}s`;
    }
    return '';
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 rounded-3xl glass-panel border border-white/12 shadow-2xl shadow-black/60 z-50 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-white/4 to-transparent">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4" style={{ color: 'var(--th-primary)' }} />
          <span className="text-sm font-bold text-white">Notification Center</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full animate-fade-in" style={{ backgroundColor: 'color-mix(in srgb, var(--th-primary) 20%, transparent)', color: 'var(--th-primary)', border: '1px solid color-mix(in srgb, var(--th-primary) 40%, transparent)' }}>
              {unreadCount} New
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={markAllRead} title="Mark all read" className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer">
            <CheckCheck className="w-3.5 h-3.5" />
          </button>
          <button onClick={clearAll} title="Clear all" className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-[#EF4444] transition-colors cursor-pointer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-white/6">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-200">You're all caught up.</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">All notifications expired or acknowledged.</p>
            </div>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.id}
                className={`relative flex gap-3 p-4 transition-all duration-200 group ${
                  n.read ? 'opacity-60 hover:opacity-80' : 'hover:bg-white/4'
                }`}
                style={!n.read ? { borderLeft: `3px solid var(--th-primary)` } : { borderLeft: '3px solid transparent' }}
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${n.read ? 'bg-slate-800' : 'bg-slate-800/80'}`}>
                  <Icon className={`w-4 h-4 ${n.read ? 'text-slate-500' : n.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-xs leading-tight ${n.read ? 'font-medium text-slate-400' : 'font-bold text-slate-100'}`}>
                      {!n.read && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5 align-middle" style={{ backgroundColor: 'var(--th-primary)' }}></span>}
                      {n.title}
                    </p>
                    <span className="text-[9px] text-slate-500 font-mono shrink-0">{n.time}</span>
                  </div>
                  <p className={`text-[11px] mt-0.5 leading-relaxed ${n.read ? 'text-slate-600' : 'text-slate-400'}`}>{n.detail}</p>
                  
                  {/* Live Expiry Badge */}
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-slate-400">
                    <Clock className="w-3 h-3 text-[#33C8FF]" />
                    <span className="text-[#33C8FF] font-semibold">{getExpiryLabel(n)}</span>
                  </div>

                  {/* Actions — visible on hover */}
                  <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    {n.expiry === 'acknowledge' && (
                      <button onClick={() => markRead(n.id)}
                        className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30">
                        <Check className="w-2.5 h-2.5" /> Acknowledge & Expire
                      </button>
                    )}

                    {n.expiry === 'resolved' && (
                      <button onClick={() => dismissNotification(n.id)}
                        className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30">
                        <Check className="w-2.5 h-2.5" /> Resolve & Expire
                      </button>
                    )}

                    {n.expiry === '30min' && !n.read && (
                      <button onClick={() => markRead(n.id)}
                        className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--th-primary) 12%, transparent)', color: 'var(--th-primary)' }}>
                        <Check className="w-2.5 h-2.5" /> Mark as read
                      </button>
                    )}

                    <button onClick={() => dismissNotification(n.id)}
                      className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/5 hover:bg-[#EF4444]/15 text-slate-500 hover:text-[#EF4444] transition-colors cursor-pointer">
                      <X className="w-2.5 h-2.5" /> Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-white/10 bg-slate-950/40 flex items-center justify-between">
          <button onClick={markAllRead} className="text-[10px] font-mono text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1">
            <CheckCheck className="w-3 h-3" /> Mark all read
          </button>
          <button onClick={clearAll} className="text-[10px] font-mono text-slate-400 hover:text-[#EF4444] transition-colors cursor-pointer flex items-center gap-1">
            <Trash2 className="w-3 h-3" /> Clear all
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN HEADER (Enforces Expiry Timers & Badge Sync)
═══════════════════════════════════════════════════════════ */
export default function Header() {
  const navigate = useNavigate();
  const { themeId, theme } = useTheme();
  const { notifications, removeIncidentNotifications } = useNotifications();
  const { logout, user: authUser, isDemoMode } = useAuth();
  const { viewRole, setViewRole, incidentCounts } = useViewRole();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const USER = getDynamicUser(authUser, viewRole);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openModal = (name) => {
    setShowProfile(false);
    setActiveModal(name);
  };

  const handleLogoutConfirm = () => {
    setActiveModal(null);
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: User, label: 'My Profile', modal: 'profile', color: 'var(--th-primary)' },
    { icon: Shield, label: 'Account Settings', modal: 'settings', color: 'var(--th-accent)' },
    { icon: Palette, label: 'Appearance', modal: 'appearance', color: '#F59E0B' },
    { icon: BellRing, label: 'Notifications', modal: 'notif-settings', color: '#38BDF8' },
    { divider: true },
    { icon: ScrollText, label: 'Activity Logs', modal: 'logs', color: '#94A3B8' },
    { icon: BarChart3, label: 'My Statistics', modal: 'stats', color: '#22C55E' },
    { divider: true },
    { icon: HelpCircle, label: 'Help & Documentation', modal: 'help', color: '#94A3B8' },
    { icon: Info, label: 'About Vyraion', modal: 'about', color: '#94A3B8' },
    { divider: true },
    { icon: Building2, label: 'Switch Department', modal: 'logout', color: '#F59E0B' },
  ];

  return (
    <>
      <header
        className="h-16 backdrop-blur-xl border-b border-white/10 px-6 flex items-center justify-between sticky top-0 z-30 transition-all duration-300"
        style={{ backgroundColor: theme.vars['--th-header'] }}
      >
        {/* Search */}
        <div className="relative w-72 md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input type="text" placeholder="Search metrics, logs, AI predictions..."
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-black/20 border border-white/10 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors"
            style={{ color: 'var(--th-text)' }}
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
            <kbd className="hidden sm:inline-block text-[10px] font-mono text-slate-500 bg-black/20 border border-white/10 px-1.5 py-0.5 rounded">⌘K</kbd>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {isDemoMode && (
            <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>Demo Mode</span>
            </div>
          )}

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="capitalize">{viewRole || authUser?.role}</span>
          </div>

          {authUser?.role === 'admin' && (
            <div className="hidden lg:flex flex-col items-end gap-0.5">
              <div className="relative inline-flex items-center">
                <select
                  value={viewRole}
                  onChange={(e) => setViewRole(e.target.value)}
                  className="appearance-none outline-none cursor-pointer bg-[#33C8FF]/10 text-[#33C8FF] border border-[#33C8FF]/30 hover:bg-[#33C8FF]/20 px-3 py-1 pr-6 rounded-full text-xs font-semibold transition-colors"
                >
                  <option value="operator">View: Operator</option>
                  <option value="authority">View: Authority</option>
                  <option value="hospital">View: Hospital</option>
                  <option value="investigator">View: Investigator</option>
                  <option value="reviewer">View: Reviewer</option>
                  <option value="admin">View: Admin</option>
                  <option value="user">View: Citizen User</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#33C8FF] absolute right-2 pointer-events-none" />
              </div>
              <div className="text-[10px] font-mono text-[#33C8FF]/90 font-semibold truncate max-w-[320px]">
                Viewing as: <strong className="text-white">{ROLE_LABELS[viewRole] || viewRole}</strong> — {ROLE_DESCRIPTIONS[viewRole] || 'Scoped Telemetry'}{' '}
                <span className="text-slate-400">({incidentCounts?.visible ?? 0} of {incidentCounts?.total ?? 0} visible)</span>
              </div>
            </div>
          )}


          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border"
            style={{ backgroundColor: 'color-mix(in srgb, var(--th-primary) 10%, transparent)', color: 'var(--th-primary)', borderColor: 'color-mix(in srgb, var(--th-primary) 25%, transparent)' }}>
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>AI Engine Live</span>
          </div>

          <button onClick={() => openModal('appearance')} title="Change Theme"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-colors cursor-pointer text-[11px] font-mono">
            <span>{theme.emoji}</span>
            <span className="hidden md:inline">{theme.name}</span>
          </button>

          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-black/20 border border-white/10 hover:border-white/20 transition-colors relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: 'var(--th-primary)' }}></span>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--th-primary)' }}></span>
                </>
              )}
            </button>

            {showNotifications && (
              <NotificationCenter onClose={() => setShowNotifications(false)} />
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative pl-2 border-l border-white/10" ref={profileRef}>
            <button
              onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
              className="flex items-center gap-2.5 py-1 px-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md shrink-0"
                style={{ background: `linear-gradient(135deg, var(--th-primary), var(--th-accent))` }}>
                {USER.initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{USER.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{USER.role}</p>
              </div>
              <ChevronDown className={`hidden md:block w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showProfile ? 'rotate-180' : ''}`} />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-3xl glass-panel border border-white/15 shadow-2xl shadow-black/60 z-50 overflow-hidden animate-fade-in">
                <div className="p-4 border-b border-white/10" style={{ background: `linear-gradient(135deg, color-mix(in srgb, var(--th-primary) 8%, transparent), color-mix(in srgb, var(--th-accent) 6%, transparent))` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-lg shrink-0"
                      style={{ background: `linear-gradient(135deg, var(--th-primary), var(--th-accent))` }}>
                      {USER.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-white truncate">{USER.fullName}</p>
                      <p className="text-[11px] font-mono truncate" style={{ color: 'var(--th-primary)' }}>{USER.role}</p>
                      {isDemoMode ? (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0"></span>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">⚠ Demo Mode</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                          <span className="text-[10px] text-emerald-400 font-mono">Online</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="py-2 px-2">
                  {menuItems.map((item, i) => {
                    if (item.divider) return <div key={i} className="my-1 border-t border-white/8" />;
                    const Icon = item.icon;
                    return (
                      <button key={i} onClick={() => openModal(item.modal)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer group ${item.danger ? 'hover:bg-[#EF4444]/10 text-[#EF4444]' : 'hover:bg-white/6 text-slate-300 hover:text-white'}`}>
                        <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" style={{ color: item.color }} />
                        <span className="flex-1 text-left">{item.label}</span>
                        {!item.danger && <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />}
                      </button>
                    );
                  })}
                </div>

                <div className="px-4 py-2.5 border-t border-white/10 bg-black/20">
                  <p className="text-[9px] font-mono text-slate-600 text-center">Vyraion OS v1.0.0 • Session Active</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── MODALS ─── */}
      {activeModal === 'profile'        && <ProfileModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'settings'       && <AccountSettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'appearance'     && <AppearanceModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'notif-settings' && <NotificationsSettingsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'logs'           && <ActivityLogsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'stats'          && <StatisticsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'help'           && <HelpModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'about'          && <AboutModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'logout'         && <LogoutConfirm onCancel={() => setActiveModal(null)} onConfirm={handleLogoutConfirm} />}
    </>
  );
}
