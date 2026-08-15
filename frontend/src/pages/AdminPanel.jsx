import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000';

function apiFetch(path, options = {}, token) {
  return fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options.headers },
    ...options,
  }).then(r => r.json());
}

const ROLE_COLORS = {
  admin: '#f59e0b', tech_lead: '#6366f1', developer: '#10b981', intern: '#94a3b8',
};
const ROLE_LABELS = {
  admin: 'Admin', tech_lead: 'Tech Lead', developer: 'Developer', intern: 'Intern',
};
const ALL_ACTIONS = ['search_web', 'read_email', 'execute_sql', 'write_file', 'call_http'];

export default function AdminPanel() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '', role: 'developer' });
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState(null);
  const [expandedUser, setExpandedUser] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await apiFetch('/users', {}, user.token);
    setUsers(data.users || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await apiFetch('/users', {
        method: 'POST', body: JSON.stringify(inviteForm),
      }, user.token);
      if (res.user) {
        showMsg(`✓ Invited ${inviteForm.email} as ${inviteForm.role}`);
        setInviteForm({ email: '', name: '', role: 'developer' });
        load();
      } else {
        showMsg(res.detail || 'Failed to invite', 'error');
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    await apiFetch(`/users/${userId}/role`, {
      method: 'PATCH', body: JSON.stringify({ role: newRole }),
    }, user.token);
    showMsg('Role updated');
    load();
  };

  const handlePermissionToggle = async (userId, action, currentValue) => {
    await apiFetch(`/users/${userId}/permissions`, {
      method: 'PATCH', body: JSON.stringify({ permissions: { [action]: !currentValue } }),
    }, user.token);
    load();
  };

  const handleDeactivate = async (userId, email) => {
    if (!window.confirm(`Deactivate ${email}? All their tokens will be revoked.`)) return;
    await apiFetch(`/users/${userId}`, { method: 'DELETE' }, user.token);
    showMsg(`${email} deactivated`);
    load();
  };

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <h2 style={styles.title}>User Management</h2>
        <span style={styles.badge}>{users.length} members</span>
      </div>

      {message && (
        <div style={{ ...styles.toast, background: message.type === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', borderColor: message.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)', color: message.type === 'error' ? '#fca5a5' : '#6ee7b7' }}>
          {message.text}
        </div>
      )}

      {/* Invite form */}
      <div style={styles.inviteCard}>
        <h3 style={styles.sectionTitle}>Invite Member</h3>
        <form onSubmit={handleInvite} style={styles.inviteForm}>
          <input
            style={styles.input} type="email" placeholder="Email address"
            value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            style={styles.input} placeholder="Display name"
            value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <select
            style={styles.select} value={inviteForm.role}
            onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
          >
            <option value="tech_lead">Tech Lead</option>
            <option value="developer">Developer</option>
            <option value="intern">Intern</option>
          </select>
          <button style={styles.inviteBtn} type="submit" disabled={inviting}>
            {inviting ? 'Inviting...' : '+ Invite'}
          </button>
        </form>
      </div>

      {/* User list */}
      {loading ? (
        <div style={{ color: '#64748b', padding: 32, textAlign: 'center' }}>Loading members...</div>
      ) : (
        <div style={styles.userList}>
          {users.map(u => (
            <div key={u.id} style={{ ...styles.userCard, opacity: u.is_active ? 1 : 0.5 }}>
              <div style={styles.userRow} onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}>
                <div style={styles.avatar}>
                  {u.avatar_url
                    ? <img src={u.avatar_url} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 18 }}>{u.name?.[0]?.toUpperCase() || '?'}</span>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.userName}>{u.name}</div>
                  <div style={styles.userEmail}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <select
                    style={{ ...styles.roleSelect, borderColor: ROLE_COLORS[u.role] || '#6366f1', color: ROLE_COLORS[u.role] || '#6366f1' }}
                    value={u.role}
                    onClick={e => e.stopPropagation()}
                    onChange={e => { e.stopPropagation(); handleRoleChange(u.id, e.target.value); }}
                    disabled={u.id === user.sub}
                  >
                    <option value="admin">Admin</option>
                    <option value="tech_lead">Tech Lead</option>
                    <option value="developer">Developer</option>
                    <option value="intern">Intern</option>
                  </select>
                  <span style={{ ...styles.statusDot, background: u.is_active ? '#10b981' : '#ef4444' }} />
                  {u.id !== user.sub && (
                    <button style={styles.dangerBtn} onClick={e => { e.stopPropagation(); handleDeactivate(u.id, u.email); }}>
                      ✕
                    </button>
                  )}
                  <span style={{ color: '#475569', fontSize: 12 }}>{expandedUser === u.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded permission toggles */}
              {expandedUser === u.id && (
                <div style={styles.permGrid}>
                  <div style={styles.permHeader}>Permission Overrides <span style={{ color: '#475569', fontWeight: 400 }}>(takes effect on next token generation)</span></div>
                  {ALL_ACTIONS.map(action => {
                    const allowed = u.permissions[action] ?? true;
                    return (
                      <div key={action} style={styles.permRow}>
                        <span style={styles.permName}>{action}</span>
                        <button
                          onClick={() => handlePermissionToggle(u.id, action, allowed)}
                          style={{ ...styles.toggle, background: allowed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', borderColor: allowed ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)', color: allowed ? '#6ee7b7' : '#fca5a5' }}
                        >
                          {allowed ? '✓ Allowed' : '✗ Denied'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  root: { padding: '0 0 32px' },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 },
  title: { margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0' },
  badge: { background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: 20, padding: '3px 10px', fontSize: 12 },
  toast: { borderRadius: 10, padding: '10px 16px', marginBottom: 16, border: '1px solid', fontSize: 13 },
  inviteCard: { background: 'rgba(15,15,35,0.6)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 16, padding: 20, marginBottom: 24 },
  sectionTitle: { margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  inviteForm: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  input: {
    flex: 1, minWidth: 160, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 14, outline: 'none',
  },
  select: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '9px 12px', color: '#e2e8f0', fontSize: 14, cursor: 'pointer',
  },
  inviteBtn: {
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff', border: 'none',
    borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  userList: { display: 'flex', flexDirection: 'column', gap: 10 },
  userCard: {
    background: 'rgba(15,15,35,0.6)', border: '1px solid rgba(99,102,241,0.12)',
    borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s',
  },
  userRow: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', cursor: 'pointer',
  },
  avatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#a5b4fc', fontWeight: 700, flexShrink: 0, overflow: 'hidden',
  },
  userName: { color: '#e2e8f0', fontSize: 14, fontWeight: 600 },
  userEmail: { color: '#64748b', fontSize: 12 },
  roleSelect: {
    background: 'rgba(0,0,0,0.3)', border: '1px solid', borderRadius: 6,
    padding: '4px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
  statusDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  dangerBtn: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 6, color: '#fca5a5', width: 26, height: 26, cursor: 'pointer', fontSize: 11,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  permGrid: { borderTop: '1px solid rgba(99,102,241,0.1)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8 },
  permHeader: { fontSize: 12, fontWeight: 600, color: '#6366f1', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  permRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  permName: { color: '#94a3b8', fontSize: 13, fontFamily: 'monospace' },
  toggle: {
    border: '1px solid', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
};
