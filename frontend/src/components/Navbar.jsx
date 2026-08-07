import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Menu, X } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 transition-all font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#33C8FF] to-[#7C5CFF] p-0.5 shadow-md shadow-[#33C8FF]/20 group-hover:scale-105 transition-transform duration-200">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#33C8FF]" />
            </div>
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-[#33C8FF] transition-colors">
            Vyraion
          </span>
        </Link>

        {/* Center: Navigation Links with Smooth Underline Hover (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300 font-mono">
          {[
            { label: 'Platform', href: '#features' },
            { label: 'Emergency Types', href: '#scenarios' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Technology', href: '#tech-stack' }
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              className="relative group py-1 hover:text-white transition-colors duration-200"
            >
              <span>{item.label}</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#33C8FF] to-[#7C5CFF] group-hover:w-full transition-all duration-300 rounded-full" />
            </a>
          ))}
        </nav>

        {/* Right: Dual Actions (Desktop) */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-medium rounded-xl text-slate-200 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all duration-200 cursor-pointer font-mono"
          >
            Sign In
          </button>

          <button
            onClick={() => navigate('/register')}
            className="px-4.5 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-[#33C8FF] to-blue-600 hover:from-[#33C8FF] hover:to-blue-500 text-slate-950 shadow-md shadow-[#33C8FF]/20 hover:shadow-[#33C8FF]/35 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-1.5 cursor-pointer font-mono"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Menu Toggle Button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-slate-800 px-4 pt-3 pb-6 space-y-4 animate-fade-in font-mono">
          <nav className="flex flex-col space-y-3 text-sm font-medium text-slate-300">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">
              Platform
            </a>
            <a href="#scenarios" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">
              Emergency Types
            </a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">
              How It Works
            </a>
            <a href="#tech-stack" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">
              Technology
            </a>
          </nav>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/login');
              }}
              className="w-full py-2.5 text-sm font-medium rounded-xl text-slate-200 bg-slate-900 border border-slate-800 text-center"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/register');
              }}
              className="w-full py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-[#33C8FF] to-blue-600 text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-[#33C8FF]/20"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
