import React, { useEffect, useRef } from 'react';

// Minimal ambient scanline grid — GPU composited, no DOM clutter
export default function AmbientGrid() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Static render — no animation needed, just a faint grid
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(124,58,237,0.025)';
      ctx.lineWidth = 1;
      const gs = 48;
      for (let x = 0; x < canvas.width; x += gs) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gs) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }
    };
    draw();
    window.addEventListener('resize', draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('resize', draw);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 1 }}
    />
  );
}
