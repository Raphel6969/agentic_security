import React from 'react';
import { Mail, Globe, FileText, Terminal, Database, Send, AlertOctagon, ShieldAlert, Cpu, ArrowRight, Activity } from 'lucide-react';

export const AttackSurface: React.FC = () => {
  return (
    <section id="attack-surface" className="py-20 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-teal-500/10 rounded-full pointer-events-none blur-[140px]" />

      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-3 border border-teal-500/20 backdrop-blur-md">
            <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">THE 4 ATTACK VECTORS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
            AI agents don't just generate text.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-white to-slate-400 block sm:inline">
              They take action.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
            Untrusted data in emails or web pages can trigger unauthorized file writes, database drops, or data exfiltration.
          </p>
        </div>

        {/* 4 Attack Surface Architecture Cards (Visual-First) */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 01: Untrusted Context */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 hover:bg-white/10 hover:border-teal-500/30 transition-all flex flex-col justify-between relative shadow-lg">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-2">
                <span className="font-bold">01 — UNTRUSTED CONTEXT</span>
                <span className="text-white/20 font-mono text-lg font-black">01</span>
              </div>
              <h3 className="text-base font-display font-bold text-white">
                Injected Ambient Data
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Malicious instructions entering via emails, PDFs, and third-party APIs.
              </p>
            </div>

            {/* Visual Pipeline */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-200">
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-teal-400" /> Email
                </span>
                <span className="text-teal-400">→</span>
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-teal-400" /> Web
                </span>
                <span className="text-teal-400">→</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  Agent
                </span>
              </div>
            </div>
          </div>

          {/* Card 02: Tool Access */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 hover:bg-white/10 hover:border-teal-500/30 transition-all flex flex-col justify-between relative shadow-lg">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-2">
                <span className="font-bold">02 — TOOL EXECUTION</span>
                <span className="text-white/20 font-mono text-lg font-black">02</span>
              </div>
              <h3 className="text-base font-display font-bold text-white">
                Thought to Real Action
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Prompt injection turns into real file writes, SQL dumps, or shell execution.
              </p>
            </div>

            {/* Visual Pipeline */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-200">
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-indigo-400" /> LLM
                </span>
                <span className="text-teal-400">→</span>
                <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-indigo-400" /> Tool
                </span>
                <span className="text-teal-400">→</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                  System
                </span>
              </div>
            </div>
          </div>

          {/* Card 03: Model Uncertainty */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 hover:bg-white/10 hover:border-teal-500/30 transition-all flex flex-col justify-between relative shadow-lg">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-2">
                <span className="font-bold">03 — MODEL UNCERTAINTY</span>
                <span className="text-white/20 font-mono text-lg font-black">03</span>
              </div>
              <h3 className="text-base font-display font-bold text-white">
                Probabilistic Gaps
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                LLMs are probabilistic. Even 99% safety leaves a 1% critical vulnerability.
              </p>
            </div>

            {/* Visual Dial */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="p-2 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">LLM Safety:</span>
                <span className="text-amber-300 font-bold">98.4% (1.6% Gap)</span>
              </div>
            </div>
          </div>

          {/* Card 04: Authorization Gap */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 hover:bg-white/10 hover:border-teal-500/30 transition-all flex flex-col justify-between relative shadow-lg">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-2">
                <span className="font-bold">04 — OVER-SCOPE GAP</span>
                <span className="text-white/20 font-mono text-lg font-black">04</span>
              </div>
              <h3 className="text-base font-display font-bold text-white">
                Benign yet Dangerous
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                "Clean system logs" prompt attempting write to <code className="text-rose-300">/etc/passwd</code>.
              </p>
            </div>

            {/* Visual Badge */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-[11px] font-mono text-rose-300 font-bold">
                <span>/etc/passwd</span>
                <span>POLICY BLOCK</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

