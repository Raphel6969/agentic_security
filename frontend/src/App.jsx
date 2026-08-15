import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import SessionTokenPanel from './components/SessionTokenPanel.jsx';

// ── Hooks ───────────────────────────────────────────────────────────────────
function useStats(refreshMs = 2000) {
  const [stats, setStats] = useState({ total_screened: 0, blocked: 0, allowed: 0, requires_approval: 0, average_risk_score: 0, block_rate: 0 });
  const fetch_ = useCallback(async () => {
    try { const r = await fetch('/api/events/stats'); if (r.ok) setStats(await r.json()); } catch {}
  }, []);
  useEffect(() => { fetch_(); const t = setInterval(fetch_, refreshMs); return () => clearInterval(t); }, [fetch_, refreshMs]);
  return [stats, fetch_];
}

function useSSE() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const es = new EventSource('/api/events/stream');
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'CONNECTED') { setConnected(true); return; }
        setEvents(prev => [{ id: Date.now() + Math.random(), ts: new Date().toLocaleTimeString('en-US', { hour12: false }), ...d }, ...prev.slice(0, 299)]);
      } catch {}
    };
    return () => es.close();
  }, []);
  return [events, connected];
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const VERDICT_COLOR = { block: '#FF3D5A', allow: '#00FF94', require_approval: '#F59E0B' };
const SCENARIO_META = {
  1: { name: 'Jailbreak & Token Leak', tag: 'DAN persona injection', color: '#FF3D5A', tool: 'write_file', threat: 'Writes leaked env secrets to disk' },
  2: { name: 'Indirect Data Exfiltration', tag: 'Poisoned email injection', color: '#F59E0B', tool: 'call_http', threat: 'POSTs credentials to attacker domain' },
  3: { name: 'Over-Scope Policy Violation', tag: 'Clean text, malicious path', color: '#7C3AED', tool: 'write_file', threat: 'Overwrites /etc/passwd' },
};

function MetricNum({ label, value, color = '#F0F0F8', decimals = 0, suffix = '' }) {
  const display = typeof value === 'number' ? (decimals > 0 ? value.toFixed(decimals) : value.toLocaleString()) : value;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '0 1.75rem', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.575rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '1.625rem', fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.025em', transition: 'color 400ms ease' }}>
        {display}{suffix}
      </span>
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const c = VERDICT_COLOR[verdict] || '#F0F0F8';
  return (
    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.2rem 0.55rem', borderRadius: 4, background: `${c}14`, color: c, border: `1px solid ${c}28`, whiteSpace: 'nowrap' }}>
      {verdict}
    </span>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'demo', label: 'Live Demo', icon: '⚡' },
  { id: 'audit', label: 'Audit Log', icon: '▤' },
  { id: 'policy', label: 'Policy', icon: '◈' },
  { id: 'users', label: 'Users', icon: '◎', adminOnly: true },
];

