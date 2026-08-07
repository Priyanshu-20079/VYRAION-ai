import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import HeroIllustration from '../components/HeroIllustration';
import {
  Activity,
  Camera,
  Brain,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Zap,
  BookOpen,
  Car,
  Flame,
  Heart,
  CloudRain,
  AlertTriangle,
  Radio,
  Truck,
  MapPin,
  Eye,
  BarChart3,
  Siren,
  ChevronDown,
  UserCheck
} from 'lucide-react';

import NeuralNetworkBackground from '../components/common/NeuralNetworkBackground';

// ─── ANIMATED COUNTER ───────────────────────────────────────────────────────
function AnimatedCounter({ end, suffix = '', prefix = '', duration = 1600 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
}

// ─── 6 EMERGENCY SCENARIOS WITH SEVERITY BADGES ──────────────────────────────
const emergencyScenarios = [
  {
    label: 'Traffic Accident',
    desc: 'Multi-vehicle highway collision detection & green-wave routing for ambulance convoys.',
    severity: 'HIGH RISK',
    badgeStyle: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    icon: Car,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    glow: 'hover:border-rose-500/50 hover:shadow-rose-500/15'
  },
  {
    label: 'Fire Outbreak',
    desc: 'Industrial thermal anomaly detection, SCDF tender dispatch & evacuation zone mapping.',
    severity: 'HIGH RISK',
    badgeStyle: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    icon: Flame,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    glow: 'hover:border-rose-500/50 hover:shadow-rose-500/15'
  },
  {
    label: 'Medical Emergency',
    desc: 'Trauma dispatch, nearest hospital bed checking & priority signal clearance.',
    severity: 'MEDIUM RISK',
    badgeStyle: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    icon: Heart,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'hover:border-amber-500/50 hover:shadow-amber-500/15'
  },
  {
    label: 'Hospital Power Failure',
    desc: 'Primary feeder trip isolation, fuel tanker deployment & ICU backup grid protection.',
    severity: 'HIGH RISK',
    badgeStyle: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    icon: Zap,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    glow: 'hover:border-rose-500/50 hover:shadow-rose-500/15'
  },
  {
    label: 'Heavy Rain',
    desc: 'Monsoon canal surge monitoring, automated sluice gate pumps & flood warnings.',
    severity: 'LOW RISK',
    badgeStyle: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    icon: CloudRain,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/15'
  },
  {
    label: 'Hazardous Material Leak',
    desc: 'Vapor plume dispersion modeling, Hazmat seal activation & perimeter cordon.',
    severity: 'HIGH RISK',
    badgeStyle: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    icon: AlertTriangle,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    glow: 'hover:border-rose-500/50 hover:shadow-rose-500/15'
  }
];

// ─── TECHNOLOGY STACK ─────────────────────────────────────────────────────────
const techStack = [
  { name: 'React 18', icon: '⚛️', color: 'text-[#33C8FF]', border: 'border-[#33C8FF]/25', glow: 'hover:border-[#33C8FF]/60 hover:shadow-[#33C8FF]/20' },
  { name: 'Node.js', icon: '🟢', color: 'text-emerald-400', border: 'border-emerald-500/25', glow: 'hover:border-emerald-500/60 hover:shadow-emerald-500/20' },
  { name: 'FastAPI', icon: '⚡', color: 'text-teal-400', border: 'border-teal-500/25', glow: 'hover:border-teal-500/60 hover:shadow-teal-500/20' },
  { name: 'YOLO v9', icon: '👁️', color: 'text-rose-400', border: 'border-rose-500/25', glow: 'hover:border-rose-500/60 hover:shadow-rose-500/20' },
  { name: 'Leaflet', icon: '🗺️', color: 'text-emerald-300', border: 'border-emerald-400/25', glow: 'hover:border-emerald-400/60 hover:shadow-emerald-400/20' },
  { name: 'MongoDB', icon: '🍃', color: 'text-emerald-400', border: 'border-emerald-500/25', glow: 'hover:border-emerald-500/60 hover:shadow-emerald-500/20' },
  { name: 'Claude 3.5', icon: '🤖', color: 'text-purple-400', border: 'border-purple-500/25', glow: 'hover:border-purple-500/60 hover:shadow-purple-500/20' },
  { name: 'Gemini 1.5', icon: '✨', color: 'text-blue-400', border: 'border-blue-500/25', glow: 'hover:border-blue-500/60 hover:shadow-blue-500/20' }
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative text-slate-100 flex flex-col font-sans selection:bg-[#33C8FF]/30 selection:text-[#33C8FF] bg-[#060B15]">
      {/* 60 FPS GPU-Accelerated Neural Particle Canvas */}
      <NeuralNetworkBackground />

      <div className="relative z-10 flex flex-col flex-1">

        {/* STICKY NAVBAR */}
        <Navbar />

        {/* ══════════════════════════════════════════════════════════════
            1. HERO SECTION
        ══════════════════════════════════════════════════════════════ */}
        <section className="relative pt-12 pb-14 md:pt-18 md:pb-20 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">

              {/* Left Column: Headline & Action CTAs */}
              <div className="lg:col-span-7 space-y-5 text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-xs font-mono font-bold text-rose-400">
                  <Siren className="w-3.5 h-3.5 animate-pulse text-rose-400" />
                  <span>AI-POWERED EMERGENCY OPERATIONS OS</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                  <span className="text-white">Autonomous AI</span>
                  <br />
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #33C8FF 0%, #7C5CFF 50%, #EF4444 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    Emergency Command
                  </span>
                  <br />
                  <span className="text-white">Platform for Smart Cities</span>
                </h1>

                <p className="text-base sm:text-lg font-medium text-[#33C8FF] leading-relaxed">
                  Detect emergencies in real time using backend AI Vision, coordinate 7 specialized AI agents, and empower operators with decision intelligence.
                </p>

                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed font-mono">
                  Vyraion integrates CCTV streams, IoT sensors, and 911 hotline data into a unified AI command center. Nova orchestrates multi-agent blueprints in under 5 seconds — keeping human operators in control with single-click command authorization.
                </p>

                {/* Hero Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-4 font-mono">
                  <button
                    onClick={() => navigate('/login')}
                    className="group px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-[#33C8FF] to-blue-600 hover:from-[#33C8FF] hover:to-blue-500 text-slate-950 transition-all duration-200 shadow-lg shadow-[#33C8FF]/25 hover:shadow-[#33C8FF]/45 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                  >
                    <span>Launch Live Demo</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a
                    href="#how-it-works"
                    className="px-6 py-3.5 rounded-xl font-bold bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-[#33C8FF]/40 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Watch Simulation</span>
                    <ChevronDown className="w-4 h-4 text-[#33C8FF]" />
                  </a>
                </div>

                {/* Hero Metrics Counters */}
                <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 font-mono">
                  {[
                    { value: 12, suffix: '', label: 'CCTV Cameras', color: 'text-[#33C8FF]' },
                    { value: 6, suffix: '', label: 'Emergency Types', color: 'text-amber-400' },
                    { value: 7, suffix: '', label: 'AI Agents', color: 'text-purple-400' },
                    { value: 96.4, suffix: '%', label: 'Detection Accuracy', color: 'text-emerald-400' },
                    { value: 5, prefix: '<', suffix: 's', label: 'Decision Time', color: 'text-rose-400' },
                  ].map((m, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <p className={`text-xl font-extrabold ${m.color}`}>
                        <AnimatedCounter end={m.value} prefix={m.prefix || ''} suffix={m.suffix} />
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Live Auto-Simulating Dashboard Preview */}
              <div className="lg:col-span-5 w-full">
                <HeroIllustration />
              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            2. THIN STATISTICS RIBBON
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-3 bg-gradient-to-r from-slate-950 via-[#0A101D] to-slate-950 border-y border-white/10 font-mono text-xs shadow-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-6">
              
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-[#33C8FF]" />
                <span className="font-bold uppercase tracking-wider text-slate-300">Currently Protecting:</span>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-[11px]">
                <span className="text-slate-300">
                  📷 <strong className="text-[#33C8FF]">12</strong> Cameras Online
                </span>
                <span className="text-slate-300">
                  🤖 <strong className="text-purple-400">7</strong> AI Agents
                </span>
                <span className="text-slate-300">
                  🚨 <strong className="text-rose-400">6</strong> Emergency Types
                </span>
                <span className="text-slate-300">
                  🚑 <strong className="text-emerald-400">5</strong> Response Agencies
                </span>
                <span className="text-slate-300">
                  🎯 <strong className="text-[#33C8FF]">96.4%</strong> AI Confidence
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Status: Operational</span>
              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            3. WHAT IS VYRAION (OVERVIEW)
        ══════════════════════════════════════════════════════════════ */}
        <section id="what-is-vyraion" className="py-14 md:py-18 border-b border-white/10 bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#33C8FF]">
                What is Vyraion?
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                The Decision Intelligence Brain Behind Smart Cities
              </h3>
              <p className="text-base text-slate-300 leading-relaxed font-mono">
                Vyraion fuses backend AI Vision detection, multi-agent reasoning, and human operator command oversight into a single operational interface — detecting emergencies in seconds and coordinating dispatch in minutes.
              </p>
            </div>

            {/* 3 Core Pillars */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
              <div className="glass-panel rounded-3xl p-7 text-left space-y-3 border border-white/10 hover:border-[#33C8FF]/50 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-[#33C8FF]/10 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-[#33C8FF]/10 border border-[#33C8FF]/30 flex items-center justify-center text-[#33C8FF] group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-white">AI Vision Engine</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time CCTV feed ingestion with automated hazard identification, confidence scoring, and risk classification across citywide camera networks.
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-7 text-left space-y-3 border border-white/10 hover:border-purple-500/50 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-white">Multi-Agent Orchestrator</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nova coordinates Traffic, Healthcare, Weather, Infrastructure, and Sentinel agents in parallel to generate a conflict-free action blueprint in 4.3 seconds.
                </p>
              </div>

              <div className="glass-panel rounded-3xl p-7 text-left space-y-3 border border-white/10 hover:border-emerald-500/50 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Truck className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-extrabold text-white">Smart Resource Dispatch</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automatically calculates optimal responder teams — Police, Ambulance, Fire tenders — based on real-time traffic corridors and hospital ICU capacity.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            4. CORE CAPABILITIES (FEATURES)
        ══════════════════════════════════════════════════════════════ */}
        <section id="features" className="py-14 md:py-18 border-b border-white/10 font-mono">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#33C8FF]">
                Core Capabilities
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Built for Command Centers. Ready for Real Operations.
              </h3>
              <p className="text-xs text-slate-400">
                Every capability is designed for emergency operations centers and national disaster control rooms.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: Camera,
                  iconColor: 'text-[#33C8FF]',
                  iconBg: 'bg-[#33C8FF]/10 border-[#33C8FF]/30',
                  title: 'AI Vision Engine',
                  desc: 'Continuous ingestion of 12 live CCTV feeds with automated risk classification and confidence scoring.',
                },
                {
                  icon: Zap,
                  iconColor: 'text-rose-400',
                  iconBg: 'bg-rose-500/10 border-rose-500/30',
                  title: 'Emergency Simulator',
                  desc: 'Inject concurrent emergencies — accidents, fires, floods — to test multi-agent decision workflows in real time.',
                },
                {
                  icon: UserCheck,
                  iconColor: 'text-purple-400',
                  iconBg: 'bg-purple-500/10 border-purple-500/30',
                  title: 'Operator Approval System',
                  desc: 'Human-in-the-loop verification console: operators review Nova blueprints and authorize dispatch with one click.',
                },
                {
                  icon: MapPin,
                  iconColor: 'text-emerald-400',
                  iconBg: 'bg-emerald-500/10 border-emerald-500/30',
                  title: 'Singapore Command Map',
                  desc: 'Leaflet satellite map rendering real-time incident markers, responder routes, and active field units.',
                },
                {
                  icon: BookOpen,
                  iconColor: 'text-amber-400',
                  iconBg: 'bg-amber-500/10 border-amber-500/30',
                  title: 'RAG Knowledge Base',
                  desc: 'Semantic retrieval across disaster SOPs, municipal emergency guidelines, and post-incident reports.',
                },
                {
                  icon: BarChart3,
                  iconColor: 'text-cyan-400',
                  iconBg: 'bg-cyan-500/10 border-cyan-500/30',
                  title: 'Operational Analytics',
                  desc: 'Citywide risk breakdown, response time trends, AI accuracy metrics, and agency dispatch analytics.',
                },
              ].map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={idx}
                    className="group glass-panel rounded-3xl p-6 space-y-3 text-left border border-white/10 hover:border-[#33C8FF]/50 hover:shadow-xl hover:shadow-[#33C8FF]/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default"
                  >
                    <div className={`w-10 h-10 rounded-xl ${feature.iconBg} border flex items-center justify-center ${feature.iconColor} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-extrabold text-white">{feature.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{feature.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            5. EMERGENCY SCENARIOS WITH SEVERITY BADGES
        ══════════════════════════════════════════════════════════════ */}
        <section id="scenarios" className="py-14 md:py-18 border-b border-white/10 bg-slate-950/40 font-mono">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#33C8FF]">
                Emergency Coverage
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                6 Supported Emergency Scenarios
              </h3>
              <p className="text-xs text-slate-400">
                Vyraion handles 6 core emergency categories with dedicated AI agent coordination protocols.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {emergencyScenarios.map((scenario, idx) => {
                const Icon = scenario.icon;
                return (
                  <div
                    key={idx}
                    className={`group glass-panel rounded-3xl p-6 text-left space-y-3 border ${scenario.border} ${scenario.glow} hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 cursor-default relative overflow-hidden`}
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl ${scenario.bg} border ${scenario.border} flex items-center justify-center ${scenario.color} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${scenario.badgeStyle}`}>
                        {scenario.severity}
                      </span>
                    </div>

                    <h4 className={`text-base font-extrabold ${scenario.color}`}>{scenario.label}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{scenario.desc}</p>
                    
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Status: <strong className="text-emerald-400">AI Monitored</strong></span>
                      <span>Response: <strong className="text-[#33C8FF]">&lt; 5s AI Blueprint</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            6. HOW VYRAION WORKS (6-STEP PIPELINE)
        ══════════════════════════════════════════════════════════════ */}
        <section id="how-it-works" className="py-16 md:py-20 border-b border-white/10 font-mono">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#33C8FF]">
                Operational Workflow
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                How Vyraion Works
              </h3>
              <p className="text-xs text-slate-400">
                A 6-stage autonomous emergency response pipeline from sensor fusion to case resolution.
              </p>
            </div>

            {/* 6-Step Cards — centered with guaranteed 64px margin below */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 lg:gap-4 max-w-7xl mx-auto mb-4 md:mb-6">
              {[
                { step: '01', icon: Eye, label: 'AI Vision Ingest', desc: 'CCTV streams parsed for hazards', color: 'text-[#33C8FF]', ring: 'border-[#33C8FF]/30' },
                { step: '02', icon: Zap, label: 'Risk Analysis', desc: 'Severity & location assessed', color: 'text-amber-400', ring: 'border-amber-500/30' },
                { step: '03', icon: Brain, label: 'Nova AI Planning', desc: '7 agents synthesize blueprint', color: 'text-purple-400', ring: 'border-purple-500/30' },
                { step: '04', icon: UserCheck, label: 'Human Approval', desc: 'Operator authorizes command', color: 'text-amber-300', ring: 'border-amber-500/30' },
                { step: '05', icon: Truck, label: 'Field Dispatch', desc: 'Police, ambulance & fire deployed', color: 'text-emerald-400', ring: 'border-emerald-500/30' },
                { step: '06', icon: CheckCircle2, label: 'Case Closed', desc: 'Archived to Knowledge Base', color: 'text-[#33C8FF]', ring: 'border-[#33C8FF]/30' },
              ].map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div className={`glass-panel w-full rounded-2xl p-4 text-center space-y-2 border ${s.ring} hover:border-[#33C8FF] hover:-translate-y-1 transition-all duration-300 flex-1`}>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900 text-slate-400">
                        Step {s.step}
                      </span>
                      <div className={`w-8 h-8 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center ${s.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight">{s.label}</h4>
                      <p className="text-[10px] text-slate-400 leading-snug">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            7. COMPARISON SECTION (TRADITIONAL VS VYRAION)
        ══════════════════════════════════════════════════════════════ */}
        <section id="why-vyraion" className="py-16 md:py-20 border-b border-white/10 bg-slate-950/40 font-mono">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#33C8FF]">
                Platform Comparison
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Traditional vs. AI Emergency Command
              </h3>
              <p className="text-xs text-slate-400">
                Compare legacy emergency response workflows against Vyraion AI Command Platform.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">

              {/* Traditional Card */}
              <div className="bg-slate-950/80 rounded-3xl p-7 border border-slate-800 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-200">Traditional Response System</h4>
                    <p className="text-[11px] text-slate-500">Manual, Delayed & Fragmented</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-400">
                  <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-300 font-bold">
                    ⚠️ Manual Detection: Relies on 911 calls; delays of 5–15 minutes.
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-300 font-bold">
                    ⚠️ Delayed Dispatch: Guesswork routing without live traffic data.
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-300 font-bold">
                    ⚠️ No Coordination: Agencies operate in siloed radio channels.
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-300 font-bold">
                    ⚠️ Fragmented Agencies: High friction & delayed field decisions.
                  </div>
                </div>
              </div>

              {/* Vyraion AI Card (Glows) */}
              <div className="glass-panel rounded-3xl p-7 border border-[#33C8FF]/40 shadow-xl shadow-[#33C8FF]/10 space-y-5 bg-gradient-to-b from-[#33C8FF]/5 via-[#0C1322] to-slate-950 relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-[#33C8FF] to-blue-600 text-slate-950 text-[9px] font-extrabold uppercase tracking-wider rounded-bl-xl">
                  Vyraion Standard
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#33C8FF]/15 border border-[#33C8FF]/30 flex items-center justify-center text-[#33C8FF]">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-white">Vyraion AI Command Platform</h4>
                    <p className="text-[11px] text-[#33C8FF]">Autonomous, Fast & Coordinated</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs text-slate-200">
                  <div className="p-2.5 rounded-xl bg-[#33C8FF]/10 border border-[#33C8FF]/30 font-bold text-[#33C8FF]">
                    ✅ AI Vision Detection: Automatic CCTV detection in milliseconds.
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#33C8FF]/10 border border-[#33C8FF]/30 font-bold text-[#33C8FF]">
                    ✅ Multi-Agent Coordination: 7 agents generate unified blueprint in 4.3s.
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#33C8FF]/10 border border-[#33C8FF]/30 font-bold text-[#33C8FF]">
                    ✅ Human Approval: Operator authorizes action with single-click review.
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#33C8FF]/10 border border-[#33C8FF]/30 font-bold text-[#33C8FF]">
                    ✅ Optimized Dispatch & Unified Response: Automated agency routing.
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            8. TECHNOLOGY STACK
        ══════════════════════════════════════════════════════════════ */}
        <section id="tech-stack" className="py-14 md:py-18 border-b border-white/10 font-mono">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#33C8FF]">
                Technology Architecture
              </h2>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Powered by Modern AI & Cloud Tech
              </h3>
              <p className="text-xs text-slate-400">
                Built on high-performance frameworks designed for real-time sensor fusion and multi-agent AI.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {techStack.map((tech, idx) => (
                <div
                  key={idx}
                  className={`group glass-panel rounded-2xl p-4 text-center border ${tech.border} ${tech.glow} hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300 cursor-default`}
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">
                    {tech.icon}
                  </div>
                  <p className={`text-xs font-extrabold ${tech.color}`}>{tech.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            9. CALL TO ACTION
        ══════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-20 border-b border-white/10 bg-slate-950/80 relative overflow-hidden font-mono">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5 relative">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-xs font-bold text-rose-400">
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-400" />
              <span>SMART CITY DISASTER & EMERGENCY CONTROL OS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Experience
              <br />
              <span className="text-[#33C8FF]">AI Emergency Response?</span>
            </h2>

            <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              See how Vyraion detects emergencies, coordinates multiple AI agents, and assists operators in real time.
            </p>

            <div className="pt-3 flex flex-wrap justify-center items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="group px-7 py-3.5 rounded-xl font-extrabold bg-gradient-to-r from-[#33C8FF] to-blue-600 hover:from-[#33C8FF] hover:to-blue-500 text-slate-950 shadow-lg shadow-[#33C8FF]/25 hover:shadow-[#33C8FF]/45 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                <span>Launch Live Demo</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('/login')}
                className="px-7 py-3.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer shadow-md"
              >
                Sign In
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            10. FOOTER
        ══════════════════════════════════════════════════════════════ */}
        <footer className="py-8 bg-slate-950 font-mono text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/10 pb-6">
              
              {/* Logo & Copyright */}
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#33C8FF] to-purple-600 flex items-center justify-center text-slate-950 font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-white text-sm">Vyraion</span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-400">Built for Smart Cities • AI-Powered</span>
              </div>

              {/* Version & Hackathon Badges (Cleaned up, no Sparkles / Built with AI) */}
              <div className="flex items-center gap-3 text-[11px]">
                <span className="px-2.5 py-0.5 rounded border border-slate-800 bg-slate-900 text-slate-300 font-bold">
                  Hackathon 2026
                </span>
                <span className="px-2.5 py-0.5 rounded border border-slate-800 bg-slate-900 text-[#33C8FF] font-bold">
                  v1.0.0
                </span>
              </div>

            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
              <p>© 2026 Vyraion Decision Intelligence Platform. All rights reserved.</p>
              <p>National Emergency Operations AI Architecture.</p>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
