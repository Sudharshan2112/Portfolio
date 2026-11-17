import React, { useRef, useEffect, useState, useCallback } from 'react';

/**
 * ============================================================================
 * TUNABLE INK PHYSICS CONSTANTS
 * ============================================================================
 * You can fine-tune these parameters to adjust the viscous liquid feel,
 * the springiness of the jelly wobble, and the snapping tension.
 */
export const INK_PHYSICS = {
  /** Maximum stretch distance in pixels before the furthest strand snaps (default: 220) */
  DEFAULT_MAX_STRETCH: 220,

  /** Number of ink strands to pull (default: 5, clamped between 4 and 7) */
  DEFAULT_STRAND_COUNT: 5,

  /**
   * Button jelly wobble spring stiffness (k)
   * Higher (e.g. 240) = faster, tighter rebound.
   * Lower (e.g. 140) = softer, looser jelly jiggle.
   */
  WOBBLE_STIFFNESS: 180,

  /**
   * Button jelly wobble damping factor (c)
   * Higher (e.g. 18) = settles very quickly with minimal overshoot.
   * Lower (e.g. 8) = rings longer with multiple oscillations.
   */
  WOBBLE_DAMPING: 12,

  /** Squash and stretch deformation stiffness */
  SQUASH_STIFFNESS: 210,

  /** Squash and stretch deformation damping */
  SQUASH_DAMPING: 14,

  /** Strand tip tracking smoothing factor (spring stiffness towards pointer) */
  STRAND_SPRING_K: 240,

  /** Strand tip velocity damping */
  STRAND_SPRING_DAMP: 20,

  /** Speed at which a snapped strand recoils back into the button base */
  RECOIL_SPEED: 28,

  /** Elastic recoil bounce multiplier when a snapped strand retracts */
  RECOIL_BOUNCE: 0.32,

  /** Base thickness of each strand at the button perimeter in pixels */
  BASE_STRAND_WIDTH: 15,

  /** Minimum tip thickness just before snapping in pixels */
  MIN_TIP_WIDTH: 1.8,

  /** Maximum membrane/webbing bridge height between adjacent strands in pixels */
  WEBBING_HEIGHT: 26,

  /** Gravity on detached falling ink droplets (pixels per second squared) */
  DROPLET_GRAVITY: 580,

  /** Maximum life duration of a falling ink droplet in seconds */
  DROPLET_LIFETIME: 0.55,

  /** Minimum distance from button edge (px) required before strands begin pulling */
  STRETCH_DEADZONE: 4,

  /** Proximity distance from button edge (px) that re-primes/attaches strands */
  ATTACH_RADIUS: 24,
} as const;

/** Props supported by the InkButton component */
export interface InkButtonProps {
  /** The accessible label displayed on the button (default: "Get in touch") */
  label?: string;

  /** Optional link URL. If provided, renders an accessible <a> tag; otherwise <button> */
  href?: string;

  /** Click callback for the button/link */
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;

  /**
   * Primary ink color. Accepts:
   * - Solid hex/rgb/hsl string (e.g. "#0b0b0b" or "#121212")
   * - "brand-gradient" or custom CSS linear-gradient string to match signature styles
   * Default: "#0b0b0b"
   */
  color?: string;

  /** Custom CSS gradient definition or presets (e.g. signature pink/magenta/purple) */
  backgroundGradient?: string;

  /** Number of ink strands to pull when moving away (default: 5, range: 4 to 7) */
  strandCount?: number;

  /** Maximum stretch distance in pixels before strands snap (default: 220) */
  maxStretch?: number;

  /** Additional CSS class names for the outer container */
  className?: string;

  /** Additional CSS class names for the inner accessible button/link */
  buttonClassName?: string;

  /** Accessible aria-label override (defaults to label) */
  ariaLabel?: string;

  /** Glow bloom color for strands and button (e.g. "#34D399" or "rgba(52,211,153,0.85)") */
  glowColor?: string;

  /** Specific palette of hex/rgb colors for the pulling ink strands */
  strandColors?: string[];

  /** Whether the luminous bloom and neon halo are enabled (default: true) */
  enableGlow?: boolean;
}

