import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Shield, Car, Hospital, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setDemoUserRole } = useAuth();
  const { setViewRole } = useViewRole();

  const handleDepartmentSelect = (targetRole) => {
    setViewRole(targetRole);
    setDemoUserRole(targetRole);

    if (targetRole === 'authority') {
      navigate('/authority', { replace: true });
    } else if (targetRole === 'hospital') {
      navigate('/hospital', { replace: true });
    } else if (targetRole === 'operator') {
      navigate('/operator', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen saas-grid-bg text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-sky-500/30 selection:text-sky-200 relative">
      
      {/* Top Navigation Back Link */}
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors duration-200 bg-slate-900/70 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-800 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Main Entry Container */}
      <div className="w-full max-w-4xl space-y-8 animate-fade-in my-auto">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <Link to="/" className="inline-flex items-center gap-2.5 group justify-center mb-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Activity className="w-6 h-6 text-sky-400" />
              </div>
            </div>
          </Link>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
            VYRAION OS
          </h1>
          <p className="text-sm font-semibold text-sky-400 tracking-wide">
            Autonomous Emergency Operations Platform
          </p>
          <p className="text-xs text-slate-400 font-mono pt-1">
            Select an operational environment to continue
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="max-w-xl mx-auto p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 3 Department Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">

          {/* 1. ADMIN CARD */}
          <div className="glass-card rounded-2xl p-6 border border-amber-500/30 bg-slate-950/80 hover:border-amber-500/60 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white tracking-wide font-mono flex items-center gap-2">
                  <span>🛡️ ADMIN</span>
                </h2>
                <p className="text-xs text-amber-300 font-medium">
                  Full Emergency Operations Command
                </p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Unrestricted command center access across all active incidents, satellite GIS feeds, AI decision synthesis, dataset generator, and system settings.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleDepartmentSelect('admin')}
              className="w-full py-3 px-4 rounded-xl font-bold font-mono text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ENTER ADMIN CONSOLE</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 2. POLICE / FIRE CARD */}
          <div className="glass-card rounded-2xl p-6 border border-blue-500/30 bg-slate-950/80 hover:border-blue-500/60 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Car className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white tracking-wide font-mono flex items-center gap-2">
                  <span>🚓 POLICE / FIRE</span>
                </h2>
                <p className="text-xs text-blue-300 font-medium">
                  Police, traffic, fire and field response operations
                </p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Public safety dispatch terminal for traffic collisions, hazmat emergencies, road corridor clearances, and fire engine field response fleet management.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleDepartmentSelect('authority')}
              className="w-full py-3 px-4 rounded-xl font-bold font-mono text-xs bg-blue-500 hover:bg-blue-400 text-slate-950 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ENTER POLICE / FIRE</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3. HOSPITAL CARD */}
          <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-slate-950/80 hover:border-emerald-500/60 transition-all duration-300 shadow-xl flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Hospital className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-white tracking-wide font-mono flex items-center gap-2">
                  <span>🏥 HOSPITAL</span>
                </h2>
                <p className="text-xs text-emerald-300 font-medium">
                  Hospital, patient and medical emergency coordination
                </p>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Trauma center operational dashboard tracking mass casualty triage, ALS ambulance fleet routing, hospital ICU bed readiness, and emergency room handoffs.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleDepartmentSelect('hospital')}
              className="w-full py-3 px-4 rounded-xl font-bold font-mono text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>ENTER HOSPITAL</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Footer info notice */}
        <div className="text-center pt-4">
          <p className="text-[11px] text-slate-500 font-mono">
            VYRAION OS Multi-Department Demonstration System • Zero Authentication Required
          </p>
        </div>

      </div>

    </div>
  );
}
