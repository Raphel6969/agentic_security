import React from 'react';

export default function RiskRadarGauge({ score = 0.0, size = 180, label = "RISK SCORE" }) {
  const normalizedScore = Math.max(0.0, Math.min(1.0, score));
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - normalizedScore * circumference;

  let colorClass = "text-[#00F5A0] stroke-[#00F5A0]";
  let shadowGlow = "shadow-[0_0_20px_rgba(0,245,160,0.3)]";
  let statusText = "CLEAN / ALLOW";

  if (normalizedScore >= 0.7) {
    colorClass = "text-[#FF2E55] stroke-[#FF2E55]";
    shadowGlow = "shadow-[0_0_25px_rgba(255,46,85,0.4)]";
    statusText = "HARD BLOCK";
  } else if (normalizedScore >= 0.4) {
    colorClass = "text-[#FFB800] stroke-[#FFB800]";
    shadowGlow = "shadow-[0_0_20px_rgba(255,184,0,0.3)]";
    statusText = "APPROVAL REQ";
  }

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className={`relative flex items-center justify-center rounded-full p-2 ${shadowGlow} transition-all duration-700`}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Outer Track Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-white/10"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Animated Value Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`${colorClass} transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Inner Readout Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] uppercase tracking-[0.2em] font-mono font-semibold text-slate-400">
            {label}
          </span>
          <span className={`text-4xl font-extrabold font-mono tracking-tight my-0.5 ${colorClass}`}>
            {normalizedScore.toFixed(2)}
          </span>
          <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full bg-black/40 border border-white/10 ${colorClass}`}>
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}
