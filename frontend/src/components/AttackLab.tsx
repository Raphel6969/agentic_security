import React, { useState } from 'react';
import { Play, ShieldAlert, CheckCircle2, XOctagon, AlertTriangle, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { ATTACK_SCENARIOS } from '../data/content';
import { runAttackScenario } from '../services/api';

interface AttackLabProps {
  onOpenDemo: (initialTab?: 'simulation' | 'screen') => void;
}

export const AttackLab: React.FC<AttackLabProps> = ({ onOpenDemo }) => {
  const [selectedAttackIndex, setSelectedAttackIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationFinished, setSimulationFinished] = useState(false);
  const [liveOutcome, setLiveOutcome] = useState<any | null>(null);

  const currentAttack = ATTACK_SCENARIOS[selectedAttackIndex];

  const runSimulation = async () => {
    setIsSimulating(true);
    setSimulationFinished(false);
    try {
      const scenarioId = selectedAttackIndex + 1;
      const res = await runAttackScenario(scenarioId);
      setLiveOutcome(res);
      setSimulationFinished(true);
    } catch (e) {
      setSimulationFinished(true);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <section id="attack-lab" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
              <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-semibold uppercase tracking-wider">SEE THE DIFFERENCE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
              What happens when an agent is left unprotected?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
              Compare an autonomous agent operating blindly against tools versus one secured behind the Sentinel runtime gateway.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenDemo('simulation')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-sm font-semibold hover:from-teal-400 hover:to-indigo-500 transition-all shadow-lg shadow-teal-500/20 cursor-pointer self-start md:self-auto"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Live Sandbox</span>
          </button>
        </div>

        {/* Attack Scenario Selectors */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ATTACK_SCENARIOS.map((scenario, index) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => {
                setSelectedAttackIndex(index);
                setSimulationFinished(false);
              }}
              className={`p-5 rounded-2xl text-left border transition-all backdrop-blur-xl cursor-pointer ${
                selectedAttackIndex === index
                  ? 'bg-white/10 border-teal-400 shadow-lg shadow-teal-500/15 glow-teal'
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-1">
                <span>SCENARIO 0{index + 1}</span>
                <span className="text-[10px] text-slate-400">{scenario.category}</span>
              </div>
              <div className="text-sm font-semibold text-white truncate">{scenario.title}</div>
            </button>
          ))}
        </div>

        {/* Active Payload Bar */}
        <div className="mt-6 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Injected Input / Context:</span>
            <div className="text-sm font-mono text-white bg-slate-950/60 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-sm">
              {currentAttack.prompt}
            </div>
          </div>

          <button
            type="button"
            onClick={runSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-mono font-semibold border border-teal-500/40 transition-all shrink-0 cursor-pointer backdrop-blur-sm"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-300" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Attack Simulation →</span>
              </>
            )}
          </button>
        </div>

        {/* Side-by-Side Cinematic Comparison */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left: Unprotected Agent */}
          <div className="rounded-2xl p-7 bg-white/5 border border-rose-500/30 backdrop-blur-xl flex flex-col justify-between relative overflow-hidden shadow-lg">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 to-rose-400" />
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-rose-400 mb-4">
                <span className="flex items-center gap-1.5 font-bold">
                  <XOctagon className="w-4 h-4" />
                  UNPROTECTED AGENT RUNTIME
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] uppercase font-bold border border-rose-500/30">
                  NO GATEWAY
                </span>
              </div>

              <div className="space-y-4 my-6 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-rose-500/20 flex items-center justify-between backdrop-blur-sm">
                  <span className="text-slate-400">1. Input Received</span>
                  <span className="text-white">Direct Execution</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-rose-500/20 flex items-center justify-between backdrop-blur-sm">
                  <span className="text-slate-400">2. Proposed Tool Call</span>
                  <span className="text-rose-300 font-bold">{currentAttack.proposedAction.tool}()</span>
                </div>
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-200 backdrop-blur-sm">
                  <div className="font-bold mb-1">3. Real-World Consequence:</div>
                  <p className="text-xs leading-relaxed">{currentAttack.unprotectedOutcome.consequence}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-rose-500/20 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Security Status:</span>
              <span className="text-rose-400 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                CRITICAL VULNERABILITY EXPLOITED
              </span>
            </div>
          </div>

          {/* Right: Sentinel Protected */}
          <div className="rounded-2xl p-7 bg-white/5 border-2 border-teal-500/50 backdrop-blur-xl shadow-lg shadow-teal-500/10 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-indigo-500" />
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-200 mb-4">
                <span className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  SENTINEL RUNTIME FIREWALL
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-[10px] uppercase font-bold shadow-sm">
                  PROTECTED
                </span>
              </div>

              <div className="space-y-4 my-6 text-xs font-mono">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between backdrop-blur-sm">
                  <span className="text-slate-400">1. Interception Point</span>
                  <span className="text-teal-300 font-semibold">/screen Gateway</span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-between backdrop-blur-sm">
                  <span className="text-slate-400">2. Detection & Policy</span>
                  <span className="text-amber-300 font-bold">{currentAttack.sentinelOutcome.ruleMatch || currentAttack.sentinelOutcome.policyViolation}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-teal-500/30 text-white backdrop-blur-sm">
                  <div className="font-bold text-teal-300 mb-1">3. Pre-Execution Verdict:</div>
                  <p className="text-xs leading-relaxed">{currentAttack.sentinelOutcome.explanation}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Outcome:</span>
              <span className="px-3.5 py-1 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40 flex items-center gap-1.5 backdrop-blur-sm">
                <XOctagon className="w-3.5 h-3.5 text-rose-400" />
                HARD-STOP VERDICT ({currentAttack.sentinelOutcome.verdict})
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
