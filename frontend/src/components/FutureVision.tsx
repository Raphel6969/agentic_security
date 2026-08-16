import React from 'react';
import { Compass, Sparkles, GitMerge, Shield, Users, Layers, Cpu, ArrowDown } from 'lucide-react';

export const FutureVision: React.FC = () => {
  const roadmapItems = [
    {
      timeframe: 'TODAY',
      title: 'Prompt & Tool Screening',
      status: 'SHIPPED',
      badge: 'CURRENT RELEASE',
      description: '/screen API with 3-stage cascade, deterministic path/domain policies, and SQLite hot telemetry.'
    },
    {
      timeframe: 'NEXT',
      title: 'Deep Agent Framework Interceptors',
      status: 'IN PROGRESS',
      badge: 'SDK PIPELINE',
      description: 'Zero-code hooks for LangChain, CrewAI, AutoGen, and custom Python/TypeScript runtime loops.'
    },
    {
      timeframe: 'UPCOMING',
      title: 'Behavioral Multi-Hop Detection',
      status: 'PLANNED',
      badge: 'STATEFUL ML',
      description: 'Detecting stealthy multi-action attack chains that appear harmless in isolation but destructive in sequence.'
    },
    {
      timeframe: 'ROADMAP',
      title: 'Enterprise Governance & Multi-Agent RBAC',
      status: 'PLANNED',
      badge: 'ENTERPRISE',
      description: 'Agent-to-agent authentication tokens, departmental tool quotas, SIEM integrations, and tenant isolation.'
    },
    {
      timeframe: 'LONG TERM',
      title: 'OS-Level eBPF Runtime Enforcement',
      status: 'RESEARCH',
      badge: 'KERNEL SECURITY',
      description: 'Deep kernel-level interception via eBPF probes guaranteeing unbreakable host system containment.'
    }
  ];

  return (
    <section id="future-vision" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">WHERE THIS GOES NEXT</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
            From prompt firewall{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-white to-slate-400 block sm:inline">
              to agent runtime security.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
            As autonomous agents become multi-agent organizations operating critical software, Sentinel is expanding toward stateful behavioral analysis and kernel-level sandboxing.
          </p>
        </div>

        {/* Roadmap Timeline Progression */}
        <div className="mt-16 space-y-4">
          {roadmapItems.map((item, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-6 sm:p-7 border transition-all backdrop-blur-xl ${
                item.status === 'SHIPPED'
                  ? 'bg-white/10 border-teal-500/30 shadow-lg shadow-teal-500/10'
                  : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 shadow-md'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-teal-400">{item.timeframe}</span>
                  <span className="text-lg font-display font-bold text-white">{item.title}</span>
                </div>
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-bold self-start sm:self-auto border ${
                  item.status === 'SHIPPED'
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                    : 'bg-white/5 text-slate-300 border-white/10'
                }`}>
                  {item.badge}
                </span>
              </div>
              <p className="mt-3 text-xs sm:text-sm text-slate-400 leading-relaxed font-mono">
                {item.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
