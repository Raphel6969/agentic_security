import React, { useEffect, useRef, useState } from 'react';

export default function TelemetryFeed() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const es = new EventSource('/api/events/stream');
    es.onopen = () => setConnected(true);
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'CONNECTED') return;
        setEvents((prev) => [{
          id: Date.now() + Math.random(),
          ts: new Date().toLocaleTimeString('en-US', { hour12: false }),
          ...d,
        }, ...prev.slice(0, 199)]);
      } catch {}
    };
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, []);

  return (
    <div className="flex flex-col h-full page-enter">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="section-label">Live Event Stream</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            background: connected ? '#00FF94' : '#FF3D5A',
            boxShadow: connected ? '0 0 8px rgba(0,255,148,0.8)' : 'none',
            animation: connected ? 'pulse-dot 2s ease-in-out infinite' : 'none',
          }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {connected ? 'SSE LIVE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Stream */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {events.length === 0 ? (
          <div style={{ padding: '3rem 0', textAlign: 'center', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: 'rgba(240,240,248,0.2)', letterSpacing: '0.1em' }}>
            WAITING FOR EVENTS — RUN AN ATTACK SCENARIO
          </div>
        ) : (
          <div>
            {events.map((ev) => {
              const isBlock = ev.verdict === 'block';
              const isApproval = ev.verdict === 'require_approval';
              const verdictColor = isBlock ? '#FF3D5A' : isApproval ? '#F59E0B' : '#00FF94';
              return (
                <div key={ev.id} className="feed-row" style={{ animationName: 'fadeSlideIn', animationDuration: '200ms', animationFillMode: 'both' }}>
                  <span style={{ color: 'rgba(240,240,248,0.25)', minWidth: 64, fontSize: '0.65rem' }}>{ev.ts}</span>
                  <span className="status-pill" style={{
                    background: `${verdictColor}12`, color: verdictColor,
                    border: `1px solid ${verdictColor}30`, minWidth: 62, justifyContent: 'center',
                  }}>
                    {ev.verdict}
                  </span>
                  <span style={{ color: '#7C3AED', minWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.tool_name}
                  </span>
                  <span style={{ color: verdictColor, fontWeight: 700, minWidth: 40 }}>
                    {ev.risk_score?.toFixed(2)}
                  </span>
                  <span style={{ color: 'rgba(240,240,248,0.35)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.65rem' }}>
                    {ev.agent_id} · {ev.incoming_source}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
