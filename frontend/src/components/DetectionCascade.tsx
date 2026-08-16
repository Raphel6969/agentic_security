import React, { useState } from 'react';
import { Zap, Cpu, Sparkles, Binary, CheckCircle2, ShieldCheck, ArrowRight, Activity, Terminal } from 'lucide-react';

export const DetectionCascade: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<number>(1);

  const stages = [
    {
      stage: 1,
      name: 'Stage 01 — Rule Engine',
      subtitle: 'Fast. Deterministic.',
      tech: '18 High-Confidence Regex Signatures',
      latency: '< 0.3ms',
      description: 'High-confidence attack signatures, known jailbreak prefixes, and direct command-injection strings are identified immediately before executing any complex models.',
      spec: [
        'Deterministic regex scanning',
        'Direct instruction override detection',
        'Zero API overhead / ultra-low CPU cost',
        'Immediate termination on high confidence'
      ],
      sampleOutput: 'MATCH: SIG_09_DIRECT_INSTRUCTION_OVERRIDE (Confidence: 1.00)'
    },
    {
      stage: 2,
      name: 'Stage 02 — Semantic ML',
      subtitle: 'Understand meaning, not just words.',
      tech: 'all-MiniLM-L6-v2 + TurboQuant 8-bit vectors',
      latency: '< 1.8ms',
      description: 'Kyron converts incoming content into dense 384-dimensional embeddings and performs nearest-neighbor search against an in-memory quantized database of prompt injection vectors.',
      spec: [
        '384-dimension vector embeddings',
        'TurboQuant 8-bit quantized cosine index',
        'Detects paraphrased & obfuscated injections',
        'Runs locally inside container memory'
      ],
      sampleOutput: 'COSINE SIMILARITY: 0.942 against vector_id="prompt_injection_v2_jailbreak"'
    },
    {
      stage: 3,
      name: 'Stage 03 — LLM Security Judge',
      subtitle: 'Reason only when necessary.',
      tech: 'Groq + Llama 3.1 8B Instant',
      latency: '< 120ms (Selective)',
      description: 'Ambiguous cases with conflicting rule/vector scores are selectively escalated to a specialized LLM security judge for deep intent arbitration, avoiding costly model invocations on clean traffic.',
      spec: [
        'Selective trigger (only on 0.40 - 0.70 ambiguity)',
        'Evaluates complex multi-hop tool parameters',
        'Contextual data exfiltration reasoning',
        'Sub-150ms inference via Groq acceleration'
      ],
      sampleOutput: 'ARBITRATION: Malicious intent confirmed in RAG context. Reasoning score: 0.91'
    }
  ];

  return (
    <section id="detection-cascade" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">THE CASCADE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
            Three stages.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-white to-slate-400 block sm:inline">
              One security decision.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
            Kyron optimizes the security pipeline by cascading from ultra-fast deterministic rules to local quantized semantic vectors, escalating to LLM judges only when truly ambiguous.
          </p>
        </div>

        {/* Cascade Pipeline Visualization Bar */}
        <div className="mt-12 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-lg">
          <span className="text-slate-400 font-semibold">CASCADE PIPELINE:</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 backdrop-blur-sm font-semibold">RULE ENGINE</span>
            <span className="text-teal-400">→</span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 backdrop-blur-sm font-semibold">ML CLASSIFIER</span>
            <span className="text-teal-400">→</span>
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-200 backdrop-blur-sm font-semibold">LLM JUDGE</span>
            <span className="text-teal-400">→</span>
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">RISK FUSION</span>
            <span className="text-teal-400">→</span>
            <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-semibold shadow-lg shadow-teal-500/20">POLICY ENGINE</span>
            <span className="text-teal-400">→</span>
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">VERDICT</span>
          </div>
        </div>

        {/* Interactive 3-Stage Inspector Grid */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {stages.map((st) => (
            <div
              key={st.stage}
              onClick={() => setSelectedStage(st.stage)}
              className={`rounded-2xl p-7 flex flex-col justify-between cursor-pointer transition-all duration-300 backdrop-blur-xl ${
                selectedStage === st.stage
                  ? 'bg-white/10 border-2 border-teal-400 shadow-lg shadow-teal-500/20 glow-teal'
                  : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 shadow-md'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 backdrop-blur-sm">
                    LATENCY: {st.latency}
                  </span>
                  <span className="text-xs font-mono font-bold text-teal-400">STAGE 0{st.stage}</span>
                </div>

                <h3 className="text-xl font-display font-bold text-white mt-1">
                  {st.name.split('—')[1]}
                </h3>
                <div className="text-xs font-mono text-teal-300/90 mt-1 mb-3">
                  {st.subtitle}
                </div>

                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-5">
                  {st.description}
                </p>

                <div className="space-y-2 border-t border-white/10 pt-4">
                  {st.spec.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="text-[10px] font-mono text-slate-400 uppercase mb-1">Technical Stack:</div>
                <div className="text-xs font-mono text-teal-300 bg-white/5 p-2.5 rounded-xl border border-white/10 truncate backdrop-blur-sm">
                  {st.tech}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Stage Output Console */}
        <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs font-mono">
            <span className="flex items-center gap-2 text-slate-200">
              <Terminal className="w-4 h-4 text-teal-400" />
              ACTIVE CASCADE TELEMETRY STREAM
            </span>
            <span className="text-slate-400">INSPECTING STAGE 0{selectedStage}</span>
          </div>
          <div className="mt-3 font-mono text-xs sm:text-sm text-teal-300 bg-slate-950/60 p-4 rounded-xl border border-white/10 overflow-x-auto backdrop-blur-md">
            <code>&gt; {stages[selectedStage - 1].sampleOutput}</code>
          </div>
        </div>

      </div>
    </section>
  );
};
