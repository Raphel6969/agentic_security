import React, { useState, useEffect } from 'react';
import { Shield, Activity, Radio, AlertOctagon, CheckCircle2, Search, Sliders, RefreshCw, Eye, Lock } from 'lucide-react';
import { MOCK_SOC_EVENTS } from '../data/content';
import { SocAuditEvent } from '../types';
import { fetchEventHistory, fetchEventStats, subscribeToEventStream, StatsResponse, AuditEventItem } from '../services/api';

export const SocControlRoom: React.FC = () => {
  const [events, setEvents] = useState<SocAuditEvent[]>(MOCK_SOC_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState<SocAuditEvent>(MOCK_SOC_EVENTS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [policyStrictMode, setPolicyStrictMode] = useState(true);
  const [stats, setStats] = useState<StatsResponse>({
    total_screened: 280,
    blocked: 232,
    allowed: 48,
    requires_approval: 0,
    average_risk_score: 0.49,
    block_rate: 82.9,
  });

  const transformApiEvent = (item: AuditEventItem): SocAuditEvent => {
    return {
      id: `EVT-${item.id}`,
      timestamp: item.timestamp ? new Date(item.timestamp.endsWith('Z') || item.timestamp.includes('+') ? item.timestamp : `${item.timestamp}Z`).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : 'Just now',
      agentId: item.agent_id || 'toy_agent_sandbox',
      sessionId: item.session_id || 'sess_default',
      tool: item.tool_name || 'unknown_tool',
      riskScore: Number(item.risk_score || 0),
      verdict: (item.verdict?.toUpperCase() as any) || 'ALLOW',
      explanation: item.explanation || 'Screened via Sentinel 3-Stage Cascade',
      policyReason: item.policy_reason || (item.policy_allowed ? 'Allowed by declarative policy.' : 'Blocked by policy rule.'),
      matchedSignals: Array.isArray(item.matched_signals)
        ? item.matched_signals.map((s) => (typeof s === 'string' ? s : s.signal || s.stage || JSON.stringify(s)))
        : []
    };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [historyData, statsData] = await Promise.all([
          fetchEventHistory({ limit: 50 }).catch(() => null),
          fetchEventStats().catch(() => null)
        ]);

        if (historyData && historyData.events?.length > 0) {
          const transformed = historyData.events.map(transformApiEvent);
          setEvents(transformed);
          setSelectedEvent(transformed[0]);
        }
        if (statsData) {
          setStats(statsData);
        }
      } catch (e) {
        // Fallback to initial mock if server is warming
      }
    };

    loadData();

    // Subscribe to live SSE events
    const unsubscribe = subscribeToEventStream((sseEvent) => {
      if (sseEvent.type === 'CONNECTED') return;

      const liveSocEvent: SocAuditEvent = {
        id: `EVT-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
        agentId: sseEvent.agent_id || 'live_stream_agent',
        sessionId: sseEvent.session_id || `sess_${Date.now().toString().slice(-4)}`,
        tool: sseEvent.tool_name || 'screen_tool',
        riskScore: Number(sseEvent.risk_score || 0),
        verdict: (sseEvent.verdict?.toUpperCase() as any) || (sseEvent.risk_score > 0.7 ? 'BLOCK' : 'ALLOW'),
        explanation: sseEvent.explanation || 'Real-time telemetry event received.',
        policyReason: sseEvent.policy_reason || 'Live rule evaluation.',
        matchedSignals: sseEvent.matched_signals || [sseEvent.attack ? 'THREAT_DETECTED' : 'NORMAL_OPERATION']
      };

      setEvents((prev) => [liveSocEvent, ...prev.slice(0, 49)]);
      setSelectedEvent(liveSocEvent);
    });

    return () => unsubscribe();
  }, []);

  // Filter events
  const filteredEvents = events.filter(
    (e) =>
      e.agentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tool.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.verdict.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <section id="soc-control-room" className="py-24 px-4 sm:px-6 lg:px-8 relative border-t border-white/5 bg-transparent">
      {/* Ambient Lighting */}
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Header */}
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-mono mb-4 border border-teal-500/20 backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">SECURITY OPERATIONS</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold text-white tracking-tight leading-[1.18]">
            Don't just block threats.{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 via-white to-slate-400 block sm:inline">
              Understand them.
            </span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300/90 leading-relaxed font-sans">
            Every screening decision becomes a live security event that can be monitored, investigated, and audited from the Sentinel control room.
          </p>
        </div>

        {/* SOC Dashboard Interface Panel */}
        <div className="mt-14 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          
          {/* Top Control Bar with Live Status */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-teal-400 animate-ping" />
              <div>
                <div className="text-xs font-mono font-bold text-white flex items-center gap-2">
                  <span>SENTINEL SOC COMMAND CENTER</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-semibold border border-teal-500/30">LIVE FEED (SSE)</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">Active Gateway: cluster-us-east-01</span>
              </div>
            </div>

            {/* Policy Strict Mode Toggle */}
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-slate-400">Default Deny Policy:</span>
              <button
                type="button"
                onClick={() => setPolicyStrictMode(!policyStrictMode)}
                className={`px-3.5 py-1 rounded-full border transition-all cursor-pointer backdrop-blur-md ${
                  policyStrictMode
                    ? 'bg-gradient-to-r from-teal-500 to-indigo-600 text-white border-teal-400 shadow-sm'
                    : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                }`}
              >
                {policyStrictMode ? 'STRICT (ENFORCED)' : 'LEARNING MODE'}
              </button>
            </div>
          </div>

          {/* 3-Column SOC Operations Grid */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Column 1: Live Telemetry Stream (4 Cols) */}
            <div className="lg:col-span-4 rounded-2xl bg-slate-950/60 p-5 border border-white/10 flex flex-col justify-between backdrop-blur-md">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <span className="text-xs font-mono text-slate-200 font-bold flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-teal-400" />
                    LIVE TELEMETRY
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{events.length} EVENTS</span>
                </div>

                {/* Search Bar */}
                <div className="relative mb-3">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter agent, tool, verdict..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                  />
                </div>

                {/* Events List */}
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {filteredEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-3 rounded-xl border text-xs font-mono cursor-pointer transition-all ${
                        selectedEvent.id === evt.id
                          ? 'bg-white/15 border-teal-400 shadow-md shadow-teal-500/10'
                          : 'bg-white/5 border-white/5 hover:border-white/15 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-[10px]">{evt.timestamp}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          evt.verdict === 'ALLOW' ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' :
                          evt.verdict === 'BLOCK' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                          {evt.verdict}
                        </span>
                      </div>
                      <div className="text-white font-semibold truncate">{evt.agentId}</div>
                      <div className="text-[11px] text-teal-300 flex justify-between mt-1">
                        <span>{evt.tool}()</span>
                        <span className="text-slate-400">Risk: <span className="text-white font-bold">{evt.riskScore}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>Auto-refreshing via SSE</span>
                <RefreshCw className="w-3 h-3 animate-spin text-teal-400" />
              </div>
            </div>

            {/* Column 2: Event Deep Inspector (5 Cols) */}
            <div className="lg:col-span-5 rounded-2xl bg-white/5 p-6 border border-teal-500/30 flex flex-col justify-between backdrop-blur-md shadow-lg">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <span className="text-xs font-mono text-slate-200 font-bold">
                    AUDIT INSPECTOR :: {selectedEvent.id}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{selectedEvent.sessionId}</span>
                </div>

                <div className="space-y-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex justify-between backdrop-blur-sm">
                    <span className="text-slate-400">Agent Origin:</span>
                    <span className="text-white font-bold">{selectedEvent.agentId}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 flex justify-between backdrop-blur-sm">
                    <span className="text-slate-400">Target Tool:</span>
                    <span className="text-teal-300 font-bold">{selectedEvent.tool}()</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-sm">
                    <span className="text-slate-400 block mb-1">Matched Security Signals:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedEvent.matchedSignals.map((sig, i) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] border border-teal-500/30">
                          {sig}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-sm">
                    <span className="text-slate-400 block mb-1">Policy Reason:</span>
                    <p className="text-white text-xs leading-relaxed">{selectedEvent.policyReason}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 backdrop-blur-sm">
                    <span className="text-slate-400 block mb-1">Verdict Explanation:</span>
                    <p className="text-xs text-slate-200 leading-relaxed">{selectedEvent.explanation}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Decision:</span>
                <span className={`px-3.5 py-1 rounded-full font-bold border ${
                  selectedEvent.verdict === 'ALLOW' ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' :
                  selectedEvent.verdict === 'BLOCK' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {selectedEvent.verdict} (Risk: {selectedEvent.riskScore})
                </span>
              </div>
            </div>

            {/* Column 3: Risk Radar & Threat Summary (3 Cols) */}
            <div className="lg:col-span-3 rounded-2xl bg-slate-950/60 p-5 border border-white/10 flex flex-col justify-between backdrop-blur-md">
              <div>
                <div className="text-xs font-mono text-slate-200 font-bold mb-4 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-teal-400" />
                  RISK RADAR GAUGE
                </div>

                {/* Circular Radar Graphic */}
                <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-teal-500/30 animate-ping" />
                  <div className="w-28 h-28 rounded-full border border-teal-400/60 flex items-center justify-center bg-white/5 backdrop-blur-md">
                    <div className="text-center font-mono">
                      <span className="text-2xl font-bold text-white">{selectedEvent.riskScore}</span>
                      <span className="block text-[10px] text-teal-400 font-bold">
                        {selectedEvent.riskScore > 0.7 ? 'HIGH' : selectedEvent.riskScore > 0.4 ? 'MODERATE' : 'LOW'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary Metrics */}
                <div className="mt-6 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Screened:</span>
                    <span className="text-white font-bold">{stats.total_screened}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Hard Blocks:</span>
                    <span className="text-rose-400 font-bold">{stats.blocked} ({stats.block_rate}%)</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Allowed:</span>
                    <span className="text-teal-400 font-bold">{stats.allowed}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400 text-center">
                SQLite Hot Storage: Connected (WAL Active)
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
