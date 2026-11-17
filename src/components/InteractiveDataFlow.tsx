import React, { useEffect, useRef } from 'react';

export const InteractiveDataFlow: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const ctx = cv.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let W = 0;
    let H = 0;
    const CYCLE = 9;
    const heights = [3, 5, 8, 12, 16, 20, 24];

    interface Dot {
      sx: number;
      sy: number;
      ph: number;
      sp: number;
      tx: number;
      ty: number;
      delay: number;
      mark: boolean;
    }

    let dots: Dot[] = [];

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const ease = (x: number) => {
      x = Math.max(0, Math.min(1, x));
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const narrow = W < 560;
      const cols = heights.length;
      const x0 = W * (narrow ? 0.46 : 0.58);
      const x1 = W * (narrow ? 0.94 : 0.92);
      const step = (x1 - x0) / (cols - 1);
      const gap = narrow ? 5.8 : 7.0;
      const base = H - 28;
      dots = [];

      heights.forEach((h, c) => {
        for (let k = 0; k < h; k++) {
          dots.push({
            sx: rnd(W * 0.04, W * (narrow ? 0.38 : 0.42)),
            sy: rnd(14, H - 36),
            ph: rnd(0, 6.28),
            sp: rnd(0.5, 1.2),
            tx: x0 + c * step,
            ty: base - k * gap,
            delay: c * 0.2 + rnd(0, 0.3),
            mark: c === cols - 1 && k === h - 1,
          });
        }
      });
    };

    const t0 = performance.now();

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const base = H - 28;

      // baseline
      ctx.strokeStyle = '#222831';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W * 0.03, base + 6);
      ctx.lineTo(W * 0.97, base + 6);
      ctx.stroke();

      // labels
      ctx.font = '500 10.5px "Kanit", monospace';
      ctx.fillStyle = '#646973';
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.fillText('RAW DATA', W * 0.03, H - 6);
      ctx.textAlign = 'center';
      ctx.fillText('MODEL & AI', W * 0.5, H - 6);
      ctx.textAlign = 'right';
      ctx.fillText('DECISION & IMPACT', W * 0.97, H - 6);

      const d = ease((t - 7.5) / 1.2);

      for (let i = 0; i < dots.length; i++) {
        const o = dots[i];
        const p = ease((t - 1 - o.delay) / 2.5) * (1 - d);
        const wob = (1 - p) * 8;
        const x = o.sx + (o.tx - o.sx) * p + Math.sin(t * o.sp + o.ph) * wob;
        const y = o.sy + (o.ty - o.sy) * p + Math.cos(t * o.sp * 1.2 + o.ph) * wob;

        ctx.globalAlpha = 0.35 + 0.65 * p;
        if (o.mark && p > 0.85) {
          ctx.fillStyle = '#B600A8';
        } else if (p > 0.55) {
          ctx.fillStyle = '#BBCCD7';
        } else {
          ctx.fillStyle = '#4B5563';
        }

        ctx.beginPath();
        ctx.arc(x, y, o.mark && p > 0.85 ? 4.5 : 2.4, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      draw(((now - t0) / 1000) % CYCLE);
      animId = requestAnimationFrame(tick);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="w-full h-[180px] sm:h-[220px] block" />
    </div>
  );
};
