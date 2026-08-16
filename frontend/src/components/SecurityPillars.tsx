import React from 'react';
import { Search, BrainCircuit, KeyRound, ShieldAlert, Cpu, ArrowUpRight } from 'lucide-react';

export const SecurityPillars: React.FC = () => {
  const pillars = [
    {
      num: '01',
      title: 'DETECT',
      subtitle: 'Signals before execution',
      description: 'Kyron analyzes incoming content and proposed actions using sub-millisecond regex rules and quantized semantic detection before anything reaches the underlying tool.',
      icon: Search,
      badge: 'SUB-MS RULES + VECTOR ML',
      metric: '< 1.5ms Latency',
      accent: 'border-white/10'
    },
    {
      num: '02',
      title: 'REASON',
      subtitle: 'Investigate the ambiguous',
      description: 'When automated detectors disagree or semantic confidence falls into an uncertain band, Kyron selectively escalates the payload to an LLM security judge for deep intent arbitration.',
      icon: BrainCircuit,
      badge: 'GROQ + LLAMA 3.1 8B',
      metric: 'Selective Escalation',
      accent: 'border-white/10'
    },
    {
      num: '03',
      title: 'AUTHORIZE',
      subtitle: 'From signals to decision',
      description: 'Risk detection is only half the problem. Deterministic policy enforcement evaluates whether the requested tool, filesystem path, network domain, or session limit is permitted.',
      icon: KeyRound,
      badge: 'HARD POLICY ENFORCEMENT',
      metric: 'Zero Privilege Drift',
      accent: 'border-teal-500/40 bg-white/10'
    },
    {
      num: '04',
      title: 'ENFORCE',
      subtitle: 'Execution gatekeeper',
      description: 'Allow, require human approval, or block. Kyron returns a machine-readable verdict with cryptographically verifiable audit trails that the agent-side runtime executes.',
      icon: ShieldAlert,
      badge: 'ALLOW / APPROVAL / BLOCK',
      metric: 'Pre-Execution Stop',
      accent: 'border-white/10'
    }
  ];

  return (
    <section id="security-pillars" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">ONE REQUEST. MULTIPLE DEFENSES.</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
            Every action passes through a security stack.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
            Four specialized security tiers inspect, contextualize, arbitrate, and enforce runtime boundaries on every autonomous agent action.
          </p>
        </div>

        {/* 4 Equal Architectural Modules */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-7 flex flex-col justify-between hover:bg-white/10 hover:border-white/20 transition-all relative overflow-hidden group shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-teal-400 mb-4">
                    <span className="text-lg font-bold font-mono text-teal-400">{pillar.num}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300 backdrop-blur-sm">
                      {pillar.metric}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors backdrop-blur-sm shadow-md">
                    <Icon className="w-5 h-5 text-teal-300 group-hover:text-white transition-colors" />
                  </div>

                  <h3 className="text-xl font-display font-bold text-white tracking-wide">
                    {pillar.title}
                  </h3>
                  <div className="text-xs font-mono text-teal-400/90 mt-1 mb-3">
                    {pillar.subtitle}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-slate-300 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 block text-center truncate backdrop-blur-sm">
                    {pillar.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
