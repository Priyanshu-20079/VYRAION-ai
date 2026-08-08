import React, { useState, useEffect, useCallback } from 'react';
import { INCIDENTS_API_URL } from '../config/api';
import {
  Hospital,
  Activity,
  HeartPulse,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Brain,
  MapPin,
  Clock,
  Radio,
  RefreshCw,
  ShieldCheck,
  Building2,
  FileSpreadsheet,
  ClipboardList
} from 'lucide-react';
import SingaporeSatelliteMap from '../components/common/SingaporeSatelliteMap';
import AIVisionStatusPanel from '../components/vision/AIVisionStatusPanel';
import IncidentChecklistPanel from '../components/common/IncidentChecklistPanel';
import { useSocket } from '../context/SocketContext';
import { useViewRole } from '../context/ViewRoleContext';
import { filterIncidentsForRole } from '../utils/incidentRoleFilters';

export default function HospitalDashboardPage() {
  const { socket, isConnected } = useSocket();
  const { setIncidentCounts } = useViewRole();

  const [hospitalIncidents, setHospitalIncidents] = useState([]);
  const [allIncidentsCount, setAllIncidentsCount] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [medicalLogs, setMedicalLogs] = useState([]);
  const [liveVehicles, setLiveVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ICU / Trauma Bed Readiness Gauges
  const bedReadiness = {
    icuBedsAvailable: 14,
    icuBedsTotal: 50,
    traumaBaysOpen: 6,
    traumaBaysTotal: 12,
    ambulanceStatus: 'READY (8 Fleets Active)',
    surgicalTheaters: '3 Operating Rooms Standing By'
  };

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

          // Scoped Hospital & Healthcare filtering
          const scoped = filterIncidentsForRole(allDocs, 'hospital');
          setHospitalIncidents(scoped);
          setIncidentCounts({ visible: scoped.length, total: allDocs.length });

          if (scoped.length > 0 && !selectedIncident) {
            setSelectedIncident(scoped[0]);
          }

          // Build medical telemetry logs
          const logs = scoped.flatMap((inc) => (inc.detectionEvents || []).map((e) => ({
            id: `med_${inc._id || inc.id}_${Math.random()}`,
            time: e.realTime || 'Just now',
            title: inc.title || inc.type,
            detail: `${e.source}: ${e.detail}`,
            severity: inc.severity
          })));
          setMedicalLogs(logs.slice(0, 10));
        }
      }
    } catch (err) {
      console.error('[HospitalDashboard] Failed to fetch incidents:', err);
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

  return (
    <div className="space-y-6 animate-fade-in p-2 sm:p-4">
      {/* ─── HOSPITAL DASHBOARD HEADER ────────────────────────────────────── */}
      <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-[#061814] to-slate-950 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Hospital className="w-6 h-6 animate-pulse text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider font-mono">
                  🏥 HOSPITAL & HEALTHCARE OPERATIONS CENTER
                </h1>
                <p className="text-xs text-emerald-300 font-mono">
                  Trauma / Emergency Medical Command — Patient & Casualty Readiness
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchIncidents}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold font-mono inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sync Medical Data</span>
            </button>
            <div className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold font-mono inline-flex items-center gap-2">
              <HeartPulse className="w-4 h-4 animate-pulse text-rose-400" />
              <span>TRAUMA BAY READY</span>
            </div>
          </div>
        </div>

        {/* Medical & Hospital Readiness KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/20 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Medical Incidents</span>
            <div className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>{hospitalIncidents.length}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-teal-500/20 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ICU Beds Available</span>
            <div className="text-xl font-bold text-teal-300 font-mono flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-400" />
              <span>{bedReadiness.icuBedsAvailable} / {bedReadiness.icuBedsTotal}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/20 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Trauma Bays Open</span>
            <div className="text-xl font-bold text-amber-300 font-mono flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-amber-400" />
              <span>{bedReadiness.traumaBaysOpen} / {bedReadiness.traumaBaysTotal}</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-rose-500/20 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">ALS Ambulances Fleets</span>
            <div className="text-xl font-bold text-rose-300 font-mono flex items-center gap-2">
              <Truck className="w-5 h-5 text-rose-400" />
              <span>8 Fleets En Route</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN HOSPITAL & MEDICAL GRID ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* LEFT COLUMN: Map & Active Medical Incidents (8 cols) */}
        <div className="lg:col-span-8 space-y-6">

          {/* AI Vision Camera Feed */}
          <AIVisionStatusPanel />

          {/* Satellite Map */}
          <div className="glass-panel p-2 rounded-2xl border border-white/10 relative">
            <div className="flex items-center justify-between p-3 border-b border-white/10 mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>AMBULANCE FLEET GPS NAVIGATION & TRAUMA HUB ROUTING</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">
                {hospitalIncidents.length} Medical Targets Active
              </span>
            </div>
            <SingaporeSatelliteMap activeQueue={hospitalIncidents} onVehicleStateChange={setLiveVehicles} />
          </div>

          {/* Active Medical Incidents Queue */}
          <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Hospital className="w-4 h-4 text-emerald-400" />
              <span>Mass Casualty Triage & Medical Dispatch Queue</span>
            </h2>

            {hospitalIncidents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2 font-mono">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs">No active medical emergencies in hospital queue. Emergency rooms standing by.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hospitalIncidents.map((inc) => (
                  <div
                    key={inc._id || inc.uniqueId || inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      selectedIncident?._id === inc._id || selectedIncident?.uniqueId === inc.uniqueId
                        ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
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
                      <div>🏥 Destination: <strong className="text-emerald-300">{inc.destination || 'Singapore General Hospital'}</strong></div>
                      <div>⚡ Status: <strong className="text-emerald-400">{inc.status} (Phase {inc.phase})</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Medical Action Checklist & Command (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Incident Action Checklist */}
          {hospitalIncidents.length > 0 && (
            <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-slate-950 via-[#0a1815] to-slate-950 shadow-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2.5">
                <ClipboardList className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Medical Action Checklist</h3>
              </div>
              <IncidentChecklistPanel activeQueue={hospitalIncidents} />
            </div>
          )}

          {/* Selected Medical Incident Details */}
          {selectedIncident && (
            <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 space-y-4 bg-slate-950/80">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-emerald-400" />
                  <h3 className="font-bold text-white text-xs font-mono">Medical Target Spec</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">{selectedIncident.uniqueId || selectedIncident.id}</span>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-white text-sm">{selectedIncident.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedIncident.action || 'Dispatching Advanced Life Support fleet and notifying trauma surgeon team.'}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1.5 text-xs font-mono">
                <div>Est. Resolution: <strong className="text-white">{selectedIncident.resolutionTime || '6-9 min'}</strong></div>
                <div>Trauma Destination: <strong className="text-emerald-300">{selectedIncident.destination || 'Singapore General Hospital'}</strong></div>
                <div>Coordinates: <strong className="text-slate-300">{selectedIncident.lat}, {selectedIncident.lng}</strong></div>
              </div>

              {/* AI Priorities */}
              {selectedIncident.priorities && selectedIncident.priorities.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-emerald-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Healthcare AI Decision Blueprints</span>
                  </h5>
                  <div className="space-y-1.5">
                    {selectedIncident.priorities.map((p, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                        <div className="font-bold text-white text-[11px]">{p.title}</div>
                        <div className="text-[10px] text-slate-300 leading-tight">{p.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live Medical Command Log */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Hospital Live Command Log</span>
            </h3>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {medicalLogs.length === 0 ? (
                <div className="text-xs text-slate-500 font-mono py-4 text-center">Awaiting medical telemetry feeds...</div>
              ) : (
                medicalLogs.map((log) => (
                  <div key={log.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300 text-[11px]">{log.title}</span>
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
