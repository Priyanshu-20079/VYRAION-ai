import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Cpu,
  Radio,
  Camera,
  Brain,
  UserCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity
} from 'lucide-react';

const SIMULATION_SCENARIOS = [
  {
    name: 'Traffic Accident',
    location: 'CTE Expressway Junction 14',
    risk: 'HIGH RISK',
    riskColor: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
    detection: 'AI Vision detected multi-vehicle collision (96.4% conf.)',
    novaStrategy: 'Redirect Express Bypass & Deploy ALS Ambulance #12',
    dispatch: 'Traffic Police + SCDF Ambulance En Route',
    agency: 'Traffic Police & SCDF'
  },
  {
    name: 'Fire Outbreak',
    location: 'Jurong SCADA Chemical Plant',
    risk: 'HIGH RISK',
    riskColor: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
    detection: 'Thermal Sensor confirmed 780°C chemical blaze',
    novaStrategy: 'Dispatch Foam Engine Tender & Lock Perimeter',
    dispatch: 'SCDF Hazmat Engine + Police Patrol On Scene',
    agency: 'SCDF Hazmat Unit'
  },
  {
    name: 'Medical Emergency',
    location: 'Orchard Central Transit Hub',
    risk: 'MEDIUM RISK',
    riskColor: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    detection: 'Mass Casualty Alert ingested from 911 Hotline',
    novaStrategy: 'Enable Signal Green-Wave for Trauma Convoy',
    dispatch: 'Advanced Life Support Ambulances Dispatched',
    agency: 'SGH Trauma Team'
  },
  {
    name: 'Hospital Power Failure',
    location: 'Singapore General Hospital (SGH)',
    risk: 'HIGH RISK',
    riskColor: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
    detection: 'Primary HV Feeder trip detected at Substation 12',
    novaStrategy: 'Dispatch Fuel Tanker & Reroute High-Voltage Feed',
    dispatch: 'Generator Fuel Tanker + EMA Utility Crew En Route',
    agency: 'EMA Utility & SGH Engineering'
  },
  {
    name: 'Heavy Rain',
    location: 'Bukit Timah Drainage Sluice',
    risk: 'LOW RISK',
    riskColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    detection: 'Weather Radar detected 65mm/hr torrential monsoon rain',
    novaStrategy: 'Activate Stormwater Pumps & Monitor Canal Gate',
    dispatch: 'Automated Drainage Pumps Running Nominal',
    agency: 'PUB Water Agency'
  },
  {
    name: 'Hazardous Material Spill',
    location: 'Jurong Logistics Chemical Depot',
    risk: 'HIGH RISK',
    riskColor: 'text-rose-400 bg-rose-500/15 border-rose-500/30',
    detection: 'Gas Sensor Array detected toxic chemical vapor plume',
    novaStrategy: 'Deploy Chemical Neutralizer & Evacuate Depot',
    dispatch: 'Hazmat Containment Team Seal Active',
    agency: 'SCDF Hazmat Decon'
  }
];

const STAGES = [
  { label: 'Detection', icon: Radio, color: 'text-amber-400' },
  { label: 'AI Vision', icon: Camera, color: 'text-[#33C8FF]' },
  { label: 'Nova AI', icon: Brain, color: 'text-[#7C5CFF]' },
  { label: 'Approval', icon: UserCheck, color: 'text-[#33C8FF]' },
  { label: 'Dispatch', icon: Truck, color: 'text-emerald-400' },
  { label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-400' }
];

export default function HeroIllustration() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);

  // Simulation step loop (advances stages every 1.1s, total scenario loop ~6.6s)
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prevStage) => {
        if (prevStage < STAGES.length - 1) {
          return prevStage + 1;
        } else {
          setScenarioIndex((prevScen) => (prevScen + 1) % SIMULATION_SCENARIOS.length);
          return 0;
        }
      });
    }, 1100);

    return () => clearInterval(interval);
  }, []);

  const scenario = SIMULATION_SCENARIOS[scenarioIndex];
  const stage = STAGES[stageIndex];
  const StageIcon = stage ? stage.icon : Radio;

  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none font-sans">
      {/* Background Glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#33C8FF]/20 via-[#7C5CFF]/20 to-[#EF4444]/20 blur-2xl opacity-70 pointer-events-none"></div>

      <div className="relative glass-panel rounded-3xl p-5 border border-white/10 shadow-2xl space-y-4 bg-slate-950/90 font-mono">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[11px] font-bold tracking-wider text-slate-200 uppercase">
              LIVE SIMULATION LOOP
            </span>
          </div>
          <span className="text-[10px] text-[#33C8FF] bg-[#33C8FF]/10 px-2.5 py-1 rounded-md border border-[#33C8FF]/30 font-bold">
            LATENCY: 4.3ms • 60 FPS
          </span>
        </div>

        {/* Dynamic Scenario Header */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-950 via-[#0D1322] to-slate-950 border border-white/10 space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#33C8FF] animate-pulse" />
              {scenario.name}
            </span>
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${scenario.riskColor}`}>
              {scenario.risk}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">{scenario.location}</p>
        </div>

        {/* 6-Stage Animated Pipeline */}
        <div className="grid grid-cols-6 gap-1 py-1 text-center">
          {STAGES.map((stg, i) => {
            const Icon = stg.icon;
            const isActive = i === stageIndex;
            const isDone = i < stageIndex;

            return (
              <div
                key={i}
                className={`p-2 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-[#33C8FF]/20 border-[#33C8FF] text-white scale-105 shadow-md shadow-[#33C8FF]/30'
                    : isDone
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900/60 border-slate-800 text-slate-600'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 mb-1 ${isActive ? 'animate-bounce' : ''}`} />
                <span className="text-[8px] font-bold truncate w-full">{stg.label}</span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Stage Details Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs transition-all duration-300">
          <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/10 pb-1">
            <span className="flex items-center gap-1 text-[#33C8FF] font-bold">
              <StageIcon className="w-3.5 h-3.5" /> Stage {stageIndex + 1}: {stage.label}
            </span>
            <span className="text-emerald-400 font-bold">● Active Workflow</span>
          </div>

          {stageIndex === 0 && <p className="text-slate-300 font-bold text-xs">{scenario.detection}</p>}
          {stageIndex === 1 && <p className="text-sky-300 font-bold text-xs">YOLO v9 inferred 96.4% confidence bbox signature</p>}
          {stageIndex === 2 && <p className="text-purple-300 font-bold text-xs">{scenario.novaStrategy}</p>}
          {stageIndex === 3 && <p className="text-amber-300 font-bold text-xs">Human Operator approved command authorization</p>}
          {stageIndex === 4 && <p className="text-emerald-300 font-bold text-xs">{scenario.dispatch}</p>}
          {stageIndex === 5 && <p className="text-emerald-400 font-bold text-xs">✅ Incident stabilized & archived to Knowledge Base</p>}

          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1">
            <span>Agency: <strong className="text-slate-200">{scenario.agency}</strong></span>
            <span>Est: <strong className="text-[#33C8FF]">4.3s AI / ~45s Dispatch</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}
