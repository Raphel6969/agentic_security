import React, { useState } from 'react';
import { Sliders, ShieldCheck, AlertTriangle, XOctagon, Layers, ArrowRight } from 'lucide-react';

export const RiskFusion: React.FC = () => {
  // Interactive Weights and Inputs
  const [ruleScore, setRuleScore] = useState<number>(0.2);
  const [mlScore, setMlScore] = useState<number>(0.85);
  const [llmScore, setLlmScore] = useState<number>(0.75);

  // Compute weighted composite score: 0.35 * Rule + 0.40 * ML + 0.25 * LLM
  const fusedRisk = Number((ruleScore * 0.35 + mlScore * 0.40 + llmScore * 0.25).toFixed(2));

  let decision: 'ALLOW' | 'APPROVAL' | 'BLOCK' = 'ALLOW';
  if (fusedRisk > 0.70) decision = 'BLOCK';
  else if (fusedRisk >= 0.40) decision = 'APPROVAL';

  return (
    <section id="risk-fusion" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      {/* Soft Ambient Radial Light */}
      <div className="absolute top-1/2 right-10 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">FROM SIGNALS TO VERDICT</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-bold text-white tracking-tight leading-tight">
            Multiple signals.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-white to-slate-400 block sm:inline">
              One risk score.
            </span>
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed">
            Kyron combines available security signals into a bounded risk score. Ambiguous cases can be escalated to the LLM judge, while deterministic policy violations remain independently enforceable.
          </p>
        </div>

        {/* Decision Bands Visual Banner */}
        <div className="mt-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-lg">
          <div className="text-xs font-mono text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
            <span>DECISION THRESHOLD BANDS</span>
            <span className="text-slate-400">BOUNDED INTERVAL [0.00 – 1.00]</span>
          </div>

          {/* Visual Band Scale */}
          <div className="relative pt-6 pb-4">
            <div className="h-4 rounded-full bg-slate-950/60 border border-white/10 flex overflow-hidden backdrop-blur-sm">
              <div className="w-[40%] bg-teal-500/40 border-r border-teal-500/60" />
              <div className="w-[30%] bg-amber-500/40 border-r border-amber-500/60" />
              <div className="w-[30%] bg-rose-500/40" />
            </div>

            {/* Current Fused Indicator Marker */}
            <div
              className="absolute top-3 -translate-x-1/2 flex flex-col items-center transition-all duration-300 pointer-events-none"
              style={{ left: `${Math.min(Math.max(fusedRisk * 100, 3), 97)}%` }}
            >
              <div className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-[11px] font-mono font-bold shadow-lg shadow-teal-500/30">
                {fusedRisk.toFixed(2)}
              </div>
              <div className="w-0.5 h-6 bg-teal-300 mt-0.5 shadow-[0_0_8px_#2dd4bf]" />
            </div>

            {/* Scale Labels */}
            <div className="mt-4 flex justify-between text-xs font-mono text-slate-400">
              <div className="text-teal-400 font-semibold">
                <span>0.00 - 0.40</span>
                <span className="block text-[10px] text-slate-400">ALLOW (Safe)</span>
              </div>
              <div className="text-amber-300 font-semibold text-center">
                <span>0.40 - 0.70</span>
                <span className="block text-[10px] text-slate-400">REQUIRE APPROVAL</span>
              </div>
              <div className="text-rose-400 font-semibold text-right">
                <span>0.70 - 1.00</span>
                <span className="block text-[10px] text-slate-400">BLOCK (Hard-Stop)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Signal Convergence Lab */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Signal Inputs (Sliders) */}
          <div className="lg:col-span-7 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-lg">
            <div className="text-sm font-display font-semibold text-white flex items-center justify-between pb-3 border-b border-white/10">
              <span>Interactive Signal Inputs</span>
              <span className="text-xs font-mono text-teal-400">Adjust values to test fusion</span>
            </div>

            {/* Slider 1: Rule Engine */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-200">1. Rule Engine Score (Weight: 35%)</span>
                <span className="text-white font-bold">{ruleScore.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={ruleScore}
                onChange={(e) => setRuleScore(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>No regex match (0.0)</span>
                <span>High-confidence injection (1.0)</span>
              </div>
            </div>

            {/* Slider 2: Semantic ML */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-200">2. Semantic ML Vector Score (Weight: 40%)</span>
                <span className="text-white font-bold">{mlScore.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={mlScore}
                onChange={(e) => setMlScore(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>Distant embedding (0.0)</span>
                <span>Near jailbreak cluster (1.0)</span>
              </div>
            </div>

            {/* Slider 3: LLM Judge */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-2">
                <span className="text-slate-200">3. LLM Security Judge (Weight: 25%)</span>
                <span className="text-white font-bold">{llmScore.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={llmScore}
                onChange={(e) => setLlmScore(parseFloat(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>Benign intent (0.0)</span>
                <span>Malicious reasoning (1.0)</span>
              </div>
            </div>
          </div>

          {/* Fusion Outcome Box */}
          <div className="lg:col-span-5 rounded-2xl p-8 bg-white/5 border border-teal-500/30 backdrop-blur-xl shadow-lg shadow-teal-500/10 flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-200 mb-3">
                <span>FUSED COMPOSITE SCORE</span>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold">ACTIVE ENGINE</span>
              </div>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-5xl font-mono font-extrabold text-white">{fusedRisk.toFixed(2)}</span>
                <span className="text-xs font-mono text-slate-400">/ 1.00</span>
              </div>

              <div className="mt-5">
                <span className="text-xs font-mono text-slate-400 uppercase">Recommended Action:</span>
                <div className="mt-2">
                  {decision === 'ALLOW' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-mono text-sm font-bold shadow-lg">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      ALLOW (PROCEED TO POLICY)
                    </div>
                  )}
                  {decision === 'APPROVAL' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-sm font-bold shadow-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      REQUIRE SOC OPERATOR APPROVAL
                    </div>
                  )}
                  {decision === 'BLOCK' && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-sm font-bold shadow-lg">
                      <XOctagon className="w-4 h-4 text-rose-400" />
                      BLOCK (HALT PRE-EXECUTION)
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10 text-xs font-mono text-slate-400">
              Formula: <code className="text-slate-200">0.35(Rule) + 0.40(ML) + 0.25(Judge)</code>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
