import React, { useEffect, useState } from 'react';

export default function AuditExplorer() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [verdict, setVerdict] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = '/api/events/history?limit=100';
      if (verdict) url += `&verdict=${verdict}`;
      const res = await fetch(url);
      const d = await res.json();
      setEvents(d.events || []);
      setTotal(d.total || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, [verdict]);

  const filtered = events.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.agent_id?.toLowerCase().includes(q) || e.tool_name?.toLowerCase().includes(q) || e.explanation?.toLowerCase().includes(q));
  });

  return (
    <div className="flex flex-col h-full gap-4 page-enter">
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', opacity: 0.35 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="search-input" placeholder="Search agent, tool, explanation..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          value={verdict} onChange={(e) => setVerdict(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '0.4rem 0.75rem', fontFamily: 'JetBrains Mono', fontSize: '0.7rem', color: '#F0F0F8', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">All Verdicts</option>
          <option value="block">BLOCK</option>
          <option value="allow">ALLOW</option>
          <option value="require_approval">APPROVAL</option>
        </select>
        <button onClick={fetchHistory} disabled={loading}
          style={{ padding: '0.4rem 0.875rem', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.6)', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {loading ? '...' : 'REFRESH'}
        </button>
        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.25)', whiteSpace: 'nowrap' }}>
          {total} records
        </span>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Time</th>
              <th>Tool</th>
              <th>Agent</th>
              <th>Risk</th>
              <th>Verdict</th>
              <th>Explanation</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'rgba(240,240,248,0.2)' }}>No records found</td></tr>
            ) : filtered.map((row) => {
              const isBlock = row.verdict === 'block';
              const isApproval = row.verdict === 'require_approval';
              const c = isBlock ? '#FF3D5A' : isApproval ? '#F59E0B' : '#00FF94';
              return (
                <tr key={row.id}>
                  <td style={{ color: 'rgba(240,240,248,0.35)' }}>#{row.id}</td>
                  <td style={{ color: 'rgba(240,240,248,0.35)', whiteSpace: 'nowrap' }}>{row.timestamp ? new Date(row.timestamp).toLocaleTimeString('en-US', { hour12: false }) : '—'}</td>
                  <td style={{ color: '#7C3AED' }}>{row.tool_name}</td>
                  <td style={{ color: 'rgba(240,240,248,0.5)' }}>{row.agent_id}</td>
                  <td style={{ color: c, fontWeight: 700 }}>{row.risk_score?.toFixed(2)}</td>
                  <td>
                    <span className={`status-pill ${isBlock ? 'block' : isApproval ? 'approval' : 'allow'}`}>
                      {row.verdict}
                    </span>
                  </td>
                  <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Plus Jakarta Sans', color: 'rgba(240,240,248,0.45)', fontSize: '0.7rem' }}>
                    {row.explanation}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
