import React from 'react';
import { ShieldCheck, X, Check, ArrowRight, ShieldAlert } from 'lucide-react';

export const WhySentinel: React.FC = () => {
  const comparisons = [
    { traditional: 'Detect malicious text only', sentinel: 'Detect malicious intent across full context' },
    { traditional: 'Focus exclusively on user prompts', sentinel: 'Inspect ambient context + proposed tool calls' },
    { traditional: 'Trust model safety self-alignment', sentinel: 'Enforce deterministic policy boundaries' },
    { traditional: 'Block known static regexes', sentinel: 'Combine rules + quantized ML + LLM judge' },
    { traditional: 'Passive detection / warning only', sentinel: 'Detect + authorize + hard pre-execution enforce' },
    { traditional: 'Post-mortem logs after incidents occur', sentinel: 'Real-time telemetry and hot audit streams' }
  ];

  return (
    <section id="why-sentinel" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">THE DIFFERENCE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
            Security cannot stop at the prompt.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
            Prompt guardrails only protect conversational chat. When agents possess tools, the entire execution lifecycle requires runtime authorization.
          </p>
        </div>

        {/* Comparison Matrix Table */}
        <div className="mt-14 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 sm:p-10 overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-6 border-b border-white/10 text-xs font-mono">
            <div className="text-rose-400 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              TRADITIONAL PROMPT GUARDRAILS
            </div>
            <div className="text-teal-300 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              KYRON AGENT RUNTIME SECURITY
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {comparisons.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-5 items-center">
                
                {/* Traditional Side */}
                <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-400">
                  <div className="p-1 rounded-md bg-rose-500/10 text-rose-400 shrink-0 mt-0.5 border border-rose-500/20">
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <span>{item.traditional}</span>
                </div>

                {/* Sentinel Side */}
                <div className="flex items-start gap-3 text-xs sm:text-sm text-white font-medium">
                  <div className="p-1 rounded-md bg-teal-500/20 text-teal-300 shrink-0 mt-0.5 border border-teal-500/30">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{item.sentinel}</span>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Strongest Statement Banner */}
        <div className="mt-14 rounded-3xl bg-white/5 border border-teal-500/30 backdrop-blur-xl p-8 sm:p-12 text-center shadow-2xl">
          <div className="text-xs font-mono uppercase tracking-widest text-teal-400 mb-3 font-semibold">Core Paradigm</div>
          <h3 className="text-2xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white leading-tight">
            AI decides what to do.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-white to-slate-400 block sm:inline">
              Sentinel decides whether it is allowed.
            </span>
          </h3>
        </div>

      </div>
    </section>
  );
};
