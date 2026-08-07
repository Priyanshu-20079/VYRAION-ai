import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  ShieldCheck,
  Cpu,
  Zap,
  PieChart,
  Layers,
  AlertTriangle
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

export default function AnalyticsPage() {
  const accuracyData = [
    { day: 'Mon', accuracy: 91, predictions: 42 },
    { day: 'Tue', accuracy: 93, predictions: 58 },
    { day: 'Wed', accuracy: 92, predictions: 61 },
    { day: 'Thu', accuracy: 95, predictions: 49 },
    { day: 'Fri', accuracy: 94, predictions: 55 },
    { day: 'Sat', accuracy: 96, predictions: 38 },
    { day: 'Sun', accuracy: 97, predictions: 40 }
  ];

  // Emergency incident risk distribution sorted from highest to lowest
  const riskDistribution = [
    { category: 'Traffic Accident', count: 18, fill: '#EF4444' },
    { category: 'Fire Outbreak', count: 14, fill: '#F59E0B' },
    { category: 'Medical Emergency', count: 11, fill: '#33C8FF' },
    { category: 'Power Grid Failure', count: 9, fill: '#7C5CFF' },
    { category: 'Hazardous Material', count: 7, fill: '#EC4899' },
    { category: 'Heavy Rain', count: 6, fill: '#10B981' },
    { category: 'Industrial Gas Leak', count: 5, fill: '#3B82F6' },
    { category: 'Hospital Power Failure', count: 4, fill: '#8B5CF6' }
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-[#0C1220] to-slate-950">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#33C8FF]/10 border border-[#33C8FF]/20 text-[#33C8FF] text-xs font-mono font-bold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>EMERGENCY TELEMETRY & ANALYTICS</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Citywide Incident Analytics & Prediction Metrics
          </h1>
          <p className="text-sm text-slate-400">
            Emergency response performance, detection accuracy trends, and risk distribution analysis.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-md">
            <span className="text-slate-400 block text-[10px]">Avg Accuracy</span>
            <span className="text-emerald-400 font-bold text-sm">94.8%</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center shadow-md">
            <span className="text-slate-400 block text-[10px]">Weekly Telemetry</span>
            <span className="text-[#33C8FF] font-bold text-sm">343k Events</span>
          </div>
        </div>
      </div>

      {/* 2 Big Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-mono">
        
        {/* Prediction Accuracy Trend (Area Chart) */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-slate-950/80">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Prediction Accuracy Trend (Weekly)
              </h2>
              <p className="text-xs text-slate-400">Model accuracy percentage over rolling 7 days</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 font-bold">
              94.8% Mean
            </span>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={accuracyData}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[80, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="accuracy" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#accGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Breakdown (Emergency Incident Bar Chart) */}
        <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-white/10 space-y-4 bg-slate-950/80">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#7C5CFF]" />
              Risk Category Breakdown
            </h2>
            <p className="text-xs text-slate-400">
              Distribution of emergency incidents detected across the city.
            </p>
          </div>

          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution} layout="vertical" margin={{ top: 5, right: 35, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis type="category" dataKey="category" stroke="#94A3B8" fontSize={11} tickLine={false} width={145} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} isAnimationActive={true} animationDuration={1000}>
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="count" position="right" fill="#CBD5E1" fontSize={11} fontWeight="bold" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
