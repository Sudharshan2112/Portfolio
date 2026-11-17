'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface ArcWaveItem {
  image: string;
  name: string;
  role: string;
}

export interface ArcWaveProps {
  items?: ArcWaveItem[];
  cardWidth?: number;
  cardHeight?: number;
  gap?: number;
  speed?: number; // degrees per second (default ~5)
  accentColor?: string;
  className?: string;
}

const DEFAULT_ITEMS: ArcWaveItem[] = [
  {
    image: '/img/arc-wave/ai-shield-agent.jpg',
    name: 'AI Cybersecurity & Agents',
    role: 'Human-AI Collaboration & Shield',
  },
  {
    image: '/img/arc-wave/ai-processor-chip.jpg',
    name: 'Deep Learning Hardware',
    role: 'Neural Processing & Acceleration',
  },
  {
    image: '/img/arc-wave/data-analysis-hud.jpg',
    name: 'Data Analysis & BI',
    role: 'Interactive KPI Intelligence & Metrics',
  },
  {
    image: '/img/arc-wave/llm-hologram.jpg',
    name: 'LLM & Generative AI',
    role: 'RAG Systems & Prompt Architectures',
  },
  {
    image: '/img/arc-wave/python-pipeline.jpg',
    name: 'Python AI Pipelines',
    role: 'Automated ETL & Model Serving',
  },
  {
    image: '/img/arc-wave/robot-synergy.jpg',
    name: 'Autonomous Systems',
    role: 'Human-Robot Collaboration & Swarms',
  },
  {
    image: '/img/arc-wave/predictive-touch.jpg',
    name: 'Predictive Modeling',
    role: 'Statistical Inference & Forecasting',
  },
  {
    image: '/img/arc-wave/ml-network.jpg',
    name: 'Machine Learning',
    role: 'Feature Engineering & Ensembles',
  },
  {
    image: '/img/arc-wave/enterprise-analytics.jpg',
    name: 'Enterprise Decision Systems',
    role: 'Power BI & Executive Analytics',
  },
];

/**
 * <ArcWave />
 * 3D cylindrical concave carousel: portrait cards mounted on the INSIDE of a
 * slowly rotating drum. The viewer looks at the far wall so the center cards
 * face the viewer and the side cards bow forward toward the viewer.
 */