/** Pre-allocated particle for falling ink droplets (zero allocations per frame) */
interface InkDroplet {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

/** Pre-allocated strand physics state */
interface StrandState {
  id: number;
  isAttached: boolean;
  snapThreshold: number;
  currentTipX: number;
  currentTipY: number;
  tipVx: number;
  tipVy: number;
  recoilPos: number; // 0 = at base, 1 = at break point
  recoilVel: number;
  breakTipX: number;
  breakTipY: number;
}

export const InkButton: React.FC<InkButtonProps> = ({
  label = 'Get in touch',
  href,
  onClick,
  color = '#0b0b0b',
  backgroundGradient,
  strandColors,
  strandCount = INK_PHYSICS.DEFAULT_STRAND_COUNT,
  maxStretch = INK_PHYSICS.DEFAULT_MAX_STRETCH,
  className = '',
  buttonClassName = '',
  ariaLabel,
  glowColor,
  enableGlow = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Accessible reduced-motion and touch detection
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isSquishing, setIsSquishing] = useState(false);

  // Clamped strand count: 4 to 7
  const validStrandCount = Math.max(4, Math.min(7, Math.round(strandCount)));

  // Detect SSR and media queries
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    const touchQuery = window.matchMedia('(pointer: coarse)');
    setIsTouchDevice(touchQuery.matches);

    const handleTouchChange = (e: MediaQueryListEvent) => setIsTouchDevice(e.matches);
    touchQuery.addEventListener('change', handleTouchChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      touchQuery.removeEventListener('change', handleTouchChange);
    };
  }, []);

  // Main interactive physics and rendering effect
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReducedMotion) return; // Respect reduced motion: no canvas physics

    const canvas = canvasRef.current;
    const button = buttonRef.current;
    const container = containerRef.current;
    if (!canvas || !button || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Canvas padding margin around button so strands never clip
    const PADDING = Math.max(maxStretch + 80, 260);

    // Layout geometry
    let btnWidth = 140;
    let btnHeight = 48;
    let btnRadius = 24;

    // Pointer state
    let isPointerInZone = false;
    let isPrimed = false; // true when cursor has visited the button and can pull strands
    let pointerType: string = 'mouse';
    let ptrScreenX = 0;
    let ptrScreenY = 0;
    let ptrLocalX = 0; // relative to button center
    let ptrLocalY = 0;
    let prevPtrLocalX = 0;
    let prevPtrLocalY = 0;
    let ptrVelocityX = 0;
    let ptrVelocityY = 0;

    // Button jelly physics state
    let wobbleX = 0;
    let wobbleY = 0;
    let wobbleVx = 0;
    let wobbleVy = 0;
    let squashX = 1.0;
    let squashY = 1.0;
    let squashVx = 0;
    let squashVy = 0;

    // Follower droplet & drip state
    let followerX = 0;
    let followerY = 0;
    let dripLength = 0;
    let dripLengthVel = 0;

    // Pre-allocated strands array
    const strands: StrandState[] = [];
    for (let i = 0; i < validStrandCount; i++) {
      // Stagger snapping distances so strands snap one by one sequentially
      const ratioOffset = (i / (validStrandCount - 1) - 0.5) * 0.38;
      const stagger = 0.82 + ratioOffset + (i % 2 === 0 ? 0.08 : -0.06);
      strands.push({
        id: i,
        isAttached: false,
        snapThreshold: maxStretch * Math.max(0.68, Math.min(1.18, stagger)),
        currentTipX: 0,
        currentTipY: 0,
        tipVx: 0,
        tipVy: 0,
        recoilPos: 0,
        recoilVel: 0,
        breakTipX: 0,
        breakTipY: 0,
      });
    }

    // Pre-allocated falling droplet pool (recycled, no allocations per frame)
    const MAX_DROPLETS = 12;
    const droplets: InkDroplet[] = [];
    for (let i = 0; i < MAX_DROPLETS; i++) {
      droplets.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        radius: 3,
        alpha: 1,
        life: 0,
        maxLife: INK_PHYSICS.DROPLET_LIFETIME,
      });
    }

    const spawnDroplet = (x: number, y: number, vx: number, vy: number, radius = 3) => {
      for (let i = 0; i < MAX_DROPLETS; i++) {
        if (!droplets[i].active) {
          droplets[i].active = true;
          droplets[i].x = x;
          droplets[i].y = y;
          droplets[i].vx = vx;
          droplets[i].vy = vy;
          droplets[i].radius = radius;
          droplets[i].alpha = 1;
          droplets[i].life = 0;
          droplets[i].maxLife = INK_PHYSICS.DROPLET_LIFETIME;
          break;
        }
      }
    };

    // Device Pixel Ratio scaling for retina displays
    const updateCanvasSize = () => {
      const rect = button.getBoundingClientRect();
      btnWidth = rect.width;
      btnHeight = rect.height;
      btnRadius = btnHeight / 2;

      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const canvasWidth = btnWidth + PADDING * 2;
      const canvasHeight = btnHeight + PADDING * 2;

      canvas.width = Math.round(canvasWidth * dpr);
      canvas.height = Math.round(canvasHeight * dpr);
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;
      canvas.style.left = `${-PADDING}px`;
      canvas.style.top = `${-PADDING}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();

    // ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(button);

    // Helper: calculate ray intersection with rounded pill boundary
    const getPillPerimeterPoint = (angle: number): { x: number; y: number } => {
      const halfW = btnWidth / 2;
      const halfH = btnHeight / 2;
      const r = halfH;
      const straightHalfW = Math.max(0, halfW - r);

      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      // Check right circle cap
      if (cos > 0.1 && straightHalfW > 0) {
        // center of right circle is at (straightHalfW, 0)
        return {
          x: straightHalfW + cos * r,
          y: sin * r,
        };
      }
      // Check left circle cap
      if (cos < -0.1 && straightHalfW > 0) {
        // center of left circle is at (-straightHalfW, 0)
        return {
          x: -straightHalfW + cos * r,
          y: sin * r,
        };
      }
      // Top or bottom straight edge
      const signY = sin >= 0 ? 1 : -1;
      return {
        x: Math.max(-straightHalfW, Math.min(straightHalfW, cos * halfW)),
        y: signY * halfH,
      };
    };

    // Color and gradient resolver
    const isBrandGradient =
      color === 'brand-gradient' ||
      Boolean(backgroundGradient) ||
      color.includes('gradient');

    const activeGlowColor =
      glowColor ||
      (isBrandGradient ? 'rgba(52, 211, 153, 0.85)' : 'rgba(255, 255, 255, 0.35)');

    const getInkFillStyle = (
      context: CanvasRenderingContext2D,
      centerX: number,
      centerY: number
    ): string | CanvasGradient => {
      // If explicit strand colors provided or can be parsed from backgroundGradient
      const rawGrad = backgroundGradient || (color.includes('gradient') ? color : null);
      const parsedColors =
        strandColors ||
        (rawGrad ? (rawGrad.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g) as string[] | null) : null);

      if (parsedColors && parsedColors.length >= 2) {
        const angleRad = ((135 - 90) * Math.PI) / 180;
        const diag = Math.sqrt(btnWidth * btnWidth + btnHeight * btnHeight) / 2;
        const x0 = centerX - Math.cos(angleRad) * diag;
        const y0 = centerY - Math.sin(angleRad) * diag;
        const x1 = centerX + Math.cos(angleRad) * diag;
        const y1 = centerY + Math.sin(angleRad) * diag;

        const grad = context.createLinearGradient(x0, y0, x1, y1);
        for (let i = 0; i < parsedColors.length; i++) {
          grad.addColorStop(i / (parsedColors.length - 1), parsedColors[i]);
        }
        return grad;
      }

      if (isBrandGradient) {
        // Fallback default: Cyber Emerald Green gradient
        const angleRad = ((135 - 90) * Math.PI) / 180;
        const diag = Math.sqrt(btnWidth * btnWidth + btnHeight * btnHeight) / 2;
        const x0 = centerX - Math.cos(angleRad) * diag;
        const y0 = centerY - Math.sin(angleRad) * diag;
        const x1 = centerX + Math.cos(angleRad) * diag;
        const y1 = centerY + Math.sin(angleRad) * diag;

        const grad = context.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0.0, '#34D399'); // Emerald mint
        grad.addColorStop(0.35, '#10B981'); // Vivid emerald
        grad.addColorStop(0.75, '#059669'); // Deep emerald
        grad.addColorStop(1.0, '#047857'); // Dark forest emerald
        return grad;
      }
      return color;
    };

    // Animation loop state
    let animationFrameId: number | null = null;
    let lastTime = performance.now();
    let isVisible = true;

    // IntersectionObserver to pause loop when off-screen
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    // Visibility change to pause loop when tab is hidden
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) lastTime = performance.now();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Pointer Event Handlers
    const handlePointerMove = (e: PointerEvent) => {
      pointerType = e.pointerType;
      // Do not run hover stretch physics on touch devices
      if (pointerType === 'touch') return;

      const rect = button.getBoundingClientRect();
      ptrScreenX = e.clientX;
      ptrScreenY = e.clientY;

      const newLocalX = e.clientX - (rect.left + rect.width / 2);
      const newLocalY = e.clientY - (rect.top + rect.height / 2);

      ptrVelocityX = (newLocalX - ptrLocalX) * 35;
      ptrVelocityY = (newLocalY - ptrLocalY) * 35;

      prevPtrLocalX = ptrLocalX;
      prevPtrLocalY = ptrLocalY;
      ptrLocalX = newLocalX;
      ptrLocalY = newLocalY;

      // Distance from button center and edge
      const distFromCenter = Math.hypot(ptrLocalX, ptrLocalY);
      const approximateEdge = Math.max(btnWidth, btnHeight) / 2;
      const distFromEdge = Math.max(0, distFromCenter - approximateEdge);

      // Check if pointer is hovering over or very close to button
      const isOverButton =
        e.clientX >= rect.left - INK_PHYSICS.ATTACH_RADIUS &&
        e.clientX <= rect.right + INK_PHYSICS.ATTACH_RADIUS &&
        e.clientY >= rect.top - INK_PHYSICS.ATTACH_RADIUS &&
        e.clientY <= rect.bottom + INK_PHYSICS.ATTACH_RADIUS;

      if (isOverButton) {
        isPointerInZone = true;
        isPrimed = true;
        // Reset and re-attach all strands
        for (let i = 0; i < validStrandCount; i++) {
          strands[i].isAttached = true;
          strands[i].recoilPos = 0;
          strands[i].recoilVel = 0;
          strands[i].currentTipX = ptrLocalX;
          strands[i].currentTipY = ptrLocalY;
          strands[i].tipVx = 0;
          strands[i].tipVy = 0;
        }
      } else if (isPrimed) {
        // If primed and distance exceeds max threshold, detach
        if (distFromEdge > maxStretch * 1.35) {
          isPrimed = false;
          isPointerInZone = false;
        }
      }
    };

    const handlePointerLeave = () => {
      isPointerInZone = false;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave);

    // ========================================================================
    // MAIN PHYSICS & RENDER LOOP (Fixed Timestep / Delta-Time)
    // ========================================================================
    const render = (now: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (!isVisible) return;

      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      // Clamp dt to avoid physics blowup on frame lag (e.g. tab switch)
      const dt = Math.min(rawDt, 0.033);

      const canvasCenterCenterX = PADDING + btnWidth / 2;
      const canvasCenterCenterY = PADDING + btnHeight / 2;

      // 1. Update Button Wobble Spring Physics
      const wobbleForceX =
        -INK_PHYSICS.WOBBLE_STIFFNESS * wobbleX -
        INK_PHYSICS.WOBBLE_DAMPING * wobbleVx;
      const wobbleForceY =
        -INK_PHYSICS.WOBBLE_STIFFNESS * wobbleY -
        INK_PHYSICS.WOBBLE_DAMPING * wobbleVy;

      wobbleVx += wobbleForceX * dt;
      wobbleVy += wobbleForceY * dt;
      wobbleX += wobbleVx * dt;
      wobbleY += wobbleVy * dt;

      // Squash and stretch spring physics
      const squashTargetX = 1.0;
      const squashTargetY = 1.0;
      const squashForceX =
        -INK_PHYSICS.SQUASH_STIFFNESS * (squashX - squashTargetX) -
        INK_PHYSICS.SQUASH_DAMPING * squashVx;
      const squashForceY =
        -INK_PHYSICS.SQUASH_STIFFNESS * (squashY - squashTargetY) -
        INK_PHYSICS.SQUASH_DAMPING * squashVy;

      squashVx += squashForceX * dt;
      squashVy += squashForceY * dt;
      squashX += squashVx * dt;
      squashY += squashVy * dt;

      // Deadzone damping to prevent microscopic CPU jitter
      if (
        Math.abs(wobbleX) < 0.005 &&
        Math.abs(wobbleY) < 0.005 &&
        Math.abs(wobbleVx) < 0.005 &&
        Math.abs(wobbleVy) < 0.005
      ) {
        wobbleX = 0;
        wobbleY = 0;
        wobbleVx = 0;
        wobbleVy = 0;
      }

      // 2. Cursor Follower & Drip Physics
      const targetFollowerX = ptrLocalX;
      const targetFollowerY = ptrLocalY;
      followerX += (targetFollowerX - followerX) * Math.min(1, dt * 24);
      followerY += (targetFollowerY - followerY) * Math.min(1, dt * 24);

      // Drip elongation based on downwards movement
      const targetDrip = Math.max(0, Math.min(18, ptrVelocityY * 0.04));
      dripLengthVel += (targetDrip - dripLength) * 180 * dt - dripLengthVel * 16 * dt;
      dripLength += dripLengthVel * dt;

      // Spawn falling droplets if drip stretches and moving fast
      if (
        isPrimed &&
        dripLength > 12 &&
        Math.random() < 0.12 &&
        pointerType !== 'touch'
      ) {
        spawnDroplet(
          canvasCenterCenterX + followerX,
          canvasCenterCenterY + followerY + dripLength,
          ptrVelocityX * 0.2 + (Math.random() - 0.5) * 20,
          ptrVelocityY * 0.3 + 80,
          Math.random() * 1.5 + 2
        );
      }

      // Update falling droplets
      for (let i = 0; i < MAX_DROPLETS; i++) {
        const drop = droplets[i];
        if (drop.active) {
          drop.life += dt;
          if (drop.life >= drop.maxLife) {
            drop.active = false;
          } else {
            drop.vy += INK_PHYSICS.DROPLET_GRAVITY * dt;
            drop.x += drop.vx * dt;
            drop.y += drop.vy * dt;
            drop.alpha = 1 - drop.life / drop.maxLife;
          }
        }
      }

      // 3. Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const fillStyle = getInkFillStyle(
        ctx,
        canvasCenterCenterX + wobbleX,
        canvasCenterCenterY + wobbleY
      );

      // 4. Calculate Strands & Meniscus Geometry
      const distFromCenter = Math.hypot(ptrLocalX, ptrLocalY);
      const mainPullAngle = Math.atan2(ptrLocalY, ptrLocalX);
      const pullDistFromCenter = Math.max(0, distFromCenter - btnRadius);

      // Compute base and tip points for each strand
      const basePoints: { x: number; y: number }[] = [];
      const tipPoints: { x: number; y: number; isAttached: boolean; width: number }[] = [];

      for (let i = 0; i < validStrandCount; i++) {
        const strand = strands[i];
        // Angular offset spread across pull direction
        const angleSpread =
          validStrandCount > 1
            ? ((i - (validStrandCount - 1) / 2) / ((validStrandCount - 1) / 2)) * 0.44
            : 0;
        const anchorAngle = mainPullAngle + angleSpread;

        // Base anchor point on button perimeter
        const basePt = getPillPerimeterPoint(anchorAngle);
        const worldBaseX = canvasCenterCenterX + wobbleX + basePt.x;
        const worldBaseY = canvasCenterCenterY + wobbleY + basePt.y;
        basePoints.push({ x: worldBaseX, y: worldBaseY });

        // Calculate distance from base anchor to pointer
        const distFromBase = Math.hypot(
          ptrLocalX - basePt.x,
          ptrLocalY - basePt.y
        );

        // Check snapping condition: snaps one by one!
        if (strand.isAttached && isPrimed) {
          if (distFromBase > strand.snapThreshold) {
            // SNAP!
            strand.isAttached = false;
            strand.recoilPos = 1.0;
            strand.recoilVel = -INK_PHYSICS.RECOIL_SPEED;
            strand.breakTipX = strand.currentTipX;
            strand.breakTipY = strand.currentTipY;

            // Recoil kick impulse on button (jelly wobble)
            const kickDirX = -Math.cos(anchorAngle);
            const kickDirY = -Math.sin(anchorAngle);
            wobbleVx += kickDirX * 65;
            wobbleVy += kickDirY * 65;
            squashX += Math.abs(kickDirX) * 0.08;
            squashY += Math.abs(kickDirY) * 0.08;

            // Spawn snap droplet
            spawnDroplet(
              canvasCenterCenterX + strand.breakTipX,
              canvasCenterCenterY + strand.breakTipY,
              kickDirX * 30 + (Math.random() - 0.5) * 40,
              kickDirY * 30 + (Math.random() - 0.5) * 40,
              2.5
            );
          }
        }

        // Target fanned tip position
        const fanNormalX = -Math.sin(mainPullAngle);
        const fanNormalY = Math.cos(mainPullAngle);
        const fanOffset =
          validStrandCount > 1
            ? (i - (validStrandCount - 1) / 2) * 8 * Math.min(1, pullDistFromCenter / 100)
            : 0;

        const targetTipX = ptrLocalX + fanNormalX * fanOffset;
        const targetTipY = ptrLocalY + fanNormalY * fanOffset;

        if (strand.isAttached && isPrimed) {
          // Smooth spring tracking to pointer
          const springFx =
            (targetTipX - strand.currentTipX) * INK_PHYSICS.STRAND_SPRING_K -
            strand.tipVx * INK_PHYSICS.STRAND_SPRING_DAMP;
          const springFy =
            (targetTipY - strand.currentTipY) * INK_PHYSICS.STRAND_SPRING_K -
            strand.tipVy * INK_PHYSICS.STRAND_SPRING_DAMP;

          strand.tipVx += springFx * dt;
          strand.tipVy += springFy * dt;
          strand.currentTipX += strand.tipVx * dt;
          strand.currentTipY += strand.tipVy * dt;

          // Tip width thins out as strand stretches
          const stretchFraction = Math.min(
            1,
            distFromBase / strand.snapThreshold
          );
          const tipWidth = Math.max(
            INK_PHYSICS.MIN_TIP_WIDTH,
            6 * (1 - stretchFraction * 0.75)
          );

          tipPoints.push({
            x: canvasCenterCenterX + strand.currentTipX,
            y: canvasCenterCenterY + strand.currentTipY,
            isAttached: true,
            width: tipWidth,
          });

          // Gentle continuous tension pull on button while stretching
          if (pullDistFromCenter > INK_PHYSICS.STRETCH_DEADZONE) {
            const pullStrength =
              Math.min(pullDistFromCenter, maxStretch) * 0.15;
            wobbleVx += Math.cos(anchorAngle) * pullStrength * dt * 30;
            wobbleVy += Math.sin(anchorAngle) * pullStrength * dt * 30;
          }
        } else if (strand.recoilPos > 0) {
          // Recoiling snapped strand
          strand.recoilPos += strand.recoilVel * dt;
          if (strand.recoilPos <= 0) {
            strand.recoilPos = 0;
            strand.recoilVel = 0;
          }

          // Interpolate between base and break point
          const curRecoilX =
            basePt.x + (strand.breakTipX - basePt.x) * strand.recoilPos;
          const curRecoilY =
            basePt.y + (strand.breakTipY - basePt.y) * strand.recoilPos;

          tipPoints.push({
            x: canvasCenterCenterX + curRecoilX,
            y: canvasCenterCenterY + curRecoilY,
            isAttached: false,
            width: INK_PHYSICS.MIN_TIP_WIDTH * 1.5,
          });
        } else {
          // Inactive / resting at base
          tipPoints.push({
            x: worldBaseX,
            y: worldBaseY,
            isAttached: false,
            width: 0,
          });
        }
      }

      // 5. Draw Webbed Meniscus & Strands
      const shouldDrawStrands =
        isPrimed &&
        pullDistFromCenter > INK_PHYSICS.STRETCH_DEADZONE &&
        pointerType !== 'touch';

      if (shouldDrawStrands) {
        ctx.save();
        if (enableGlow) {
          ctx.shadowColor = activeGlowColor;
          ctx.shadowBlur = 20;
        }

        ctx.fillStyle = fillStyle;
        ctx.beginPath();

        // Draw each tapered strand
        for (let i = 0; i < validStrandCount; i++) {
          const bp = basePoints[i];
          const tp = tipPoints[i];
          if (!tp.isAttached && strands[i].recoilPos <= 0) continue;

          const dx = tp.x - bp.x;
          const dy = tp.y - bp.y;
          const len = Math.hypot(dx, dy);
          if (len < 2) continue;

          const nx = -dy / len;
          const ny = dx / len;

          const baseW = INK_PHYSICS.BASE_STRAND_WIDTH;
          const tipW = tp.width;

          // Strand corner coordinates
          const blX = bp.x + (nx * baseW) / 2;
          const blY = bp.y + (ny * baseW) / 2;
          const brX = bp.x - (nx * baseW) / 2;
          const brY = bp.y - (ny * baseW) / 2;

          const tlX = tp.x + (nx * tipW) / 2;
          const tlY = tp.y + (ny * tipW) / 2;
          const trX = tp.x - (nx * tipW) / 2;
          const trY = tp.y - (ny * tipW) / 2;

          // Slight midpoint gravitational sag
          const midX = (bp.x + tp.x) / 2 + nx * 2;
          const midY = (bp.y + tp.y) / 2 + ny * 2 + Math.min(len * 0.05, 8);

          // Draw strand filament polygon with curved waist
          ctx.moveTo(blX, blY);
          ctx.quadraticCurveTo(midX + (nx * tipW) / 2, midY + (ny * tipW) / 2, tlX, tlY);
          ctx.arcTo(tp.x + (nx * tipW) / 4, tp.y + (ny * tipW) / 4, trX, trY, tipW / 2);
          ctx.lineTo(trX, trY);
          ctx.quadraticCurveTo(midX - (nx * tipW) / 2, midY - (ny * tipW) / 2, brX, brY);
          ctx.closePath();
        }

        // Draw Gooey Webbing Membrane between adjacent active strands
        for (let i = 0; i < validStrandCount - 1; i++) {
          const tp1 = tipPoints[i];
          const tp2 = tipPoints[i + 1];
          const bp1 = basePoints[i];
          const bp2 = basePoints[i + 1];

          if (
            (tp1.isAttached || strands[i].recoilPos > 0.4) &&
            (tp2.isAttached || strands[i + 1].recoilPos > 0.4)
          ) {
            // Webbing bridge connecting strand bases
            const midBaseX = (bp1.x + bp2.x) / 2;
            const midBaseY = (bp1.y + bp2.y) / 2;
            const avgPullX = (tp1.x + tp2.x) / 2;
            const avgPullY = (tp1.y + tp2.y) / 2;

            const pullDist = Math.hypot(avgPullX - midBaseX, avgPullY - midBaseY);
            const webHeight = Math.min(
              INK_PHYSICS.WEBBING_HEIGHT,
              pullDist * 0.42
            );

            const webApexX =
              midBaseX + ((avgPullX - midBaseX) / (pullDist || 1)) * webHeight;
            const webApexY =
              midBaseY + ((avgPullY - midBaseY) / (pullDist || 1)) * webHeight;

            ctx.moveTo(bp1.x, bp1.y);
            ctx.quadraticCurveTo(webApexX, webApexY, bp2.x, bp2.y);
            ctx.lineTo(midBaseX, midBaseY);
            ctx.closePath();
          }
        }

        ctx.fill();

        // Luminous glowing core spine along each strand (fiber-optic molten glow)
        if (enableGlow) {
          ctx.shadowColor = '#FFFFFF';
          ctx.shadowBlur = 8;
          ctx.strokeStyle = 'rgba(255, 230, 250, 0.85)';
          for (let i = 0; i < validStrandCount; i++) {
            const bp = basePoints[i];
            const tp = tipPoints[i];
            if (!tp.isAttached && strands[i].recoilPos <= 0) continue;

            const dx = tp.x - bp.x;
            const dy = tp.y - bp.y;
            const len = Math.hypot(dx, dy);
            if (len < 2) continue;

            const nx = -dy / len;
            const ny = dx / len;
            const midX = (bp.x + tp.x) / 2 + nx * 2;
            const midY = (bp.y + tp.y) / 2 + ny * 2 + Math.min(len * 0.05, 8);

            ctx.lineWidth = Math.max(1.2, tp.width * 0.45);
            ctx.beginPath();
            ctx.moveTo(bp.x, bp.y);
            ctx.quadraticCurveTo(midX, midY, tp.x, tp.y);
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // 6. Draw Wobbling Ink Button Body
      ctx.save();
      ctx.translate(canvasCenterCenterX + wobbleX, canvasCenterCenterY + wobbleY);
      ctx.scale(squashX, squashY);

      if (enableGlow) {
        ctx.shadowColor = activeGlowColor;
        ctx.shadowBlur = 24;
      }

      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      // Draw smooth pill shape
      const rx = -btnWidth / 2;
      const ry = -btnHeight / 2;
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(rx, ry, btnWidth, btnHeight, btnRadius);
      } else {
        // Fallback for older browsers
        ctx.moveTo(rx + btnRadius, ry);
        ctx.lineTo(rx + btnWidth - btnRadius, ry);
        ctx.quadraticCurveTo(rx + btnWidth, ry, rx + btnWidth, ry + btnRadius);
        ctx.lineTo(rx + btnWidth, ry + btnHeight - btnRadius);
        ctx.quadraticCurveTo(
          rx + btnWidth,
          ry + btnHeight,
          rx + btnWidth - btnRadius,
          ry + btnHeight
        );
        ctx.lineTo(rx + btnRadius, ry + btnHeight);
        ctx.quadraticCurveTo(rx, ry + btnHeight, rx, ry + btnHeight - btnRadius);
        ctx.lineTo(rx, ry + btnRadius);
        ctx.quadraticCurveTo(rx, ry, rx + btnRadius, ry);
      }
      ctx.closePath();
      ctx.fill();

      // 7. Wet Glossy Top Highlight Reflection
      ctx.save();
      ctx.clip(); // Clip highlight inside the button pill
      const highlightGrad = ctx.createLinearGradient(
        0,
        -btnHeight / 2,
        0,
        -btnHeight / 2 + btnHeight * 0.48
      );
      highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
      highlightGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
      highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = highlightGrad;
      ctx.beginPath();
      ctx.ellipse(
        0,
        -btnHeight / 2 + 5,
        btnWidth * 0.44,
        btnHeight * 0.28,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Subtle bottom rim bounce reflection
      const rimGrad = ctx.createLinearGradient(
        0,
        btnHeight / 2 - 8,
        0,
        btnHeight / 2
      );
      rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0.15)');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(-btnWidth / 2, btnHeight / 2 - 8, btnWidth, 8);
      ctx.restore();

      ctx.restore();

      // 8. Draw Pointer Drip & Cursor Follower
      const shouldDrawCursorFollower =
        isPointerInZone && isPrimed && pointerType !== 'touch';

      if (shouldDrawCursorFollower) {
        const dropX = canvasCenterCenterX + followerX;
        const dropY = canvasCenterCenterY + followerY;

        ctx.save();
        if (enableGlow) {
          ctx.shadowColor = '#00F0FF';
          ctx.shadowBlur = 18;
        }

        ctx.fillStyle = fillStyle;
        ctx.beginPath();
        // Droplet body
        ctx.arc(dropX, dropY, 5.5, 0, Math.PI * 2);
        // Stretched drip tail
        if (dripLength > 2) {
          ctx.moveTo(dropX - 4, dropY);
          ctx.quadraticCurveTo(dropX, dropY + dripLength + 4, dropX + 4, dropY);
        }
        ctx.fill();

        // Droplet wet specular highlight dot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(dropX - 1.8, dropY - 1.8, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 9. Draw Falling Ink Droplets
      ctx.save();
      if (enableGlow) {
        ctx.shadowColor = activeGlowColor;
        ctx.shadowBlur = 12;
      }
      for (let i = 0; i < MAX_DROPLETS; i++) {
        const drop = droplets[i];
        if (drop.active) {
          ctx.fillStyle = fillStyle;
          ctx.globalAlpha = drop.alpha;
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
          ctx.fill();

          // Droplet highlight
          ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * drop.alpha})`;
          ctx.beginPath();
          ctx.arc(
            drop.x - drop.radius * 0.35,
            drop.y - drop.radius * 0.35,
            drop.radius * 0.35,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      }
      ctx.restore();
    };

    // Start animation loop
    animationFrameId = requestAnimationFrame(render);

    // Click squish trigger
    const handleButtonClick = () => {
      // Trigger ink squish
      squashX = 1.14;
      squashY = 0.86;
      squashVx = -2.5;
      squashVy = 16.0;

      const clickCenterX = PADDING + btnWidth / 2;
      const clickCenterY = PADDING + btnHeight / 2;

      // Spawn click splash droplets
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.4;
        const spd = Math.random() * 80 + 60;
        spawnDroplet(
          clickCenterX + Math.cos(angle) * (btnWidth * 0.35),
          clickCenterY + Math.sin(angle) * (btnHeight * 0.35),
          Math.cos(angle) * spd,
          Math.sin(angle) * spd,
          Math.random() * 1.5 + 2
        );
      }
    };

    button.addEventListener('click', handleButtonClick);

    // ========================================================================
    // CLEANUP ON UNMOUNT (No Memory Leaks)
    // ========================================================================
    return () => {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      button.removeEventListener('click', handleButtonClick);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [
    validStrandCount,
    maxStretch,
    color,
    backgroundGradient,
    prefersReducedMotion,
    glowColor,
    enableGlow,
  ]);

  // Click & Tap handling with ink squish state
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      setIsSquishing(true);
      setTimeout(() => setIsSquishing(false), 240);
      if (onClick) onClick(e);
    },
    [onClick]
  );

  // Common button styling & accessibility
  const isBrandGradientRender =
    color === 'brand-gradient' || Boolean(backgroundGradient) || color.includes('gradient');
  const activeGlowColor =
    glowColor || (isBrandGradientRender ? 'rgba(52, 211, 153, 0.85)' : 'rgba(255, 255, 255, 0.35)');

  const buttonStyle: React.CSSProperties = {
    background: backgroundGradient
      ? backgroundGradient
      : color === 'brand-gradient'
      ? 'linear-gradient(135deg, #34D399 0%, #10B981 35%, #059669 75%, #047857 100%)'
      : color,
    boxShadow: enableGlow
      ? `0 0 24px ${activeGlowColor}, 0 0 48px ${activeGlowColor}, inset 0 1px 4px rgba(255, 255, 255, 0.45)`
      : backgroundGradient || color === 'brand-gradient'
      ? '0px 4px 14px rgba(16, 185, 129, 0.3), inset 2px 2px 8px rgba(255, 255, 255, 0.22)'
      : '0px 6px 16px rgba(0, 0, 0, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
    border: enableGlow ? '1.5px solid rgba(110, 231, 183, 0.65)' : undefined,
  };

  const sharedClasses = `
    relative z-10 select-none inline-flex items-center justify-center font-bold tracking-wider uppercase
    rounded-full text-white text-xs sm:text-sm md:text-base px-8 py-3.5 sm:px-10 sm:py-4 md:px-12 md:py-4.5
    transition-all duration-200 ease-out cursor-pointer
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-[#0C0C0C]
    ${
      isSquishing
        ? 'scale-95'
        : 'hover:scale-[1.03] active:scale-95 hover:shadow-[0_0_36px_rgba(52,211,153,0.75),0_0_65px_rgba(16,185,129,0.5)]'
    }
    ${buttonClassName}
  `.trim();

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      style={{ touchAction: 'manipulation' }}
    >
      {/* 
        Decorative Canvas:
        - Positioned absolutely behind the button with generous margins so strands are never clipped.
        - aria-hidden and pointer-events-none ensures 100% accessibility compliance.
        - Automatically disabled when prefers-reduced-motion is active.
      */}
      {!prefersReducedMotion && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute pointer-events-none select-none z-0"
          style={{ willChange: 'transform' }}
        />
      )}

      {/* Real accessible HTML element: <a> if href provided, otherwise <button> */}
      {href ? (
        <a
          ref={buttonRef as React.RefObject<HTMLAnchorElement>}
          href={href}
          onClick={handleClick}
          aria-label={ariaLabel || label}
          className={sharedClasses}
          style={buttonStyle}
        >
          {/* Subtle glossy top highlight line */}
          <span
            className="absolute inset-x-4 top-1 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
            aria-hidden="true"
          />
          <span className="relative z-10 drop-shadow-sm">{label}</span>
        </a>
      ) : (
        <button
          ref={buttonRef as React.RefObject<HTMLButtonElement>}
          type="button"
          onClick={handleClick}
          aria-label={ariaLabel || label}
          className={sharedClasses}
          style={buttonStyle}
        >
          {/* Subtle glossy top highlight line */}
          <span
            className="absolute inset-x-4 top-1 h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
            aria-hidden="true"
          />
          <span className="relative z-10 drop-shadow-sm">{label}</span>
        </button>
      )}
    </div>
  );
};

export default InkButton;
