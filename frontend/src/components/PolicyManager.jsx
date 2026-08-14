import React, { useEffect, useState } from 'react';

export default function PolicyManager() {
  const [yaml, setYaml] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text }

  const fetch_ = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/policy');
      const d = await res.json();
      setYaml(d.raw_yaml || '');
    } catch { setMsg({ type: 'err', text: 'Failed to load policy file.' }); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const res = await fetch('/api/policy', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy_yaml: yaml }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.detail);
      setMsg({ type: 'ok', text: 'Policy saved and hot-reloaded.' });
    } catch (e) {
      setMsg({ type: 'err', text: e.message });
    } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col h-full gap-4 page-enter">
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p className="section-label">Policy Configuration</p>
          <p style={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.3)', marginTop: 4 }}>
            policy/policy.example.yaml — live hot-reload
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fetch_} disabled={loading}
            style={{ padding: '0.4rem 0.875rem', borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: 'rgba(240,240,248,0.6)', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {loading ? '...' : 'RELOAD'}
          </button>
          <button onClick={save} disabled={saving || loading}
            style={{ padding: '0.4rem 1.25rem', borderRadius: 7, background: '#00FF94', fontFamily: 'JetBrains Mono', fontSize: '0.65rem', color: '#04060F', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', border: 'none', boxShadow: saving ? 'none' : '0 0 16px rgba(0,255,148,0.3)' }}>
            {saving ? 'SAVING...' : 'SAVE & APPLY'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding: '0.625rem 1rem', borderRadius: 7, fontFamily: 'JetBrains Mono', fontSize: '0.7rem', background: msg.type === 'ok' ? 'rgba(0,255,148,0.07)' : 'rgba(255,61,90,0.07)', border: `1px solid ${msg.type === 'ok' ? 'rgba(0,255,148,0.2)' : 'rgba(255,61,90,0.2)'}`, color: msg.type === 'ok' ? '#00FF94' : '#FF3D5A' }}>
          {msg.text}
        </div>
      )}

      {/* Editor */}
      <div style={{ flex: 1, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF3D5A' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FF94' }} />
          <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.6rem', color: 'rgba(240,240,248,0.25)', marginLeft: 8, letterSpacing: '0.1em' }}>YAML</span>
        </div>
        <textarea
          className="code-editor"
          value={yaml}
          onChange={(e) => setYaml(e.target.value)}
          disabled={loading}
          rows={20}
          style={{ paddingTop: '2.5rem', minHeight: '100%', borderRadius: 8 }}
        />
      </div>
    </div>
  );
}