export const ArcWave: React.FC<ArcWaveProps> = ({
  items = DEFAULT_ITEMS,
  cardWidth = 260,
  cardHeight = 370,
  gap = 20,
  speed = 5,
  accentColor = '#22d3ee',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const drumRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const N = Math.max(3, items.length);

  // Cylinder radius: R = ((cardWidth + gap) / 2) / tan(PI / N)
  const R = (cardWidth + gap) / 2 / Math.tan(Math.PI / N);

  // Rotation state in refs for 60fps RAF loop without React re-renders
  const rotationRef = useRef<number>(0);
  const velocityRef = useRef<number>(0); // deg/sec from drag/wheel
  const currentSpeedRef = useRef<number>(speed);
  const targetSpeedRef = useRef<number>(speed);
  const isHoveredRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const hoveredIndexRef = useRef<number | null>(null);

  // Drag interaction tracking
  const dragStartCoordRef = useRef<number>(0);
  const dragStartRotRef = useRef<number>(0);
  const lastDragTimeRef = useRef<number>(0);
  const lastDragCoordRef = useRef<number>(0);

  // React state for hover overlay on touched/hovered card
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // Update scale factor on resize to keep drum fitting narrow mobile screens
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const containerW = containerRef.current.clientWidth;
      // Ideal drum diameter is ~2*R + cardWidth
      const idealW = 2 * R + cardWidth * 0.5;
      if (containerW < idealW) {
        setScale(Math.max(0.48, containerW / idealW));
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [R, cardWidth]);

  // Main 60fps Animation Loop: Auto-rotate, inertia decay, angle dimming
  useEffect(() => {
    let lastTime = performance.now();
    let rafId: number;

    const animate = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000); // delta in seconds
      lastTime = now;

      if (!isDraggingRef.current) {
        // Smoothly ease current speed toward target speed
        const speedEase = 4.5 * dt;
        currentSpeedRef.current +=
          (targetSpeedRef.current - currentSpeedRef.current) * speedEase;

        // Apply auto-rotation if not prefers-reduced-motion
        const baseAuto = prefersReducedMotion ? 0 : currentSpeedRef.current * dt;

        // Apply inertia velocity decay
        rotationRef.current += baseAuto + velocityRef.current * dt;
        velocityRef.current *= Math.pow(0.88, dt * 60); // exponential friction decay
        if (Math.abs(velocityRef.current) < 0.01) {
          velocityRef.current = 0;
        }
      }

      const rot = rotationRef.current;

      // Update Drum 3D transform
      if (drumRef.current) {
        drumRef.current.style.transform = `scale(${scale}) translateZ(${R}px) rotateY(${rot}deg)`;
      }

      // Update each card's dynamic dimming based on angle to viewer
      for (let i = 0; i < N; i++) {
        const cardEl = cardRefs.current[i];
        if (!cardEl) continue;

        // Net angle of card relative to line of sight (viewer at far wall)
        const cardBaseAngle = (i * 360) / N;
        let normalizedAngle = (cardBaseAngle + rot) % 360;
        if (normalizedAngle > 180) normalizedAngle -= 360;
        if (normalizedAngle < -180) normalizedAngle += 360;
        const deltaDeg = Math.abs(normalizedAngle);

        // Facing viewer (delta ~ 0): brightness 1.0; at edges (delta >= 80): ~0.58 for rich clarity
        const rad = (deltaDeg * Math.PI) / 180;
        const cosFactor = Math.max(0, Math.cos(rad));
        const brightness = 0.58 + 0.42 * Math.pow(cosFactor, 1.2);

        // Apply brightness/opacity to card image overlay
        const dimOverlay = cardEl.querySelector('.arcwave-dim') as HTMLElement | null;
        if (dimOverlay) {
          // Dim overlay opacity: 0 when facing viewer, 0.65 when edge
          dimOverlay.style.opacity = (1 - brightness).toFixed(3);
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId);
  }, [N, R, scale, prefersReducedMotion]);

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartCoordRef.current = e.clientX;
    dragStartRotRef.current = rotationRef.current;
    lastDragCoordRef.current = e.clientX;
    lastDragTimeRef.current = performance.now();
    velocityRef.current = 0;

    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const currentX = e.clientX;
    const now = performance.now();
    const deltaX = currentX - dragStartCoordRef.current;

    // Convert pixel delta to rotation degrees (~0.22 deg/pixel)
    const degPerPixel = 0.22 / Math.max(0.5, scale);
    rotationRef.current = dragStartRotRef.current + deltaX * degPerPixel;

    // Track instantaneous release velocity
    const dt = Math.max(0.001, (now - lastDragTimeRef.current) / 1000);
    const dCoord = currentX - lastDragCoordRef.current;
    velocityRef.current = (dCoord * degPerPixel) / dt;

    lastDragCoordRef.current = currentX;
    lastDragTimeRef.current = now;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    // Cap maximum throw velocity for realistic inertia
    velocityRef.current = Math.max(-120, Math.min(120, velocityRef.current));

    if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
      containerRef.current.releasePointerCapture(e.pointerId);
    }
  };

  // Wheel / Trackpad horizontal scroll handler
  const handleWheel = (e: React.WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 1) {
      // Rotate proportionally to wheel delta
      rotationRef.current -= delta * 0.12;
      targetSpeedRef.current = speed;
    }
  };

  // Keyboard navigation (ArrowLeft / ArrowRight)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      velocityRef.current = 45;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      velocityRef.current = -45;
    }
  };

  // Card Hover & Touch Tap Handlers
  const handleCardMouseEnter = (idx: number) => {
    isHoveredRef.current = true;
    targetSpeedRef.current = 0; // Eases rotation to a stop
    hoveredIndexRef.current = idx;
    setActiveCardIndex(idx);
  };

  const handleCardMouseLeave = () => {
    isHoveredRef.current = false;
    targetSpeedRef.current = speed; // Resumes rotation
    hoveredIndexRef.current = null;
    setActiveCardIndex(null);
  };

  const handleCardClick = (idx: number) => {
    // Touch tap toggles active state
    if (activeCardIndex === idx) {
      handleCardMouseLeave();
    } else {
      handleCardMouseEnter(idx);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Arc Wave 3D Carousel"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      className={`arcwave-container relative w-full h-[500px] sm:h-[540px] md:h-[560px] overflow-hidden rounded-[24px] border border-white/10 select-none cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 ${className}`}
      style={{
        perspective: '1350px',
        touchAction: 'pan-y',
        background:
          'radial-gradient(ellipse at 50% 50%, #10141e 0%, #080a0f 60%, #030406 100%)',
        boxShadow: '0 25px 60px -10px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.08)',
      }}
    >
      <style>{`
        .arcwave-container {
          --accent: ${accentColor};
        }
        .arcwave-drum {
          transform-style: preserve-3d;
          will-change: transform;
        }
        .arcwave-card {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform-style: preserve-3d;
        }
        .arcwave-card.is-active {
          box-shadow: 0 0 0 1.5px var(--accent), 0 14px 36px -4px rgba(0, 0, 0, 0.9);
        }
      `}</style>

      {/* Ambient Top Light Beam */}
      <div
        className="absolute inset-x-0 top-0 h-36 pointer-events-none opacity-40 z-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(34, 211, 238, 0.18) 0%, transparent 70%)',
        }}
      />

      {/* 3D Drum (Cylinder) holding portrait cards on inside wall */}
      <div
        ref={drumRef}
        className="arcwave-drum absolute inset-0 pointer-events-none"
        style={{
          transformStyle: 'preserve-3d',
          transformOrigin: '50% 50%',
        }}
      >
        {items.map((item, i) => {
          const cardAngle = (i * 360) / N;
          const isActive = activeCardIndex === i;

          return (
            <div
              key={i}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              onMouseEnter={() => handleCardMouseEnter(i)}
              onMouseLeave={handleCardMouseLeave}
              onClick={() => handleCardClick(i)}
              className={`arcwave-card absolute overflow-hidden rounded-[14px] pointer-events-auto cursor-pointer transition-shadow duration-300 ${
                isActive ? 'is-active' : ''
              }`}
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                left: '50%',
                top: '50%',
                marginLeft: `-${cardWidth / 2}px`,
                marginTop: `-${cardHeight / 2}px`,
                // Inside wall mount: rotateY(angle) translateZ(-R)
                transform: `rotateY(${cardAngle}deg) translateZ(-${R}px)`,
                background: '#07090e',
                border: isActive
                  ? `1px solid ${accentColor}`
                  : '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              {/* Card Image with high clarity & contrast */}
              <img
                src={item.image}
                alt={item.name}
                loading="eager"
                className="w-full h-full object-cover select-none pointer-events-none filter brightness-[1.03] contrast-[1.04]"
                style={{ imageRendering: '-webkit-optimize-contrast' }}
              />

              {/* Dynamic Angle Dimming Mask (lightens facing center, dims at edges) */}
              <div
                className="arcwave-dim absolute inset-0 bg-black pointer-events-none transition-opacity duration-100"
                style={{ opacity: 0 }}
              />

              {/* Glass Specular Rim Highlight */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, transparent 40%, rgba(0,0,0,0.3) 100%)',
                }}
              />

              {/* Bottom Gradient Caption on Hover/Tap */}
              <div
                className={`absolute inset-x-0 bottom-0 p-4 pt-10 bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col justify-end transition-all duration-300 pointer-events-none ${
                  isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
              >
                <div className="font-bold text-white text-sm sm:text-[15px] leading-tight line-clamp-1 drop-shadow-md tracking-tight">
                  {item.name}
                </div>
                <div className="text-[11px] sm:text-xs text-cyan-300/80 font-mono mt-0.5 line-clamp-1">
                  {item.role}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edge Gradient Vignette for Depth Immersion */}
      <div className="absolute inset-y-0 left-0 w-10 sm:w-14 bg-gradient-to-r from-[#030406]/50 to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-10 sm:w-14 bg-gradient-to-l from-[#030406]/50 to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default ArcWave;
