import React, { useState, useEffect } from 'react';
import { Shield, Play, Menu, X, Sparkles, LogOut, Terminal } from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  onOpenDemo: (initialTab?: 'simulation' | 'audit' | 'policy' | 'tokens') => void;
  onOpenLogin: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
  currentUser?: UserSession | null;
  onSwitchRole?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenDemo, 
  onOpenLogin,
  reducedMotion, 
  onToggleReducedMotion,
  currentUser,
  onSwitchRole 
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Architecture', href: '#interactive-architecture' },
    { label: 'Pillars', href: '#security-pillars' },
    { label: 'Cascade', href: '#detection-cascade' },
    { label: 'Policy', href: '#policy-engine' },
    { label: 'Scenarios', href: '#attack-scenarios' },
    { label: 'SDK', href: '#developer-sdk' },
  ];

  return (
    <header
      id="main-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)] py-2.5'
          : 'bg-transparent border-b border-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-indigo-600 p-[1px] shadow-md shadow-teal-500/20">
            <div className="w-full h-full bg-[#020617] rounded-[11px] flex items-center justify-center transition-colors group-hover:bg-slate-900">
              <Shield className="w-4 h-4 text-teal-300" />
            </div>
          </div>
          <span className="font-display font-black text-lg tracking-wider text-white">KYRON</span>
        </a>

        {/* Minimal Navigation Links */}
        <nav className="hidden md:flex items-center gap-5">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs text-slate-400 hover:text-teal-300 transition-colors font-mono uppercase tracking-wider"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          {/* User Session Switch / Sign In Button */}
          {currentUser ? (
            <button
              type="button"
              onClick={onSwitchRole}
              className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-teal-400 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Click to switch role or sign out"
            >
              <span className="text-xs">{currentUser.badge}</span>
              <span className="font-bold text-teal-300">{currentUser.name}</span>
              <LogOut className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenLogin}
              className="text-xs font-mono px-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Primary Action */}
          <button
            id="nav-view-demo-btn"
            type="button"
            onClick={() => currentUser ? onOpenDemo('simulation') : onOpenLogin()}
            className="flex items-center gap-2 text-xs font-mono font-bold px-4 py-2 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white hover:opacity-95 transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{currentUser ? 'Dashboard' : 'Launch Console'}</span>
          </button>
        </div>

        {/* Mobile Toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenDemo('simulation')}
            className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30"
          >
            Console
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-xl text-slate-300 border border-white/10 bg-white/5"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Minimal Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden mt-2 px-4 py-3 bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 flex flex-col gap-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 text-xs text-slate-300 hover:text-teal-400 font-mono"
            >
              {link.label}
            </a>
          ))}
          {currentUser ? (
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); if (onSwitchRole) onSwitchRole(); }}
              className="text-left py-1.5 text-xs font-mono text-rose-400"
            >
              Sign Out ({currentUser.name})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setMobileMenuOpen(false); onOpenLogin(); }}
              className="text-left py-1.5 text-xs font-mono text-teal-300"
            >
              Sign In to Console →
            </button>
          )}
        </div>
      )}
    </header>
  );
};



