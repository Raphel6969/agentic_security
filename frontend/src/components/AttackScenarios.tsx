import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, XOctagon, Terminal, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { ATTACK_SCENARIOS } from '../data/content';

export const AttackScenarios: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('attack-01');

  const selectedScenario = ATTACK_SCENARIOS.find((s) => s.id === activeTab) || ATTACK_SCENARIOS[0];

  return (
    <section id="attack-scenarios" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
            <Terminal className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">REAL-WORLD THREAT VECTORS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
            Three attack scenarios.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-white to-slate-400 block sm:inline">
              Three definitive blocks.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
            From direct instruction overrides to ambient indirect data poisoning and benign over-scoped operations.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="mt-12 flex flex-wrap gap-3 border-b border-white/10 pb-4">
          {ATTACK_SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setActiveTab(sc.id)}
              className={`px-5 py-2.5 rounded-full font-mono text-xs font-semibold transition-all cursor-pointer backdrop-blur-md ${
                activeTab === sc.id
                  ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white shadow-lg shadow-teal-500/20'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              0{idx + 1} — {sc.title}
            </button>
          ))}
        </div>

        {/* Deep Dive Scenario Panel */}
        <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 sm:p-10 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-mono text-teal-400 uppercase tracking-wider font-semibold">{selectedScenario.badge}</span>
              <h3 className="text-2xl font-display font-bold text-white mt-1">{selectedScenario.title}</h3>
            </div>
            <div className="px-4 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm">
              <XOctagon className="w-4 h-4 text-rose-400" />
              FINAL VERDICT: {selectedScenario.sentinelOutcome.verdict}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Step 1: Inbound Attack Vector */}
            <div className="rounded-2xl p-5 bg-white/5 border border-white/10 flex flex-col justify-between backdrop-blur-sm">
              <div>
                <div className="text-xs font-mono text-teal-400 uppercase mb-2 font-semibold">1. Injected Payload</div>
                <p className="text-xs font-mono text-white bg-slate-950/60 p-3.5 rounded-xl border border-white/10 leading-relaxed backdrop-blur-sm">
                  {selectedScenario.prompt}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400">
                Source: Ambient Untrusted Context
              </div>
            </div>

            {/* Step 2: Agent Proposed Action */}
            <div className="rounded-2xl p-5 bg-white/5 border border-white/10 flex flex-col justify-between backdrop-blur-sm">
              <div>
                <div className="text-xs font-mono text-teal-400 uppercase mb-2 font-semibold">2. Proposed Tool Call</div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="text-slate-300">Tool: <span className="text-white font-bold">{selectedScenario.proposedAction.tool}()</span></div>
                  <div className="text-slate-300">Target: <span className="text-amber-300 font-semibold">{selectedScenario.proposedAction.target}</span></div>
                  <div className="text-slate-400 text-[11px] truncate">
                    Params: {JSON.stringify(selectedScenario.proposedAction.params)}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-rose-400 font-semibold">
                Without Kyron: Malicious Execution
              </div>
            </div>

            {/* Step 3: Kyron Interception Details */}
            <div className="rounded-2xl p-5 bg-white/5 border border-teal-500/30 flex flex-col justify-between backdrop-blur-sm shadow-md">
              <div>
                <div className="text-xs font-mono text-slate-200 uppercase mb-2 font-semibold">3. Kyron Layer Interception</div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="text-slate-400">Risk Score: <span className="text-white font-bold">{selectedScenario.sentinelOutcome.riskScore}</span></div>
                  {selectedScenario.sentinelOutcome.ruleMatch && (
                    <div className="text-slate-300">Rule Signature: <span className="text-teal-400 font-semibold">{selectedScenario.sentinelOutcome.ruleMatch}</span></div>
                  )}
                  {selectedScenario.sentinelOutcome.policyViolation && (
                    <div className="text-slate-300">Policy Violation: <span className="text-rose-400 font-bold">{selectedScenario.sentinelOutcome.policyViolation}</span></div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                    {selectedScenario.sentinelOutcome.explanation}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-teal-400 font-semibold">
                Audited & Stopped at Gateway
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
