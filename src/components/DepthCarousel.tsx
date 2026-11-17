'use client';

import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

export interface DepthCarouselItem {
  src: string;
  alt: string;
  title: string;
  tag: string;
  description: string;
  href?: string;
  fit?: 'cover' | 'contain';
}

export interface DepthCarouselProps {
  items: DepthCarouselItem[];
  initialIndex?: number;
  loop?: boolean;
  autoplay?: boolean;
  autoplayInterval?: number;
  className?: string;
  onSelect?: (item: DepthCarouselItem, index: number) => void;
}

export const DepthCarousel: React.FC<DepthCarouselProps> = ({
  items,
  initialIndex = 0,
  loop = true,
  autoplay = false,
  autoplayInterval = 4500,
  className = '',
  onSelect,
}) => {
  const carouselId = useId();
  const [activeIndex, setActiveIndex] = useState(
    items.length > 0 ? ((initialIndex % items.length) + items.length) % items.length : 0
  );
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const currentDragX = useRef(0);
  const isPointerDown = useRef(false);
  const hasMovedSignificantly = useRef(false);
  const cardWidthRef = useRef(520);

  const count = items.length;

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // Update card width estimate on resize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateSize = () => {
      if (stageRef.current) {
        const stageW = stageRef.current.clientWidth;
        // Cards are ~62% of stage width, clamped between 280px and 720px
        cardWidthRef.current = Math.max(280, Math.min(720, Math.round(stageW * 0.62)));
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Navigation helpers
  const goTo = useCallback(
    (newIndex: number) => {
      if (count === 0) return;
      let next = newIndex;
      if (loop) {
        next = ((newIndex % count) + count) % count;
      } else {
        next = Math.max(0, Math.min(count - 1, newIndex));
      }
      setActiveIndex(next);
      if (onSelect) {
        onSelect(items[next], next);
      }
    },
    [count, loop, onSelect, items]
  );

  const prev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);
  const next = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || isPaused || isDragging || prefersReducedMotion || count <= 1) return;
    const timer = setInterval(() => {
      goTo(activeIndex + 1);
    }, autoplayInterval);
    return () => clearInterval(timer);
  }, [autoplay, isPaused, isDragging, prefersReducedMotion, count, autoplayInterval, activeIndex, goTo]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
  };

  // Pointer drag handling
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // left click only
    isPointerDown.current = true;
    hasMovedSignificantly.current = false;
    dragStartX.current = e.clientX;
    currentDragX.current = e.clientX;
    setIsDragging(true);
    setDragOffset(0);
    if (stageRef.current) {
      stageRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;
    const diff = e.clientX - dragStartX.current;
    if (Math.abs(diff) > 6) {
      hasMovedSignificantly.current = true;
    }
    currentDragX.current = e.clientX;
    setDragOffset(diff);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDown.current) return;
    isPointerDown.current = false;
    setIsDragging(false);

    const diff = currentDragX.current - dragStartX.current;
    const threshold = cardWidthRef.current * 0.18; // ~18% card width swipe to trigger

    if (diff < -threshold) {
      next();
    } else if (diff > threshold) {
      prev();
    }
    setDragOffset(0);

    try {
      if (stageRef.current && stageRef.current.hasPointerCapture(e.pointerId)) {
        stageRef.current.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    isPointerDown.current = false;
    setIsDragging(false);
    setDragOffset(0);
  };

  if (!items || items.length === 0) return null;

  const currentItem = items[activeIndex];

  // We render offsets d in [-3, -2, -1, 0, 1, 2, 3] to provide the coverflow depth
  // Even with 3 items, circular wrapping fills the outer slivers perfectly
  const offsets = [-3, -2, -1, 0, 1, 2, 3];

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="3D Depth Project Showcase"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className={`relative w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 rounded-3xl ${className}`}
    >
      {/* ============================================================== */}
      {/* 3D STAGE CONTAINER                                            */}
      {/* ============================================================== */}
      <div
        ref={stageRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        className={`relative w-full overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.12] bg-[#030303] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(6,182,212,0.08)] ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          aspectRatio: '16 / 9.2',
          minHeight: '340px',
          maxHeight: '620px',
          perspective: '1100px',
          perspectiveOrigin: '50% 50%',
          touchAction: 'pan-y',
        }}
      >
        {/* Left & Right Edge Dissolve Gradients (hardware-accelerated, zero scroll lag) */}
        <div className="absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-[#030303] to-transparent pointer-events-none z-20" />
        <div className="absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-[#030303] to-transparent pointer-events-none z-20" />

        {/* Subtle Ambient 3D Depth Floor Glow */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              'radial-gradient(ellipse 65% 35% at 50% 92%, rgba(6, 182, 212, 0.22) 0%, rgba(16, 185, 129, 0.12) 35%, transparent 72%)',
          }}
        />

        {/* Ambient Top Light Sheen */}
        <div
          className="absolute inset-x-0 top-0 h-40 pointer-events-none z-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(255, 255, 255, 0.12) 0%, transparent 70%)',
          }}
        />

        {/* ============================================================== */}
        {/* CARDS LAYER (PRESERVE-3D)                                      */}
        {/* ============================================================== */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {offsets.map((d) => {
            // Compute wrapped index for item
            const itemIdx = ((activeIndex + d) % count + count) % count;
            const item = items[itemIdx];
            const isCenter = d === 0;
            const absD = Math.abs(d);

            // Responsive translateX percentage: ~58% of card width
            const baseTranslatePct = d * 58;

            // Optional drag offset translation applied to the set
            const dragInfluence = isDragging ? dragOffset * (1 - absD * 0.15) : 0;

            // Depth receding translateZ
            const translateZ = -absD * 122;

            // Rotation angle: 0 for center, ~38deg for d=1, steepening to ~78deg for outer slivers
            let rotateAngle = 0;
            if (d !== 0) {
              const sign = Math.sign(d);
              if (absD === 1) rotateAngle = -sign * 38;
              else if (absD === 2) rotateAngle = -sign * 58;
              else rotateAngle = -sign * 78; // |d| >= 3 almost edge-on
            }

            // Scale falloff
            const scale = Math.max(0.72, 1 - Math.min(absD, 4) * 0.065);

            // Opacity falloff: 1 at center, 0.9 at d=1, down to 0.22 at outer slivers
            let opacity = 1;
            if (absD === 1) opacity = 0.88;
            else if (absD === 2) opacity = 0.52;
            else if (absD >= 3) opacity = 0.22;

            // Z-index: nearer cards overlap farther ones
            const zIndex = 100 - absD;

            return (
              <div
                key={`offset-${d}-${itemIdx}`}
                className="absolute flex items-center justify-center pointer-events-auto transform-gpu"
                style={{
                  width: 'clamp(280px, 60%, 700px)',
                  aspectRatio: '16 / 9',
                  zIndex,
                  transform: prefersReducedMotion
                    ? `translateX(${d * 32}%) scale(${scale})`
                    : `translateX(calc(${baseTranslatePct}% + ${dragInfluence}px)) translateZ(${translateZ}px) rotateY(${rotateAngle}deg) scale(${scale})`,
                  opacity,
                  transition:
                    isDragging || prefersReducedMotion
                      ? 'none'
                      : 'transform 550ms cubic-bezier(0.22, 0.8, 0.2, 1), opacity 550ms cubic-bezier(0.22, 0.8, 0.2, 1)',
                  willChange: isDragging ? 'transform' : 'auto',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/* Clickable Card Button */}
                <button
                  type="button"
                  tabIndex={isCenter ? 0 : -1}
                  aria-label={`${item.title} - ${item.tag}. ${isCenter ? 'Active card' : 'Click to bring to center'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasMovedSignificantly.current) return;
                    if (isCenter) {
                      // Clicking center card opens lightbox
                      setLightboxOpen(true);
                    } else {
                      goTo(activeIndex + d);
                    }
                  }}
                  className={`group relative w-full h-full rounded-[16px] sm:rounded-[18px] overflow-hidden text-left focus:outline-none transition-all duration-300 ${
                    isCenter
                      ? 'ring-1 ring-cyan-400/40 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_30px_rgba(6,182,212,0.25)] hover:ring-cyan-300/70'
                      : 'ring-1 ring-white/10 hover:ring-white/30 shadow-[0_12px_30px_rgba(0,0,0,0.7)]'
                  }`}
                  style={{
                    background: '#0a0d12',
                  }}
                >
                  {/* High Clarity Image */}
                  {item.fit === 'contain' ? (
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#07090e]">
                      {/* Ambient Blurred Backdrop */}
                      <img
                        src={item.src}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-25 scale-125"
                      />
                      {/* Crisp Centered Screen (Mobile UI) */}
                      <img
                        src={item.src}
                        alt={item.alt}
                        loading={absD <= 1 ? 'eager' : 'lazy'}
                        className="relative z-10 h-full w-auto max-w-full object-contain p-1.5 sm:p-2 rounded-2xl drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)] transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                        style={{
                          imageRendering: '-webkit-optimize-contrast',
                        }}
                      />
                    </div>
                  ) : (
                    <img
                      src={item.src}
                      alt={item.alt}
                      loading={absD <= 1 ? 'eager' : 'lazy'}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                      style={{
                        imageRendering: '-webkit-optimize-contrast',
                      }}
                    />
                  )}

                  {/* Shiny Glass Specular Sheen (3D finish) */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 38%, transparent 60%, rgba(6,182,212,0.08) 100%)',
                    }}
                  />

                  {/* Subtle Top-Border Highlight */}
                  <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

                  {/* Subtle Inner Bevel Shadow */}
                  <div className="absolute inset-0 rounded-[16px] sm:rounded-[18px] ring-1 ring-inset ring-white/10 pointer-events-none" />

                  {/* Active Card Quick-Magnify Hint */}
                  {isCenter && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/60 backdrop-blur-md rounded-full p-1.5 text-white/80 hover:text-white border border-white/20">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* ============================================================== */}
        {/* CHROME: Glowing Thin Gradient Line along Bottom Edge           */}
        {/* ============================================================== */}
        <div
          className="absolute inset-x-0 bottom-0 h-[2px] z-20 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.85) 25%, rgba(16, 185, 129, 0.85) 75%, transparent 100%)',
            boxShadow: '0 -2px 14px rgba(6, 182, 212, 0.65)',
          }}
        />

        {/* ============================================================== */}
        {/* CHROME: Pill Button "Preview →" at Bottom-Left of Stage        */}
        {/* ============================================================== */}
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 flex items-center gap-2">
          {currentItem.href ? (
            <a
              href={currentItem.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${currentItem.title} in new tab`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 hover:border-cyan-400/60 shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_12px_rgba(6,182,212,0.25)] transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <span>Preview</span>
              <span className="text-cyan-400 font-bold">→</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              aria-label={`Enlarge ${currentItem.title}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-white bg-black/75 hover:bg-black/90 backdrop-blur-md border border-white/20 hover:border-cyan-400/60 shadow-[0_4px_16px_rgba(0,0,0,0.5),0_0_12px_rgba(6,182,212,0.25)] transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <span>Preview</span>
              <span className="text-cyan-400 font-bold">→</span>
            </button>
          )}

          {/* Quick Enlarge Button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="View full resolution image"
            className="p-2 rounded-full text-white/70 hover:text-white bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 transition-all duration-200 hover:scale-105"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CHROME: Left & Right Navigation Arrows */}
        <div className="absolute inset-y-0 left-2 sm:left-4 z-30 flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Previous slide"
            className="p-2.5 sm:p-3 rounded-full text-white/75 hover:text-white bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 hover:border-cyan-400/50 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="absolute inset-y-0 right-2 sm:right-4 z-30 flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Next slide"
            className="p-2.5 sm:p-3 rounded-full text-white/75 hover:text-white bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 hover:border-cyan-400/50 shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Pagination Dots indicator on bottom-right */}
        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? 'w-6 bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                  : 'w-1.5 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* BELOW THE STAGE: Active Card Title, Category & Description     */}
      {/* ============================================================== */}
      <div className="mt-6 sm:mt-8 px-2 sm:px-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div
          key={activeIndex}
          className="flex-1 transition-opacity duration-300 ease-out animate-fadeIn"
        >
          <div className="inline-flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400 font-mono">
              {currentItem.tag}
            </span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-white/50 font-mono">
              0{activeIndex + 1} / 0{count}
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight flex items-center gap-3">
            <span>{currentItem.title}</span>
            {currentItem.href && (
              <a
                href={currentItem.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Visit project link for ${currentItem.title}`}
                className="text-white/40 hover:text-cyan-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </h3>

          <p className="mt-2 text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed">
            {currentItem.description}
          </p>
        </div>

        {/* Interactive Controls info */}
        <div className="flex items-center gap-3 text-xs text-white/40 font-mono self-start md:self-end">
          <span className="hidden sm:inline">Drag or swipe · Keys ← →</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FULL-RESOLUTION LIGHTBOX MODAL FOR 100% CLARITY               */}
      {/* ============================================================== */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${currentItem.title} full resolution preview`}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fadeIn"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative max-w-6xl w-full max-h-[92vh] flex flex-col items-center bg-[#07090e] border border-white/20 rounded-2xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="w-full flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-mono font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {currentItem.tag}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  {currentItem.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {currentItem.href && (
                  <a
                    href={currentItem.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <span>View Repository</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxOpen(false)}
                  aria-label="Close preview"
                  className="p-1.5 rounded-lg text-white/70 hover:text-white bg-white/5 hover:bg-white/15 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* High-res image display with razor clarity */}
            <div className="relative w-full flex-1 flex items-center justify-center p-2 sm:p-4 overflow-auto bg-black/40">
              <img
                src={currentItem.src}
                alt={currentItem.alt}
                className="max-w-full max-h-[75vh] object-contain rounded-lg border border-white/10 shadow-2xl"
                style={{
                  imageRendering: '-webkit-optimize-contrast',
                }}
              />
            </div>

            {/* Lightbox Footer */}
            <div className="w-full px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-xs text-white/60">
              <p className="line-clamp-1">{currentItem.description}</p>
              <span className="font-mono text-cyan-400 ml-4 shrink-0">Original Resolution (16:9)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
