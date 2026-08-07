import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Lock, Mail, User, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      await register(name, email, password);
      // Navigate to login with registered banner
      navigate('/login', { state: { registered: true, email } });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your information.');
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

      {/* Main Register Card */}
      <div className="w-full max-w-md glass-card rounded-2xl p-8 sm:p-10 shadow-2xl border border-slate-800 animate-fade-in">
        
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group justify-center mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-0.5 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-sky-400" />
              </div>
            </div>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create Your Account
          </h1>
          <p className="text-xs text-slate-400">
            Start monitoring operational intelligence with Vyraion
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name Field */}
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Work Email Field */}
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-colors"
              />
            </div>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-center text-xs text-slate-400">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500/40 focus:ring-offset-0 cursor-pointer"
              />
              <span>I agree to the Terms of Service & Privacy Policy</span>
            </label>
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Sign In Link Footer */}
          <div className="pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400 space-x-1">
            <span>Already have an account?</span>
            <Link
              to="/login"
              className="text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1 transition-all duration-200 hover:translate-x-0.5 group"
            >
              <span>Sign in</span>
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
}
