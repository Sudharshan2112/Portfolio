import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';

/**
 * ============================================================================
 * TIMELINE CONSTANTS (in seconds) - Exactly 10.0s loop cadence (start-to-start)
 * ============================================================================
 */
export const PETAL_TIMELINE = {
  /** Initial solid word hold before erosion begins */
  HOLD_IN: 1.0,
  /** Duration of organic erosion front sweeping across text */
  DISSOLVE: 1.8,
  /** Free outward drift and wind sway duration until apex */
  FLIGHT: 1.6,
  /** Apex pause where all petals hang momentarily suspended */
  TURN: 0.3,
  /** Exact time-reversed flight returning every petal home */
  REWIND: 2.5,
  /** Fully restored solid word hold before next cycle starts */
  HOLD_OUT: 2.8,
  /** Exact cycle period from start to start (repeats every 10.0s) */
  LOOP_PERIOD: 10.0,
} as const;

const T_ACTIVE = PETAL_TIMELINE.DISSOLVE + PETAL_TIMELINE.FLIGHT; // 3.40s
const G_ACCEL = 120; // Gravity acceleration term (px/s^2) for gentle natural float

/** Default palette matching the cyber background: Violet -> Indigo -> Blue -> Cyan -> White */
export const DEFAULT_MATCHING_COLORS = [
  '#a855f7', // 0: Vivid violet / purple (outer edges)
  '#6366f1', // 1: Indigo / royal blue
  '#3b82f6', // 2: Electric blue
  '#06b6d4', // 3: Bright neon cyan / teal
  '#ffffff', // 4: Diamond pure white (center highlight)
];

/** Helper to apply symmetrical background-matching gradient stops */
function applyGradientStops(grad: CanvasGradient, palette: string[]) {
  if (palette.length >= 5) {
    grad.addColorStop(0.0, palette[0]); // Outer left: violet
    grad.addColorStop(0.2, palette[1]); // Mid-left: indigo
    grad.addColorStop(0.38, palette[2]); // Inner-left: electric blue
    grad.addColorStop(0.5, palette[palette.length - 1]); // Center: gleaming white
    grad.addColorStop(0.62, palette[3] || palette[2]); // Inner-right: neon cyan
    grad.addColorStop(0.8, palette[1]); // Mid-right: indigo
    grad.addColorStop(1.0, palette[0]); // Outer right: violet
  } else {
    for (let i = 0; i < palette.length; i++) {
      grad.addColorStop(i / (palette.length - 1), palette[i]);
    }
  }
}

/** Props for the PetalDissolve component */
export interface PetalDissolveProps {
  /** The word or phrase to render and dissolve (default: "HEY, I'M SUDHARSHAN") */
  text?: string;
  /** Activation trigger: "hover" | "click" | "loop" | "manual" (default: "loop") */
  trigger?: 'hover' | 'click' | 'loop' | 'manual';
  /** Petal sampling density multiplier (0.5 to 2, default: 1) */
  density?: number;
  /** Font family for text rendering (default: "'Kanit', sans-serif") */
  fontFamily?: string;
  /** Font weight for text rendering (default: "900") */
  fontWeight?: string | number;
  /** Array of hex colors for petal sprites and text gradient (matches background by default) */
  colors?: string[];
  /** Custom CSS classes for container wrapper */
  className?: string;
  /** Callback fired when the entire dissolve-rewind cycle finishes */
  onComplete?: () => void;
}

/** Imperative methods exposed via ref */
export interface PetalDissolveRef {
  /** Trigger the effect from beginning */
  play: () => void;
  /** Restart the effect immediately */
  replay: () => void;
  /** Terminate loop and clean up resources */
  destroy: () => void;
  /** Direct access to render at arbitrary timeline point */
  drawAt: (t: number) => void;
}

