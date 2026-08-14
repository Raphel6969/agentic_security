import React, { useEffect, useState } from 'react';
import { Shield, Zap, Radio, Database, Sliders, Activity, Lock, AlertTriangle, CheckCircle } from 'lucide-react';
import ParticleBackground from './components/ParticleBackground';
import AttackSimulator from './components/AttackSimulator';
import TelemetryFeed from './components/TelemetryFeed';
import AuditExplorer from './components/AuditExplorer';
import PolicyManager from './components/PolicyManager';

export default function App() {
  const [activeTab, setActiveTab] = useState('simulator');
  const [stats, setStats] = useState({
    total_screened: 0,
    blocked: 0,
    allowed: 0,
    requires_approval: 0,
    average_risk_score: 0.0,
    block_rate: 0.0,
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/events/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Interactive Particle Canvas */}
      <ParticleBackground />

      {/* Floating Glass Header Navbar */}
      <header className="sticky top-0 z-50 px-4 py-4 max-w-7xl mx-auto w-full">
        <div className="bezel-shell">
          <div className="bezel-core flex items-center justify-between py-3 px-6">
            {/* Brand Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(255,46,85,0.3)]">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  SENTINEL LAYER
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    SOC CONTROL ROOM
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Agentic AI Security & Runtime Threat Firewall</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-black/40 p-1.5 rounded-full border border-white/10">
              <button
                onClick={() => setActiveTab('simulator')}
                className={`btn-press px-4 py-2 rounded-full text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'simulator'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                Attack Simulator
              </button>

              <button
                onClick={() => setActiveTab('telemetry')}
                className={`btn-press px-4 py-2 rounded-full text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'telemetry'
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                Live Telemetry
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`btn-press px-4 py-2 rounded-full text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'audit'
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Audit Logs
              </button>

              <button
                onClick={() => setActiveTab('policy')}
                className={`btn-press px-4 py-2 rounded-full text-xs font-mono font-bold flex items-center gap-2 transition-all ${
                  activeTab === 'policy'
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Policy Engine
              </button>
            </nav>

            {/* Connection Status Badge */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(0,245,160,0.8)] animate-pulse" />
              <span className="hidden sm:inline text-slate-300 font-bold">SYSTEM ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden px-4 mb-4">
        <div className="grid grid-cols-2 gap-2 bg-black/60 p-2 rounded-xl border border-white/10 font-mono text-xs">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`p-2 rounded-lg text-center font-bold ${activeTab === 'simulator' ? 'bg-rose-500 text-white' : 'text-slate-400'}`}
          >
            Attack Simulator
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`p-2 rounded-lg text-center font-bold ${activeTab === 'telemetry' ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}
          >
            Live Telemetry
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`p-2 rounded-lg text-center font-bold ${activeTab === 'audit' ? 'bg-emerald-500 text-black' : 'text-slate-400'}`}
          >
            Audit Logs
          </button>
          <button
            onClick={() => setActiveTab('policy')}
            className={`p-2 rounded-lg text-center font-bold ${activeTab === 'policy' ? 'bg-amber-500 text-black' : 'text-slate-400'}`}
          >
            Policy Engine
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 pb-12 z-10 space-y-8">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bezel-shell">
            <div className="bezel-core flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Total Screened</span>
                <div className="text-2xl font-extrabold font-mono text-white mt-1">{stats.total_screened}</div>
              </div>
              <Activity className="w-8 h-8 text-indigo-400/60" />
            </div>
          </div>

          <div className="bezel-shell">
            <div className="bezel-core flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Hard Blocks</span>
                <div className="text-2xl font-extrabold font-mono text-rose-400 mt-1">{stats.blocked}</div>
              </div>
              <Lock className="w-8 h-8 text-rose-500/60" />
            </div>
          </div>

          <div className="bezel-shell">
            <div className="bezel-core flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Clean Passes</span>
                <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">{stats.allowed}</div>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500/60" />
            </div>
          </div>

          <div className="bezel-shell">
            <div className="bezel-core flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Avg Risk Score</span>
                <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1">{stats.average_risk_score.toFixed(2)}</div>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500/60" />
            </div>
          </div>
        </div>

        {/* Tab Components */}
        {activeTab === 'simulator' && <AttackSimulator onRunScenario={fetchStats} />}
        {activeTab === 'telemetry' && <TelemetryFeed />}
        {activeTab === 'audit' && <AuditExplorer />}
        {activeTab === 'policy' && <PolicyManager />}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 py-6 px-4 text-center font-mono text-xs text-slate-500 z-10">
        <p>Sentinel Layer v0.1.0 — Runtime Firewall for Agentic Security. Built with 3-Stage Cascade & Policy Engine.</p>
      </footer>
    </div>
  );
}
