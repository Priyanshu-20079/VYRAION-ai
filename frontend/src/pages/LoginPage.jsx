import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, ArrowLeft, Lock, Mail, ChevronRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (location.state?.registered) {
      if (location.state?.email) {
        setEmail(location.state.email);
      }
      setSuccessMessage('Account created successfully! Please sign in to continue.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res && res.user && res.user.role === 'operator') {
        navigate('/operator', { replace: true });
      } else if (res && res.user && res.user.role === 'authority') {
        navigate('/authority', { replace: true });
      } else if (res && res.user && res.user.role === 'hospital') {
        navigate('/hospital', { replace: true });
      } else {
        const destination = location.state?.from?.pathname || '/dashboard';
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
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

      {/* Main Login Card */}
      <div className="w-full max-w-md glass-card rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-800 animate-fade-in">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-6">
          <Link to="/" className="inline-flex items-center gap-2.5 group justify-center mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-sky-400" />
              </div>
            </div>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-400">
            Sign in to access your Operational Intelligence dashboard
          </p>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Work Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 text-slate-400 hover:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500/40 focus:ring-offset-0 cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <a
              href="#forgot"
              onClick={(e) => e.preventDefault()}
              className="text-sky-400 hover:text-sky-300 hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl font-semibold bg-sky-500 hover:bg-sky-400 disabled:bg-sky-500/50 text-slate-950 transition-all duration-200 hover:shadow-lg hover:shadow-sky-500/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Create Account Link Footer */}
          <div className="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400 space-x-1">
            <span>Don't have an account?</span>
            <Link
              to="/register"
              className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1 transition-all duration-200 hover:translate-x-0.5 group"
            >
              <span>Create one</span>
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </form>

        {/* DEMO LOGIN CREDENTIALS SECTION */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 space-y-3 font-mono">
          <div className="text-center space-y-1">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
              <span>🔑 DEMO LOGIN CREDENTIALS</span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Click a button to populate credentials into the form above:
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setEmail('admin@vyraion.demo'); setPassword('demo123'); }}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-all cursor-pointer text-center space-y-0.5"
            >
              <div>👑 Admin Demo</div>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('police@vyraion.demo'); setPassword('demo123'); }}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-blue-500/30 text-blue-300 text-[11px] font-bold transition-all cursor-pointer text-center space-y-0.5"
            >
              <div>👮 Police Demo</div>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('hospital@vyraion.demo'); setPassword('demo123'); }}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-all cursor-pointer text-center space-y-0.5"
            >
              <div>🏥 Hospital Demo</div>
            </button>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-[10px] text-slate-300 space-y-1.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-amber-400 font-bold">Administrator</span>
              <span>Email: <code>admin@vyraion.demo</code> | Pass: <code>demo123</code></span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/60 pt-1">
              <span className="text-blue-400 font-bold">Police / Fire</span>
              <span>Email: <code>police@vyraion.demo</code> | Pass: <code>demo123</code></span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/60 pt-1">
              <span className="text-emerald-400 font-bold">Hospital Dept</span>
              <span>Email: <code>hospital@vyraion.demo</code> | Pass: <code>demo123</code></span>
            </div>
          </div>
        </div>

      </div>


    </div>
  );
}
