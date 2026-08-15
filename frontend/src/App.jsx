import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import SessionTokenPanel from './components/SessionTokenPanel.jsx';

// ── Multi-fallback API helper with automatic JWT injection ──────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('sentinel_jwt');
  const headers = { ...options.headers };
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const opts = { ...options, headers };

  // 1. Try direct port 8000 first for fast local development
  try {
    const res = await fetch(`http://localhost:8000${path}`, opts);
    if (res.ok) return res;
  } catch {}

  // 2. Try 127.0.0.1:8000
  try {
    const res = await fetch(`http://127.0.0.1:8000${path}`, opts);
    if (res.ok) return res;
  } catch {}

  // 3. Fallback to relative /api proxy
  return fetch(`/api${path}`, opts);
}

// ── Hooks ───────────────────────────────────────────────────────────────────
function useStats(refreshMs = 2500) {
  const [stats, setStats] = useState({ total_screened: 0, blocked: 0, allowed: 0, requires_approval: 0, average_risk_score: 0, block_rate: 0 });
  const fetch_ = useCallback(async () => {
    try {
      const r = await apiFetch('/events/stats');
      if (r && r.ok) {
        const d = await r.json();
        setStats(d);
      }
    } catch (err) {}
  }, []);

  useEffect(() => {
    fetch_();
    const t = setInterval(fetch_, refreshMs);
    return () => clearInterval(t);
  }, [fetch_, refreshMs]);

  return [stats, fetch_];
}

function useSSE() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let es = null;
    let cancelled = false;
    const token = localStorage.getItem('sentinel_jwt');
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';

    const handleMessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'CONNECTED') {
          setConnected(true);
          return;
        }
        setEvents(prev => [{
          id: Date.now() + Math.random(),
          ts: new Date().toLocaleTimeString('en-US', { hour12: false }),
          ...d
        }, ...prev.slice(0, 299)]);
      } catch {}
    };

    const connect = (baseUrl) => {
      if (cancelled) return;
      try {
        es = new EventSource(`${baseUrl}${tokenParam}`);
        es.onopen = () => {
          if (!cancelled) setConnected(true);
        };
        es.onmessage = handleMessage;
        es.onerror = () => {
          if (!cancelled) {
            setConnected(false);
            es.close();
            // Retry on alternative host after 2.5 seconds
            setTimeout(() => {
              if (!cancelled) {
                const nextUrl = baseUrl.includes('localhost') ? 'http://127.0.0.1:8000/events/stream' : 'http://localhost:8000/events/stream';
                connect(nextUrl);
              }
            }, 2500);
          }
        };
      } catch {
        setConnected(false);
      }
    };

    connect('http://localhost:8000/events/stream');

    return () => {
      cancelled = true;
      if (es) es.close();
    };
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
  { id: 'policy', label: 'Policy Engine', icon: '◈' },
  { id: 'tokens', label: 'Agent Tokens', icon: '🔑' },
  { id: 'users', label: 'User Admin', icon: '👥', adminOnly: true },
];

