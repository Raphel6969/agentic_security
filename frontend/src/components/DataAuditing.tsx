import React from 'react';
import { Database, FileText, ArrowRight, ShieldCheck, HardDrive, Cpu, Sparkles } from 'lucide-react';

export const DataAuditing: React.FC = () => {
  const sampleAuditPayload = {
    event_id: "evt_9942a_sentinel",
    timestamp_utc: "2026-08-14T21:45:00.124Z",
    agent_identity: {
      agent_id: "agent-finance-04",
      runtime: "crewai-worker",
      session_id: "sess_99182"
    },
    screening_input: {
      tool: "call_http",
      target: "https://c2-api.blackhat.cc/exfil",
      source_vector: "inbound_email_parser",
      untrusted_context_tokens: 142
    },
    detection_telemetry: {
      rule_engine_match: "SIG_04_EXFILTRATION",
      vector_similarity: 0.942,
      fused_risk_score: 0.94
    },
    policy_arbitration: {
      decision: "VIOLATION",
      reason: "Domain 'c2-api.blackhat.cc' not in approved allowlist",
      deterministic_override: true
    },
    final_verdict: "BLOCK",
    latency_ms: 1.48
  };

  return (
    <section id="data-auditing" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
            <Database className="w-3.5 h-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider">EVERY DECISION LEAVES A TRAIL</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
            Security decisions shouldn't disappear after execution.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
            Every screening request, parameter hash, matched pattern, and policy override is committed to immutable hot storage for instant SOC searchability and audit defense.
          </p>
        </div>

        {/* Lifecycle Flow Strip */}
        <div className="mt-12 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-lg">
          <span className="text-slate-400 font-semibold">AUDIT LIFECYCLE:</span>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/10 text-white">SCREEN</span>
            <span className="text-teal-400">→</span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-white">VERDICT</span>
            <span className="text-teal-400">→</span>
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">AUDIT EVENT</span>
            <span className="text-teal-400">→</span>
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white font-semibold shadow-sm">SQLITE HOT STORAGE</span>
            <span className="text-teal-400">→</span>
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold">SOC DASHBOARD</span>
          </div>
        </div>

        {/* JSON Schema Explorer & Migration Architecture */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* JSON Schema Box (7 Cols) */}
          <div className="lg:col-span-7 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950/60 border-b border-white/10 backdrop-blur-md">
              <span className="text-xs font-mono text-slate-200 flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-teal-400" />
                AUDIT_RECORD_SCHEMA.json
              </span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold">
                IMMUTABLE
              </span>
            </div>
            <div className="p-6 overflow-x-auto text-xs font-mono text-slate-200 bg-slate-950/80 leading-relaxed max-h-[380px] backdrop-blur-sm">
              <pre><code>{JSON.stringify(sampleAuditPayload, null, 2)}</code></pre>
            </div>
          </div>

          {/* Storage Hierarchy & Future Postgres Upgrade (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Current Hot Storage */}
            <div className="rounded-2xl bg-white/10 border border-teal-500/30 backdrop-blur-xl p-6 shadow-lg shadow-teal-500/10">
              <div className="flex items-center justify-between text-xs font-mono text-teal-300 mb-2 font-bold">
                <span className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-teal-400" />
                  CURRENT HOT STORAGE
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] border border-teal-500/30">PRODUCTION READY</span>
              </div>
              <h3 className="text-lg font-display font-semibold text-white">SQLite WAL-Mode</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Zero configuration, single-file hot storage with sub-millisecond synchronous write operations and concurrent read capability.
              </p>
            </div>

            {/* Future Long-Term Storage */}
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 shadow-lg hover:bg-white/10 transition-all">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-400" />
                  ROADMAP UPGRADE PATH
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400">ENTERPRISE ARCHITECTURE</span>
              </div>
              <h3 className="text-lg font-display font-semibold text-white">PostgreSQL + Timescale</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Future streaming pipeline for multi-month forensic retention, SIEM export (Splunk/Datadog), and long-term organizational security analytics.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
