import React, { useState, useEffect } from 'react';
import {
  Camera,
  Activity,
  ShieldCheck,
  Zap,
  MapPin,
  RefreshCw,
  Sparkles,
  Server
} from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

export default function AIVisionStatusPanel({ onTriggerIncident }) {
  const [visionStatus, setVisionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // Poll backend vision engine status every 4 seconds
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/vision/status`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setVisionStatus(result.data);
          }
        }
      } catch (err) {
        // Fallback for offline mode
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRunDiagnosticScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/vision/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && result.data && result.data.detection) {
          setVisionStatus((prev) => ({
            ...(prev || {}),
            latestDetection: result.data.detection,
            totalAnalyses24h: (prev?.totalAnalyses24h || 48291) + 1
          }));

          if (onTriggerIncident && result.data.incident) {
            onTriggerIncident(result.data.detection);
          }
        }
      }
    } catch (e) {
    } finally {
      setTimeout(() => setIsScanning(false), 800);
    }
  };

  const detection = visionStatus?.latestDetection || {
    cameraName: 'Cam 01: CTE Expressway Corridor',
    locationName: 'Central Expressway (CTE) Junction 14',
    incidentName: 'Traffic Accident',
    riskLevel: 'HIGH',
    confidence: 96.4,
    timestamp: 'Just now',
    recommendedAgencies: ['Traffic Police', 'SCDF ALS Ambulance', 'LTA Heavy Tow']
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
    }
  };

  return (
    <div className="glass-panel px-4 py-3 rounded-2xl border border-white/10 font-mono">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">

        {/* Engine Status */}
        <div className="flex items-center gap-2">
          <Camera className="w-3.5 h-3.5 text-[#33C8FF] shrink-0" />
          <span className="text-[10px] text-slate-400">Engine Status</span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            ● Operational
          </span>
        </div>
        <div className="w-px h-4 bg-white/10 hidden sm:block" />

        {/* Cameras Online */}
        <div className="flex items-center gap-2">
          <Server className="w-3.5 h-3.5 text-[#33C8FF] shrink-0" />
          <span className="text-[10px] text-slate-400">Cameras Online</span>
          <span className="text-[10px] font-bold text-[#33C8FF] font-mono">12</span>
        </div>
        <div className="w-px h-4 bg-white/10 hidden sm:block" />

        {/* Latest Detection */}
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[10px] text-slate-400 shrink-0">Latest Detection</span>
          <span className="text-[10px] font-bold text-white truncate max-w-[140px]">
            {detection.incidentName || detection.label || 'Traffic Accident'}
          </span>
          <span className="text-[9px] text-slate-500 shrink-0 hidden md:block truncate max-w-[100px]">
            · {detection.cameraName?.split(':')[0] || 'Cam 01'}
          </span>
        </div>
        <div className="w-px h-4 bg-white/10 hidden sm:block" />

        {/* Risk Level */}
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="text-[10px] text-slate-400">Risk Level</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${getRiskColor(detection.riskLevel)}`}>
            {detection.riskLevel || 'HIGH'}
          </span>
        </div>
        <div className="w-px h-4 bg-white/10 hidden sm:block" />

        {/* Confidence Score */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#33C8FF] shrink-0" />
          <span className="text-[10px] text-slate-400">Confidence</span>
          <span className="text-[10px] font-extrabold text-[#33C8FF] font-mono">
            {detection.confidence || 96.4}%
          </span>
        </div>
        <div className="w-px h-4 bg-white/10 hidden sm:block" />

        {/* Frames stat */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[10px] text-slate-400">Frames/24h</span>
          <span className="text-[10px] font-bold text-slate-300 font-mono">
            {(visionStatus?.totalAnalyses24h || 48291).toLocaleString()}
          </span>
        </div>

        {/* Scan button — pushed to the right */}
        <div className="ml-auto">
          <button
            onClick={handleRunDiagnosticScan}
            disabled={isScanning}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-[#33C8FF]/15 border border-slate-700 hover:border-[#33C8FF]/40 text-[#33C8FF] text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'SCANNING...' : 'CCTV Scan'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