function Sidebar({ tab, setTab, sseConnected }) {
  const { user, logout } = useAuth();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const visibleNav = NAV.filter(n => !n.adminOnly || user?.role === 'admin');

  const handleColdSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const r = await apiFetch('/events/sync-cold', { method: 'POST' });
      const d = await r.json();
      setSyncMsg('✓ Synced to Neon DB');
      setTimeout(() => setSyncMsg(null), 3000);
    } catch {
      setSyncMsg('Sync error');
      setTimeout(() => setSyncMsg(null), 3000);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <aside style={{ width: 230, minHeight: '100vh', background: '#060914', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 10 }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #7C3AED, #4C1D95)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 16px rgba(124,58,237,0.4)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '0.85rem', color: '#F0F0F8', letterSpacing: '-0.01em', lineHeight: 1 }}>SENTINEL</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.5rem', color: 'rgba(240,240,248,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 3 }}>AI Security Console</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ padding: '0.4rem 0.875rem', fontFamily: 'JetBrains Mono', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.25)', fontWeight: 600, marginBottom: 2 }}>Operations</div>
        {visibleNav.map((n) => (
          <div key={n.id} onClick={() => setTab(n.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.875rem', borderRadius: 8, cursor: 'pointer', transition: 'all 180ms ease', fontSize: '0.8rem', fontWeight: 500, userSelect: 'none',
              color: tab === n.id ? '#00FF94' : 'rgba(240,240,248,0.45)',
              background: tab === n.id ? 'rgba(0,255,148,0.08)' : 'transparent',
              border: `1px solid ${tab === n.id ? 'rgba(0,255,148,0.15)' : 'transparent'}`,
            }}>
            <span style={{ fontSize: '0.9rem', opacity: tab === n.id ? 1 : 0.6 }}>{n.icon}</span>
            <span>{n.label}</span>
          </div>
        ))}
      </nav>

      {/* Storage & Architecture Indicator */}
      <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', fontWeight: 600 }}>Storage Tiers</span>
          <button onClick={handleColdSync} disabled={syncing} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.55rem', fontFamily: 'JetBrains Mono', cursor: 'pointer', padding: 0 }}>
            {syncing ? 'Syncing...' : syncMsg || '☁️ Sync Neon'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.4)' }}>🔥 Hot Storage</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', color: '#00FF94', fontWeight: 700 }}>SQLite WAL (&lt;1ms)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.4)' }}>☁️ Cold Storage</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', color: '#818cf8', fontWeight: 700 }}>Neon Cloud</span>
          </div>
        </div>
      </div>

      {/* System status */}
      <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.25)', marginBottom: 8 }}>Protection Stack</div>
        {[
          ['Stage 0 Token RBAC', true],
          ['Stage 1 Regex Rules', true],
          ['Stage 2 ML Vector Index', true],
          ['Stage 3 LLM Judge', true],
          ['Policy Hard Guard', true],
          ['SSE Telemetry', sseConnected],
        ].map(([label, ok]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.38)' }}>{label}</span>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', fontWeight: 700, color: ok ? '#00FF94' : '#FF3D5A', letterSpacing: '0.05em' }}>{ok ? '● ON' : '● OFF'}</span>
          </div>
        ))}
      </div>

      {/* User profile + Logout */}
      {user && (
        <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc', fontSize: 12, fontWeight: 700, flexShrink: 0, overflow: 'hidden' }}>
            {user.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name || user.email}</div>
            <div style={{ fontSize: '0.58rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{user.role?.replace('_', ' ')}</div>
          </div>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'rgba(240,240,248,0.3)', cursor: 'pointer', fontSize: 16, padding: 4, borderRadius: 4 }} title="Logout">⏻</button>
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

  const runScenario = async (id) => {
    setRunningScenario(id);
    setScenarioResult(null);
    setError(null);
    try {
      const r = await apiFetch('/demo/run-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: id }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setScenarioResult({ id, ...data });
      if (onStatsChange) onStatsChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunningScenario(null);
    }
  };

  const toggleContinuous = async () => {
    if (continuous) {
      await apiFetch('/demo/continuous/stop', { method: 'POST' });
      setContinuous(false);
    } else {
      await apiFetch('/demo/continuous', { method: 'POST' });
      setContinuous(true);
    }
  };

  const screen = scenarioResult?.protected_run?.screen_response;
  const unprotected = scenarioResult?.unprotected_run;
  const meta = scenarioResult ? SCENARIO_META[scenarioResult.id] : null;
  const recentEvents = events.slice(0, 30);

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: '100%', overflow: 'hidden' }}>

      {/* LEFT — Controls + Result */}
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '1.25rem', overflowY: 'auto', paddingRight: '0.25rem' }}>

        {/* Attack Simulator Cards */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', fontWeight: 600 }}>Attack Simulator</span>
            <button onClick={toggleContinuous} style={{
              padding: '0.35rem 0.85rem', borderRadius: 7, fontSize: '0.625rem', fontFamily: 'JetBrains Mono', fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 180ms ease',
              background: continuous ? 'rgba(255,61,90,0.12)' : 'rgba(255,255,255,0.04)',
              color: continuous ? '#FF3D5A' : 'rgba(240,240,248,0.5)',
              border: `1px solid ${continuous ? 'rgba(255,61,90,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              {continuous ? '■ STOP LOOP' : '▶ CONTINUOUS AGENTS'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[1, 2, 3].map((id) => {
              const m = SCENARIO_META[id];
              const isRunning = runningScenario === id;
              const isSelected = scenarioResult?.id === id;
              return (
                <div key={id} onClick={() => !runningScenario && runScenario(id)}
                  style={{
                    padding: '0.85rem 1rem', borderRadius: 9, cursor: runningScenario ? 'not-allowed' : 'pointer',
                    background: isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isSelected ? `${m.color}40` : 'rgba(255,255,255,0.06)'}`,
                    transition: 'all 180ms ease', display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                  <div style={{ width: 6, height: 36, borderRadius: 3, background: m.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '0.8rem', color: '#F0F0F8' }}>{m.name}</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', color: m.color, background: `${m.color}14`, padding: '0.15rem 0.4rem', borderRadius: 4, border: `1px solid ${m.color}25` }}>{m.tag}</span>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Tool: <code style={{ color: '#a5b4fc' }}>{m.tool}</code> · {m.threat}
                    </div>
                  </div>
                  <button style={{
                    padding: '0.35rem 0.85rem', borderRadius: 6, background: isRunning ? 'rgba(255,255,255,0.05)' : `${m.color}18`,
                    border: `1px solid ${m.color}35`, color: m.color, fontFamily: 'JetBrains Mono', fontSize: '0.625rem', fontWeight: 700,
                    cursor: runningScenario ? 'not-allowed' : 'pointer', flexShrink: 0,
                  }}>
                    {isRunning ? 'RUNNING...' : 'LAUNCH ATTACK'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,61,90,0.1)', border: '1px solid rgba(255,61,90,0.25)', borderRadius: 8, padding: '0.75rem', color: '#FF3D5A', fontSize: '0.75rem' }}>
            Error: {error}
          </div>
        )}

        {/* Side-by-side comparative execution display */}
        {scenarioResult && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '0.85rem', color: '#F0F0F8' }}>{scenarioResult.title}</div>
              <VerdictBadge verdict={screen?.verdict || 'block'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Unprotected */}
              <div style={{ background: 'rgba(255,61,90,0.05)', border: '1px solid rgba(255,61,90,0.2)', borderRadius: 8, padding: '0.85rem' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: '#FF3D5A', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>❌ Unprotected Agent</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.7)', lineHeight: 1.4 }}>{unprotected?.action_outcome}</div>
              </div>

              {/* Sentinel Protected */}
              <div style={{ background: 'rgba(0,255,148,0.05)', border: '1px solid rgba(0,255,148,0.2)', borderRadius: 8, padding: '0.85rem' }}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: '#00FF94', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>🛡️ Sentinel Protected</div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.7)', lineHeight: 1.4 }}>
                  Risk Score: <strong style={{ color: '#FF3D5A' }}>{screen?.risk_score?.toFixed(2)}</strong><br />
                  Verdict: <strong style={{ color: '#FF3D5A' }}>{screen?.verdict?.toUpperCase()}</strong>
                </div>
              </div>
            </div>

            {/* Matched threat signals */}
            {screen?.matched_signals?.length > 0 && (
              <div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', letterSpacing: '0.12em', color: 'rgba(240,240,248,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Detected Threat Signals</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {screen.matched_signals.map((s, idx) => (
                    <span key={idx} style={{ background: 'rgba(255,61,90,0.1)', border: '1px solid rgba(255,61,90,0.25)', color: '#FF3D5A', fontFamily: 'JetBrains Mono', fontSize: '0.6rem', padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                      [{s.stage}] {s.signal}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT — Live SSE Stream Feed */}
      <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap: '0.75rem', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.625rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', fontWeight: 600 }}>Live Telemetry Stream (SSE)</span>
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.3)' }}>{events.length} events received</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, paddingRight: 4 }}>
          {recentEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'rgba(240,240,248,0.2)', fontFamily: 'JetBrains Mono', fontSize: '0.75rem' }}>
              Waiting for live agent screening events...<br /><br />
              <span style={{ fontSize: '0.65rem' }}>Launch an attack scenario or run the PDF demo agent to see decisions stream live.</span>
            </div>
          ) : (
            recentEvents.map(ev => (
              <div key={ev.id} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 7, padding: '0.65rem 0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.625rem', color: '#7C3AED', fontWeight: 600 }}>{ev.tool_name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.3)' }}>{ev.ts}</span>
                    <VerdictBadge verdict={ev.verdict || 'allow'} />
                  </div>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.explanation}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

// ── Audit Page ───────────────────────────────────────────────────────────────
function AuditPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [verdict, setVerdict] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const load = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const r = await apiFetch(`/events/history?limit=300${verdict ? `&verdict=${verdict}` : ''}`);
      if (!r || !r.ok) throw new Error(`HTTP ${r?.status || 'Network Error'}`);
      const d = await r.json();
      setEvents(d.events || []);
      setTotal(d.total || 0);
    } catch (err) {
      setFetchError(err.message || 'Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [verdict]);

  const filtered = events.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.tool_name?.toLowerCase().includes(q) || e.agent_id?.toLowerCase().includes(q) || e.explanation?.toLowerCase().includes(q) || e.user_email?.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tool, agent, user email, or explanation..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0.5rem 0.75rem', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#F0F0F8', outline: 'none' }} />
        </div>
        <select value={verdict} onChange={e => setVerdict(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0.5rem 0.75rem', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#F0F0F8', outline: 'none', cursor: 'pointer' }}>
          <option value="">All Verdicts</option>
          <option value="block">BLOCK</option>
          <option value="allow">ALLOW</option>
          <option value="require_approval">APPROVAL</option>
        </select>
        <button onClick={load} style={{ padding: '0.5rem 1rem', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'JetBrains Mono', fontSize: '0.625rem', color: 'rgba(240,240,248,0.6)', cursor: 'pointer', letterSpacing: '0.1em' }}>
          {loading ? '...' : 'REFRESH'}
        </button>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.3)', whiteSpace: 'nowrap' }}>
          {total} records {user?.role !== 'admin' ? `(Your User Scope)` : `(Global System Scope)`}
        </span>
      </div>

      {fetchError && (
        <div style={{ background: 'rgba(255,61,90,0.1)', border: '1px solid rgba(255,61,90,0.3)', borderRadius: 8, padding: '0.75rem 1rem', color: '#FF3D5A', fontSize: '0.75rem', fontFamily: 'JetBrains Mono' }}>
          ⚠️ Error loading audit logs: {fetchError}. Check if backend is running on port 8000.
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
              {['#', 'Time', 'Tool', 'Agent / User', 'Risk', 'Verdict', 'Explanation'].map(h => (
                <th key={h} style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(240,240,248,0.3)', padding: '0.6rem 0.85rem', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'rgba(240,240,248,0.25)' }}>
                No audit records found for this scope. Run an attack scenario or use SentinelGuard SDK to populate.
              </td></tr>
            ) : filtered.map(row => {
              const c = VERDICT_COLOR[row.verdict] || '#F0F0F8';
              return (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.3)' }}>#{row.id}</td>
                  <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.35)', whiteSpace: 'nowrap' }}>{row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : '—'}</td>
                  <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#7C3AED', fontWeight: 600 }}>{row.tool_name}</td>
                  <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'JetBrains Mono', fontSize: '0.625rem', color: 'rgba(240,240,248,0.45)' }}>
                    {row.user_email ? `${row.user_email} (${row.user_role || 'user'})` : (row.agent_id || 'unassigned')}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: c, fontWeight: 700 }}>{row.risk_score?.toFixed(2)}</td>
                  <td style={{ padding: '0.6rem 0.85rem' }}><VerdictBadge verdict={row.verdict} /></td>
                  <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'Plus Jakarta Sans', fontSize: '0.65rem', color: 'rgba(240,240,248,0.45)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.explanation}</td>
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
function PolicyPage({ activeTab }) {
  const [yaml, setYaml] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiFetch('/policy');
      if (r && r.ok) {
        const d = await r.json();
        setYaml(d.raw_yaml || '');
      }
    } catch {
      setMsg({ type: 'err', text: 'Failed to load policy file.' });
    } finally {
      setLoading(false);
    }
  };

  // Auto-reload policy whenever Policy tab becomes active
  useEffect(() => {
    if (activeTab === 'policy') {
      load();
    }
  }, [activeTab]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const r = await apiFetch('/policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_yaml: yaml }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || 'Failed to save.');
      setMsg({ type: 'ok', text: '✓ Policy validated, saved, and hot-reloaded into Policy Engine.' });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '0.9rem', color: '#F0F0F8' }}>Declarative Policy Editor</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.625rem', color: 'rgba(240,240,248,0.35)', marginTop: 3 }}>Edits are strictly validated against root escalation and hot-reloaded instantly</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ padding: '0.4rem 0.85rem', borderRadius: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'JetBrains Mono', fontSize: '0.625rem', color: 'rgba(240,240,248,0.5)', cursor: 'pointer' }}>
            RELOAD
          </button>
          <button onClick={save} disabled={saving} style={{ padding: '0.4rem 1.25rem', borderRadius: 7, background: saving ? 'rgba(0,255,148,0.3)' : '#00FF94', border: 'none', fontFamily: 'JetBrains Mono', fontSize: '0.625rem', color: '#04060F', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
            {saving ? 'SAVING...' : 'SAVE & APPLY'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '0.65rem 1rem', borderRadius: 8, fontSize: '0.75rem', background: msg.type === 'ok' ? 'rgba(0,255,148,0.1)' : 'rgba(255,61,90,0.1)', border: `1px solid ${msg.type === 'ok' ? 'rgba(0,255,148,0.3)' : 'rgba(255,61,90,0.3)'}`, color: msg.type === 'ok' ? '#00FF94' : '#FF3D5A' }}>
          {msg.text}
        </div>
      )}

      <div style={{ flex: 1, position: 'relative' }}>
        <textarea
          value={yaml}
          onChange={e => setYaml(e.target.value)}
          disabled={loading}
          style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '1rem', fontFamily: 'JetBrains Mono', fontSize: '0.75rem', color: '#00FF94', lineHeight: 1.6, outline: 'none', resize: 'none' }}
        />
      </div>
    </div>
  );
}

// ── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const { isAuthenticated, loading, user } = useAuth();
  const [tab, setTab] = useState('demo');
  const [stats, fetchStats] = useStats(2500);
  const [events, sseConnected] = useSSE();

  const blockRate = stats.total_screened > 0 ? ((stats.blocked / stats.total_screened) * 100).toFixed(1) : '0.0';
  const riskColor = stats.average_risk_score >= 0.7 ? '#FF3D5A' : stats.average_risk_score >= 0.4 ? '#F59E0B' : '#00FF94';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#04060F', color: 'rgba(240,240,248,0.3)', fontFamily: 'JetBrains Mono', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
        INITIALIZING SENTINEL LAYER...
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  const pageTitles = { demo: 'Live Threat Simulator', audit: 'Audit Trail & Telemetry Explorer', policy: 'Declarative Policy Engine', tokens: 'Agent Session Tokens & Keys', users: 'User Access Control' };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: '#04060F' }}>
      <Sidebar tab={tab} setTab={setTab} sseConnected={sseConnected} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 10, position: 'relative' }}>
        {/* Metric Bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0.875rem 1.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#04060F', flexShrink: 0 }}>
          <MetricNum label="Screened" value={stats.total_screened} />
          <MetricNum label="Blocked" value={stats.blocked} color="#FF3D5A" />
          <MetricNum label="Allowed" value={stats.allowed} color="#00FF94" />
          <MetricNum label="Block Rate" value={parseFloat(blockRate)} color={parseFloat(blockRate) > 30 ? '#FF3D5A' : '#F59E0B'} decimals={1} suffix="%" />
          <MetricNum label="Avg Risk" value={stats.average_risk_score} color={riskColor} decimals={2} />
          <div style={{ marginLeft: 'auto', textAlign: 'right', paddingLeft: '1.5rem' }}>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '0.8rem', color: 'rgba(240,240,248,0.8)' }}>
              {pageTitles[tab] || tab}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', color: 'rgba(240,240,248,0.22)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
              {user?.role === 'admin' ? '👑 Admin Mode (All Users)' : `👤 Scope: ${user?.email || 'User'}`}
            </div>
          </div>
        </div>

        {/* Active Tab View */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1.75rem' }}>
          {tab === 'demo' && <LiveDemoPage events={events} onStatsChange={fetchStats} />}
          {tab === 'audit' && <AuditPage />}
          {tab === 'policy' && <PolicyPage activeTab={tab} />}
          {tab === 'tokens' && <SessionTokenPanel />}
          {tab === 'users' && <AdminPanel />}
        </div>
      </div>
    </div>
  );
}
