import React from 'react';
import { Shield } from 'lucide-react';

export const FinalVision: React.FC = () => {
  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent overflow-hidden text-center">
      {/* Expanding Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-teal-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-6 border border-teal-500/20 backdrop-blur-md">
          <Shield className="w-3.5 h-3.5 text-teal-400" />
          <span className="font-semibold uppercase tracking-wider">THE FUTURE OF AGENTIC SECURITY</span>
        </div>

        {/* Huge Headline */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Agents will act.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-white to-slate-400 block sm:inline">
            Security should act first.
          </span>
        </h2>

        {/* Supporting Copy */}
        <p className="mt-6 text-sm sm:text-base text-slate-300/90 max-w-2xl mx-auto leading-relaxed font-sans">
          As AI agents move from answering questions to operating software, security must move with them — from the prompt layer to the moment of execution.
        </p>

        {/* Visual Sequence Stream */}
        <div className="mt-14 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl text-xs sm:text-sm font-mono text-slate-200 shadow-2xl">
          <span className="px-3.5 py-1.5 rounded-full bg-white/10 text-slate-300">UNDERSTAND</span>
          <span className="text-teal-400">→</span>
          <span className="px-3.5 py-1.5 rounded-full bg-white/10 text-slate-300">VERIFY</span>
          <span className="text-teal-400">→</span>
          <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-bold shadow-sm">AUTHORIZE</span>
          <span className="text-teal-400">→</span>
          <span className="px-3.5 py-1.5 rounded-full bg-white/10 text-slate-300">EXECUTE</span>
          <span className="text-teal-400">→</span>
          <span className="px-3.5 py-1.5 rounded-full bg-white/10 text-slate-300">AUDIT</span>
        </div>

      </div>
    </section>
  );
};
