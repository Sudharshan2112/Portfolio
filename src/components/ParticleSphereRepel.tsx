import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';

/**
 * ============================================================================
 * PARTICLE SPHERE REPEL - 2D Canvas Interactive Holographic Sphere
 * ============================================================================
 * A hollow sphere of ~2500 Fibonacci-distributed tiny round dots floating in
 * the centre of a near-black background (#060608). The sphere slowly rotates in 3D
 * with a vertical gradient (violet -> blue -> teal). Pointer acts as a repulsion
 * field parting dots across the sphere surface to open a soft-edged round hole.
 * Clicking triggers an outward shockwave burst that eases smoothly back into place.
 * Critically damped smoothing ensures zero jitter or jump.
 */

export interface ParticleSphereRepelProps {
  /** Total number of particles on sphere surface (default: 2500) */
  count?: number;
  /** Three gradient hex color stops: [top, middle, bottom] */
  colors?: [string, string, string];
  /** Sphere radius as fraction of the smaller container side (default: 0.38) */
  radius?: number;
  /** Repulsion radius in normalized sphere units [0..1] (default: 0.28) */
  repelRadius?: number;
  /** Repulsion displacement strength (default: 0.35) */
  repelStrength?: number;
  /** Rotation speed in radians per second (default: 0.25) */
  rotationSpeed?: number;
  /** Background color of canvas (default: 'transparent' or '#060608') */
  background?: string;
  /** Callback fired on burst */
  onBurst?: () => void;
  /** Accessibility label for container (default: 'Interactive particle sphere') */
  ariaLabel?: string;
  /** Custom CSS classes for container wrapper */
  className?: string;
  /** Optional inline styles for container wrapper */
  style?: React.CSSProperties;
  /** Optional children rendered on top of the sphere */
  children?: React.ReactNode;
}

export interface ParticleSphereRepelRef {
  /** Trigger an outward shockwave burst at current or center position */
  burst: () => void;
  /** Pause animation loop */
  pause: () => void;
  /** Resume animation loop */
  resume: () => void;
  /** Destroy animation and clean up resources */
  destroy: () => void;
}

/** Seeded PRNG (Mulberry32) for 100% deterministic, reproducible randomness */
function createMulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Parse hex color to RGB tuple [0..255] */
function parseHex(hex: string): [number, number, number] {
  let c = hex.trim().replace('#', '');
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const n = parseInt(c, 16);
  if (isNaN(n)) return [139, 92, 246];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Linear interpolation between two RGB colors */
function lerpRgb(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  const s = Math.max(0, Math.min(1, t));
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * s),
    Math.round(c1[1] + (c2[1] - c1[1]) * s),
    Math.round(c1[2] + (c2[2] - c1[2]) * s),
  ];
}

const DEFAULT_GRADIENT: [string, string, string] = [
  '#a855f7', // Top: Violet / electric purple
  '#3b82f6', // Middle: Royal blue
  '#06b6d4', // Bottom: Bright cyan / teal
];

export const ParticleSphereRepel = forwardRef<
  ParticleSphereRepelRef,
  ParticleSphereRepelProps
