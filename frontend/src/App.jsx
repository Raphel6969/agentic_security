import React, { useEffect, useState } from 'react';
import AmbientGrid from './components/AmbientGrid';
import AttackSimulator from './components/AttackSimulator';
import TelemetryFeed from './components/TelemetryFeed';
import AuditExplorer from './components/AuditExplorer';
import PolicyManager from './components/PolicyManager';

const NAV = [
  { id: 'simulator', label: 'Attack Lab', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  )},
  { id: 'telemetry', label: 'Live Stream', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  )},
  { id: 'audit', label: 'Audit Log', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
  )},
  { id: 'policy', label: 'Policy', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  )},
];

const PAGE_TITLES = {
  simulator: 'Attack Simulator',
  telemetry: 'Live Telemetry',
  audit: 'Audit Log',
  policy: 'Policy Engine',
};

export default function App() {
  const [tab, setTab] = useState('simulator');
  const [stats, setStats] = useState({ total_screened: 0, blocked: 0, allowed: 0, average_risk_score: 0 });
  const [sseConnected, setSseConnected] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/events/stats');
      if (res.ok) setStats(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchStats();
    const t = setInterval(fetchStats, 4000);

    // Check SSE connectivity
    const es = new EventSource('/api/events/stream');
    es.onopen = () => setSseConnected(true);
    es.onerror = () => setSseConnected(false);
    // Close immediately — TelemetryFeed manages its own connection
    setTimeout(() => es.close(), 500);

    return () => { clearInterval(t); };
  }, []);

  const blockRate = stats.total_screened > 0
    ? ((stats.blocked / stats.total_screened) * 100).toFixed(1)
    : '0.0';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative', background: '#04060F' }}>
      <AmbientGrid />

      {/* ─── Sidebar ───────────────────────────────────────────────── */}
      <aside className="sidebar" style={{ zIndex: 10 }}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 800, fontSize: '0.875rem', color: '#F0F0F8', letterSpacing: '-0.01em', lineHeight: 1 }}>
                SENTINEL
              </div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.55rem', color: 'rgba(240,240,248,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 2 }}>
                Security Layer
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          <p className="section-label" style={{ padding: '0.5rem 0.875rem', marginBottom: 2 }}>Operations</p>
          {NAV.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* System Status */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="section-label" style={{ marginBottom: 8 }}>System Status</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Rule Engine', ok: true },
              { label: 'ML Classifier', ok: true },
              { label: 'LLM Judge', ok: true },
              { label: 'Policy Engine', ok: true },
              { label: 'SSE Stream', ok: sseConnected },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.4)' }}>{s.label}</span>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', fontWeight: 700, color: s.ok ? '#00FF94' : '#FF3D5A', letterSpacing: '0.05em' }}>
                  {s.ok ? '● OK' : '● ERR'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ─── Main Content ───────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 10 }}>

        {/* Metric Bar */}
        <div className="metric-bar">
          <div className="metric-item">
            <span className="metric-label">Screened</span>
            <span className="metric-value neutral">{stats.total_screened.toLocaleString()}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Blocked</span>
            <span className="metric-value danger">{stats.blocked.toLocaleString()}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Allowed</span>
            <span className="metric-value safe">{stats.allowed.toLocaleString()}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Block Rate</span>
            <span className={`metric-value ${parseFloat(blockRate) > 30 ? 'danger' : 'warning'}`}>{blockRate}%</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Avg Risk</span>
            <span className={`metric-value ${stats.average_risk_score >= 0.7 ? 'danger' : stats.average_risk_score >= 0.4 ? 'warning' : 'safe'}`}>
              {stats.average_risk_score.toFixed(2)}
            </span>
          </div>

          {/* Page title pushed to right */}
          <div style={{ marginLeft: 'auto', paddingLeft: '2rem' }}>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: '0.9rem', color: 'rgba(240,240,248,0.85)', letterSpacing: '-0.01em' }}>
              {PAGE_TITLES[tab]}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.25)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 2 }}>
              Sentinel Layer v0.1.0
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.75rem 2rem' }}>
          {tab === 'simulator' && <AttackSimulator onRunScenario={fetchStats} />}
          {tab === 'telemetry' && <TelemetryFeed />}
          {tab === 'audit' && <AuditExplorer />}
          {tab === 'policy' && <PolicyManager />}
        </div>
      </div>
    </div>
  );
}
