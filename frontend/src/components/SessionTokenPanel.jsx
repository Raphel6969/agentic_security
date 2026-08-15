import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000';

function apiFetch(path, options = {}, token) {
  return fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    ...options,
  }).then(r => r.json());
}

function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return null; }
}

function CountDown({ expiresAt }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(expiresAt) - Date.now();
      if (diff <= 0) { setRemaining('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m remaining`);
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [expiresAt]);
  return <span style={{ color: remaining === 'Expired' ? '#ef4444' : '#10b981', fontSize: 11 }}>{remaining}</span>;
}

export default function SessionTokenPanel() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [newToken, setNewToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showDecoded, setShowDecoded] = useState(false);

  const load = async () => {
    const data = await apiFetch('/tokens/agent', {}, user.token);
    setTokens(data.tokens || []);
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    const data = await apiFetch('/tokens/agent', { method: 'POST' }, user.token);
    setNewToken(data);
    setGenerating(false);
    setShowDecoded(false);
    load();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newToken.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRevoke = async (jti) => {
    await apiFetch(`/tokens/agent/${jti}`, { method: 'DELETE' }, user.token);
    if (newToken?.jti === jti) setNewToken(null);
    load();
  };

  const decoded = newToken ? parseJwt(newToken.token) : null;
  const activeTokens = tokens.filter(t => !t.is_revoked && !t.is_expired);

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Agent Session Token</h3>
          <p style={styles.sub}>Pass this token to your agent via <code style={styles.code}>X-Sentinel-Token</code> header or <code style={styles.code}>SENTINEL_TOKEN</code> env var</p>
        </div>
        <span style={styles.badge}>{activeTokens.length} active</span>
      </div>

      <button onClick={handleGenerate} disabled={generating} style={styles.genBtn}>
        {generating ? '⏳ Generating...' : '⚡ Generate New Token'}
      </button>

      {newToken && (
        <div style={styles.tokenCard}>
          <div style={styles.tokenHeader}>
            <span style={styles.tokenLabel}>New Token — {newToken.role}</span>
            <CountDown expiresAt={newToken.expires_at} />
          </div>

          <div style={styles.tokenBox}>
            <code style={styles.tokenText}>{newToken.token}</code>
          </div>

          <div style={styles.tokenActions}>
            <button onClick={handleCopy} style={{ ...styles.actionBtn, background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', borderColor: copied ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)', color: copied ? '#6ee7b7' : '#a5b4fc' }}>
              {copied ? '✓ Copied!' : '📋 Copy Token'}
            </button>
            <button onClick={() => setShowDecoded(!showDecoded)} style={{ ...styles.actionBtn, background: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.2)', color: '#94a3b8' }}>
              {showDecoded ? 'Hide Decoded' : '🔍 Decode Payload'}
            </button>
            <button onClick={() => handleRevoke(newToken.jti)} style={{ ...styles.actionBtn, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              🗑 Revoke
            </button>
          </div>

          {showDecoded && decoded && (
            <div style={styles.decoded}>
              <div style={styles.decodedTitle}>Decoded Payload <span style={{ color: '#475569', fontWeight: 400 }}>— verify at jwt.io</span></div>
              <div style={styles.decodedGrid}>
                <div style={styles.decodedRow}><span style={styles.key}>role</span><span style={{ ...styles.val, color: '#f59e0b' }}>{decoded.role}</span></div>
                <div style={styles.decodedRow}><span style={styles.key}>email</span><span style={styles.val}>{decoded.email}</span></div>
                <div style={styles.decodedRow}><span style={styles.key}>session_id</span><span style={styles.val}>{decoded.session_id?.slice(0, 18)}...</span></div>
                <div style={{ ...styles.decodedRow, alignItems: 'flex-start' }}>
                  <span style={styles.key}>permissions</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {Object.entries(decoded.permissions || {}).map(([k, v]) => (
                      <span key={k} style={{ color: v ? '#6ee7b7' : '#fca5a5', fontSize: 11, fontFamily: 'monospace' }}>
                        {v ? '✓' : '✗'} {k}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={styles.decodedRow}>
                  <span style={styles.key}>expires</span>
                  <span style={styles.val}>{new Date(decoded.exp * 1000).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          )}

          <div style={styles.usageBox}>
            <div style={styles.usageTitle}>Usage</div>
            <code style={styles.usageCode}>export SENTINEL_TOKEN="{newToken.token.slice(0, 40)}..."</code>
            <code style={styles.usageCode}>python demos/pdf_injection/demo_agent.py</code>
          </div>
        </div>
      )}

      {/* Token history */}
      {tokens.length > 0 && (
        <div style={styles.history}>
          <div style={styles.histTitle}>Token History</div>
          {tokens.map(t => (
            <div key={t.jti} style={{ ...styles.histRow, opacity: t.is_revoked || t.is_expired ? 0.4 : 1 }}>
              <div>
                <div style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'monospace' }}>{t.jti.slice(0, 20)}...</div>
                <div style={{ color: '#475569', fontSize: 11 }}>Issued {new Date(t.issued_at).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {t.is_revoked ? (
                  <span style={{ fontSize: 11, color: '#ef4444' }}>Revoked</span>
                ) : t.is_expired ? (
                  <span style={{ fontSize: 11, color: '#64748b' }}>Expired</span>
                ) : (
                  <>
                    <CountDown expiresAt={t.expires_at} />
                    <button onClick={() => handleRevoke(t.jti)} style={{ ...styles.actionBtn, padding: '3px 8px', fontSize: 11, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                      Revoke
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { padding: 20 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#e2e8f0' },
  sub: { margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 },
  code: { background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', padding: '1px 5px', borderRadius: 4, fontFamily: 'monospace', fontSize: 11 },
  badge: { background: 'rgba(16,185,129,0.15)', color: '#6ee7b7', borderRadius: 20, padding: '3px 10px', fontSize: 11, whiteSpace: 'nowrap' },
  genBtn: {
    width: '100%', padding: '11px', borderRadius: 10,
    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.1))',
    border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: 14, fontWeight: 600,
    cursor: 'pointer', marginBottom: 16, transition: 'all 0.2s',
  },
  tokenCard: { background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 },
  tokenHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  tokenLabel: { fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5 },
  tokenBox: { background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 12px', marginBottom: 10, overflowX: 'auto' },
  tokenText: { fontSize: 10, color: '#94a3b8', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.6 },
  tokenActions: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  actionBtn: {
    border: '1px solid', borderRadius: 7, padding: '6px 12px', fontSize: 12,
    fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  },
  decoded: { background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 12 },
  decodedTitle: { fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  decodedGrid: { display: 'flex', flexDirection: 'column', gap: 6 },
  decodedRow: { display: 'flex', alignItems: 'center', gap: 12 },
  key: { fontSize: 11, color: '#475569', fontFamily: 'monospace', minWidth: 90 },
  val: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },
  usageBox: { background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 12px' },
  usageTitle: { fontSize: 10, color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  usageCode: { display: 'block', fontSize: 10, color: '#6ee7b7', fontFamily: 'monospace', marginBottom: 3 },
  history: { marginTop: 8 },
  histTitle: { fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  histRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' },
};
