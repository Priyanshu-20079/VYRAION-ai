import React, { useState, useEffect, useCallback } from 'react';
import { INCIDENTS_API_URL } from '../config/api';
import {
  Siren,
  ShieldAlert,
  Flame,
  Car,
  Truck,
  Activity,
  CheckCircle2,
  Radio,
  MapPin,
  Clock,
  AlertTriangle,
  Brain,
  ShieldCheck,
  RefreshCw,
  Video
} from 'lucide-react';
import SingaporeSatelliteMap from '../components/common/SingaporeSatelliteMap';
import AIVisionStatusPanel from '../components/vision/AIVisionStatusPanel';
import { useSocket } from '../context/SocketContext';
import { useViewRole } from '../context/ViewRoleContext';
import { filterIncidentsForRole, ROLE_LABELS, ROLE_DESCRIPTIONS } from '../utils/incidentRoleFilters';

export default function PoliceFireDashboardPage() {
  const { socket, isConnected } = useSocket();
  const { setIncidentCounts } = useViewRole();

  const [policeIncidents, setPoliceIncidents] = useState([]);
  const [allIncidentsCount, setAllIncidentsCount] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [liveTimeline, setLiveTimeline] = useState([]);
  const [liveVehicles, setLiveVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real incidents from MongoDB Atlas backed API
  const fetchIncidents = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${INCIDENTS_API_URL}/active?role=all`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const allDocs = json.data;
          setAllIncidentsCount(allDocs.length);

          // Scoped Police & Fire filtering (traffic, fire, hazmat, police/fire units)
          const scoped = filterIncidentsForRole(allDocs, 'authority');
          setPoliceIncidents(scoped);
          setIncidentCounts({ visible: scoped.length, total: allDocs.length });

          if (scoped.length > 0 && !selectedIncident) {
            setSelectedIncident(scoped[0]);
          }

          // Build timeline logs
          const logs = scoped.flatMap((inc) => (inc.detectionEvents || []).map((e) => ({
            id: `evt_${inc._id || inc.id}_${Math.random()}`,
            time: e.realTime || 'Just now',
            title: inc.title || inc.type,
            detail: `${e.source}: ${e.detail}`,
            severity: inc.severity
          })));
          setLiveTimeline(logs.slice(0, 10));
        }
      }
    } catch (err) {
      console.error('[PoliceFireDashboard] Failed to fetch incidents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setIncidentCounts, selectedIncident]);

  useEffect(() => {
    fetchIncidents();

    if (socket && isConnected) {
      const handleSync = () => fetchIncidents();
      socket.on('incident:created', handleSync);
      socket.on('incident:phase-changed', handleSync);
      socket.on('incident:approved', handleSync);
      socket.on('incident:resolved', handleSync);
      socket.on('incident:reset', handleSync);

      return () => {
        socket.off('incident:created', handleSync);
        socket.off('incident:phase-changed', handleSync);
        socket.off('incident:approved', handleSync);
        socket.off('incident:resolved', handleSync);
        socket.off('incident:reset', handleSync);
      };
    }
  }, [fetchIncidents, socket, isConnected]);

  // Public safety counts
  const trafficCount = policeIncidents.filter(i => (i.type || '').toLowerCase().includes('traffic')).length;
  const fireCount = policeIncidents.filter(i => (i.type || '').toLowerCase().includes('fire') || (i.type || '').toLowerCase().includes('hazmat')).length;
  const criticalCount = policeIncidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4">
      {/* ─── POLICE & FIRE DASHBOARD HEADER ───────────────────────────────── */}
      <div className="glass-panel p-6 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-slate-950 via-[#0A1224] to-slate-950 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Siren className="w-6 h-6 animate-pulse text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider font-mono">
                  👮 POLICE & FIRE OPERATIONS CENTER
                </h1>
                <p className="text-xs text-blue-300 font-mono">
                  Public Safety / Emergency Response Command — Scoped Telemetry
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchIncidents}
              className="px-3.5 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 text-xs font-bold font-mono inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Telemetry</span>
            </button>
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold font-mono inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>POLICE NET ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Tactical Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-blue-500/20 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Public Safety Incidents</span>
            <div className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-400" />
              <span>{policeIncidents.length}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/20 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Traffic Collisions</span>
            <div className="text-xl font-bold text-amber-300 font-mono flex items-center gap-2">
              <Car className="w-5 h-5 text-amber-400" />
              <span>{trafficCount}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-rose-500/20 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Fire & Hazmat Outbreaks</span>
            <div className="text-xl font-bold text-rose-400 font-mono flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-400" />
              <span>{fireCount}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-red-500/20 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">High / Critical Severity</span>
            <div className="text-xl font-bold text-red-400 font-mono flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>{criticalCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN POLICE & FIRE GRID ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Map & Active Public Safety Incidents (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* AI Vision Camera Telemetry */}
          <AIVisionStatusPanel />

          {/* Satellite Map */}
          <div className="glass-panel p-2 rounded-2xl border border-white/10 relative">
            <div className="flex items-center justify-between p-3 border-b border-white/10 mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>POLICE & FIRE ROAD NETWORK GPS TELEMETRY</span>
              </div>
              <span className="text-[10px] text-blue-400 font-mono">
                {policeIncidents.length} Public Safety Targets
              </span>
            </div>
            <SingaporeSatelliteMap activeQueue={policeIncidents} onVehicleStateChange={setLiveVehicles} />
          </div>

          {/* Active Incidents List */}
          <div className="glass-panel p-5 rounded-2xl border border-blue-500/20 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Siren className="w-4 h-4 text-blue-400" />
              <span>Active Public Safety & Traffic Dispatch Queue</span>
            </h2>

            {policeIncidents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2 font-mono">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs">No active police or fire incidents in queue. All corridors clear.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {policeIncidents.map((inc) => (
                  <div
                    key={inc._id || inc.uniqueId || inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      selectedIncident?._id === inc._id || selectedIncident?.uniqueId === inc.uniqueId
                        ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {inc.type}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        inc.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      }`}>
                        {inc.severity}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-xs leading-snug">{inc.title || inc.name}</h3>

                    <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                      <div>📍 Hotspot: <strong className="text-slate-200">{inc.hotspot}</strong></div>
                      <div>🚦 Status: <strong className="text-emerald-400">{inc.status} (Phase {inc.phase})</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Tactical Command & Response Units (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Selected Incident Detail Card */}
          {selectedIncident && (
            <div className="glass-panel p-5 rounded-2xl border border-blue-500/30 space-y-4 bg-slate-950/80">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Siren className="w-4 h-4 text-blue-400" />
                  <h3 className="font-bold text-white text-xs font-mono">Public Safety Incident Target</h3>
                </div>
                <span className="text-[10px] font-mono text-blue-400">{selectedIncident.uniqueId || selectedIncident.id}</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">{selectedIncident.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedIncident.action || 'Deploying traffic police corridor clearance & perimeter safety.'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1.5 text-xs font-mono">
                <div>Est. Resolution: <strong className="text-white">{selectedIncident.resolutionTime || '15-20 min'}</strong></div>
                <div>Destination Hub: <strong className="text-blue-300">{selectedIncident.destination || 'HQ Command'}</strong></div>
                <div>Coordinates: <strong className="text-slate-300">{selectedIncident.lat}, {selectedIncident.lng}</strong></div>
              </div>

              {/* AI Priorities */}
              {selectedIncident.priorities && selectedIncident.priorities.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-blue-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-blue-400" />
                    <span>Public Safety AI Blueprints</span>
                  </h5>
                  <div className="space-y-1.5">
                    {selectedIncident.priorities.map((p, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                        <div className="font-bold text-white text-[11px]">{p.title}</div>
                        <div className="text-[10px] text-slate-300 leading-tight">{p.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Police & Fire Units Tracking */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" />
              <span>Police & Fire Field Response Fleet</span>
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚔</span>
                  <div>
                    <div className="font-bold text-white text-xs">Traffic Police Fleet #04</div>
                    <div className="text-[10px] text-slate-400">Patrol Division • Tanglin Station</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">PATROLLING</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🚒</span>
                  <div>
                    <div className="font-bold text-white text-xs">Hazmat Fire Engine #09</div>
                    <div className="text-[10px] text-slate-400">Heavy Rescue • Central Station</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">STANDBY</span>
              </div>
            </div>
          </div>

          {/* Live Incident Timeline */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-400" />
              <span>Police Live Command Log</span>
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {liveTimeline.length === 0 ? (
                <div className="text-xs text-slate-500 font-mono py-4 text-center">Awaiting police dispatch feeds...</div>
              ) : (
                liveTimeline.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-300 text-[11px]">{log.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{log.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
