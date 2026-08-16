import React from 'react';
import { Cpu, Terminal, CheckCircle2, ShieldCheck, Layers, Award } from 'lucide-react';
import { TECH_STACK } from '../data/content';

export const TechStack: React.FC = () => {
  return (
    <section id="technology-stack" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Section 23: Current Capabilities Proof Strip */}
        <div className="rounded-3xl bg-white/5 border border-teal-500/30 backdrop-blur-xl p-8 sm:p-10 relative overflow-hidden mb-20 shadow-2xl">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-semibold uppercase tracking-wider">WHAT EXISTS TODAY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
              Eight phases. One working security system.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
              Kyron is fully operational with active runtime interception, three-stage cascade screening, deterministic policy enforcement, and live SOC telemetry.
            </p>
          </div>

          {/* 4 Core Current Capabilities */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-xs font-mono text-teal-400 font-bold">01 — RUNTIME FIREWALL</div>
              <p className="text-xs text-slate-300 mt-1">/screen intercepts incoming context and tool calls before execution.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-xs font-mono text-teal-400 font-bold">02 — CASCADE DETECTION</div>
              <p className="text-xs text-slate-300 mt-1">Rules, semantic ML, and selective LLM reasoning collaborate.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-xs font-mono text-teal-400 font-bold">03 — POLICY ENFORCEMENT</div>
              <p className="text-xs text-slate-300 mt-1">Paths, domains, tools, and session limits are strictly bounded.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-xs font-mono text-teal-400 font-bold">04 — SOC OPERATIONS</div>
              <p className="text-xs text-slate-300 mt-1">Live telemetry, audit trails, and simulator in one control room.</p>
            </div>
          </div>

          {/* Restrained System Proof Strip */}
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-bold text-white">8 / 8</div>
              <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-medium">Phases Complete</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-bold text-teal-400">40 / 40</div>
              <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-medium">Backend Tests Green</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-bold text-indigo-300">1.4ms</div>
              <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-medium">Avg Decision Time</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-md">
              <div className="text-xl sm:text-2xl font-bold text-teal-300">100%</div>
              <div className="text-[10px] text-slate-400 uppercase mt-0.5 font-medium">Deterministic Override</div>
            </div>
          </div>
        </div>

        {/* Technical Specifications Table */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-2 border border-teal-500/20 backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">SYSTEM SPECIFICATIONS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-white tracking-tight leading-[1.2]">
            Runtime Performance Specifications
          </h2>
        </div>

        {/* Clean Tech Spec Table */}
        <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 bg-slate-950/60 text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">System Layer</th>
                  <th className="py-4 px-6">Technology</th>
                  <th className="py-4 px-6">Architecture Purpose</th>
                  <th className="py-4 px-6 text-right">Characteristic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {TECH_STACK.map((item, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-white">{item.layer}</td>
                    <td className="py-3.5 px-6 text-teal-300">{item.technology}</td>
                    <td className="py-3.5 px-6 text-slate-400">{item.purpose}</td>
                    <td className="py-3.5 px-6 text-right">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-[10px] text-teal-300 border border-teal-500/20">
                        {item.badge}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </section>
  );
};
