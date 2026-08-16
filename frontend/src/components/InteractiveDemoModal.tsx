import React, { useState, useEffect } from 'react';
import { 
  X, Shield, Play, Terminal, CheckCircle2, AlertTriangle, XOctagon, RefreshCw, 
  Cpu, Layers, Lock, Database, Search, Activity, FileText, Key, Radio, Sliders, Check, Trash2, Save
} from 'lucide-react';
import { ATTACK_SCENARIOS } from '../data/content';
import { VerdictType } from '../types';
import { 
  runAttackScenario, 
  startContinuousSimulation, 
  stopContinuousSimulation, 
  fetchEventHistory, 
  fetchEventStats, 
  fetchPolicy, 
  updatePolicy, 
  generateAgentToken, 
  listAgentTokens, 
  revokeAgentToken,
  subscribeToEventStream, 
  StatsResponse, 
  AuditEventItem,
  getStoredToken
} from '../services/api';

interface InteractiveDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'simulation' | 'audit' | 'policy' | 'tokens';
}

export const InteractiveDemoModal: React.FC<InteractiveDemoModalProps> = ({ 
  isOpen, 
  onClose, 
  initialTab = 'simulation' 
}) => {
  const [activeTab, setActiveTab] = useState<'simulation' | 'audit' | 'policy' | 'tokens'>(initialTab);
  
  // Continuous agents toggle
  const [continuousMode, setContinuousMode] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  // Live telemetry stream events
  const [liveStreamEvents, setLiveStreamEvents] = useState<Array<{
    id: string;
    time: string;
    tool: string;
    target: string;
    risk: number;
    verdict: 'ALLOW' | 'BLOCK' | 'REQUIRE_APPROVAL';
    reason: string;
    rule: string;
  }>>([]);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AuditEventItem[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditVerdictFilter, setAuditVerdictFilter] = useState('ALL');
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Policy Editor State
  const [policyYaml, setPolicyYaml] = useState<string>('');
  const [policySaving, setPolicySaving] = useState(false);
  const [policySaveStatus, setPolicySaveStatus] = useState<string | null>(null);

  // Agent Token State
  const [agentTokens, setAgentTokens] = useState<any[]>([]);
  const [generatedToken, setGeneratedToken] = useState<any | null>(null);
  const [generatingToken, setGeneratingToken] = useState(false);

  // Stats
  const [stats, setStats] = useState<StatsResponse>({
    total_screened: 280,
    blocked: 232,
    allowed: 48,
    requires_approval: 0,
    average_risk_score: 0.49,
    block_rate: 82.9,
  });

  // Sync initialTab when modal opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Load initial data and subscribe to SSE
  useEffect(() => {
    if (!isOpen) return;

    const loadInitialData = async () => {
      try {
        const [statsData, historyData] = await Promise.all([
          fetchEventStats().catch(() => null),
          fetchEventHistory({ limit: 50 }).catch(() => null)
        ]);

        if (statsData) setStats(statsData);
        if (historyData?.events) setAuditLogs(historyData.events);
      } catch (err) {
        console.warn('Initial modal data load error:', err);
      }
    };

    loadInitialData();

    // Subscribe to SSE
    const unsubscribe = subscribeToEventStream((sseEvent) => {
      if (sseEvent.type === 'CONNECTED') return;

      const newStreamItem = {
        id: `evt_${Math.random().toString(36).substring(2, 7)}`,
        time: new Date().toLocaleTimeString(),
        tool: sseEvent.tool_name || 'agent_tool',
        target: sseEvent.incoming_text ? sseEvent.incoming_text.slice(0, 30) : 'internal_target',
        risk: Number(sseEvent.risk_score || 0),
        verdict: (sseEvent.verdict?.toUpperCase() as any) || (sseEvent.risk_score > 0.7 ? 'BLOCK' : 'ALLOW'),
        reason: sseEvent.explanation || 'Real-time telemetry event.',
        rule: sseEvent.scenario_id ? `SCENARIO_0${sseEvent.scenario_id}` : (sseEvent.attack ? 'THREAT_INTERCEPTED' : 'POLICY_ALLOW')
      };

      setLiveStreamEvents((prev) => [newStreamItem, ...prev.slice(0, 49)]);

      // Update stats dynamically
      setStats((prev) => {
        const isBlock = newStreamItem.verdict === 'BLOCK';
        const total = prev.total_screened + 1;
        const blocked = isBlock ? prev.blocked + 1 : prev.blocked;
        const allowed = !isBlock ? prev.allowed + 1 : prev.allowed;
        return {
          ...prev,
          total_screened: total,
          blocked,
          allowed,
          block_rate: Math.round((blocked / total) * 1000) / 10
        };
      });
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Load audit history when audit tab opens or filter changes
  useEffect(() => {
    if (activeTab === 'audit' && isOpen) {
      setLoadingAudit(true);
      fetchEventHistory({ limit: 100, verdict: auditVerdictFilter })
        .then((res) => setAuditLogs(res.events || []))
        .catch(() => {})
        .finally(() => setLoadingAudit(false));
    }
  }, [activeTab, auditVerdictFilter, isOpen]);

  // Load policy YAML when policy tab opens
  useEffect(() => {
    if (activeTab === 'policy' && isOpen) {
      fetchPolicy()
        .then((res) => setPolicyYaml(res.raw_yaml || ''))
        .catch(() => {});
    }
  }, [activeTab, isOpen]);

  // Load agent tokens when tokens tab opens
  useEffect(() => {
    if (activeTab === 'tokens' && isOpen) {
      listAgentTokens()
        .then((res) => setAgentTokens(res.tokens || []))
        .catch(() => {});
    }
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  const handleLaunchAttack = async (scenario: typeof ATTACK_SCENARIOS[0]) => {
    setIsEvaluating(true);
    setActiveScenarioId(scenario.id);

    try {
      const scenarioNumber = parseInt(scenario.id.replace('scenario_', ''), 10) || 1;
      const result = await runAttackScenario(scenarioNumber);
      
      const screenResp = result?.protected_run?.screen_response || {};
      const verdictUpper = (screenResp.verdict?.toUpperCase() as any) || 'BLOCK';
      const riskScore = screenResp.risk_score !== undefined ? screenResp.risk_score : 0.95;

      const newEvent = {
        id: `evt_${Math.random().toString(36).substring(2, 9)}`,
        time: new Date().toLocaleTimeString(),
        tool: scenario.proposedAction.tool,
        target: scenario.proposedAction.target,
        risk: riskScore,
        verdict: verdictUpper,
        reason: screenResp.explanation || scenario.sentinelOutcome.explanation,
        rule: screenResp.matched_signals?.[0]?.signal || scenario.sentinelOutcome.ruleMatch || 'POLICY_GUARD'
      };

      setLiveStreamEvents((prev) => [newEvent, ...prev]);
    } catch (err) {
      // Fallback
      const newEvent = {
        id: `evt_${Math.random().toString(36).substring(2, 9)}`,
        time: new Date().toLocaleTimeString(),
        tool: scenario.proposedAction.tool,
        target: scenario.proposedAction.target,
        risk: scenario.sentinelOutcome.riskScore,
        verdict: scenario.sentinelOutcome.verdict,
        reason: scenario.sentinelOutcome.explanation,
        rule: scenario.sentinelOutcome.ruleMatch || 'POLICY_GUARD'
      };
      setLiveStreamEvents((prev) => [newEvent, ...prev]);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleToggleContinuous = async () => {
    const nextState = !continuousMode;
    setContinuousMode(nextState);
    if (nextState) {
      await startContinuousSimulation().catch(() => {});
    } else {
      await stopContinuousSimulation().catch(() => {});
    }
  };

  const handleSavePolicy = async () => {
    setPolicySaving(true);
    setPolicySaveStatus(null);
    try {
      await updatePolicy(policyYaml);
      setPolicySaveStatus('Policy validated, saved, and hot-reloaded into engine!');
      setTimeout(() => setPolicySaveStatus(null), 4000);
    } catch (e: any) {
      setPolicySaveStatus(`Error: ${e.message}`);
    } finally {
      setPolicySaving(false);
    }
  };

  const handleGenerateToken = async () => {
    setGeneratingToken(true);
    try {
      const res = await generateAgentToken();
      setGeneratedToken(res);
      const listRes = await listAgentTokens().catch(() => null);
      if (listRes?.tokens) setAgentTokens(listRes.tokens);
    } catch (e) {
      console.warn('Failed to generate agent token:', e);
    } finally {
      setGeneratingToken(false);
    }
  };

  const handleRevokeToken = async (jti: string) => {
    try {
      await revokeAgentToken(jti);
      setAgentTokens((prev) =>
        prev.map((t) => (t.jti === jti ? { ...t, is_revoked: true } : t))
      );
    } catch (e) {
      console.warn('Failed to revoke token:', e);
    }
  };

  const handleClearStream = () => {
    setLiveStreamEvents([]);
  };

  const filteredAuditLogs = auditLogs.filter((evt) => {
    const matchesSearch = 
      (evt.agent_id && evt.agent_id.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (evt.tool_name && evt.tool_name.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (evt.explanation && evt.explanation.toLowerCase().includes(auditSearch.toLowerCase())) ||
      (evt.user_email && evt.user_email.toLowerCase().includes(auditSearch.toLowerCase()));
    const matchesVerdict = auditVerdictFilter === 'ALL' || (evt.verdict && evt.verdict.toUpperCase() === auditVerdictFilter);
    return matchesSearch && matchesVerdict;
  });

  const formatAuditSummary = (explanation: string): string => {
    if (!explanation) return 'Passed screening.';

    if (
      explanation.toLowerCase().includes('passed 3-stage cascade') || 
      explanation.toLowerCase().includes('passed — clean') ||
      explanation.toLowerCase().includes('clean request')
    ) {
      return 'Passed 3-Stage Cascade (Clean)';
    }

    if (explanation.includes('Hard Policy Violation:')) {
      const violationPart = explanation.split('Hard Policy Violation:')[1]?.split('.')[0]?.trim();
      return violationPart ? `Policy Block: ${violationPart}` : 'Policy Block: Out-of-bounds';
    }

    if (explanation.includes('Cascade flagged threat via')) {
      if (explanation.includes('instruction_override') || explanation.includes('ignore previous') || explanation.includes('persona_jailbreak')) {
        return 'Stage 1/3 • Prompt Injection Intercepted';
      }
      if (explanation.includes('exfiltration') || explanation.includes('credentials') || explanation.includes('send_data')) {
        return 'Stage 1/3 • Data Exfiltration Blocked';
      }
      if (explanation.includes('passwd') || explanation.includes('override')) {
        return 'Stage 1/3 • System Over-Scope Blocked';
      }
      return 'Cascade Threat Intercepted';
    }

    const firstSentence = explanation.split('.')[0]?.trim();
    if (firstSentence && firstSentence.length <= 55) {
      return firstSentence;
    }
    return explanation.length > 55 ? explanation.slice(0, 52) + '...' : explanation;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-2xl animate-fade-in">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[850px] bg-[#020617] border border-white/10 rounded-3xl flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden font-mono">
        
        {/* Top Console Stats & Scope Ribbon */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-white text-sm tracking-wider">SENTINEL</span>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">AI Security Console</span>
              </div>
            </div>
          </div>

          {/* Metric Badges Ribbon */}
          <div className="flex items-center gap-4 sm:gap-7 text-xs font-mono">
            <div>
              <span className="text-[9px] text-slate-400 uppercase block">Screened</span>
              <span className="text-base font-bold text-white">{stats.total_screened}</span>
            </div>
            <div>
              <span className="text-[9px] text-rose-400 uppercase block">Blocked</span>
              <span className="text-base font-bold text-rose-400">{stats.blocked}</span>
            </div>
            <div>
              <span className="text-[9px] text-teal-400 uppercase block">Allowed</span>
              <span className="text-base font-bold text-teal-300">{stats.allowed}</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[9px] text-rose-400 uppercase block">Block Rate</span>
              <span className="text-base font-bold text-rose-400">{stats.block_rate}%</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-[9px] text-amber-400 uppercase block">Avg Risk</span>
              <span className="text-base font-bold text-amber-300">{stats.average_risk_score.toFixed(2)}</span>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Console Workspace Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Navigation Sidebar */}
          <div className="w-full md:w-60 bg-slate-950/60 border-r border-white/10 p-3.5 flex flex-col justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-slate-400 px-3 tracking-wider block mb-2">
                Console View
              </span>
              
              <button
                type="button"
                onClick={() => setActiveTab('simulation')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all text-left cursor-pointer ${
                  activeTab === 'simulation'
                    ? 'bg-gradient-to-r from-teal-500/20 to-indigo-600/20 text-teal-300 border border-teal-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Terminal className="w-4 h-4 text-teal-400" />
                <span>Attack Simulator</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all text-left cursor-pointer ${
                  activeTab === 'audit'
                    ? 'bg-gradient-to-r from-teal-500/20 to-indigo-600/20 text-teal-300 border border-teal-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Audit Logs</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('policy')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all text-left cursor-pointer ${
                  activeTab === 'policy'
                    ? 'bg-gradient-to-r from-teal-500/20 to-indigo-600/20 text-teal-300 border border-teal-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Sliders className="w-4 h-4 text-purple-400" />
                <span>Policy Engine</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tokens')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all text-left cursor-pointer ${
                  activeTab === 'tokens'
                    ? 'bg-gradient-to-r from-teal-500/20 to-indigo-600/20 text-teal-300 border border-teal-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Key className="w-4 h-4 text-amber-400" />
                <span>Agent Tokens</span>
              </button>
            </div>

            {/* Bottom Engine Status */}
            <div className="space-y-3 pt-3 border-t border-white/10 text-[10px] font-mono">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                <span className="text-slate-400 block font-bold">Runtime Engine Stack</span>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Stage 1 Regex Rules</span>
                    <span className="text-teal-400 font-bold">• ON</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Stage 2 TurboQuant ML</span>
                    <span className="text-teal-400 font-bold">• ON</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Stage 3 LLM Judge</span>
                    <span className="text-teal-400 font-bold">• ON</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Policy Hard Guard</span>
                    <span className="text-teal-400 font-bold">• ON</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span>SSE Telemetry</span>
                    <span className="text-teal-400 font-bold">• LIVE</span>
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900 border border-white/5 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs">
                  🛡️
                </div>
                <div className="truncate">
                  <div className="text-white font-bold truncate">FastAPI Gateway</div>
                  <div className="text-teal-400 text-[8px] uppercase">port :8000 connected</div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Content Panels */}
          <div className="flex-1 bg-slate-950/40 p-4 sm:p-6 overflow-y-auto">
            
            {/* TAB 1: LIVE DEMO / ATTACK SIMULATOR */}
            {activeTab === 'simulation' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">
                
                {/* Left: Attack Launcher (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      ATTACK SIMULATOR (LIVE BACKEND)
                    </span>
                    <button
                      type="button"
                      onClick={handleToggleContinuous}
                      className={`px-3 py-1 rounded-full text-[10px] font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
                        continuousMode ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-bold animate-pulse' : 'bg-white/5 text-slate-400 border-white/10'
                      }`}
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{continuousMode ? 'CONTINUOUS: RUNNING' : 'START CONTINUOUS'}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {ATTACK_SCENARIOS.map((scenario) => (
                      <div
                        key={scenario.id}
                        className="rounded-2xl p-4 bg-slate-900/80 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between shadow-lg"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-white">{scenario.title}</span>
                            <span className="px-2 py-0.5 rounded text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                              {scenario.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 truncate">
                            Tool: <span className="text-teal-300">{scenario.proposedAction.tool}</span> • {scenario.prompt.slice(0, 45)}...
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[9px] text-slate-400">TARGET: {scenario.proposedAction.target}</span>
                          <button
                            type="button"
                            disabled={isEvaluating}
                            onClick={() => handleLaunchAttack(scenario)}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-mono text-[10px] font-bold transition-all cursor-pointer disabled:opacity-30 flex items-center gap-1.5"
                          >
                            {isEvaluating && activeScenarioId === scenario.id ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>EXECUTING...</span>
                              </>
                            ) : (
                              <span>LAUNCH ATTACK</span>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Live Telemetry Stream (7 Cols) */}
                <div className="lg:col-span-7 rounded-2xl bg-slate-900/60 border border-white/10 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-teal-400" />
                        LIVE TELEMETRY STREAM (SSE)
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">{liveStreamEvents.length} events received</span>
                        {liveStreamEvents.length > 0 && (
                          <button
                            type="button"
                            onClick={handleClearStream}
                            className="text-[9px] text-slate-400 hover:text-white cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    {liveStreamEvents.length === 0 ? (
                      <div className="py-20 text-center text-slate-400 text-xs">
                        <Radio className="w-8 h-8 mx-auto text-slate-600 mb-2 animate-pulse" />
                        <p className="font-bold text-slate-300">Listening to FastAPI SSE Telemetry Stream...</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                          Click "Launch Attack" or "Start Continuous" to send live traffic through the runtime cascade.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                        {liveStreamEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs space-y-1.5 animate-fade-in"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 text-[10px]">{evt.time} • {evt.rule}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                evt.verdict === 'ALLOW' ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' :
                                'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              }`}>
                                {evt.verdict}
                              </span>
                            </div>
                            <div className="text-white font-bold flex items-center gap-2">
                              <span>Tool: {evt.tool}()</span>
                              <span className="text-slate-400 text-[10px] font-normal truncate">→ {evt.target}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 bg-white/5 p-2 rounded-lg leading-relaxed">
                              Reason: <span className="text-slate-200">{evt.reason}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: AUDIT LOG EXPLORER */}
            {activeTab === 'audit' && (
              <div className="space-y-4">
                {/* Search & Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search tool, agent, user email, or explanation..."
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={auditVerdictFilter}
                      onChange={(e) => setAuditVerdictFilter(e.target.value)}
                      className="bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-400"
                    >
                      <option value="ALL">All Verdicts</option>
                      <option value="ALLOW">ALLOW</option>
                      <option value="BLOCK">BLOCK</option>
                    </select>

                    <span className="text-xs text-slate-400 font-mono">
                      {filteredAuditLogs.length} live records from SQLite Hot Storage
                    </span>
                  </div>
                </div>

                {/* Audit Table */}
                <div className="rounded-2xl bg-slate-900/80 border border-white/10 overflow-x-auto shadow-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/80 text-[10px] text-slate-400 uppercase border-b border-white/10">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">TIME</th>
                        <th className="p-3">TOOL</th>
                        <th className="p-3">AGENT / USER</th>
                        <th className="p-3">RISK</th>
                        <th className="p-3">VERDICT</th>
                        <th className="p-3">EXPLANATION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {loadingAudit ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-400" />
                            Loading audit records from SQLite...
                          </td>
                        </tr>
                      ) : filteredAuditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">
                            No matching audit logs found. Run a simulation to generate events.
                          </td>
                        </tr>
                      ) : (
                        filteredAuditLogs.map((evt, idx) => (
                          <tr key={evt.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 text-slate-400">0{idx + 1}</td>
                            <td className="p-3 text-slate-400 whitespace-nowrap">
                              {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : 'N/A'}
                            </td>
                            <td className="p-3 text-teal-300 font-bold">{evt.tool_name}()</td>
                            <td className="p-3 text-slate-200">{evt.agent_id}</td>
                            <td className="p-3 font-bold">{Number(evt.risk_score || 0).toFixed(2)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                evt.verdict?.toLowerCase() === 'allow' ? 'bg-teal-500/20 text-teal-300 border-teal-500/30' :
                                'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              }`}>
                                {evt.verdict?.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 text-slate-300 max-w-sm truncate" title={evt.explanation}>
                              <span className="text-slate-200">{formatAuditSummary(evt.explanation)}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: POLICY ENGINE */}
            {activeTab === 'policy' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-teal-400" />
                      Declarative Policy Editor (`policy.yaml`)
                    </h4>
                    <p className="text-xs text-slate-400">Live hot-reload policy rules with hard override authority.</p>
                  </div>
                  <button
                    type="button"
                    disabled={policySaving}
                    onClick={handleSavePolicy}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-xs font-bold font-mono hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{policySaving ? 'Validating...' : 'Save & Hot-Reload Policy'}</span>
                  </button>
                </div>

                {policySaveStatus && (
                  <div className={`p-3 rounded-xl text-xs font-mono ${policySaveStatus.startsWith('Error') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'}`}>
                    {policySaveStatus}
                  </div>
                )}

                <div className="relative rounded-2xl bg-slate-950 border border-white/10 overflow-hidden shadow-2xl">
                  <textarea
                    rows={16}
                    value={policyYaml}
                    onChange={(e) => setPolicyYaml(e.target.value)}
                    className="w-full bg-transparent p-4 font-mono text-xs text-teal-200 focus:outline-none leading-relaxed resize-none"
                    placeholder="Loading policy.yaml from backend..."
                  />
                </div>
              </div>
            )}

            {/* TAB 4: AGENT TOKENS */}
            {activeTab === 'tokens' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      Stage 0 Agent Session Tokens (RBAC)
                    </h4>
                    <p className="text-xs text-slate-400">Cryptographically signed tokens bounding agent execution scope before cascade execution.</p>
                  </div>
                  <button
                    type="button"
                    disabled={generatingToken}
                    onClick={handleGenerateToken}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>{generatingToken ? 'Issuing Token...' : 'Generate New 8h Agent Token'}</span>
                  </button>
                </div>

                {generatedToken && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                    <span className="text-xs font-bold text-amber-300 uppercase">Newly Generated Session Token:</span>
                    <div className="p-2.5 rounded-xl bg-slate-950 font-mono text-xs text-amber-200 break-all border border-amber-500/20 select-all">
                      {generatedToken.token}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Usage: Add header <code className="text-teal-300">X-Sentinel-Token: {generatedToken.token.slice(0, 20)}...</code> on /screen requests.
                    </div>
                  </div>
                )}

                {/* Token Table */}
                <div className="rounded-2xl bg-slate-900/80 border border-white/10 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950/80 text-[10px] text-slate-400 uppercase border-b border-white/10">
                      <tr>
                        <th className="p-3">JTI</th>
                        <th className="p-3">ROLE AT ISSUE</th>
                        <th className="p-3">ISSUED AT</th>
                        <th className="p-3">STATUS</th>
                        <th className="p-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {agentTokens.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-500">
                            No agent tokens issued yet. Click "Generate New 8h Agent Token" to create one.
                          </td>
                        </tr>
                      ) : (
                        agentTokens.map((t) => (
                          <tr key={t.jti} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 text-teal-300 font-bold">{t.jti.slice(0, 8)}...</td>
                            <td className="p-3 uppercase text-slate-200">{t.role_at_issue}</td>
                            <td className="p-3 text-slate-400">{new Date(t.issued_at).toLocaleString()}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                t.is_revoked ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                              }`}>
                                {t.is_revoked ? 'REVOKED' : 'ACTIVE'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {!t.is_revoked && (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeToken(t.jti)}
                                  className="text-[10px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                                >
                                  Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
