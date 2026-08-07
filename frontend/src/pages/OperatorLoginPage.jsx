import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function OperatorLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [operatorId, setOperatorId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActiveSessionModal, setShowActiveSessionModal] = useState(false);

  // Check if operator was evicted from another session
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('evicted') === 'true') {
      setErrorMessage('Your session was terminated because another device has logged in.');
    }
  }, [location]);

  const handleSubmit = async (e, force = false) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await login(operatorId, password, force);
      if (res && res.sessionActive) {
        setShowActiveSessionModal(true);
        return;
      }
      // Ensure the logged-in user is an operator
      if (res && res.user && res.user.role !== 'operator') {
        throw new Error('Access Denied - Operator credentials required.');
      }
      setShowActiveSessionModal(false);
      navigate('/operator', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to sign in. Please verify your operator credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForceLogin = () => {
    handleSubmit(null, true);
  };

  const handleCancelConflict = () => {
    setShowActiveSessionModal(false);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen saas-grid-bg text-slate-100 flex flex-col justify-center items-center px-4 py-12 selection:bg-amber-500/30 selection:text-amber-200 relative">
      
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

      {/* Main Login Card */}
      <div className="w-full max-w-md glass-card rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-850 animate-fade-in bg-slate-950/80">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center gap-2.5 group justify-center mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-650 p-0.5 shadow-md shadow-amber-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white font-mono uppercase">
            🛡 Operator Console
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to access your Mobile-First dispatcher terminal
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
          {/* Operator Email Field */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Operator Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                placeholder="operator@vyraion.ai"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-200"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Operator Sign In</span>
            )}
          </button>
        </form>

        {/* Demo Accounts Panel */}
        <div className="mt-8 pt-6 border-t border-slate-900 text-left font-mono text-[10px] text-slate-500 space-y-1">
          <p className="text-slate-400 font-bold uppercase tracking-wider mb-1.5 text-[9px]">Demo Operator Account:</p>
          <div className="bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-xl space-y-1 text-slate-400">
            <p>EMAIL: <strong className="text-amber-400">operator@vyraion.ai</strong></p>
            <p>PASS: <strong className="text-slate-200">Dispatch@2026</strong></p>
          </div>
        </div>
      </div>

      {/* ⚠️ CONFLICTING SESSION MODAL */}
      {showActiveSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-mono">
          <div className="max-w-md w-full glass-panel border border-amber-500/30 rounded-3xl p-6 space-y-5 text-center bg-slate-950">
            <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">Operator Session Active</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                An active dispatcher session is currently running on another device.
              </p>
            </div>

            <div className="p-3 bg-amber-500/5 border border-amber-500/10 text-amber-200 text-center text-xs rounded-xl font-semibold">
              "Operator session already active."
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleForceLogin}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all cursor-pointer uppercase"
              >
                Force Login
              </button>
              <button
                onClick={handleCancelConflict}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 text-xs font-semibold transition-all cursor-pointer uppercase"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
