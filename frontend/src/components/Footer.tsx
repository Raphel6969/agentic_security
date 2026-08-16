import React from 'react';
import { Shield, ArrowUpRight, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-transparent backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
        
        {/* Brand & Mission Statement */}
        <div className="space-y-3 max-w-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
              <Shield className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-white">SENTINEL</span>
              <span className="block text-[11px] font-mono text-slate-400 uppercase">Agent Runtime Security</span>
            </div>
          </div>
          <p className="text-xs font-mono text-slate-400 leading-relaxed">
            Detect. Reason. Authorize. Enforce.
          </p>
        </div>

        {/* Links Navigation */}
        <div className="flex flex-wrap gap-8 text-xs font-mono">
          <div className="space-y-2">
            <span className="text-white font-bold block uppercase tracking-wider text-[11px]">System</span>
            <ul className="space-y-1.5 text-slate-400">
              <li><a href="#what-is-sentinel" className="hover:text-teal-300 transition-colors">Product</a></li>
              <li><a href="#interactive-architecture" className="hover:text-teal-300 transition-colors">Architecture</a></li>
              <li><a href="#security-pillars" className="hover:text-teal-300 transition-colors">Security</a></li>
              <li><a href="#future-vision" className="hover:text-teal-300 transition-colors">Roadmap</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="text-white font-bold block uppercase tracking-wider text-[11px]">Operations</span>
            <ul className="space-y-1.5 text-slate-400">
              <li><a href="#attack-lab" className="hover:text-teal-300 transition-colors">Attack Lab</a></li>
              <li><a href="#soc-control-room" className="hover:text-teal-300 transition-colors">SOC Dashboard</a></li>
              <li><a href="#data-auditing" className="hover:text-teal-300 transition-colors">Audit Trails</a></li>
              <li><a href="#agent-integration" className="hover:text-teal-300 transition-colors">Developer SDK</a></li>
            </ul>
          </div>

          <div className="space-y-2">
            <span className="text-white font-bold block uppercase tracking-wider text-[11px]">Resources</span>
            <ul className="space-y-1.5 text-slate-400">
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-teal-300 transition-colors flex items-center gap-1">
                  GitHub <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#agent-integration" className="hover:text-teal-300 transition-colors flex items-center gap-1">
                  Documentation <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-xs font-mono text-slate-400 md:text-right">
          <div>© 2026 Sentinel Layer.</div>
          <div className="text-[11px] text-slate-500 mt-1">Autonomous Runtime Firewall</div>
        </div>

      </div>
    </footer>
  );
};
