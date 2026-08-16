import React from 'react';
import { Lock, Check, X, Shield, Folder, Globe, Timer, Ban } from 'lucide-react';

export const PolicyEngine: React.FC = () => {
  return (
    <section id="policy-engine" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">DETECTION IS NOT AUTHORIZATION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
            Even a "safe" action can be forbidden.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
            Kyron maintains a deterministic policy layer that evaluates what the agent is actually authorized to do, regardless of how friendly the prompt appears or how confident the model sounds.
          </p>
        </div>

        {/* 4 Policy Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Policy 01: Path Control */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 flex flex-col justify-between hover:bg-white/10 hover:border-white/20 transition-all shadow-lg">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-3">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Folder className="w-3.5 h-3.5 text-teal-400" />
                  PATH CONTROL
                </span>
                <span className="text-white font-bold">01</span>
              </div>
              <h3 className="text-lg font-display font-semibold text-white">Filesystem Sandboxing</h3>
              <p className="text-xs text-slate-400 mt-2 mb-4">
                Restrict write/read operations strictly to safe sub-directories.
              </p>
              
              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-white/10 font-mono text-xs backdrop-blur-sm">
                <div className="text-[10px] text-slate-400 uppercase">write_file()</div>
                <div className="flex items-center justify-between text-teal-400">
                  <span>/sandbox/*</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between text-teal-400">
                  <span>/tmp/*</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between text-rose-400 font-bold border-t border-white/10 pt-1">
                  <span>/etc/passwd</span>
                  <X className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">
              Strict prefix matching
            </div>
          </div>

          {/* Policy 02: Domain Control */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 flex flex-col justify-between hover:bg-white/10 hover:border-white/20 transition-all shadow-lg">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-3">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Globe className="w-3.5 h-3.5 text-teal-400" />
                  DOMAIN CONTROL
                </span>
                <span className="text-white font-bold">02</span>
              </div>
              <h3 className="text-lg font-display font-semibold text-white">Outbound Allowlist</h3>
              <p className="text-xs text-slate-400 mt-2 mb-4">
                Enforce authorized host destinations for HTTP calls and API webhooks.
              </p>
              
              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-white/10 font-mono text-xs backdrop-blur-sm">
                <div className="text-[10px] text-slate-400 uppercase">call_http()</div>
                <div className="flex items-center justify-between text-teal-400">
                  <span>api.company.com</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between text-teal-400">
                  <span>trusted.io</span>
                  <Check className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center justify-between text-rose-400 font-bold border-t border-white/10 pt-1">
                  <span>attacker.com</span>
                  <X className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">
              Prevents data exfiltration
            </div>
          </div>

          {/* Policy 03: Session Limits */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 flex flex-col justify-between hover:bg-white/10 hover:border-white/20 transition-all shadow-lg">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-3">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Timer className="w-3.5 h-3.5 text-teal-400" />
                  SESSION LIMITS
                </span>
                <span className="text-white font-bold">03</span>
              </div>
              <h3 className="text-lg font-display font-semibold text-white">Call Rate Budgets</h3>
              <p className="text-xs text-slate-400 mt-2 mb-4">
                Throttle infinite loops and recursive autonomous task spawns.
              </p>
              
              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-white/10 font-mono text-xs backdrop-blur-sm">
                <div className="text-[10px] text-slate-400 uppercase">TOOL INVOCATIONS (MAX 5)</div>
                <div className="grid grid-cols-6 gap-1 text-center font-bold">
                  <div className="p-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">01✓</div>
                  <div className="p-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">02✓</div>
                  <div className="p-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">03✓</div>
                  <div className="p-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">04✓</div>
                  <div className="p-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">05✓</div>
                  <div className="p-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">06✕</div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">
              Throttles runaway loops
            </div>
          </div>

          {/* Policy 04: Default Deny */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 flex flex-col justify-between hover:bg-white/10 hover:border-white/20 transition-all shadow-lg">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-3">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Ban className="w-3.5 h-3.5 text-teal-400" />
                  DEFAULT DENY
                </span>
                <span className="text-white font-bold">04</span>
              </div>
              <h3 className="text-lg font-display font-semibold text-white">Zero Trust Stance</h3>
              <p className="text-xs text-slate-400 mt-2 mb-4">
                Any unregistered tool, wildcard argument, or unmapped action is rejected.
              </p>
              
              <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-white/10 font-mono text-xs backdrop-blur-sm">
                <div className="text-[10px] text-slate-400 uppercase">UNKNOWN ACTION</div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>UNKNOWN TOOL</span>
                  <span>→ NO POLICY</span>
                </div>
                <div className="flex items-center justify-between text-rose-400 font-bold border-t border-white/10 pt-1">
                  <span>OUTCOME:</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">DENY</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">
              Strict zero-trust baseline
            </div>
          </div>

        </div>

        {/* Strong Architectural Affirmation */}
        <div className="mt-12 text-center py-8 px-6 rounded-2xl bg-white/5 border border-teal-500/30 backdrop-blur-xl shadow-lg shadow-teal-500/10">
          <div className="text-xs font-mono tracking-widest text-teal-400 uppercase mb-2 font-semibold">Core Axiom</div>
          <div className="text-2xl sm:text-4xl font-display font-extrabold text-white">
            Policy can override the model.
          </div>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
            Regardless of LLM confidence scores or prompt engineering nuances, hard deterministic rules establish unconditional execution boundaries.
          </p>
        </div>

      </div>
    </section>
  );
};
