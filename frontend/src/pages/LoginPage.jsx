import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:8000';

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'not_invited') setError('Your email is not registered. Contact your Admin to be invited.');
    else if (err === 'oauth_denied') setError('OAuth login was cancelled.');
    else if (err === 'oauth_failed') setError('OAuth login failed. Please try again.');
    else if (err === 'no_email') setError('Could not retrieve email from OAuth provider.');

    // Generate floating particles
    setParticles(Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 4,
    })));
  }, []);

  return (
    <div style={styles.root}>
      {/* Animated background particles */}
      <div style={styles.particleLayer}>
        {particles.map(p => (
          <div key={p.id} style={{
            ...styles.particle,
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animation: `floatParticle ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
          }} />
        ))}
      </div>

      {/* Grid overlay */}
      <div style={styles.gridOverlay} />

      {/* Login card */}
      <div style={styles.card}>
        {/* Logo / brand */}
        <div style={styles.logoWrap}>
          <div style={styles.logoRing}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 3L28 9V17C28 23 22.627 28.37 16 30C9.373 28.37 4 23 4 17V9L16 3Z"
                fill="url(#shield)" stroke="rgba(99,102,241,0.5)" strokeWidth="1"/>
              <path d="M12 16l3 3 5-5" stroke="#a5b4fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="shield" x1="4" y1="3" x2="28" y2="30" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#312e81"/>
                  <stop offset="1" stopColor="#1e1b4b"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <h1 style={styles.title}>Sentinel Layer</h1>
        <p style={styles.subtitle}>Runtime AI Security Platform</p>
        <p style={styles.tagline}>Sign in to access the agentic security console</p>

        {error && (
          <div style={styles.errorBox}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div style={styles.buttonGroup}>
          <a href={`${API}/auth/google`} style={styles.oauthBtn}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>

          <a href={`${API}/auth/github`} style={styles.oauthBtnGh}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </a>
        </div>

        <p style={styles.notice}>
          Access is by invitation only.{' '}
          <span style={{ color: '#818cf8' }}>Contact your Admin</span> to be added.
        </p>

        <div style={styles.pillRow}>
          <span style={styles.pill}>🔒 JWT Auth</span>
          <span style={styles.pill}>🛡️ Role-Based</span>
          <span style={styles.pill}>⚡ Real-time</span>
        </div>
      </div>

      <style>{`
        @keyframes floatParticle {
          0% { transform: translateY(0px) scale(1); opacity: 0.3; }
          100% { transform: translateY(-30px) scale(1.5); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  root: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at 20% 50%, #1e1b4b 0%, #0f0f23 50%, #0a0a1a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  particleLayer: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
  },
  particle: {
    position: 'absolute',
    borderRadius: '50%',
    background: 'rgba(99,102,241,0.6)',
    boxShadow: '0 0 8px rgba(99,102,241,0.4)',
  },
  gridOverlay: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
  },
  card: {
    position: 'relative', zIndex: 10,
    background: 'rgba(17,17,40,0.85)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(99,102,241,0.2)',
    borderRadius: 24,
    padding: '48px 40px',
    width: 400,
    textAlign: 'center',
    boxShadow: '0 0 60px rgba(99,102,241,0.08), 0 24px 48px rgba(0,0,0,0.5)',
  },
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: 20 },
  logoRing: {
    width: 72, height: 72, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
    border: '1px solid rgba(99,102,241,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 24px rgba(99,102,241,0.15)',
  },
  title: {
    margin: '0 0 6px', fontSize: 28, fontWeight: 700,
    background: 'linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 100%)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    margin: '0 0 8px', fontSize: 13, color: '#6366f1', fontWeight: 500, letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tagline: { margin: '0 0 32px', fontSize: 14, color: '#94a3b8' },
  errorBox: {
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 10, padding: '12px 16px', marginBottom: 24,
    display: 'flex', alignItems: 'center', gap: 10,
    color: '#fca5a5', fontSize: 13, textAlign: 'left',
  },
  buttonGroup: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 },
  oauthBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    padding: '13px 20px', borderRadius: 12, textDecoration: 'none',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#e2e8f0', fontSize: 15, fontWeight: 500,
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  oauthBtnGh: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
    padding: '13px 20px', borderRadius: 12, textDecoration: 'none',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#e2e8f0', fontSize: 15, fontWeight: 500,
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  notice: { fontSize: 12, color: '#64748b', marginBottom: 24 },
  pillRow: { display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  pill: {
    fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.1)',
    border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '4px 10px',
  },
};
