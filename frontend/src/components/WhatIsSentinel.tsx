import React from 'react';
import { Shield, Lock, Eye, Check, X, Sliders, ArrowRight } from 'lucide-react';

export const WhatIsSentinel: React.FC = () => {
  return (
    <section id="what-is-sentinel" className="py-20 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent bg-tech-dots">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-3 border border-teal-500/20 backdrop-blur-md">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">THE SECURITY CORE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
            A runtime firewall between intent and action.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
            Kyron intercepts every proposed agent action, validates it through two complementary layers, and enforces one definitive verdict:
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold">ALLOW</span>
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">REQUIRE APPROVAL</span>
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">BLOCK</span>
          </div>
        </div>

        {/* Visual Split Dichotomy */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Left: Probabilistic ML Detection */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all relative shadow-lg">
            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <Eye className="w-4 h-4 text-teal-400" />
                  LAYER 01 : DETECTION
                </span>
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-bold">PROBABILISTIC ML</span>
              </div>
              <h3 className="text-xl font-display font-bold text-white">
                Multi-Tier Signal Cascade
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Extracts threat vectors via regex signatures, semantic embeddings, and selective LLM arbitration.
              </p>
            </div>

            <div className="mt-6 space-y-2 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono">
                <span className="text-slate-200">Regex Rule Signatures</span>
                <span className="text-teal-400 font-bold">18 Rules (&lt;0.5ms)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono">
                <span className="text-slate-200">Quantized Vector Embeddings</span>
                <span className="text-indigo-300 font-bold">all-MiniLM (&lt;2ms)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono">
                <span className="text-slate-200">Selective LLM Reasoning</span>
                <span className="text-amber-300 font-bold">Groq Llama-3.1 Instant</span>
              </div>
            </div>
          </div>

          {/* Right: Deterministic Hard Policy */}
          <div className="rounded-2xl bg-white/5 border border-teal-500/30 backdrop-blur-xl p-6 sm:p-7 flex flex-col justify-between relative shadow-lg shadow-teal-500/10 hover:border-teal-400 transition-all">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-200 mb-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <Lock className="w-4 h-4 text-teal-400" />
                  LAYER 02 : AUTHORIZATION
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-[10px] font-bold">HARD BOUNDARY</span>
              </div>
              <h3 className="text-xl font-display font-bold text-white">
                Deterministic Policy Engine
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                Enforces path sandboxing, domain allowlists, and execution rate budgets with zero LLM hallucination risk.
              </p>
            </div>

            <div className="mt-6 space-y-2 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono">
                <span className="text-slate-200">Filesystem Sandboxing</span>
                <span className="text-teal-400 font-bold">/sandbox/*, /tmp/*</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono">
                <span className="text-slate-200">Egress Domain Allowlists</span>
                <span className="text-teal-400 font-bold">api.stripe.com</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono">
                <span className="text-slate-200">Default Deny Security Guard</span>
                <span className="text-indigo-300 font-bold">Zero Privilege Drift</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

