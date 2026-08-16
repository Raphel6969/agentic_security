import React, { useState } from 'react';
import RiskRadarGauge from './RiskRadarGauge';

const SCENARIOS = [
  { id: 1, name: 'Direct Prompt Injection & Jailbreak', tag: 'Stage 1 + 2', color: '#FF3D5A' },
  { id: 2, name: 'Indirect Data Exfiltration via Email', tag: 'Stage 2 + Policy', color: '#F59E0B' },
  { id: 3, name: 'Over-Scope Call / Policy Violation', tag: 'Hard Policy Block', color: '#7C3AED' },
];

export default function AttackSimulator({ onRunScenario }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const run = async (id) => {
    setSelected(id);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/demo/run-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario_id: id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
      if (onRunScenario) onRunScenario(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const screen = result?.protected_run?.screen_response;

  return (
    <div className="flex flex-col gap-5 page-enter h-full">
      {/* Scenarios */}
      <div>
        <p className="section-label mb-3">Select Scenario</p>
        <div className="flex flex-col gap-2 stagger">
          {SCENARIOS.map((s) => (
            <div
              key={s.id}
              className={`scenario-row ${selected === s.id ? 'selected' : ''}`}
              onClick={() => !loading && run(s.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div style={{ width: 3, height: 36, borderRadius: 9999, background: s.color, flexShrink: 0 }} />
                <div className="min-w-0">
                  <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: '0.8125rem', fontWeight: 600, color: '#F0F0F8', marginBottom: 2 }}>
                    {s.name}
                  </div>
                  <div className="section-label" style={{ fontSize: '0.575rem' }}>{s.tag}</div>
                </div>
              </div>
              <button
                className={`btn-run ${loading && selected === s.id ? 'loading' : ''}`}
                onClick={(e) => { e.stopPropagation(); !loading && run(s.id); }}
                disabled={loading}
              >
                {loading && selected === s.id ? '...' : 'RUN'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'rgba(255,61,90,0.08)', border: '1px solid rgba(255,61,90,0.2)', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#FF3D5A' }}>
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex flex-col gap-3 page-enter" style={{ flex: 1 }}>
          <p className="section-label">Execution Result — {result.title}</p>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            {/* Vulnerable side */}
            <div className="result-col vuln" style={{ flex: 1 }}>
              <div style={{ color: '#FF3D5A', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                ● Unprotected
              </div>
              <div style={{ color: 'rgba(240,240,248,0.5)', marginBottom: 4 }}>tool: <span style={{ color: '#FF3D5A' }}>{result.proposed_tool_call?.tool_name}</span></div>
              <div style={{ color: 'rgba(240,240,248,0.5)', marginBottom: 8 }}>status: <span style={{ color: '#FF3D5A', fontWeight: 700 }}>EXECUTED</span></div>
              <div style={{ color: 'rgba(240,240,248,0.35)', fontSize: '0.65rem', lineHeight: 1.5 }}>
                {result.unprotected_run?.security_summary}
              </div>
            </div>

            {/* Sentinel side */}
            <div className="result-col safe" style={{ flex: 1 }}>
              <div style={{ color: '#00FF94', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
                ■ Kyron Protected
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <RiskRadarGauge score={screen?.risk_score || 0} size={100} />
                <div>
                  <div style={{ color: 'rgba(240,240,248,0.5)', marginBottom: 4 }}>verdict: <span style={{ color: '#FF3D5A', fontWeight: 700 }}>{screen?.verdict?.toUpperCase()}</span></div>
                  <div style={{ color: 'rgba(240,240,248,0.5)', fontSize: '0.65rem' }}>tool: <span style={{ color: '#00FF94' }}>ABORTED</span></div>
                </div>
              </div>
              {screen?.matched_signals?.length > 0 && (
                <div style={{ fontSize: '0.65rem', color: 'rgba(240,240,248,0.35)', lineHeight: 1.6 }}>
                  {screen.matched_signals.map((sig, i) => (
                    <div key={i}>
                      <span style={{ color: '#7C3AED' }}>[{sig.stage}]</span> {sig.signal}
                    </div>
                  ))}
                </div>
              )}
              {screen?.policy_check?.allowed === false && (
                <div style={{ marginTop: 6, fontSize: '0.65rem', color: '#F59E0B' }}>
                  Policy: {screen.policy_check.reason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