>(
  (
    {
      count = 2500,
      colors = DEFAULT_GRADIENT,
      radius = 0.38,
      repelRadius = 0.28,
      repelStrength = 0.35,
      rotationSpeed = 0.25,
      background = 'transparent',
      onBurst,
      ariaLabel = 'Interactive particle sphere',
      className = '',
      style,
      children,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Animation & State Refs
    const animIdRef = useRef<number | null>(null);
    const isRunningRef = useRef(false);
    const isPausedRef = useRef(false);
    const lastTimeRef = useRef<number | null>(null);
    const timeRef = useRef<number>(0);
    const reducedMotionRef = useRef(false);

    // Raw last pointer screen coordinates for scroll re-mapping
    const lastClientPosRef = useRef<{ x: number; y: number } | null>(null);

    // Pointer state in sphere normalized space [-1..1]
    const pointerRef = useRef<{
      active: boolean;
      x: number;
      y: number;
      z: number;
    }>({
      active: false,
      x: 0,
      y: 0,
      z: 1,
    });

    // Shockwave Burst Impulse State
    const burstRef = useRef<{
      active: boolean;
      startTime: number;
      originX: number;
      originY: number;
      originZ: number;
    }>({
      active: false,
      startTime: -999,
      originX: 0,
      originY: 0,
      originZ: 1,
    });

    // Particle Data Structure (Typed Arrays for zero GC overhead)
    const dataRef = useRef<{
      count: number;
      homeX: Float32Array;
      homeY: Float32Array;
      homeZ: Float32Array;
      dispX: Float32Array;
      dispY: Float32Array;
      dispZ: Float32Array;
      targetDispX: Float32Array;
      targetDispY: Float32Array;
      targetDispZ: Float32Array;
      colorR: Uint8Array;
      colorG: Uint8Array;
      colorB: Uint8Array;
      jitter: Float32Array;
      buckets: number[][]; // 6 depth buckets for cheap back-to-front sorting
    } | null>(null);

    // Bounding dimensions
    const boundsRef = useRef({
      width: 0,
      height: 0,
      sphereR: 150,
      centerX: 0,
      centerY: 0,
      dpr: 1,
    });

    // 1. Build Fibonacci Sphere Data (once or when count/colors change)
    const initParticles = useCallback(() => {
      const N = Math.max(100, count);
      const homeX = new Float32Array(N);
      const homeY = new Float32Array(N);
      const homeZ = new Float32Array(N);
      const dispX = new Float32Array(N);
      const dispY = new Float32Array(N);
      const dispZ = new Float32Array(N);
      const targetDispX = new Float32Array(N);
      const targetDispY = new Float32Array(N);
      const targetDispZ = new Float32Array(N);
      const colorR = new Uint8Array(N);
      const colorG = new Uint8Array(N);
      const colorB = new Uint8Array(N);
      const jitter = new Float32Array(N);

      const rng = createMulberry32(739104);
      const topCol = parseHex(colors[0]);
      const midCol = parseHex(colors[1]);
      const botCol = parseHex(colors[2]);

      // Golden ratio angle for uniform spherical distribution
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~2.39996 rad

      for (let i = 0; i < N; i++) {
        // Uniform height distribution y in [-1, +1]
        const y = 1.0 - (i / (N - 1)) * 2.0;
        const radiusAtY = Math.sqrt(Math.max(0.0, 1.0 - y * y));
        const theta = goldenAngle * i;

        const x = Math.cos(theta) * radiusAtY;
        const z = Math.sin(theta) * radiusAtY;

        homeX[i] = x;
        homeY[i] = y;
        homeZ[i] = z;

        // Vertical Color Gradient: y = +1 (top), 0 (mid), -1 (bottom)
        const t = (y + 1.0) * 0.5; // [0..1] from bottom to top
        let col: [number, number, number];
        if (t >= 0.5) {
          col = lerpRgb(midCol, topCol, (t - 0.5) * 2.0);
        } else {
          col = lerpRgb(botCol, midCol, t * 2.0);
        }

        colorR[i] = col[0];
        colorG[i] = col[1];
        colorB[i] = col[2];

        // Small individual delay jitter for organic shockwave ripples
        jitter[i] = rng() * 0.08;
      }

      // Pre-allocate 6 depth buckets to prevent per-frame allocation
      const buckets: number[][] = Array.from({ length: 6 }, () => []);

      dataRef.current = {
        count: N,
        homeX,
        homeY,
        homeZ,
        dispX,
        dispY,
        dispZ,
        targetDispX,
        targetDispY,
        targetDispZ,
        colorR,
        colorG,
        colorB,
        jitter,
        buckets,
      };
    }, [count, colors]);

    // 2. Trigger Shockwave Burst
    const triggerBurst = useCallback(() => {
      if (reducedMotionRef.current) return; // Reduced motion disables bursts
      const p = pointerRef.current;
      burstRef.current = {
        active: true,
        startTime: timeRef.current,
        originX: p.active ? p.x : 0,
        originY: p.active ? p.y : 0,
        originZ: p.active ? p.z : 1,
      };
      if (onBurst) onBurst();
    }, [onBurst]);

    // 3. Update Bounding Dimensions & Canvas Size
    const updateSize = useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const rawW = Math.max(rect.width, 100);
      const rawH = Math.max(rect.height, 100);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.0);

      const w = Math.round(rawW);
      const h = Math.round(rawH);

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const sphereR = Math.min(w, h) * radius;

      boundsRef.current = {
        width: w,
        height: h,
        sphereR,
        centerX: w * 0.5,
        centerY: h * 0.5,
        dpr,
      };
    }, [radius]);

    // 4. Update Physics & Render Canvas Frame
    const renderFrame = useCallback(
      (nowTime: number, dt: number) => {
        const canvas = canvasRef.current;
        const data = dataRef.current;
        if (!canvas || !data) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height, sphereR, centerX, centerY, dpr } = boundsRef.current;
        if (width <= 0 || height <= 0 || sphereR <= 0) return;

        // Clamped delta time (<= 1/30s) to prevent jumping on tab switches
        const safeDt = Math.max(0.001, Math.min(dt, 0.033));
        timeRef.current = nowTime;

        // Rotation angles (zero rotation if prefers-reduced-motion is active)
        const isReduced = reducedMotionRef.current;
        const effRotSpeed = isReduced ? 0 : rotationSpeed;
        const rotY = nowTime * effRotSpeed;
        const tiltX = 0.26; // Fixed slight tilt for rich 3D depth

        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const cosX = Math.cos(tiltX);
        const sinX = Math.sin(tiltX);

        // Pointer state
        const pointer = pointerRef.current;
        const repelRadSq = repelRadius * repelRadius;
        const pointerActive = pointer.active;
        const px = pointer.x;
        const py = pointer.y;
        const pz = pointer.z;

        // Burst shockwave state
        const burst = burstRef.current;
        const burstElapsed = nowTime - burst.startTime;
        const isBursting = burst.active && burstElapsed < 2.2 && !isReduced;
        if (burst.active && burstElapsed >= 2.2) {
          burst.active = false;
        }

        const {
          count: N,
          homeX,
          homeY,
          homeZ,
          dispX,
          dispY,
          dispZ,
          targetDispX,
          targetDispY,
          targetDispZ,
          colorR,
          colorG,
          colorB,
          jitter,
          buckets,
        } = data;

        // Clear 6 depth buckets
        for (let b = 0; b < 6; b++) {
          buckets[b].length = 0;
        }

        // Critically damped exponential smoothing factor: 1 - exp(-k * dt)
        const smoothLambda = 1.0 - Math.exp(-14.0 * safeDt);

        // Physics step per particle
        for (let i = 0; i < N; i++) {
          // 1. Base unperturbed position on unit sphere
          const hx = homeX[i];
          const hy = homeY[i];
          const hz = homeZ[i];

          // 2. Rotate home position into World Space
          const rX1 = hx * cosY + hz * sinY;
          const rY1 = hy;
          const rZ1 = -hx * sinY + hz * cosY;

          const wx = rX1;
          const wy = rY1 * cosX - rZ1 * sinX;
          const wz = rY1 * sinX + rZ1 * cosX;

          // 3. Compute Hover Repulsion Target
          let tx = 0;
          let ty = 0;
          let tz = 0;

          if (pointerActive && wz > -0.2) {
            // Distance from pointer to world point
            const dx = wx - px;
            const dy = wy - py;
            const dz = wz - pz;
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < repelRadSq && distSq > 0.0001) {
              const dist = Math.sqrt(distSq);
              // Smooth quadratic repulsion falloff
              const force = (1.0 - dist / repelRadius) * repelStrength;

              // Tangent push direction along the sphere surface
              // Project displacement vector onto sphere tangent plane
              const dot = dx * wx + dy * wy + dz * wz;
              let tanX = dx - dot * wx;
              let tanY = dy - dot * wy;
              let tanZ = dz - dot * wz;
              const tanLen = Math.hypot(tanX, tanY, tanZ) || 1.0;

              tx = (tanX / tanLen) * force;
              ty = (tanY / tanLen) * force;
              tz = (tanZ / tanLen) * force;
            }
          }

          // 4. Compute Click Shockwave Burst Impulse
          if (isBursting) {
            const bx = wx - burst.originX;
            const by = wy - burst.originY;
            const bz = wz - burst.originZ;
            const distBurst = Math.hypot(bx, by, bz);

            // Wave arrives after small delay proportional to distance + random jitter
            const arrivalTime = distBurst * 0.28 + jitter[i];
            const tau = Math.max(0.0, burstElapsed - arrivalTime);

            if (tau > 0.0) {
              // Rapid impulse rise and smooth exponential decay envelope
              const burstEnvelope = tau * Math.exp(-tau * 4.2) * 2.8;
              // Push outward along surface normal
              tx += wx * burstEnvelope;
              ty += wy * burstEnvelope;
              tz += wz * burstEnvelope;
            }
          }

          targetDispX[i] = tx;
          targetDispY[i] = ty;
          targetDispZ[i] = tz;

          // 5. Critically Damped Smoothing (exponential approach)
          dispX[i] += (tx - dispX[i]) * smoothLambda;
          dispY[i] += (ty - dispY[i]) * smoothLambda;
          dispZ[i] += (tz - dispZ[i]) * smoothLambda;

          // 6. Final World Position
          const finalZ = wz + dispZ[i];

          // 7. Partition into 6 Depth Buckets [-1.2 .. +1.2]
          const normDepth = (finalZ + 1.2) / 2.4;
          const bucketIdx = Math.max(0, Math.min(5, Math.floor(normDepth * 6)));
          buckets[bucketIdx].push(i);
        }

        // --------------------------------------------------------------------
        // Canvas Rendering
        // --------------------------------------------------------------------
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(dpr, dpr);

        // Optional background fill
        if (background && background !== 'transparent') {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, width, height);
        }

        // Soft, faint ambient glow behind the sphere
        const glowGrad = ctx.createRadialGradient(
          centerX,
          centerY,
          sphereR * 0.15,
          centerX,
          centerY,
          sphereR * 1.35
        );
        glowGrad.addColorStop(0.0, 'rgba(124, 58, 237, 0.14)'); // Subtle violet aura
        glowGrad.addColorStop(0.5, 'rgba(59, 130, 246, 0.06)');  // Soft blue
        glowGrad.addColorStop(1.0, 'rgba(6, 182, 212, 0.0)');   // Transparent edge
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, sphereR * 1.35, 0, Math.PI * 2);
        ctx.fill();

        // Render Depth Buckets in strict Back-to-Front order
        for (let b = 0; b < 6; b++) {
          const list = buckets[b];
          const countInBucket = list.length;
          if (countInBucket === 0) continue;

          for (let k = 0; k < countInBucket; k++) {
            const i = list[k];

            // Reconstruct world coords
            const hx = homeX[i];
            const hy = homeY[i];
            const hz = homeZ[i];

            const rX1 = hx * cosY + hz * sinY;
            const rY1 = hy;
            const rZ1 = -hx * sinY + hz * cosY;

            const wx = rX1;
            const wy = rY1 * cosX - rZ1 * sinX;
            const wz = rY1 * sinX + rZ1 * cosX;

            const fx = wx + dispX[i];
            const fy = wy + dispY[i];
            const fz = wz + dispZ[i];

            // 3D Perspective Projection to 2D Screen
            const perspective = 1.0 / (1.0 - fz * 0.22);
            const sx = centerX + fx * sphereR * perspective;
            const sy = centerY - fy * sphereR * perspective; // Flip Y for canvas

            // Depth Cues: Near dots are larger & brighter, far dots smaller & dimmer
            const zNorm = Math.max(0.0, Math.min(1.0, (fz + 1.1) / 2.2));
            const baseSize = 0.9 + zNorm * 1.95; // 0.9px to 2.85px
            const alpha = 0.18 + zNorm * 0.82;   // 0.18 to 1.0

            // Rim enhancement: dots at the edge of the repulsion hole become slightly brighter
            const dpx = targetDispX[i];
            const dpy = targetDispY[i];
            const dpz = targetDispZ[i];
            const isRim = dpx * dpx + dpy * dpy + dpz * dpz > 0.01;
            const finalSize = isRim ? baseSize * 1.3 : baseSize;
            const finalAlpha = Math.min(1.0, isRim ? alpha * 1.35 : alpha);

            const r = colorR[i];
            const g = colorG[i];
            const bl = colorB[i];

            // Draw crisp round particle
            ctx.fillStyle = `rgba(${r}, ${g}, ${bl}, ${finalAlpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(sx, sy, finalSize, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      },
      [rotationSpeed, repelRadius, repelStrength, background]
    );

    // 5. Master Animation Loop
    const startLoop = useCallback(() => {
      if (animIdRef.current !== null) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }

      isRunningRef.current = true;
      lastTimeRef.current = performance.now();

      const loop = (now: number) => {
        if (!isRunningRef.current) return;

        if (isPausedRef.current) {
          animIdRef.current = requestAnimationFrame(loop);
          return;
        }

        if (lastTimeRef.current === null) lastTimeRef.current = now;
        const dt = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        const timeSec = now / 1000;
        renderFrame(timeSec, dt);

        animIdRef.current = requestAnimationFrame(loop);
      };

      animIdRef.current = requestAnimationFrame(loop);
    }, [renderFrame]);

    const stopLoop = useCallback(() => {
      isRunningRef.current = false;
      if (animIdRef.current !== null) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
    }, []);

    // 6. Pointer & Touch Interactions
    const updatePointerFromClientCoords = useCallback(
      (clientX: number, clientY: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const localX = clientX - rect.left;
        const localY = clientY - rect.top;

        const { centerX, centerY, sphereR } = boundsRef.current;
        if (sphereR <= 0) return;

        // Map pointer to normalized sphere space [-1..1]
        const nx = (localX - centerX) / sphereR;
        const ny = -(localY - centerY) / sphereR; // Invert for cartesian Y
        const distSq = nx * nx + ny * ny;

        // Compute Z coordinate on front hemisphere
        let nz = 0.0;
        if (distSq <= 1.0) {
          nz = Math.sqrt(Math.max(0.0, 1.0 - distSq));
        } else {
          nz = 0.1;
        }

        pointerRef.current = {
          active: true,
          x: nx,
          y: ny,
          z: nz,
        };
      },
      []
    );

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      lastClientPosRef.current = { x: e.clientX, y: e.clientY };
      updatePointerFromClientCoords(e.clientX, e.clientY);
    };

    const handlePointerLeave = () => {
      lastClientPosRef.current = null;
      pointerRef.current.active = false;
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      lastClientPosRef.current = { x: e.clientX, y: e.clientY };
      updatePointerFromClientCoords(e.clientX, e.clientY);
      triggerBurst();
    };

    // Keyboard support: Enter / Space triggers burst
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerBurst();
      }
    };

    // Imperative ref API
    useImperativeHandle(
      ref,
      () => ({
        burst: () => triggerBurst(),
        pause: () => {
          isPausedRef.current = true;
        },
        resume: () => {
          isPausedRef.current = false;
          lastTimeRef.current = performance.now();
        },
        destroy: () => stopLoop(),
      }),
      [triggerBurst, stopLoop]
    );

    // Lifecycle
    useEffect(() => {
      initParticles();
      updateSize();

      // Check prefers-reduced-motion (live)
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      reducedMotionRef.current = mql.matches;

      const handleMotionChange = (e: MediaQueryListEvent) => {
        reducedMotionRef.current = e.matches;
        if (e.matches) {
          renderFrame(timeRef.current, 0.016);
        }
      };

      if (mql.addEventListener) {
        mql.addEventListener('change', handleMotionChange);
      } else {
        mql.addListener(handleMotionChange);
      }

      const container = containerRef.current;

      // ResizeObserver
      let resizeObserver: ResizeObserver | null = null;
      if (container && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          updateSize();
          if (isPausedRef.current) {
            renderFrame(timeRef.current, 0.016);
          }
        });
        resizeObserver.observe(container);
      }

      // IntersectionObserver: pause when off-screen
      let intersectionObserver: IntersectionObserver | null = null;
      if (container && typeof IntersectionObserver !== 'undefined') {
        intersectionObserver = new IntersectionObserver((entries) => {
          const entry = entries[0];
          if (!entry) return;
          if (entry.isIntersecting) {
            lastTimeRef.current = performance.now();
            if (!isRunningRef.current && !isPausedRef.current) {
              startLoop();
            }
          } else {
            stopLoop();
          }
        });
        intersectionObserver.observe(container);
      }

      // Tab visibility: pause loop when tab is hidden
      const handleVisibilityChange = () => {
        if (document.hidden) {
          stopLoop();
        } else {
          lastTimeRef.current = performance.now();
          if (!isPausedRef.current) {
            startLoop();
          }
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Scroll listener: update pointer position relative to canvas bounding box on scroll
      const handleScroll = () => {
        if (pointerRef.current.active && lastClientPosRef.current) {
          updatePointerFromClientCoords(
            lastClientPosRef.current.x,
            lastClientPosRef.current.y
          );
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });

      // Start loop
      startLoop();

      return () => {
        stopLoop();
        if (mql.removeEventListener) {
          mql.removeEventListener('change', handleMotionChange);
        } else {
          mql.removeListener(handleMotionChange);
        }
        if (resizeObserver) resizeObserver.disconnect();
        if (intersectionObserver) intersectionObserver.disconnect();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('scroll', handleScroll);
      };
    }, [
      initParticles,
      updateSize,
      startLoop,
      stopLoop,
      renderFrame,
      updatePointerFromClientCoords,
    ]);

    return (
      <div
        ref={containerRef}
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        onPointerCancel={handlePointerLeave}
        onKeyDown={handleKeyDown}
        className={`relative w-full h-full overflow-hidden select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${className}`}
        style={{
          touchAction: 'pan-y', // Does NOT block vertical touch scrolling on mobile
          ...style,
        }}
      >
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full pointer-events-none block z-0"
        />

        {/* Content sitting cleanly on top */}
        {children && <div className="relative z-10 w-full h-full">{children}</div>}
      </div>
    );
  }
);

ParticleSphereRepel.displayName = 'ParticleSphereRepel';

export default ParticleSphereRepel;
