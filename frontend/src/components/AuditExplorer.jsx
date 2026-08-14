import React, { useEffect, useState } from 'react';
import { Database, Search, Filter, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export default function AuditExplorer() {
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterVerdict, setFilterVerdict] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = '/api/events/history?limit=50';
      if (filterVerdict) url += `&verdict=${filterVerdict}`;
      const response = await fetch(url);
      const data = await response.json();
      setEvents(data.events || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch event history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filterVerdict]);

  const filteredEvents = events.filter((e) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.agent_id?.toLowerCase().includes(q) ||
      e.tool_name?.toLowerCase().includes(q) ||
      e.explanation?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bezel-shell">
      <div className="bezel-core space-y-4">
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold text-white">SQLite Hot Storage Audit Explorer</h3>
              <p className="text-xs text-slate-400">Total Audit Records: {total}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search agent, tool, or detail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* Verdict Filter */}
            <select
              value={filterVerdict}
              onChange={(e) => setFilterVerdict(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Verdicts</option>
              <option value="block">BLOCK</option>
              <option value="allow">ALLOW</option>
              <option value="require_approval">REQUIRE APPROVAL</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">ID / Time</th>
                <th className="py-2.5 px-3">Agent & Tool</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Explanation & Audit Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No audit records found matching query.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((row) => {
                  const isBlock = row.verdict === 'block';
                  const isApproval = row.verdict === 'require_approval';

                  let badgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  if (isBlock) badgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                  if (isApproval) badgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

                  return (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-300">#{row.id}</div>
                        <div className="text-[10px] text-slate-500">
                          {row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-indigo-300">{row.tool_name}</div>
                        <div className="text-[10px] text-slate-500">id: {row.agent_id}</div>
                      </td>
                      <td className="py-3 px-3 font-bold">
                        <span className={isBlock ? 'text-rose-400' : 'text-emerald-400'}>
                          {row.risk_score?.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${badgeClass}`}>
                          {row.verdict}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-sans text-xs max-w-md truncate">
                        {row.explanation}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
