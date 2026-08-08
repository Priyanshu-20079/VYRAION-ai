import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  Clock,
  MapPin,
  Sparkles,
  UserCheck,
  RefreshCw,
  Zap,
  Archive,
  Download,
  Smartphone,
  LogOut,
  ArrowLeft,
  Copy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useViewRole } from '../context/ViewRoleContext';
import { filterIncidentsForRole, getFilterTabsForRole, applySubFilter } from '../utils/incidentRoleFilters';
import { OPERATOR_API_URL } from '../config/api';
import { fetchNovaBlueprint, generateNovaBlueprint } from '../utils/novaDecisionEngine';

export default function OperatorConsolePage() {
  const { token, user, logout, isDemoMode } = useAuth();
  const { socket, isConnected } = useSocket();
  const { viewRole } = useViewRole(); // even though this is operator console, we might want to respect role or hardcode 'operator'. Let's hardcode 'operator' for filters.
  
  const [fetchedIncidents, setFetchedIncidents] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  
  const pendingIncidents = applySubFilter(filterIncidentsForRole(fetchedIncidents, 'operator'), 'operator', selectedTab);

  const [blueprintsMap, setBlueprintsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [countdown, setCountdown] = useState(45);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const notificationPermissionRef = useRef(false);

  // Device Detection: Check if accessed on desktop screen (> 768px and non-mobile UA)
  useEffect(() => {
    const checkDevice = () => {
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const isMobileUA = mobileRegex.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsDesktop(!isSmallScreen && !isMobileUA);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const handleCopyLink = () => {
    const link = typeof window !== 'undefined' ? `${window.location.origin}/operator` : '/operator';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  // Register PWA Install Prompt Listener (Android Chrome & Desktop PWA)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Helper for physical haptic vibration feedback on phone screens
  const triggerHaptic = (pattern = [80, 40, 80]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Request browser push notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          notificationPermissionRef.current = true;
        }
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      notificationPermissionRef.current = true;
    }
  }, []);

  // Real-time WebSocket incident sync (with 5s polling fallback if socket disconnects)
  useEffect(() => {
    let prevCount = 0;
    const fetchPending = async () => {
      try {
        const [pendingRes, reportsRes] = await Promise.all([
          fetch(`${OPERATOR_API_URL}/pending`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${OPERATOR_API_URL}/reports`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const allData = [];
        if (pendingRes.ok) {
          const resPending = await pendingRes.json();
          if (resPending.success && Array.isArray(resPending.data)) allData.push(...resPending.data);
        }
        if (reportsRes.ok) {
          const resReports = await reportsRes.json();
          if (resReports.success && Array.isArray(resReports.data)) allData.push(...resReports.data);
        }
        
        setFetchedIncidents(allData);

        // Trigger browser push notification when new incident arrives
        const pendingCount = allData.filter(i => i.status === 'AWAITING_APPROVAL').length;
        if (pendingCount > prevCount && notificationPermissionRef.current) {
              const latestInc = allData[allData.length - 1];
              new Notification(`🚨 ${latestInc.name || 'Emergency'} Incident`, {
                body: `${latestInc.title || 'Incident detected'}. Operator authorization required for mission dispatch.`,
                icon: '/pwa-icon.svg'
              });
              triggerHaptic([200, 100, 200]);
            }
            prevCount = pendingCount;
          
      } catch (e) {
        console.error('Operator console fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();

    if (socket && isConnected) {
      socket.emit('register-operator', { sessionId: user?.sessionId });

      const handlePendingChange = () => {
        fetchPending();
      };

      // When a specific incident resolves, remove it from the local queue immediately
      // without waiting for a full re-fetch (avoids card flash for the operator).
      const handleResolved = (data) => {
        const resolvedId = data?.id || data?.incident?.id;
        if (resolvedId && resolvedId !== 'all') {
          setFetchedIncidents((prev) =>
            prev.filter((i) => i.id !== resolvedId && i.uniqueId !== resolvedId)
          );
        } else {
          // Full reset - clear entire queue
          fetchPending();
        }
      };

      const handleReset = () => {
        setFetchedIncidents([]);
      };

      const handleSessionInvalidated = (data) => {
        if (data && data.oldSessionId === user?.sessionId) {
          logout();
          alert('Operator session already active. You have been logged out because another device logged in.');
          window.location.href = '/operator/login?evicted=true';
        }
      };

      socket.on('incident:created', handlePendingChange);
      socket.on('incident:phase-changed', handlePendingChange);
      socket.on('incident:approved', handlePendingChange);
      socket.on('incident:resolved', handleResolved);
      socket.on('incident:reset', handleReset);
      socket.on('operator:session-invalidated', handleSessionInvalidated);

      return () => {
        socket.off('incident:created', handlePendingChange);
        socket.off('incident:phase-changed', handlePendingChange);
        socket.off('incident:approved', handlePendingChange);
        socket.off('incident:resolved', handleResolved);
        socket.off('incident:reset', handleReset);
        socket.off('operator:session-invalidated', handleSessionInvalidated);
      };
    } else {
      console.warn('[OperatorConsolePage] Socket disconnected — falling back to 5s polling.');
      const interval = setInterval(fetchPending, 5000);
      return () => clearInterval(interval);
    }
  }, [token, socket, isConnected]);

  // Fetch real LLM decision blueprints for pending incidents
  useEffect(() => {
    let isMounted = true;
    if (pendingIncidents && pendingIncidents.length > 0) {
      pendingIncidents.forEach((inc) => {
        fetchNovaBlueprint([inc]).then((bp) => {
          if (isMounted && Array.isArray(bp) && bp.length > 0) {
            setBlueprintsMap((prev) => ({ ...prev, [inc.id]: bp }));
          }
        });
      });
    }
    return () => { isMounted = false; };
  }, [pendingIncidents]);

  // Approval window countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 45));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle Operator Mission Approval
  const handleApprove = async (id) => {
    triggerHaptic([100, 50, 100]);
    setSubmitting(true);
    setActionMessage('');
    try {
      const res = await fetch(`${OPERATOR_API_URL}/approve/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setActionMessage(`✅ Mission '${id}' APPROVED. Field units dispatched. Auto-simulation completion timer running (60-120s).`);
        setFetchedIncidents((prev) => prev.filter((i) => i.id !== id && i.uniqueId !== id));
        if (notificationPermissionRef.current) {
          new Notification('✅ Mission Approved', {
            body: `Field units dispatched for ${id}. Dashboard updated.`,
            icon: '/pwa-icon.svg'
          });
        }
      }
    } catch (e) {
      setActionMessage(`⚠️ Failed to approve: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Operator Rejection
  const handleReject = async (id) => {
    triggerHaptic([150, 50, 50]);
    setSubmitting(true);
    setActionMessage('');
    try {
      const res = await fetch(`${OPERATOR_API_URL}/reject/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setActionMessage(`🚫 Mission '${id}' REJECTED by operator.`);
        setFetchedIncidents((prev) => prev.filter((i) => i.id !== id && i.uniqueId !== id));
      }
    } catch (e) {
      setActionMessage(`⚠️ Failed to reject: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Case Resolution & Archiving
  const handleResolve = async (id) => {
    triggerHaptic([80, 40, 120]);
    setSubmitting(true);
    setActionMessage('');
    try {
      const res = await fetch(`${OPERATOR_API_URL}/resolve/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setActionMessage(`✅ Mission Completed Successfully. ${getSuccessMessage(id)}`);
        // Immediately remove the resolved incident from the operator queue.
        // The socket 'incident:resolved' broadcast will also trigger a re-fetch,
        // but this ensures the card disappears instantly for the operator.
        setFetchedIncidents((prev) => prev.filter((i) => i.id !== id && i.uniqueId !== id));
        if (notificationPermissionRef.current) {
          new Notification('✅ Mission Completed & Archived', {
            body: `Incident ${id} closed and archived to Knowledge Base.`,
            icon: '/pwa-icon.svg'
          });
        }
      } else {
        setActionMessage(`⚠️ Failed to resolve: ${result.message || 'Unknown error'}`);
      }
    } catch (e) {
      setActionMessage(`⚠️ Failed to resolve: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getSuccessMessage = (incId) => {
    const messages = {
      traffic: 'Traffic congestion cleared. Emergency corridor reopened.',
      fire: 'Industrial chemical blaze contained and extinguished. Thermal hotspots neutralized.',
      medical: 'Medical patients triaged and transported to hospital.',
      power: 'Substation feeder rerouted. Grid primary power restored.',
      hospital: 'City General primary power feed restored. ICU systems nominal.',
      hazmat: 'Chemical spill neutralized. Contamination containment verified.',
      safety: 'Perimeter secured. Crowd safety protocols established.',
      rain: 'Torrential rainfall advisory lifted. Drainage systems clear.'
    };
    return messages[incId] || 'Emergency incident successfully resolved and stabilized.';
  };

  // 🖥️ DESKTOP GUARD SCREEN: Displayed when /operator is accessed from desktop screen (> 768px)
  if (isDesktop) {
    const operatorUrl = typeof window !== 'undefined' ? `${window.location.origin}/operator` : 'https://vyraion.vercel.app/operator';
    const qrCodeApi = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(operatorUrl)}&color=33C8FF&bgcolor=060B15`;

    return (
      <div className="min-h-screen saas-grid-bg text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-6 shadow-2xl bg-slate-950/90 font-mono">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-[#33C8FF]/20 to-[#7C5CFF]/20 border border-[#33C8FF]/40 flex items-center justify-center text-[#33C8FF] animate-pulse">
            <Smartphone className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-white tracking-tight">📱 Mobile Operator Console Required</h1>
            <p className="text-xs text-slate-300 leading-relaxed px-2">
              This interface is optimized for mobile emergency operators.
              Please open this link on your phone or scan the QR code from the main dashboard.
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 inline-block mx-auto space-y-3 shadow-inner">
            <img
              src={qrCodeApi}
              alt="Scan to open Operator Console on phone"
              className="w-40 h-40 mx-auto rounded-xl border border-[#33C8FF]/30 p-1 bg-[#060B15]"
            />
            <p className="text-[10px] text-slate-400">Scan with your phone camera</p>
            <button
              onClick={handleCopyLink}
              className="py-1.5 px-3 rounded-xl bg-slate-950 hover:bg-[#33C8FF]/10 text-[#33C8FF] border border-[#33C8FF]/30 text-[10px] font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>{copySuccess ? 'Copied Link!' : 'Copy Operator URL'}</span>
            </button>
          </div>

          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl font-bold text-xs bg-slate-900 hover:bg-[#33C8FF]/15 text-[#33C8FF] border border-[#33C8FF]/40 transition-all duration-200 cursor-pointer shadow-lg shadow-[#33C8FF]/10"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 📱 MOBILE PWA CONSOLE VIEW (MULTIPLE INCIDENTS SUPPORTED SIMULTANEOUSLY)
  return (
    <div className="min-h-screen saas-grid-bg text-slate-100 flex flex-col items-center px-3 py-4 sm:p-6 font-sans selection:bg-sky-500/30 selection:text-sky-200">
      
      {/* 📱 MOBILE-FIRST PWA CONTAINER */}
      <div className="w-full max-w-md space-y-4 pb-12">

        {/* PWA INSTALLATION BANNER */}
        {isInstallable && (
          <div className="p-3.5 rounded-3xl bg-gradient-to-r from-[#33C8FF]/20 via-[#7C5CFF]/20 to-[#33C8FF]/20 border border-[#33C8FF]/40 shadow-xl flex items-center justify-between font-mono animate-bounce">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-[#33C8FF]" />
              <div>
                <p className="text-xs font-extrabold text-white">Install Vyraion Ops PWA</p>
                <p className="text-[10px] text-slate-300">Add to Android / iOS Home Screen</p>
              </div>
            </div>
            <button
              onClick={handleInstallPWA}
              className="py-1.5 px-3 rounded-xl bg-[#33C8FF] hover:bg-[#33C8FF]/90 text-slate-950 font-extrabold text-xs flex items-center gap-1 shadow-md shadow-[#33C8FF]/30 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>INSTALL</span>
            </button>
          </div>
        )}

        {/* DEMO MODE WARNING BANNER */}
        {isDemoMode && (
          <div className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-3 py-1.5 rounded-2xl font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md border border-amber-400/40 animate-fade-in text-center">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-950 animate-pulse shrink-0" />
            <span>⚠ Demo Mode — backend unreachable</span>
          </div>
        )}

        {/* TOP COMMAND HEADER BAR */}
        <div className="glass-panel p-3.5 sm:p-4 rounded-3xl border border-white/10 flex items-center justify-between shadow-2xl bg-slate-950/90 gap-2">
          
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#33C8FF] to-[#7C5CFF] p-0.5 shadow-md shadow-[#33C8FF]/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-[#33C8FF]" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold text-white tracking-tight">Vyraion Ops</h1>
                {isDemoMode ? (
                  <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                    ⚠ DEMO MODE
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 animate-pulse">
                    PWA LIVE
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">Multi-Incident Terminal</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden xs:inline-flex text-[10px] font-mono text-amber-400 font-bold bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 h-9 items-center gap-1 shrink-0">
              <span>🛡</span>
              <span>Operator Console</span>
            </span>
            <span className="text-[10px] font-mono text-slate-300 font-bold bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 h-9 flex items-center shrink-0">
              👤 {user?.name || 'Operator'}
            </span>
            <button
              onClick={logout}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-800 transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ACTION FEEDBACK ALERT BANNER */}
        {actionMessage && (
          <div className="p-3 rounded-2xl bg-[#33C8FF]/15 border border-[#33C8FF]/40 text-[#33C8FF] text-xs font-mono font-bold flex items-center justify-between animate-fade-in shadow-lg">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage('')} className="text-slate-400 hover:text-white font-bold ml-2">✕</button>
          </div>
        )}

        {/* 🚨 DYNAMIC MULTI-INCIDENT QUEUE CARDS */}
        {loading ? (
          <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-3 font-mono">
            <RefreshCw className="w-6 h-6 text-[#33C8FF] animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Syncing live multi-incident queue...</p>
          </div>
        ) : pendingIncidents.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-3 font-mono bg-slate-950/80">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">All Clear • Queue Empty</h2>
            <p className="text-xs text-slate-400">No active incidents awaiting operator action. Click any emergency scenario on the dashboard to trigger.</p>
          </div>
        ) : (
          <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between px-1 text-xs text-slate-400 font-bold">
              <span>🚨 ACTIVE EMERGENCY QUEUE ({pendingIncidents.length})</span>
              <span className="text-[#33C8FF] text-[10px]">Real-Time Sync</span>
            </div>

            {/* Operator Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 mb-2">
              {getFilterTabsForRole('operator').map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`px-4 py-1.5 rounded-full border text-xs font-bold font-mono transition-all shrink-0 ${
                    selectedTab === tab.id
                      ? 'bg-[#33C8FF]/20 text-[#33C8FF] border-[#33C8FF]'
                      : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-300'
                  }`}
                >
                  {tab.label} {selectedTab === tab.id && `(${pendingIncidents.length})`}
                </button>
              ))}
            </div>

            {pendingIncidents.map((activeIncident) => {
              const blueprint = blueprintsMap[activeIncident.id] || generateNovaBlueprint([activeIncident]);
              const isAwaiting = activeIncident.status === 'AWAITING_APPROVAL' || activeIncident.phase === 3;

              return (
                <div key={activeIncident.id} className={`glass-panel p-5 rounded-3xl border space-y-4 shadow-2xl relative bg-gradient-to-b from-slate-950 via-[#0D1322] to-slate-950 animate-fade-in ${
                  isAwaiting ? 'border-amber-500/50 shadow-amber-500/10' : 'border-emerald-500/40 shadow-emerald-500/10'
                }`}>
                  
                  {/* Status Header & Countdown */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isAwaiting ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></div>
                      <span className="font-extrabold text-white">
                        {isAwaiting ? '⚠️ WAITING FOR APPROVAL' : activeIncident.status === 'APPROVED' ? '✅ MISSION ACTIVE (60-120s AUTO)' : activeIncident.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>{countdown}s Window</span>
                    </div>
                  </div>

                  {/* Incident Main Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] font-mono border ${
                          activeIncident.riskLevel === 'LOW' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : activeIncident.riskLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                        }`}>
                          {activeIncident.riskLevel || activeIncident.severity || 'HIGH'} RISK
                        </span>
                        {activeIncident.detectedBy === 'AI Vision' && (
                          <span className="px-2 py-0.5 rounded-md bg-[#33C8FF]/15 border border-[#33C8FF]/40 text-[#33C8FF] text-[9px] font-bold">
                            🤖 AI VISION ({activeIncident.confidence || 94.8}%)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">Detected {activeIncident.timeDetected || 'Just now'}</span>
                    </div>

                    <h2 className="text-base font-extrabold text-white leading-tight">
                      {activeIncident.name || activeIncident.title}
                    </h2>

                    <p className="text-xs text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#33C8FF] shrink-0" />
                      <span className="truncate">{activeIncident.locationName || activeIncident.title || 'Singapore Operations Sector'}</span>
                    </p>

                    {activeIncident.recommendedAgencies && activeIncident.recommendedAgencies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="text-[10px] text-slate-400 self-center">Agencies:</span>
                        {activeIncident.recommendedAgencies.map((agency, i) => (
                          <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {agency}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* AI Recommendation Summary */}
                  {blueprint.length > 0 && (
                    <div className="p-3 rounded-2xl bg-slate-900/90 border border-[#33C8FF]/30 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-[#33C8FF] font-bold">
                        <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Nova Strategy</span>
                        <span>AI Conf. 96.4%</span>
                      </div>
                      <p className="font-bold text-white text-xs leading-snug">{blueprint[0].title}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{blueprint[0].reason}</p>
                    </div>
                  )}

                  {/* 🔘 APPROVAL ACTION BUTTONS PER INCIDENT */}
                  {isAwaiting ? (
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => handleApprove(activeIncident.id)}
                        disabled={submitting}
                        className="w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-slate-950 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer touch-manipulation active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-4 h-4 fill-slate-950 text-emerald-500" />
                        <span>APPROVE MISSION & DISPATCH</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleReject(activeIncident.id)}
                          disabled={submitting}
                          className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-red-400 border border-red-500/30 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation active:scale-[0.98]"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => setActionMessage(`⚠️ Escalated incident ${activeIncident.id} to Senior Command.`)}
                          disabled={submitting}
                          className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-[#7C5CFF] border border-[#7C5CFF]/30 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation active:scale-[0.98]"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Escalate</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 🏁 MISSION RESOLUTION BUTTONS */
                    <div className="space-y-2 pt-1 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs text-emerald-400 font-bold p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                        <span>🏁 Mission Dispatched (Auto-Timer)</span>
                        <span className="animate-pulse">{activeIncident.liveStage || 'Active'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleResolve(activeIncident.id)}
                          disabled={submitting}
                          className="py-3 px-3 rounded-xl font-extrabold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 touch-manipulation active:scale-[0.98]"
                        >
                          <Archive className="w-3.5 h-3.5" />
                          <span>Close Case & Archive</span>
                        </button>

                        <button
                          onClick={() => handleApprove(activeIncident.id)}
                          disabled={submitting}
                          className="py-3 px-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation active:scale-[0.98]"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reopen</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* 📜 REAL-TIME MISSION TIMELINE & TELEMETRY STREAM */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3 bg-slate-950/90 font-mono text-xs shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="font-extrabold text-white flex items-center gap-1.5 text-xs">
              <Radio className="w-3.5 h-3.5 text-[#33C8FF]" /> Live Mission Telemetry Stream
            </h3>
            <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
              REAL-TIME
            </span>
          </div>

          <div className="space-y-2 text-[11px]">
            {pendingIncidents.length > 0 ? (
              pendingIncidents.map((inc) => (
                <div key={inc.id} className="p-2.5 rounded-xl border bg-slate-900 border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold text-white">{inc.name}: {inc.liveStage || 'Awaiting Authorization'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{inc.timeDetected || 'Active'}</span>
                </div>
              ))
            ) : (
              <div className="p-2.5 rounded-xl border bg-slate-950 border-slate-800 text-slate-500 text-center">
                All emergency telemetry channels clear.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
