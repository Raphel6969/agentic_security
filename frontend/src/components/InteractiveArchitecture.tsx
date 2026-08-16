import React, { useState, useEffect, useRef } from 'react';
import { Shield, Cpu, Lock, Search, BrainCircuit, Sliders, CheckCircle2, AlertTriangle, XOctagon, Database, Terminal, Server, ArrowDown, Activity, Play, Pause, RotateCcw } from 'lucide-react';
import { ARCHITECTURE_PHASES } from '../data/content';

interface InteractiveArchitectureProps {
  reducedMotion: boolean;
}

export const InteractiveArchitecture: React.FC<InteractiveArchitectureProps> = ({ reducedMotion }) => {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-play timer for presentation mode
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentPhaseIndex((prev) => (prev + 1) % ARCHITECTURE_PHASES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const activePhase = ARCHITECTURE_PHASES[currentPhaseIndex];
  const phaseNum = currentPhaseIndex + 1;

  return (
    <section id="interactive-architecture" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent overflow-hidden">
      
      {/* Background Cinematic Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[900px] h-[700px] bg-teal-500/10 blur-[160px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto relative z-10" ref={containerRef}>
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
              <Activity className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-semibold uppercase tracking-wider">UNDER THE HOOD :: SCROLL-EXPANDING ARCHITECTURE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
              Watch Kyron open before your eyes.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
              Explore the 8-phase runtime execution pipeline. As actions travel from the autonomous AI agent, the gateway expands to inspect, arbitrate, authorize, and audit every signal.
            </p>
          </div>

          {/* Interactive Play / Scrub Controls */}
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl self-start md:self-auto shadow-lg">
            <button
              type="button"
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-teal-500/20 text-teal-300 hover:text-white text-xs font-mono font-medium transition-all border border-teal-500/30 cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-teal-400" /> : <Play className="w-3.5 h-3.5 fill-current text-teal-400" />}
              <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentPhaseIndex(0);
              }}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Reset to Phase 1"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Phase Step Scrubbing Tabs */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {ARCHITECTURE_PHASES.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setCurrentPhaseIndex(idx);
              }}
              className={`p-3 rounded-2xl text-left border transition-all backdrop-blur-xl cursor-pointer ${
                currentPhaseIndex === idx
                  ? 'bg-white/15 border-teal-400 shadow-lg shadow-teal-500/15 text-white glow-teal'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/10'
              }`}
            >
              <div className="text-[10px] font-mono text-teal-400 font-bold">PHASE 0{p.phase}</div>
              <div className="text-xs font-medium truncate mt-0.5">{p.title.split(' ')[0]}</div>
            </button>
          ))}
        </div>

        {/* The Interactive Expanding Architecture Stage Container */}
        <div className="mt-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 sm:p-10 shadow-2xl relative">
          
          {/* Header Bar of Stage */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-mono text-teal-400 font-semibold">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">
                  LAYER: {activePhase.layer}
                </span>
                <span>•</span>
                <span className="text-slate-300">{activePhase.technicalLabel}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-white">
                0{activePhase.phase}. {activePhase.title}
              </h3>
              <p className="text-sm text-slate-400 max-w-2xl">
                {activePhase.description}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono bg-slate-950/60 p-3.5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div>
                <span className="text-slate-400 block text-[10px]">PROGRESS</span>
                <span className="text-white font-bold">{Math.round(((currentPhaseIndex + 1) / 8) * 100)}%</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div>
                <span className="text-slate-400 block text-[10px]">STAGE STATUS</span>
                <span className="text-teal-400 font-bold">{activePhase.metrics?.status || 'ACTIVE'}</span>
              </div>
            </div>
          </div>

          {/* Isometric Architectural Diagram Canvas */}
          <div className="mt-10 relative flex flex-col items-center space-y-6">
            
            {/* NODE 1: AI AGENT (Visible from Phase 1) */}
            <div className={`w-full max-w-md p-5 rounded-2xl transition-all duration-500 border backdrop-blur-md ${
              phaseNum >= 1
                ? 'bg-white/10 border-teal-400/50 shadow-lg shadow-teal-500/10'
                : 'opacity-30 bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-2">
                <span className="flex items-center gap-2 text-white font-semibold">
                  <Cpu className="w-4 h-4 text-teal-400" />
                  AI AGENT RUNTIME
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-semibold border border-teal-500/30">ORIGIN</span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Action: <span className="text-white">write_file("/sandbox/config.json")</span>
              </p>
            </div>

            {/* Connecting Beam 1 -> 2 */}
            <div className={`w-0.5 h-6 transition-all ${phaseNum >= 2 ? 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]' : 'bg-white/10'}`} />

            {/* NODE 2: SENTINEL INTERCEPTION GATEWAY (Expands vertically in Phase 2) */}
            <div className={`w-full max-w-2xl p-6 rounded-2xl transition-all duration-500 border backdrop-blur-md ${
              phaseNum >= 2
                ? 'bg-white/10 border-teal-400/60 shadow-xl shadow-teal-500/15'
                : 'opacity-20 bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-mono text-slate-200 font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-400" />
                  KYRON SECURITY GATEWAY (/screen API)
                </span>
                <span className="text-[10px] font-mono text-teal-400 font-semibold">LATENCY: &lt;1.8ms</span>
              </div>

              {/* 4 Pillars inside Gateway (Phase 2+) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className={`p-2.5 rounded-xl border text-center transition-all ${
                  phaseNum >= 3 ? 'bg-teal-500/20 border-teal-500/40 text-white font-bold' : 'bg-slate-950/40 border-white/5 text-slate-400'
                }`}>
                  <div className="text-[10px] font-mono text-teal-400">01</div>
                  <div className="text-xs font-mono">DETECT</div>
                </div>
                <div className={`p-2.5 rounded-xl border text-center transition-all ${
                  phaseNum >= 3 ? 'bg-teal-500/20 border-teal-500/40 text-white font-bold' : 'bg-slate-950/40 border-white/5 text-slate-400'
                }`}>
                  <div className="text-[10px] font-mono text-teal-400">02</div>
                  <div className="text-xs font-mono">REASON</div>
                </div>
                <div className={`p-2.5 rounded-xl border text-center transition-all ${
                  phaseNum >= 5 ? 'bg-teal-500/20 border-teal-500/40 text-white font-bold' : 'bg-slate-950/40 border-white/5 text-slate-400'
                }`}>
                  <div className="text-[10px] font-mono text-teal-400">03</div>
                  <div className="text-xs font-mono">AUTHORIZE</div>
                </div>
                <div className={`p-2.5 rounded-xl border text-center transition-all ${
                  phaseNum >= 6 ? 'bg-teal-500/20 border-teal-500/40 text-white font-bold' : 'bg-slate-950/40 border-white/5 text-slate-400'
                }`}>
                  <div className="text-[10px] font-mono text-teal-400">04</div>
                  <div className="text-xs font-mono">ENFORCE</div>
                </div>
              </div>

              {/* Phase 3: Detection Cascade Breakdown */}
              {phaseNum >= 3 && (
                <div className="mt-5 pt-4 border-t border-white/10">
                  <div className="text-[11px] font-mono text-teal-400 uppercase mb-2 font-semibold">Cascade Detection Modules:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-sm">
                      <div className="text-slate-200 font-semibold">Rule Engine</div>
                      <div className="text-[10px] text-slate-400">18 Regex Patterns</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-sm">
                      <div className="text-slate-200 font-semibold">Semantic ML</div>
                      <div className="text-[10px] text-slate-400">Quantized Vectors</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-sm">
                      <div className="text-slate-200 font-semibold">LLM Judge</div>
                      <div className="text-[10px] text-slate-400">Selective Reasoner</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Phase 4: Risk Fusion Signal Convergence */}
              {phaseNum >= 4 && (
                <div className="mt-4 p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between text-xs font-mono backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-teal-400" />
                    <span className="text-white font-semibold">Risk Fusion Converged:</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-950/60 text-teal-300 font-bold border border-teal-500/40">
                    SCORE: 0.12 (LOW RISK)
                  </span>
                </div>
              )}

              {/* Phase 5: Deterministic Policy Engine */}
              {phaseNum >= 5 && (
                <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-white/10 text-xs font-mono space-y-1.5 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-slate-200 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-teal-400" />
                      Policy Engine Boundaries
                    </span>
                    <span className="text-teal-400">PASSED</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between">
                    <span>Path: /sandbox/config.json</span>
                    <span className="text-teal-400 font-semibold">ALLOWLISTED ✓</span>
                  </div>
                </div>
              )}
            </div>

            {/* Connecting Beam 2 -> 3 */}
            <div className={`w-0.5 h-6 transition-all ${phaseNum >= 6 ? 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]' : 'bg-white/10'}`} />

            {/* NODE 3: VERDICT BRANCHING (Phase 6+) */}
            <div className={`w-full max-w-2xl p-5 rounded-2xl transition-all duration-500 border backdrop-blur-md ${
              phaseNum >= 6
                ? 'bg-white/10 border-teal-500/40 shadow-lg'
                : 'opacity-20 bg-white/5 border-white/10'
            }`}>
              <div className="text-xs font-mono text-teal-400 uppercase mb-3 text-center font-semibold">Three Verdict Branches</div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                <div className="p-3 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold">
                  ALLOW
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-400">
                  APPROVAL
                </div>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-slate-400">
                  BLOCK
                </div>
              </div>
            </div>

            {/* Connecting Beam 3 -> 4 */}
            <div className={`w-0.5 h-6 transition-all ${phaseNum >= 7 ? 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]' : 'bg-white/10'}`} />

            {/* NODE 4: TOOL EXECUTION & AUDITING (Phase 7 & 8) */}
            <div className={`w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-500 ${
              phaseNum >= 7 ? 'opacity-100' : 'opacity-20'
            }`}>
              {/* Tool Execution Infrastructure */}
              <div className="p-5 rounded-2xl bg-white/5 border border-teal-500/30 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-mono text-teal-400 font-bold mb-2">
                  <Server className="w-4 h-4" />
                  TOOL EXECUTION
                </div>
                <div className="text-xs text-slate-400 font-mono space-y-1">
                  <div>✓ Filesystem Write Complete</div>
                  <div>✓ Target: /sandbox/config.json</div>
                </div>
              </div>

              {/* Audit & SOC Telemetry (Phase 8) */}
              <div className={`p-5 rounded-2xl border backdrop-blur-md transition-all ${
                phaseNum >= 8
                  ? 'bg-white/10 border-teal-400/50 shadow-lg shadow-teal-500/10'
                  : 'bg-white/5 border-white/10'
              }`}>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-200 font-bold mb-2">
                  <Database className="w-4 h-4 text-teal-400" />
                  AUDIT & SOC TELEMETRY
                </div>
                <div className="text-xs text-slate-400 font-mono space-y-1">
                  <div>• SQLite Hot Storage Written</div>
                  <div>• Broadcast via SSE to SOC Room</div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Phase Navigation Footer */}
          <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs font-mono text-slate-400">
              CLICK ANY PHASE ABOVE OR USE BUTTONS TO ADVANCE THE PIPELINE
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPhaseIndex === 0}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentPhaseIndex((prev) => Math.max(prev - 1, 0));
                }}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 cursor-pointer backdrop-blur-md"
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={currentPhaseIndex === ARCHITECTURE_PHASES.length - 1}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentPhaseIndex((prev) => Math.min(prev + 1, ARCHITECTURE_PHASES.length - 1));
                }}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-xs font-mono text-white font-bold hover:from-teal-400 hover:to-indigo-500 disabled:opacity-30 cursor-pointer shadow-lg shadow-teal-500/20"
              >
                Next Phase →
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
