import React from 'react';

export default function RiskRadarGauge({ score = 0.0, size = 160 }) {
  const s = Math.max(0, Math.min(1, score));
  const radius = (size - 20) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - s * circ;

  let color = '#00FF94';
  let label = 'CLEAN';
  if (s >= 0.7) { color = '#FF3D5A'; label = 'BLOCK'; }
  else if (s >= 0.4) { color = '#F59E0B'; label = 'REVIEW'; }

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle cx={size/2} cy={size/2} r={radius}
            fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.32,0.72,0,1), stroke 400ms ease', filter: `drop-shadow(0 0 6px ${color}80)` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '1.5rem', fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {s.toFixed(2)}
          </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.2em', color: 'rgba(240,240,248,0.35)', marginTop: 4, textTransform: 'uppercase' }}>
            RISK
          </span>
        </div>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: 700, color, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}
