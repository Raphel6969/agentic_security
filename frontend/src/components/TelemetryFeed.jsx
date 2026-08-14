import React, { useEffect, useState } from 'react';
import { Activity, Radio, Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function TelemetryFeed() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/events/stream');

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.type === 'CONNECTED') return;

        setEvents((prev) => [
          {
            id: Date.now() + Math.random(),
            timestamp: new Date().toLocaleTimeString(),
            ...parsed,
          },
          ...prev.slice(0, 49), // Keep latest 50
        ]);
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="bezel-shell">
      <div className="bezel-core space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Radio className={`w-5 h-5 ${connected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <h3 className="text-lg font-bold text-white">Live Telemetry Stream</h3>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_10px_rgba(0,245,160,0.8)]' : 'bg-slate-600'}`} />
            <span className="text-slate-400">{connected ? 'SSE STREAM ACTIVE' : 'RECONNECTING...'}</span>
          </div>
        </div>

        {/* Live Stream List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {events.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-2">
              <Activity className="w-8 h-8 animate-pulse text-indigo-500/50" />
              <span>Waiting for live screening events... Trigger an attack scenario to see stream updates.</span>
            </div>
          ) : (
            events.map((evt) => {
              const isBlock = evt.verdict === 'block';
              const isApproval = evt.verdict === 'require_approval';

              let borderColor = 'border-emerald-500/30 bg-emerald-950/10';
              let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

              if (isBlock) {
                borderColor = 'border-rose-500/30 bg-rose-950/10';
                badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
              } else if (isApproval) {
                borderColor = 'border-amber-500/30 bg-amber-950/10';
                badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
              }

              return (
                <div
                  key={evt.id}
                  className={`p-3.5 rounded-xl border ${borderColor} transition-all duration-300 font-mono text-xs space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${badgeColor}`}>
                        {evt.verdict}
                      </span>
                      <span className="text-slate-300 font-bold">{evt.tool_name}</span>
                      <span className="text-slate-500">agent: {evt.agent_id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{evt.timestamp}</span>
                    </div>
                  </div>

                  <div className="text-slate-300 font-sans text-xs">
                    {evt.explanation}
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-white/5">
                    <span>Risk Score: <strong className={isBlock ? 'text-rose-400' : 'text-emerald-400'}>{evt.risk_score?.toFixed(2)}</strong></span>
                    <span>Source: {evt.incoming_source}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