/** Seeded PRNG (Mulberry32) for deterministic, reproducible randomness */
export function createMulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth cubic ease in-out */
export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** Pre-allocated petal data structure (zero allocations per frame) */
interface PetalData {
  count: number;
  x0: Float32Array;
  y0: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  td: Float32Array;
  spin: Float32Array;
  flutterFreq: Float32Array;
  flutterPhase: Float32Array;
  windAmp: Float32Array;
  windFreq: Float32Array;
  windPhase: Float32Array;
  sizeScale: Float32Array;
  colorIdx: Uint8Array;
}

export const PetalDissolve = forwardRef<PetalDissolveRef, PetalDissolveProps>(
  (
    {
      text = "HEY, I'M SUDHARSHAN",
      trigger = 'loop',
      density = 1,
      fontFamily = "'Kanit', sans-serif",
      fontWeight = 900,
      colors = DEFAULT_MATCHING_COLORS,
      className = '',
      onComplete,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Animation state
    const animFrameRef = useRef<number | null>(null);
    const masterStartRef = useRef<number | null>(null);
    const spritesRef = useRef<HTMLCanvasElement[]>([]);
    const petalsRef = useRef<PetalData | null>(null);
    const isLoopingRef = useRef(trigger === 'loop');
    const boundsRef = useRef({
      containerW: 0,
      containerH: 0,
      fontSize: 60,
      textX: 0,
      textY: 0,
      marginL: 60,
      marginR: 60,
      marginT: 80,
      marginB: 60,
      dpr: 1,
    });

    // 1. Pre-render Petal Sprites matching background palette
    const initSprites = useCallback(() => {
      if (typeof document === 'undefined') return;
      const sprites: HTMLCanvasElement[] = [];
      const palette = colors && colors.length >= 3 ? colors : DEFAULT_MATCHING_COLORS;

      palette.forEach((col) => {
        const sprite = document.createElement('canvas');
        sprite.width = 32;
        sprite.height = 32;
        const sCtx = sprite.getContext('2d');
        if (!sCtx) return;

        const cx = 16;
        const top = 3;
        const bottom = 29;
        const w = 9.0;
        const h = bottom - top;

        sCtx.beginPath();
        sCtx.moveTo(cx, top);
        sCtx.bezierCurveTo(cx + w, top + h * 0.32, cx + w * 0.72, bottom, cx, bottom);
        sCtx.bezierCurveTo(cx - w * 0.72, bottom, cx - w, top + h * 0.32, cx, top);
        sCtx.closePath();

        const grad = sCtx.createLinearGradient(cx, top, cx, bottom);
        grad.addColorStop(0, col);
        const isWhite =
          col.toUpperCase() === '#FFFFFF' || col.toUpperCase() === '#F8FAFC';
        grad.addColorStop(1, isWhite ? '#a5f3fc' : '#0a0f1d');
        sCtx.fillStyle = grad;
        sCtx.fill();

        // Delicate central vein highlight
        sCtx.beginPath();
        sCtx.moveTo(cx, top + 4);
        sCtx.quadraticCurveTo(cx + 0.8, top + h * 0.5, cx, bottom - 3);
        sCtx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        sCtx.lineWidth = 0.9;
        sCtx.stroke();

        sprites.push(sprite);
      });

      spritesRef.current = sprites;
    }, [colors]);

    // 2. Draw Crisp Gradient Text at Rest (Canvas ONLY - No DOM duplication)
    const drawCrispRestText = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { containerW, containerH, fontSize, textX, textY, marginL, marginT, dpr } =
        boundsRef.current;
      if (containerW <= 0 || containerH <= 0) return;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const metrics = ctx.measureText(text);
      const approxSpan = Math.max(metrics.width, 100);
      const xMin = marginL + textX - approxSpan / 2;
      const xMax = marginL + textX + approxSpan / 2;

      const palette = colors && colors.length >= 3 ? colors : DEFAULT_MATCHING_COLORS;
      const textGrad = ctx.createLinearGradient(xMin, 0, xMax, 0);
      applyGradientStops(textGrad, palette);

      ctx.fillStyle = textGrad;
      ctx.fillText(text, marginL + textX, marginT + textY);
    }, [text, fontFamily, fontWeight, colors]);

    // 3. Build Petal Grid from Offscreen Sampling
    const rebuildPetals = useCallback(() => {
      if (typeof document === 'undefined') return;
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const rawW = Math.max(rect.width, 280);
      const rawH = Math.max(rect.height, 60);

      const containerW = Math.round(rawW);
      const containerH = Math.round(rawH);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

      const computed = window.getComputedStyle(container);
      const cssFontSize = parseFloat(computed.fontSize);
      let fontSize = Math.round(cssFontSize) || Math.round(containerH * 0.85);

      // Offscreen canvas with generous padding so text glyphs are NEVER clipped
      const offW = containerW;
      const offH = Math.max(containerH, 140);
      const offscreen = document.createElement('canvas');
      offscreen.width = offW;
      offscreen.height = offH;
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      let metrics = offCtx.measureText(text);

      const maxAllowedW = containerW * 0.96;
      if (metrics.width > maxAllowedW) {
        fontSize = Math.max(16, Math.floor(fontSize * (maxAllowedW / metrics.width)));
        offCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        metrics = offCtx.measureText(text);
      }

      const textX = Math.round(containerW / 2);
      const textY = Math.round(containerH / 2);
      const offTextY = Math.round(offH / 2);
      const approxSpan = Math.max(metrics.width, 100);
      const xMin = Math.round(textX - approxSpan / 2);
      const xMax = Math.round(textX + approxSpan / 2);

      const palette = colors && colors.length >= 3 ? colors : DEFAULT_MATCHING_COLORS;
      const textGrad = offCtx.createLinearGradient(xMin, 0, xMax, 0);
      applyGradientStops(textGrad, palette);

      offCtx.clearRect(0, 0, offW, offH);
      offCtx.fillStyle = textGrad;
      offCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(text, textX, offTextY);

      const imgData = offCtx.getImageData(0, 0, offW, offH);
      const data = imgData.data;

      let baseStep = Math.max(2, Math.round(3.5 / Math.max(0.5, Math.min(2.0, density))));
      let points: { x: number; y: number }[] = [];

      for (let attempt = 0; attempt < 3; attempt++) {
        points = [];
        for (let y = 0; y < offH; y += baseStep) {
          for (let x = 0; x < offW; x += baseStep) {
            const idx = (y * offW + x) * 4;
            if (data[idx + 3] > 40) {
              const mappedY = y - (offTextY - textY);
              points.push({ x, y: mappedY });
            }
          }
        }
        if (points.length < 500 && baseStep > 2) {
          baseStep = Math.max(2, baseStep - 1);
        } else if (points.length > 2800) {
          baseStep += 1;
        } else {
          break;
        }
      }

      // Procedural fallback
      if (points.length < 100) {
        points = [];
        const step = 4;
        const yStart = textY - fontSize * 0.45;
        const yEnd = textY + fontSize * 0.45;
        for (let x = xMin; x <= xMax; x += step) {
          for (let y = yStart; y <= yEnd; y += step) {
            points.push({ x: Math.round(x), y: Math.round(y) });
          }
        }
      }

      const N = points.length;
      const rng = createMulberry32(849204);

      const x0 = new Float32Array(N);
      const y0 = new Float32Array(N);
      const vx = new Float32Array(N);
      const vy = new Float32Array(N);
      const td = new Float32Array(N);
      const spin = new Float32Array(N);
      const flutterFreq = new Float32Array(N);
      const flutterPhase = new Float32Array(N);
      const windAmp = new Float32Array(N);
      const windFreq = new Float32Array(N);
      const windPhase = new Float32Array(N);
      const sizeScale = new Float32Array(N);
      const colorIdx = new Uint8Array(N);

      let realMinX = containerW;
      let realMaxX = 0;
      for (let i = 0; i < N; i++) {
        if (points[i].x < realMinX) realMinX = points[i].x;
        if (points[i].x > realMaxX) realMaxX = points[i].x;
      }
      const realSpan = Math.max(realMaxX - realMinX, 1);

      let envMinX = 0;
      let envMaxX = containerW;
      let envMinY = 0;
      let envMaxY = containerH;

      for (let i = 0; i < N; i++) {
        const pt = points[i];
        x0[i] = pt.x;
        y0[i] = pt.y;

        const u = (pt.x - realMinX) / realSpan;
        const noise = (rng() - 0.5) * 0.32 + Math.sin(pt.y * 0.12) * 0.1;
        const sweepProgress = Math.max(0, Math.min(1, u + noise));
        td[i] = sweepProgress * (PETAL_TIMELINE.DISSOLVE - 0.25);

        const outward = (pt.x - containerW / 2) / (containerW / 2);
        vx[i] = outward * (rng() * 45 + 24) + (rng() - 0.5) * 30;
        vy[i] = -(rng() * 65 + 40);

        spin[i] = (rng() - 0.5) * 3.6;
        flutterFreq[i] = rng() * 3.2 + 2.2;
        flutterPhase[i] = rng() * Math.PI * 2;

        windAmp[i] = rng() * 36 + 18;
        windFreq[i] = rng() * 2.0 + 1.0;
        windPhase[i] = rng() * Math.PI * 2;

        sizeScale[i] = rng() * 0.45 + 0.65;

        // Map petal color symmetrically from edge to center highlight
        const distFromCenter = Math.min(1, 2 * Math.abs(u - 0.5));
        const colorWeight = 1 - distFromCenter;
        const baseIdx = Math.round(colorWeight * (palette.length - 1));
        const jitter = (rng() - 0.5) * 0.65;
        colorIdx[i] = Math.max(
          0,
          Math.min(palette.length - 1, Math.round(baseIdx + jitter))
        );

        const maxTau = Math.max(0, T_ACTIVE - td[i]);
        const steps = 12;
        for (let s = 0; s <= steps; s++) {
          const tau = (s / steps) * maxTau;
          const w =
            windAmp[i] *
            Math.sin(windFreq[i] * tau + windPhase[i]) *
            (1 - Math.exp(-tau * 2.5));
          const curX = pt.x + vx[i] * tau + w;
          const curY = pt.y + vy[i] * tau + 0.5 * G_ACCEL * tau * tau;

          if (curX < envMinX) envMinX = curX;
          if (curX > envMaxX) envMaxX = curX;
          if (curY < envMinY) envMinY = curY;
          if (curY > envMaxY) envMaxY = curY;
        }
      }

      const marginL = Math.max(50, Math.ceil(-envMinX) + 40);
      const marginR = Math.max(50, Math.ceil(envMaxX - containerW) + 40);
      const marginT = Math.max(50, Math.ceil(-envMinY) + 40);
      const marginB = Math.max(50, Math.ceil(envMaxY - containerH) + 40);

      petalsRef.current = {
        count: N,
        x0,
        y0,
        vx,
        vy,
        td,
        spin,
        flutterFreq,
        flutterPhase,
        windAmp,
        windFreq,
        windPhase,
        sizeScale,
        colorIdx,
      };

      boundsRef.current = {
        containerW,
        containerH,
        fontSize,
        textX,
        textY,
        marginL,
        marginR,
        marginT,
        marginB,
        dpr,
      };

      canvas.width = Math.round((containerW + marginL + marginR) * dpr);
      canvas.height = Math.round((containerH + marginT + marginB) * dpr);
      canvas.style.width = `${containerW + marginL + marginR}px`;
      canvas.style.height = `${containerH + marginT + marginB}px`;
      canvas.style.left = `-${marginL}px`;
      canvas.style.top = `-${marginT}px`;

      initSprites();
      drawCrispRestText();
    }, [text, density, fontFamily, fontWeight, colors, initSprites, drawCrispRestText]);

    // 4. Pure Stateless Render Function
    const renderPureState = useCallback(
      (evalTime: number) => {
        const canvas = canvasRef.current;
        const petals = petalsRef.current;
        const sprites = spritesRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (evalTime <= 0 || !petals || sprites.length === 0) {
          drawCrispRestText();
          return;
        }

        const { marginL, marginT, dpr } = boundsRef.current;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const N = petals.count;
        const {
          x0,
          y0,
          vx,
          vy,
          td,
          spin,
          flutterFreq,
          flutterPhase,
          windAmp,
          windFreq,
          windPhase,
          sizeScale,
          colorIdx,
        } = petals;

        const spriteSize = 32;
        const halfSprite = spriteSize / 2;

        for (let i = 0; i < N; i++) {
          const tDetached = td[i];

          // Attached to word prior to erosion front reaching this petal
          if (evalTime <= tDetached) {
            const px = x0[i] + marginL;
            const py = y0[i] + marginT;
            const sprite = sprites[colorIdx[i]];
            const s = sizeScale[i] * 0.42;

            ctx.globalAlpha = 1.0;
            ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * px, dpr * py);
            ctx.drawImage(sprite, -halfSprite, -halfSprite);
            continue;
          }

          // Local flight time
          const tau = evalTime - tDetached;
          const wind =
            windAmp[i] *
            Math.sin(windFreq[i] * tau + windPhase[i]) *
            (1 - Math.exp(-tau * 2.5));
          const curX = x0[i] + vx[i] * tau + wind + marginL;
          const curY = y0[i] + vy[i] * tau + 0.5 * G_ACCEL * tau * tau + marginT;

          const theta = spin[i] * tau;
          const flip = Math.cos(flutterFreq[i] * tau + flutterPhase[i]);
          const baseScale = sizeScale[i] * 0.48;
          const scaleX = flip * baseScale;
          const scaleY = baseScale;

          let opacity = 1.0;
          if (tau > T_ACTIVE - 0.45) {
            opacity = Math.max(0, (T_ACTIVE - tau) / 0.45);
          }

          const sprite = sprites[colorIdx[i]];

          ctx.globalAlpha = opacity;
          ctx.setTransform(dpr * scaleX, 0, 0, dpr * scaleY, dpr * curX, dpr * curY);
          ctx.rotate(theta);
          ctx.drawImage(sprite, -halfSprite, -halfSprite);
        }

        ctx.globalAlpha = 1.0;
      },
      [drawCrispRestText]
    );

    // 5. Master Clock Frame Dispatcher (Exact 10.0s Cadence)
    const renderCycleFrame = useCallback(
      (cycleTime: number) => {
        if (cycleTime < PETAL_TIMELINE.HOLD_IN) {
          // Phase 1: HOLD_IN (0 to 1.0s) - Solid razor-sharp gradient text
          renderPureState(0);
        } else if (cycleTime < PETAL_TIMELINE.HOLD_IN + T_ACTIVE) {
          // Phase 2: DISSOLVE & FLIGHT (1.0s to 4.4s) - Petals sweep, detach, and drift
          const forwardTime = cycleTime - PETAL_TIMELINE.HOLD_IN;
          renderPureState(forwardTime);
        } else if (
          cycleTime <
          PETAL_TIMELINE.HOLD_IN + T_ACTIVE + PETAL_TIMELINE.TURN
        ) {
          // Phase 3: TURN (4.4s to 4.7s) - Apex hang
          renderPureState(T_ACTIVE);
        } else if (
          cycleTime <
          PETAL_TIMELINE.HOLD_IN +
            T_ACTIVE +
            PETAL_TIMELINE.TURN +
            PETAL_TIMELINE.REWIND
        ) {
          // Phase 4: REWIND (4.7s to 7.2s) - Exact reverse trajectory home
          const rewindElapsed =
            cycleTime -
            (PETAL_TIMELINE.HOLD_IN + T_ACTIVE + PETAL_TIMELINE.TURN);
          const rewindProgress = Math.min(1, rewindElapsed / PETAL_TIMELINE.REWIND);
          const easedProgress = easeInOutCubic(rewindProgress);
          const effectiveTime = T_ACTIVE * (1 - easedProgress);
          renderPureState(effectiveTime);
        } else {
          // Phase 5: HOLD_OUT (7.2s to 10.0s) - Fully restored word held rock solid
          renderPureState(0);
        }
      },
      [renderPureState]
    );

    // 6. Animation RAF Loop
    const startLoop = useCallback(() => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      masterStartRef.current = null;

      const loop = (now: number) => {
        if (masterStartRef.current === null) {
          masterStartRef.current = now;
        }

        const totalElapsed = (now - masterStartRef.current) / 1000;

        if (isLoopingRef.current) {
          const cycleTime = totalElapsed % PETAL_TIMELINE.LOOP_PERIOD;
          renderCycleFrame(cycleTime);
          animFrameRef.current = requestAnimationFrame(loop);
        } else {
          if (totalElapsed < PETAL_TIMELINE.LOOP_PERIOD) {
            renderCycleFrame(totalElapsed);
            animFrameRef.current = requestAnimationFrame(loop);
          } else {
            renderPureState(0);
            animFrameRef.current = null;
            if (onComplete) onComplete();
          }
        }
      };

      animFrameRef.current = requestAnimationFrame(loop);
    }, [renderCycleFrame, renderPureState, onComplete]);

    const stopLoop = useCallback(() => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    }, []);

    // 7. Imperative Ref API
    useImperativeHandle(
      ref,
      () => ({
        play: () => {
          isLoopingRef.current = false;
          startLoop();
        },
        replay: () => {
          stopLoop();
          isLoopingRef.current = false;
          startLoop();
        },
        destroy: () => {
          stopLoop();
        },
        drawAt: (t: number) => {
          stopLoop();
          renderPureState(t);
        },
      }),
      [startLoop, stopLoop, renderPureState]
    );

    // 8. Lifecycle
    useEffect(() => {
      isLoopingRef.current = trigger === 'loop';
      rebuildPetals();

      // Check prefers-reduced-motion: if enabled, render static word
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mql && mql.matches) {
        drawCrispRestText();
        return;
      }

      if (trigger === 'loop') {
        startLoop();
      }

      // Handle ResizeObserver
      const container = containerRef.current;
      let resizeObserver: ResizeObserver | null = null;
      if (container && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          rebuildPetals();
        });
        resizeObserver.observe(container);
      }

      // Handle Tab Visibility
      const handleVisibilityChange = () => {
        if (document.hidden) {
          stopLoop();
        } else {
          if (trigger === 'loop') {
            startLoop();
          } else {
            drawCrispRestText();
          }
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        stopLoop();
        if (resizeObserver) resizeObserver.disconnect();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }, [trigger, rebuildPetals, startLoop, stopLoop, drawCrispRestText]);

    // 9. Interactive Trigger Handlers
    const handleClick = () => {
      if (trigger === 'click') {
        stopLoop();
        isLoopingRef.current = false;
        startLoop();
      }
    };

    const handleMouseEnter = () => {
      if (trigger === 'hover') {
        stopLoop();
        isLoopingRef.current = false;
        startLoop();
      }
    };

    return (
      <div
        ref={containerRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        className={`relative inline-block overflow-visible select-none ${className}`}
        style={{ verticalAlign: 'middle' }}
      >
        {/* Transparent DOM layout spacer */}
        <span
          className="invisible block select-none pointer-events-none"
          aria-hidden="true"
        >
          {text}
        </span>

        {/* Dynamic single canvas rendering both text and flying petals */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute pointer-events-none block z-10"
        />
      </div>
    );
  }
);

PetalDissolve.displayName = 'PetalDissolve';

export default PetalDissolve;