function Sidebar({ tab, setTab, sseConnected }) {
  const { user, logout } = useAuth();
  const [showTokenPanel, setShowTokenPanel] = useState(false);
  const visibleNav = NAV.filter(n => !n.adminOnly || user?.role === 'admin');

  return (
    <aside style={{ width: 220, minHeight: '100vh', background: '#060914', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 10 }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '0.825rem', color: '#F0F0F8', letterSpacing: '-0.01em', lineHeight: 1 }}>SENTINEL</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.5rem', color: 'rgba(240,240,248,0.28)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>Runtime Firewall</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ padding: '0.4rem 0.875rem', fontFamily: 'JetBrains Mono', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.25)', fontWeight: 600, marginBottom: 2 }}>Operations</div>
        {visibleNav.map((n) => (
          <div key={n.id} onClick={() => setTab(n.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.55rem 0.875rem', borderRadius: 7, cursor: 'pointer', transition: 'all 180ms ease', fontSize: '0.8rem', fontWeight: 500, userSelect: 'none',
              color: tab === n.id ? '#00FF94' : 'rgba(240,240,248,0.4)',
              background: tab === n.id ? 'rgba(0,255,148,0.06)' : 'transparent',
              border: `1px solid ${tab === n.id ? 'rgba(0,255,148,0.12)' : 'transparent'}`,
            }}>
            <span style={{ fontSize: '0.9rem', opacity: tab === n.id ? 1 : 0.5 }}>{n.icon}</span>
            <span>{n.label}</span>
          </div>
        ))}
      </nav>

      {/* System status */}
      <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.25)', marginBottom: 8 }}>Stage Status</div>
        {[
          ['Rule Engine', true], ['ML Classifier', true], ['LLM Judge', true], ['Policy Engine', true], ['SSE Stream', sseConnected]
        ].map(([label, ok]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.38)' }}>{label}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', fontWeight: 700, color: ok ? '#00FF94' : '#FF3D5A', letterSpacing: '0.05em' }}>{ok ? '● LIVE' : '● ERR'}</span>
          </div>
        ))}
      </div>

      {/* Agent Token Panel toggle */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => setShowTokenPanel(p => !p)}
          style={{ width: '100%', padding: '0.65rem 1.25rem', background: showTokenPanel ? 'rgba(99,102,241,0.1)' : 'transparent', border: 'none', borderBottom: showTokenPanel ? '1px solid rgba(99,102,241,0.15)' : 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: showTokenPanel ? '#818cf8' : 'rgba(240,240,248,0.35)', fontSize: '0.75rem', fontWeight: 600, transition: 'all 150ms' }}
        >
          <span>⚡</span> Agent Token {showTokenPanel ? '▲' : '▼'}
        </button>
        {showTokenPanel && <SessionTokenPanel />}
      </div>

      {/* User info + logout */}
      {user && (
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc', fontSize: 11, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email}</div>
            <div style={{ fontSize: '0.58rem', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{user.role?.replace('_', ' ')}</div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'rgba(240,240,248,0.25)', cursor: 'pointer', fontSize: 14, padding: 4, borderRadius: 4 }} title="Logout">⏻</button>
        </div>
      )}
    </aside>
  );
}

