import React from 'react';
import { ArrowRight, Play, Terminal, ArrowUpRight, Shield } from 'lucide-react';

interface FinalCTAProps {
  onOpenDemo: (initialTab?: 'simulation' | 'screen') => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenDemo }) => {
  return (
    <section className="py-28 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 text-center">
        
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto">
          Put a security boundary{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-white to-slate-400 block sm:inline">
            around your agents.
          </span>
        </h2>

        <p className="mt-5 text-sm sm:text-base text-slate-300/90 max-w-2xl mx-auto leading-relaxed font-sans">
          Explore the architecture, simulate an attack, and see how Sentinel turns an autonomous agent's most dangerous capability — taking action — into a controlled, auditable operation.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="final-cta-run-demo-btn"
            type="button"
            onClick={() => onOpenDemo('simulation')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-semibold text-sm hover:from-teal-400 hover:to-indigo-500 transition-all shadow-lg shadow-teal-500/25 hover:shadow-teal-500/40 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Run the Demo →</span>
          </button>

          <a
            id="final-cta-github-btn"
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full bg-white/5 text-slate-200 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all text-sm font-medium backdrop-blur-md"
          >
            <Terminal className="w-4 h-4 text-teal-400" />
            <span>Explore GitHub</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
          </a>
        </div>

      </div>
    </section>
  );
};
