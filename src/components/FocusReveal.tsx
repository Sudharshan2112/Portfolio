'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface FocusRevealLine {
  text: string;
  className?: string;
}

export interface FocusRevealProps {
  lines: FocusRevealLine[];
  blur?: number;
  bracketColor?: string;
  padX?: number;
  padY?: number;
  className?: string;
}

interface ParsedWord {
  id: string;
  raw: string;
  clean: string;
  trailingPunctuation: string;
  isPermanent: boolean;
  isFocusTarget: boolean;
  lineIndex: number;
  wordIndex: number;
}

export const FocusReveal: React.FC<FocusRevealProps> = ({
  lines,
  blur = 6,
  bracketColor = '#d8f56a',
  padX = 10,
  padY = 6,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  const [activeWordId, setActiveWordId] = useState<string | null>(null);
  const [hasEverFocused, setHasEverFocused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(media.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // Check if any line has selective focus tags [word]
  const hasSelectiveTags = lines.some((l) => /\[.*?\]/.test(l.text));

  // Parse lines into words.
  // [word] or [word], -> specific focus reveal target with trailing punctuation attached
  // *word* -> permanent bracket example
  // other words -> fully visible text
  const parsedLines = lines.map((line, lIdx) => {
    const rawWords = line.text.split(/\s+/).filter(Boolean);
    const words: ParsedWord[] = rawWords.map((w, wIdx) => {
      const permMatch = w.match(/^\*([^*]+)\*([,\.\?!;:]*)$/);
      const bracketMatch = w.match(/^\[([^\]]+)\]([,\.\?!;:]*)$/);

      let clean = w;
      let trailingPunctuation = '';
      let isPermanent = false;
      let isBracketed = false;

      if (permMatch) {
        isPermanent = true;
        clean = permMatch[1];
        trailingPunctuation = permMatch[2] || '';
      } else if (bracketMatch) {
        isBracketed = true;
        clean = bracketMatch[1];
        trailingPunctuation = bracketMatch[2] || '';
      } else {
        // Strip stray brackets if any
        clean = w.replace(/[\[\]*]/g, '');
      }

      const isFocusTarget = hasSelectiveTags ? isBracketed : !isPermanent;

      return {
        id: `word-${lIdx}-${wIdx}`,
        raw: w,
        clean,
        trailingPunctuation,
        isPermanent,
        isFocusTarget,
        lineIndex: lIdx,
        wordIndex: wIdx,
      };
    });
    return { ...line, words };
  });

  const fullSentence = lines
    .map((l) => l.text.replace(/[*\[\]]/g, ''))
    .join(' ');

  // Update frame position and dimensions
  const updateFrame = useCallback(
    (targetEl: HTMLElement, instant = false) => {
      const container = containerRef.current;
      const frame = frameRef.current;
      if (!container || !frame) return;

      const wordRect = targetEl.getBoundingClientRect();
      const contRect = container.getBoundingClientRect();

      const x = wordRect.left - contRect.left - padX;
      const y = wordRect.top - contRect.top - padY;
      const w = wordRect.width + padX * 2;
      const h = wordRect.height + padY * 2;

      if (instant || prefersReducedMotion) {
        frame.classList.add('no-anim');
        frame.style.transform = `translate(${x}px, ${y}px)`;
        frame.style.width = `${w}px`;
        frame.style.height = `${h}px`;
        frame.style.opacity = '1';
        void frame.offsetWidth; // Force reflow
        frame.classList.remove('no-anim');
      } else {
        frame.style.transform = `translate(${x}px, ${y}px)`;
        frame.style.width = `${w}px`;
        frame.style.height = `${h}px`;
        frame.style.opacity = '1';
      }
    },
    [padX, padY, prefersReducedMotion]
  );

  // Focus a specific word
  const handleWordFocus = useCallback(
    (id: string) => {
      const el = wordRefs.current.get(id);
      if (!el) return;

      const isFirst = !hasEverFocused || !activeWordId;
      setActiveWordId(id);
      setHasEverFocused(true);

      updateFrame(el, isFirst);
    },
    [hasEverFocused, activeWordId, updateFrame]
  );

  // Clear focus when pointer leaves container or Escape pressed
  const clearFocus = useCallback(() => {
    setActiveWordId(null);
    const frame = frameRef.current;
    if (frame) {
      frame.style.opacity = '0';
    }
  }, []);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearFocus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearFocus]);

  // Re-measure on resize and fonts ready
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reMeasure = () => {
      if (activeWordId) {
        const el = wordRefs.current.get(activeWordId);
        if (el) {
          updateFrame(el, true);
        }
      }
    };

    window.addEventListener('resize', reMeasure);

    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(reMeasure);
      resizeObserver.observe(containerRef.current);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(reMeasure);
    }

    return () => {
      window.removeEventListener('resize', reMeasure);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [activeWordId, updateFrame]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label={fullSentence}
      onPointerLeave={clearFocus}
      className={`focus-reveal-container relative select-none ${className}`}
      style={
        {
          '--bracket-color': bracketColor,
          '--blur-amount': `${blur}px`,
        } as React.CSSProperties
      }
    >
      {/* 8-gradient corner-bracket frame */}
      <div
        ref={frameRef}
        aria-hidden="true"
        className="focus-reveal-frame"
        style={{
          transform: 'translate(0, 0)',
          width: 0,
          height: 0,
          opacity: 0,
        }}
      />

      {/* Render text lines */}
      <div className="flex flex-col gap-1.5">
        {parsedLines.map((line, lIdx) => (
          <div
            key={lIdx}
            className={`flex flex-wrap items-baseline gap-x-1 gap-y-1 ${line.className || ''}`}
          >
            {line.words.map((w) => {
              if (w.isPermanent) {
                // Permanent bracket example word
                return (
                  <span key={w.id} className="inline-flex items-baseline">
                    <span
                      aria-hidden="true"
                      className="focus-permanent-word inline-block px-1.5 py-0.5 text-white font-medium"
                      style={{ filter: 'blur(0px)', opacity: 1 }}
                    >
                      {w.clean}
                    </span>
                    {w.trailingPunctuation && (
                      <span className="text-gray-300 pointer-events-none select-none">
                        {w.trailingPunctuation}
                      </span>
                    )}
                  </span>
                );
              }

              const isActive = activeWordId === w.id;

              if (!w.isFocusTarget) {
                // Non-target word: fully visible and readable
                return (
                  <span key={w.id} className="inline-flex items-baseline">
                    <span
                      ref={(el) => {
                        if (el) wordRefs.current.set(w.id, el);
                        else wordRefs.current.delete(w.id);
                      }}
                      data-w={w.clean}
                      tabIndex={0}
                      aria-hidden="true"
                      onPointerEnter={() => handleWordFocus(w.id)}
                      onPointerDown={() => handleWordFocus(w.id)}
                      onFocus={() => handleWordFocus(w.id)}
                      className="focus-word-visible inline-block px-0.5 py-0.5 cursor-pointer outline-none transition-colors duration-200"
                    >
                      {w.clean}
                    </span>
                    {w.trailingPunctuation && (
                      <span className="text-gray-300 pointer-events-none select-none">
                        {w.trailingPunctuation}
                      </span>
                    )}
                  </span>
                );
              }

              // Focus reveal target word: starts blurred and sharpens on hover with corner brackets
              return (
                <span key={w.id} className="inline-flex items-baseline">
                  <span
                    ref={(el) => {
                      if (el) wordRefs.current.set(w.id, el);
                      else wordRefs.current.delete(w.id);
                    }}
                    data-w={w.clean}
                    tabIndex={0}
                    aria-hidden="true"
                    onPointerEnter={() => handleWordFocus(w.id)}
                    onPointerDown={() => handleWordFocus(w.id)}
                    onFocus={() => handleWordFocus(w.id)}
                    className={`focus-word inline-block px-1 py-0.5 cursor-pointer outline-none ${
                      isActive ? 'on' : ''
                    }`}
                  >
                    {w.clean}
                  </span>
                  {w.trailingPunctuation && (
                    <span className="text-gray-300 pointer-events-none select-none">
                      {w.trailingPunctuation}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      {/* Scoped CSS Styles */}
      <style>{`
        .focus-reveal-container {
          position: relative;
        }

        /* 8-gradient corner brackets on a single element */
        .focus-reveal-frame,
        .focus-permanent-word {
          --arm: 9px;
          --glow: drop-shadow(0 0 5px var(--bracket-color, #d8f56a));
          background:
            /* Top-left */
            linear-gradient(var(--bracket-color), var(--bracket-color)) top left / var(--arm) 1px no-repeat,
            linear-gradient(var(--bracket-color), var(--bracket-color)) top left / 1px var(--arm) no-repeat,
            /* Top-right */
            linear-gradient(var(--bracket-color), var(--bracket-color)) top right / var(--arm) 1px no-repeat,
            linear-gradient(var(--bracket-color), var(--bracket-color)) top right / 1px var(--arm) no-repeat,
            /* Bottom-left */
            linear-gradient(var(--bracket-color), var(--bracket-color)) bottom left / var(--arm) 1px no-repeat,
            linear-gradient(var(--bracket-color), var(--bracket-color)) bottom left / 1px var(--arm) no-repeat,
            /* Bottom-right */
            linear-gradient(var(--bracket-color), var(--bracket-color)) bottom right / var(--arm) 1px no-repeat,
            linear-gradient(var(--bracket-color), var(--bracket-color)) bottom right / 1px var(--arm) no-repeat;
          filter: var(--glow);
        }

        .focus-reveal-frame {
          position: absolute;
          left: 0;
          top: 0;
          pointer-events: none;
          z-index: 25;
          box-sizing: border-box;
          transition:
            transform 450ms cubic-bezier(0.22, 0.8, 0.2, 1),
            width 550ms cubic-bezier(0.22, 0.8, 0.2, 1),
            height 550ms cubic-bezier(0.22, 0.8, 0.2, 1),
            opacity 250ms ease;
          will-change: transform, width, height, opacity;
        }

        .focus-reveal-frame.no-anim {
          transition: none !important;
        }

        .focus-permanent-word {
          --arm: 5px;
          position: relative;
          color: #ffffff;
        }

        /* Normal visible words */
        .focus-word-visible {
          opacity: 0.95;
          filter: none;
          color: inherit;
        }

        /* Focus reveal target words */
        .focus-word {
          color: inherit;
          opacity: 0.65;
          filter: blur(var(--blur-amount, 5px));
          transition:
            filter 0.35s ease,
            opacity 0.35s ease,
            color 0.35s ease;
          will-change: filter, opacity, color;
        }

        .focus-word.on {
          color: #ffffff;
          opacity: 1;
          filter: blur(0px);
        }

        @media (prefers-reduced-motion: reduce) {
          .focus-reveal-frame {
            transition: none !important;
          }
          .focus-word {
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
};
