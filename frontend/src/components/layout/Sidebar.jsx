import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  BarChart3,
  FileSpreadsheet,
  Activity
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      badge: 'Live',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      name: 'Dataset Generator',
      path: '/dataset',
      icon: FileSpreadsheet,
      badge: 'Atlas',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      name: 'Knowledge Base',
      path: '/knowledge',
      icon: Database,
      badge: 'RAG',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: BarChart3,
      badge: 'Telemetry',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    }
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#0B101D]/90 backdrop-blur-2xl border-r border-white/10 flex flex-col justify-between h-screen sticky top-0 z-40 select-none">
      
      {/* Top Header & Brand */}
      <div className="p-5 space-y-6">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#33C8FF] to-[#7C5CFF] p-0.5 shadow-lg shadow-[#33C8FF]/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-[#070B14] rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#33C8FF]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-white group-hover:text-[#33C8FF] transition-colors">
                Vyraion
              </span>
              <span className="text-[10px] font-mono font-bold text-[#33C8FF] bg-[#33C8FF]/10 px-1.5 py-0.5 rounded border border-[#33C8FF]/20">
                OS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Neural Ops v1.0.0</p>
          </div>
        </NavLink>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/');

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                  isActive
                    ? 'bg-[#33C8FF]/15 text-[#33C8FF] border border-[#33C8FF]/30 shadow-md shadow-[#33C8FF]/10'
                    : 'text-[#94A3B8] hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-[#33C8FF]' : 'text-slate-400 group-hover:text-white'}`} />
                  <span>{item.name}</span>
                </div>

                {item.badge && (
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Footer */}
      <div className="p-4 m-3 rounded-2xl bg-[#111827]/80 border border-white/10 space-y-3">
        
        {/* Core Status */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="font-semibold text-slate-200 text-[11px]">AI Engine Active</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">99.9%</span>
        </div>

        {/* Workspace */}
        <div className="pt-2 border-t border-white/5 space-y-1 text-[10px]">
          <div className="flex items-center justify-between text-slate-400">
            <span>Workspace</span>
            <span className="text-slate-200 font-semibold">Production</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Vector Index</span>
            <span className="text-[#33C8FF] font-mono font-semibold">ChromaDB</span>
          </div>
        </div>

      </div>

    </aside>
  );
}