// ── Live Demo Page ───────────────────────────────────────────────────────────
function LiveDemoPage({ events, onStatsChange }) {
  const [runningScenario, setRunningScenario] = useState(null);
  const [scenarioResult, setScenarioResult] = useState(null);
  const [continuous, setContinuous] = useState(false);
  const [error, setError] = useState(null);
  const [seedStatus, setSeedStatus] = useState(null);

  // Seed on mount
  useEffect(() => {
    fetch('/api/demo/seed', { method: 'POST' })
      .then(r => r.json())
      .then(d => { setSeedStatus(d); if (onStatsChange) onStatsChange(); })
      .catch(() => {});
  }, []);

  const runScenario = async (id) => {
    setRunningScenario(id);
    setScenarioResult(null);
    setError(null);
    try {
      const r = await fetch('/api/demo/run-scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario_id: id }) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setScenarioResult({ id, ...data });
      if (onStatsChange) onStatsChange();
    } catch (e) { setError(e.message); }
    finally { setRunningScenario(null); }
  };

  const toggleContinuous = async () => {
    if (continuous) {
      await fetch('/api/demo/continuous/stop', { method: 'POST' });
      setContinuous(false);
    } else {
      await fetch('/api/demo/continuous', { method: 'POST' });
      setContinuous(true);
    }
  };

  const screen = scenarioResult?.protected_run?.screen_response;
  const unprotected = scenarioResult?.unprotected_run;
  const meta = scenarioResult ? SCENARIO_META[scenarioResult.id] : null;

  // Filter SSE events relevant to demo
  const recentEvents = events.slice(0, 20);

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>

      {/* LEFT — Controls + Result ───────────────────────────────────────── */}
      <div style={{ flex: '0 0 420px', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflow: 'auto' }}>

        {/* Live Agent Mode toggle */}
        <div style={{ padding: '1rem 1.25rem', background: continuous ? 'rgba(0,255,148,0.05)' : 'rgba(255,255,255,0.02)', border: `1px solid ${continuous ? 'rgba(0,255,148,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '0.875rem', color: continuous ? '#00FF94' : '#F0F0F8', marginBottom: 3 }}>
              {continuous ? '● Live Agent Simulation Running' : 'Start Live Agent Simulation'}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.625rem', color: 'rgba(240,240,248,0.35)', letterSpacing: '0.05em' }}>
              {continuous ? 'Agent is making real calls — Sentinel intercepting live. Watch the stream →' : 'Simulates a real AI agent cycling through legitimate and malicious tool calls'}
            </div>
          </div>
          <button onClick={toggleContinuous}
            style={{ padding: '0.5rem 1.25rem', borderRadius: 7, background: continuous ? 'rgba(255,61,90,0.1)' : '#00FF94', border: continuous ? '1px solid rgba(255,61,90,0.3)' : 'none', color: continuous ? '#FF3D5A' : '#04060F', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 200ms ease', flexShrink: 0 }}>
            {continuous ? 'STOP' : 'START →'}
          </button>
        </div>

        {/* Manual scenario triggers */}
        <div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.575rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.28)', marginBottom: 10 }}>Manual Attack Scenarios</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3].map((id) => {
              const m = SCENARIO_META[id];
              const isRunning = runningScenario === id;
              return (
                <div key={id} style={{ padding: '0.875rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'border-color 200ms ease' }}
                  onClick={() => !runningScenario && runScenario(id)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = `${m.color}40`}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
                  <div style={{ width: 3, height: 40, borderRadius: 9999, background: m.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '0.8rem', fontWeight: 600, color: '#F0F0F8', marginBottom: 2 }}>{m.name}</div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.575rem', color: 'rgba(240,240,248,0.35)', letterSpacing: '0.05em' }}>
                      {m.tag} · <span style={{ color: m.color }}>{m.threat}</span>
                    </div>
                  </div>
                  <button disabled={!!runningScenario}
                    style={{ padding: '0.35rem 0.875rem', borderRadius: 6, background: isRunning ? 'rgba(124,58,237,0.2)' : '#7C3AED', color: 'white', fontFamily: 'JetBrains Mono', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', border: 'none', cursor: runningScenario ? 'not-allowed' : 'pointer', opacity: runningScenario && !isRunning ? 0.4 : 1, transition: 'all 160ms ease', flexShrink: 0 }}>
                    {isRunning ? '...' : 'RUN'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(255,61,90,0.07)', border: '1px solid rgba(255,61,90,0.2)', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#FF3D5A' }}>{error}</div>
        )}

        {/* Comparison Result */}
        {scenarioResult && meta && screen && (
          <div style={{ animation: 'fadeSlideIn 300ms ease forwards' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.575rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.28)', marginBottom: 10 }}>
              Execution Result — Scenario {scenarioResult.id}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* Unprotected */}
              <div style={{ padding: '0.875rem', borderRadius: 9, background: 'rgba(255,61,90,0.04)', border: '1px solid rgba(255,61,90,0.18)' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.575rem', fontWeight: 700, color: '#FF3D5A', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>● Unprotected</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.5)', marginBottom: 4 }}>
                  tool: <span style={{ color: '#F59E0B' }}>{meta.tool}</span>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', fontWeight: 700, color: '#FF3D5A', marginBottom: 6 }}>EXECUTED ✗</div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '0.675rem', color: 'rgba(240,240,248,0.4)', lineHeight: 1.5 }}>
                  {unprotected?.security_summary || meta.threat}
                </div>
              </div>

              {/* Protected */}
              <div style={{ padding: '0.875rem', borderRadius: 9, background: 'rgba(0,255,148,0.04)', border: '1px solid rgba(0,255,148,0.18)' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.575rem', fontWeight: 700, color: '#00FF94', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>■ Sentinel</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.5)', marginBottom: 4 }}>
                  risk: <span style={{ color: screen.risk_score >= 0.7 ? '#FF3D5A' : '#F59E0B', fontWeight: 700 }}>{screen.risk_score.toFixed(2)}</span>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem', fontWeight: 700, color: '#00FF94', marginBottom: 6 }}>BLOCKED ✓</div>
                {screen.matched_signals?.slice(0, 2).map((s, i) => (
                  <div key={i} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.4)', lineHeight: 1.6 }}>
                    <span style={{ color: '#7C3AED' }}>[{s.stage}]</span> {s.signal}
                  </div>
                ))}
                {screen.policy_check?.allowed === false && (
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: '#F59E0B', marginTop: 2 }}>Policy: {screen.policy_check.reason?.slice(0, 60)}...</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT — Live Event Stream ──────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.575rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.28)' }}>
            Sentinel Decisions · Real-Time
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FF94', boxShadow: '0 0 8px rgba(0,255,148,0.8)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', color: 'rgba(240,240,248,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>LIVE</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {recentEvents.length === 0 ? (
            <div style={{ paddingTop: '4rem', textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'rgba(240,240,248,0.18)', letterSpacing: '0.1em', lineHeight: 2 }}>
              WAITING FOR EVENTS<br/>
              <span style={{ fontSize: '0.6rem' }}>Press START or run a scenario to see live Sentinel decisions</span>
            </div>
          ) : recentEvents.map((ev) => {
            const v = ev.verdict || 'allow';
            const c = VERDICT_COLOR[v] || '#F0F0F8';
            const isAttack = ev.attack;
            return (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', animation: 'fadeSlideIn 250ms ease forwards' }}>
                {/* Colored left bar */}
                <div style={{ width: 2, height: '100%', minHeight: 36, borderRadius: 9999, background: c, flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <VerdictBadge verdict={v} />
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.675rem', color: '#7C3AED', fontWeight: 600 }}>{ev.tool_name}</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: c, fontWeight: 700 }}>{typeof ev.risk_score === 'number' ? ev.risk_score.toFixed(2) : '—'}</span>
                    {isAttack && <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', background: 'rgba(255,61,90,0.1)', color: '#FF3D5A', border: '1px solid rgba(255,61,90,0.2)', padding: '0.1rem 0.4rem', borderRadius: 3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ATTACK</span>}
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.575rem', color: 'rgba(240,240,248,0.22)', marginLeft: 'auto' }}>{ev.ts}</span>
                  </div>
                  {ev.incoming_text && (
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                      "{ev.incoming_text}"
                    </div>
                  )}
                  {ev.explanation && (
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: '0.65rem', color: 'rgba(240,240,248,0.4)', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ev.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Audit Page ───────────────────────────────────────────────────────────────
function AuditPage() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [verdict, setVerdict] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/events/history?limit=200${verdict ? `&verdict=${verdict}` : ''}`);
      const d = await r.json(); setEvents(d.events || []); setTotal(d.total || 0);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [verdict]);

  const filtered = events.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.tool_name?.toLowerCase().includes(q) || e.agent_id?.toLowerCase().includes(q) || e.explanation?.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', animation: 'fadeSlideIn 250ms ease forwards' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tool, agent, explanation..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0.4rem 0.75rem 0.4rem 2rem', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#F0F0F8', outline: 'none' }} />
        </div>
        <select value={verdict} onChange={e => setVerdict(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0.4rem 0.75rem', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#F0F0F8', outline: 'none', cursor: 'pointer' }}>
          <option value="">All</option><option value="block">BLOCK</option><option value="allow">ALLOW</option><option value="require_approval">APPROVAL</option>
        </select>
        <button onClick={load} style={{ padding: '0.4rem 1rem', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'JetBrains Mono', fontSize: '0.625rem', color: 'rgba(240,240,248,0.5)', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {loading ? '...' : 'REFRESH'}
        </button>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.625rem', color: 'rgba(240,240,248,0.25)', whiteSpace: 'nowrap' }}>{total} records</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['#', 'Time', 'Tool', 'Agent', 'Risk', 'Verdict', 'Explanation'].map(h => (
                <th key={h} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.28)', padding: '0.5rem 0.75rem', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'rgba(240,240,248,0.18)' }}>No records. Run a scenario or start live demo to populate.</td></tr>
            ) : filtered.map(row => {
              const c = VERDICT_COLOR[row.verdict] || '#F0F0F8';
              return (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.3)' }}>#{row.id}</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.3)', whiteSpace: 'nowrap' }}>{row.timestamp ? new Date(row.timestamp).toLocaleTimeString('en-US', { hour12: false }) : '—'}</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#7C3AED', fontWeight: 600 }}>{row.tool_name}</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'JetBrains Mono', fontSize: '0.625rem', color: 'rgba(240,240,248,0.4)' }}>{row.agent_id}</td>
                  <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: c, fontWeight: 700 }}>{row.risk_score?.toFixed(2)}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}><VerdictBadge verdict={row.verdict} /></td>
                  <td style={{ padding: '0.6rem 0.75rem', fontFamily: 'Plus Jakarta Sans', fontSize: '0.65rem', color: 'rgba(240,240,248,0.4)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.explanation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Policy Page ──────────────────────────────────────────────────────────────
function PolicyPage() {
  const [yaml, setYaml] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/policy').then(r => r.json()).then(d => setYaml(d.raw_yaml || '')).catch(() => setMsg({ type: 'err', text: 'Failed to load.' })).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch('/api/policy', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ policy_yaml: yaml }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail);
      setMsg({ type: 'ok', text: 'Policy saved and hot-reloaded into Policy Engine.' });
    } catch (e) { setMsg({ type: 'err', text: e.message }); } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem', animation: 'fadeSlideIn 250ms ease forwards' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '0.875rem', color: '#F0F0F8' }}>Declarative Policy Editor</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.3)', marginTop: 3 }}>policy/policy.example.yaml — changes hot-reload into the Policy Engine immediately</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setLoading(true); fetch('/api/policy').then(r => r.json()).then(d => setYaml(d.raw_yaml || '')).finally(() => setLoading(false)); }}
            style={{ padding: '0.4rem 0.875rem', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'JetBrains Mono', fontSize: '0.625rem', color: 'rgba(240,240,248,0.5)', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            RELOAD
          </button>
          <button onClick={save} disabled={saving}
            style={{ padding: '0.4rem 1.25rem', borderRadius: 7, background: saving ? 'rgba(0,255,148,0.3)' : '#00FF94', border: 'none', fontFamily: 'JetBrains Mono', fontSize: '0.625rem', color: '#04060F', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 0 14px rgba(0,255,148,0.25)' }}>
            {saving ? 'SAVING...' : 'SAVE & APPLY'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '0.625rem 1rem', borderRadius: 7, fontFamily: 'JetBrains Mono', fontSize: '0.7rem', background: msg.type === 'ok' ? 'rgba(0,255,148,0.07)' : 'rgba(255,61,90,0.07)', border: `1px solid ${msg.type === 'ok' ? 'rgba(0,255,148,0.2)' : 'rgba(255,61,90,0.2)'}`, color: msg.type === 'ok' ? '#00FF94' : '#FF3D5A' }}>{msg.text}</div>
      )}

      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1, padding: '0.45rem 1rem', background: 'rgba(0,0,0,0.6)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          {['#FF3D5A','#F59E0B','#00FF94'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', color: 'rgba(240,240,248,0.25)', marginLeft: 8, letterSpacing: '0.1em' }}>policy.example.yaml</span>
        </div>
        <textarea value={yaml} onChange={e => setYaml(e.target.value)} disabled={loading} rows={22}
          style={{ width: '100%', paddingTop: '2.75rem', padding: '2.75rem 1rem 1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontFamily: 'JetBrains Mono', fontSize: '0.72rem', color: '#00FF94', lineHeight: 1.7, resize: 'vertical', outline: 'none', minHeight: '100%', transition: 'border-color 200ms ease' }} />
      </div>
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { isAuthenticated, loading } = useAuth();
  const [tab, setTab] = useState('demo');
  const [stats, fetchStats] = useStats(2000);
  const [events, sseConnected] = useSSE();

  const blockRate = stats.total_screened > 0 ? ((stats.blocked / stats.total_screened) * 100).toFixed(1) : '0.0';
  const riskColor = stats.average_risk_score >= 0.7 ? '#FF3D5A' : stats.average_risk_score >= 0.4 ? '#F59E0B' : '#00FF94';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#04060F', color: 'rgba(240,240,248,0.3)', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
        INITIALIZING...
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  const pageTitles = { demo: 'Live Demo', audit: 'Audit Log', policy: 'Policy Engine', users: 'User Management' };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#04060F' }}>
      {/* Ambient grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(124,58,237,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.02) 1px, transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none', zIndex: 0 }} />

      <Sidebar tab={tab} setTab={setTab} sseConnected={sseConnected} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 10, position: 'relative' }}>
        {/* Metric bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0.875rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#04060F', flexShrink: 0, gap: 0 }}>
          <MetricNum label="Screened" value={stats.total_screened} />
          <MetricNum label="Blocked" value={stats.blocked} color="#FF3D5A" />
          <MetricNum label="Allowed" value={stats.allowed} color="#00FF94" />
          <MetricNum label="Block Rate" value={parseFloat(blockRate)} color={parseFloat(blockRate) > 30 ? '#FF3D5A' : '#F59E0B'} decimals={1} suffix="%" />
          <MetricNum label="Avg Risk" value={stats.average_risk_score} color={riskColor} decimals={2} />
          <div style={{ marginLeft: 'auto', textAlign: 'right', paddingLeft: '1.5rem' }}>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '0.8rem', color: 'rgba(240,240,248,0.8)' }}>
              {pageTitles[tab] || tab}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', color: 'rgba(240,240,248,0.22)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>Sentinel Layer v0.1.0</div>
          </div>
        </div>

        {/* Page */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
          {tab === 'demo' && <LiveDemoPage events={events} onStatsChange={fetchStats} />}
          {tab === 'audit' && <AuditPage />}
          {tab === 'policy' && <PolicyPage />}
          {tab === 'users' && <AdminPanel />}
        </div>
      </div>
    </div>
  );
}
