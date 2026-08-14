import React, { useState } from 'react';
import { Play, ShieldAlert, ShieldCheck, Zap, AlertTriangle, CheckCircle, FileCode, Server, Terminal, Lock } from 'lucide-react';
import RiskRadarGauge from './RiskRadarGauge';

const SCENARIOS = [
  {
    id: 1,
    title: 'Scenario 1: Direct Prompt Injection & Jailbreak',
    subtitle: 'DAN Persona Override & Environment Token Leak',
    tag: 'Stage 1 & 2 Threat',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  },
  {
    id: 2,
    title: 'Scenario 2: Indirect Data Poisoning',
    subtitle: 'Data Exfiltration via Poisoned Inbox Email',
    tag: 'Stage 2 & Policy Threat',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    id: 3,
    title: 'Scenario 3: Over-Scope Call / Policy Violation',
    subtitle: 'Clean Text requesting /etc/passwd Overwrite',
    tag: 'Policy Engine Hard Block',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
];

export default function AttackSimulator({ onRunScenario = null }) {
  const [selectedScenario, setSelectedScenario] = useState(1);
  const [loading, setLoading] = useState(false);
  const [scenarioResult, setScenarioResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async (scenarioId) => {
    setLoading(true);
    setError(null);
    setSelectedScenario(scenarioId);

    try {
      const response = await fetch('/api/demo/run-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: scenarioId }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setScenarioResult(data);
      if (onRunScenario) onRunScenario(data);
    } catch (err) {
      console.error('Failed to run scenario:', err);
      setError(err.message || 'Failed to connect to Sentinel API endpoint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="bezel-shell">
        <div className="bezel-core flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-widest font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Phase 6 Attack Laboratory
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono tracking-widest font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                1-Click Execution
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400" />
              Live Interactive Attack Simulator
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Trigger real-world prompt injection and over-scope tool attacks to compare Unprotected AI Agents against Sentinel Layer Security.
            </p>
          </div>

          <button
            onClick={() => handleRun(selectedScenario)}
            disabled={loading}
            className="btn-press px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-white font-semibold shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 flex items-center gap-3 self-stretch md:self-auto justify-center disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin font-mono">⚡</span>
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span className="font-mono text-sm tracking-wide">
              {loading ? 'EXECUTING SIMULATION...' : 'RUN SELECTED SCENARIO'}
            </span>
          </button>
        </div>
      </div>

      {/* Scenario Selector Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SCENARIOS.map((s) => {
          const isSelected = selectedScenario === s.id;
          return (
            <div
              key={s.id}
              onClick={() => handleRun(s.id)}
              className={`bezel-shell cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-rose-500/50 scale-[1.01]' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <div className="bezel-core h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.badgeColor}`}>
                      {s.tag}
                    </span>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-400">{s.subtitle}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>Scenario #{s.id}</span>
                  <span className="text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    Select & Run →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-mono flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Simulation Results Side-by-Side Comparison */}
      {scenarioResult && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              Side-by-Side Comparison Output — {scenarioResult.title}
            </h3>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              ATTACK PREVENTED BY SENTINEL
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 🔴 CARD 1: UNPROTECTED AGENT (VULNERABLE) */}
            <div className="bezel-shell border-rose-500/30 bg-rose-950/10">
              <div className="bezel-core relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-rose-500/20 border-b border-l border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold tracking-widest rounded-bl-xl">
                  🔴 UNPROTECTED AGENT (VULNERABLE)
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Direct Agent Execution</h4>
                    <p className="text-xs text-rose-300/80 font-mono">No security screening gate</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs text-slate-300">
                    <div className="text-[10px] uppercase text-slate-500 tracking-wider mb-1">Incoming Content Payload</div>
                    <p className="text-rose-200/90 leading-relaxed font-sans text-sm">
                      "{scenarioResult.incoming_content.text}"
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-black/40 border border-rose-500/20 font-mono text-xs">
                    <div className="text-[10px] uppercase text-rose-400 tracking-wider mb-1 flex items-center justify-between">
                      <span>Proposed Tool Invocation</span>
                      <span className="text-rose-400 font-bold">STATUS: EXECUTED</span>
                    </div>
                    <div className="text-slate-200">
                      Tool: <span className="text-amber-400 font-bold">{scenarioResult.proposed_tool_call.tool_name}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-1">
                      Arguments: {JSON.stringify(scenarioResult.proposed_tool_call.arguments)}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs font-mono space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                      UNPROTECTED OUTCOME
                    </div>
                    <p className="text-rose-300/90">
                      {scenarioResult.unprotected_run.security_summary}
                    </p>
                    <div className="mt-2 pt-2 border-t border-rose-500/20 text-[11px] text-slate-300">
                      Result Payload: {JSON.stringify(scenarioResult.unprotected_run.tool_output)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 🟢 CARD 2: SENTINEL PROTECTED AGENT (SECURED) */}
            <div className="bezel-shell border-emerald-500/30 bg-emerald-950/10">
              <div className="bezel-core relative overflow-hidden">
                <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500/20 border-b border-l border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold tracking-widest rounded-bl-xl">
                  🟢 SENTINEL PROTECTED (SECURED)
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Sentinel Runtime Proxy Gate</h4>
                    <p className="text-xs text-emerald-300/80 font-mono">3-Stage Cascade + Policy Engine</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 items-center">
                  <div className="sm:col-span-1 flex justify-center">
                    <RiskRadarGauge
                      score={scenarioResult.protected_run.screen_response?.risk_score || 0.0}
                      size={140}
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-2 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Final Decision</div>
                      <div className="text-sm font-bold text-rose-400 mt-0.5">
                        VERDICT: {scenarioResult.protected_run.screen_response?.verdict?.toUpperCase()}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-slate-300">
                      Tool Status: <span className="text-emerald-400 font-bold">ABORTED (Never Ran)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs font-mono space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                    <Lock className="w-4 h-4" />
                    SECURITY INTERCEPTION SUMMARY
                  </div>
                  <p className="text-slate-200 text-xs leading-relaxed font-sans">
                    {scenarioResult.protected_run.screen_response?.explanation}
                  </p>

                  {scenarioResult.protected_run.screen_response?.matched_signals?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[11px]">
                      <div className="text-emerald-400 font-bold mb-1">Matched Threat Signals:</div>
                      <ul className="space-y-1 text-slate-300">
                        {scenarioResult.protected_run.screen_response.matched_signals.map((sig, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span className="font-bold text-amber-300">[{sig.stage}]</span> {sig.signal} ({sig.score ? `score: ${sig.score}` : ''})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
