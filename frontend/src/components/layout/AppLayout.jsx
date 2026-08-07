import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from '../common/ErrorBoundary';
import NeuralNetworkBackground from '../common/NeuralNetworkBackground';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

export default function AppLayout() {
  const { isDemoMode } = useAuth();

  return (
    <div className="min-h-screen relative text-slate-100 flex flex-col font-sans selection:bg-[#33C8FF]/30 selection:text-[#33C8FF] overflow-x-hidden">
      
      {/* 🌌 GPU-ACCELERATED NEURAL NETWORK BACKGROUND */}
      <NeuralNetworkBackground />

      {/* Persistent Demo Mode Banner */}
      {isDemoMode && (
        <div className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-1.5 font-mono text-xs font-bold flex items-center justify-center gap-2 shadow-md z-[100] border-b border-amber-400/40 shrink-0 animate-fade-in relative">
          <AlertTriangle className="w-4 h-4 text-slate-950 animate-pulse shrink-0" />
          <span>⚠ Demo Mode — backend unreachable, using local session</span>
        </div>
      )}

      <div className="flex-1 flex min-w-0 relative z-10">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* Top Header */}
          <Header />

          {/* Usable Main Viewport (1800px max usable width) */}
          <main className="flex-1 w-full max-usable-width py-8 space-y-8 animate-fade-in">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>

        </div>
      </div>

    </div>
  );
}
