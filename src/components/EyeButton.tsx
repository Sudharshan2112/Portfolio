'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ButtonHTMLAttributes,
} from 'react';

export interface EyeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  copyText?: string;
  copiedLabel?: string;
}

// Module-level pointer coordinates shared across all instances
let sharedPointer: { x: number; y: number } | null = null;
const activeInstances = new Set<() => void>();

if (typeof window !== 'undefined') {
  const onPointer = (e: PointerEvent | MouseEvent) => {
    sharedPointer = { x: e.clientX, y: e.clientY };
    activeInstances.forEach((notify) => notify());
  };

  const onLeave = (e: MouseEvent) => {
    if (
      !e.relatedTarget &&
      (e.clientX <= 0 ||
        e.clientY <= 0 ||
        e.clientX >= window.innerWidth ||
        e.clientY >= window.innerHeight)
    ) {
      sharedPointer = null;
      activeInstances.forEach((notify) => notify());
    }
  };

  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('mousemove', onPointer, { passive: true });
  window.addEventListener('pointerdown', onPointer, { passive: true });
  document.addEventListener('mouseleave', onLeave);
  window.addEventListener('scroll', () => activeInstances.forEach((notify) => notify()), {
    capture: true,
    passive: true,
  });
  window.addEventListener('resize', () => activeInstances.forEach((notify) => notify()), {
    passive: true,
  });
}

/**
 * <EyeButton />
 * A tactile black pill button with two googly eyes whose pupils follow
 * the pointer across the entire page, and eyes that blink at irregular intervals.
 */
export const EyeButton: React.FC<EyeButtonProps> = ({
  children = 'Copy the email',
  copyText,
  copiedLabel = 'Copied!',
  onClick,
  className = '',
  type = 'button',
  ...restProps
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const eye1Ref = useRef<HTMLSpanElement>(null);
  const eye2Ref = useRef<HTMLSpanElement>(null);
  const pupil1Ref = useRef<HTMLSpanElement>(null);
  const pupil2Ref = useRef<HTMLSpanElement>(null);

  // Blinking state
  const [isBlinking, setIsBlinking] = useState(false);
  const blinkTimer1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimer2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rafIdRef = useRef<number | null>(null);

  // Constants per spec
  const eyeRadius = 14; // 28px / 2
  const pupilRadius = 5; // 10px / 2
  const maxTravel = eyeRadius - pupilRadius - 2; // 7px
  const idleTravelX = maxTravel * 0.35; // 35% down-right
  const idleTravelY = maxTravel * 0.35;

  const applyTransform = (el: HTMLSpanElement | null, x: number, y: number) => {
    if (!el) return;
    el.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
  };

  // Frame update: reads measurements, calculates trigonometry, writes transforms
  const updateEyes = useCallback(() => {
    const eye1 = eye1Ref.current;
    const eye2 = eye2Ref.current;
    const pupil1 = pupil1Ref.current;
    const pupil2 = pupil2Ref.current;

    if (!eye1 || !eye2 || !pupil1 || !pupil2) return;

    const pointer = sharedPointer;

    // Idle gaze if pointer is null or offscreen
    if (!pointer) {
      applyTransform(pupil1, idleTravelX, idleTravelY);
      applyTransform(pupil2, idleTravelX, idleTravelY);
      return;
    }

    // Step 3: READ all measurements first
    const rect1 = eye1.getBoundingClientRect();
    const rect2 = eye2.getBoundingClientRect();

    // If element is not rendered / display:none
    if (rect1.width === 0 && rect2.width === 0) return;

    const c1x = rect1.left + rect1.width / 2;
    const c1y = rect1.top + rect1.height / 2;

    const c2x = rect2.left + rect2.width / 2;
    const c2y = rect2.top + rect2.height / 2;

    const dx1 = pointer.x - c1x;
    const dy1 = pointer.y - c1y;
    const d1 = Math.hypot(dx1, dy1);

    const dx2 = pointer.x - c2x;
    const dy2 = pointer.y - c2y;
    const d2 = Math.hypot(dx2, dy2);

    // Step 4: Max travel calculation
    let tx1 = 0;
    let ty1 = 0;
    if (d1 > 0) {
      const travel1 = maxTravel * Math.min(1, d1 / 60);
      tx1 = (dx1 / d1) * travel1;
      ty1 = (dy1 / d1) * travel1;
    }

    let tx2 = 0;
    let ty2 = 0;
    if (d2 > 0) {
      const travel2 = maxTravel * Math.min(1, d2 / 60);
      tx2 = (dx2 / d2) * travel2;
      ty2 = (dy2 / d2) * travel2;
    }

    // WRITE transforms
    applyTransform(pupil1, tx1, ty1);
    applyTransform(pupil2, tx2, ty2);
  }, [idleTravelX, idleTravelY, maxTravel]);

  const requestUpdate = useCallback(() => {
    if (rafIdRef.current !== null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      updateEyes();
    });
  }, [updateEyes]);

  // Subscribe to shared pointer events
  useEffect(() => {
    activeInstances.add(requestUpdate);

    // Initial position on mount
    requestUpdate();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(requestUpdate).catch(() => {});
    }

    return () => {
      activeInstances.delete(requestUpdate);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [requestUpdate]);

  // Blinking loop per specification
  useEffect(() => {
    let isMounted = true;

    const scheduleBlink = () => {
      if (!isMounted) return;

      const delay = 1800 + Math.random() * (5200 - 1800);

      blinkTimer1Ref.current = setTimeout(() => {
        if (!isMounted) return;

        if (!document.hidden) {
          setIsBlinking(true);

          blinkTimer2Ref.current = setTimeout(() => {
            if (!isMounted) return;
            setIsBlinking(false);

            if (Math.random() < 0.2) {
              setTimeout(() => {
                if (!isMounted || document.hidden) return;
                setIsBlinking(true);
                setTimeout(() => {
                  if (isMounted) setIsBlinking(false);
                }, 120);
              }, 260);
            }
          }, 120);
        }

        scheduleBlink();
      }, delay);
    };

    scheduleBlink();

    return () => {
      isMounted = false;
      if (blinkTimer1Ref.current) clearTimeout(blinkTimer1Ref.current);
      if (blinkTimer2Ref.current) clearTimeout(blinkTimer2Ref.current);
    };
  }, []);

  // Click & Copy handling
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
      if (e.defaultPrevented) return;
    }

    if (copyText) {
      try {
        await navigator.clipboard.writeText(copyText);
        setIsCopied(true);
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => {
          setIsCopied(false);
        }, 1600);
      } catch (err) {
        // Leave unchanged if clipboard access denied
      }
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={handleClick}
      className={`eye-button ${className}`}
      {...restProps}
    >
      <style>{`
        .eye-button {
          --eye: 28px;
          --pupil: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          height: 38px;
          border-radius: 999px;
          background: #000000;
          color: #ffffff;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: 700;
          font-size: 15px;
          white-space: nowrap;
          padding: 0 5px 0 16px;
          box-shadow: 0 10px 24px -8px rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.16);
          cursor: pointer;
          user-select: none;
          outline: none;
          transition: transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
          position: relative;
        }

        .eye-button:hover {
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.65);
        }

        .eye-button:active {
          transform: scale(0.97);
          transition-duration: 150ms;
        }

        .eye-button:focus-visible {
          box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #000000;
        }

        .eye-button-label {
          margin-right: 14px;
          line-height: 1;
        }

        .eye-button-eyes {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          pointer-events: none;
          flex-shrink: 0;
        }

        .eye-button .eye {
          width: var(--eye);
          height: var(--eye);
          border-radius: 50%;
          background: #ffffff;
          position: relative;
          overflow: hidden;
          transform-origin: center;
          transition: transform 90ms ease-in;
          display: block;
        }

        .eye-button .eye.is-blink {
          transform: scaleY(0.08);
        }

        .eye-button .pupil {
          width: var(--pupil);
          height: var(--pupil);
          border-radius: 50%;
          background: #000000;
          position: absolute;
          left: 50%;
          top: 50%;
          margin-left: calc(var(--pupil) / -2);
          margin-top: calc(var(--pupil) / -2);
          transition: transform 80ms ease-out;
          display: block;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .eye-button,
          .eye-button:active,
          .eye-button .eye,
          .eye-button .pupil {
            transition: none !important;
          }
          .eye-button .eye.is-blink {
            transform: none !important;
          }
        }
      `}</style>

      {/* Accessible label text */}
      <span className="eye-button-label" aria-live="polite">
        {isCopied ? copiedLabel : children}
      </span>

      {/* Googly eyes */}
      <span className="eye-button-eyes" aria-hidden="true">
        <span
          ref={eye1Ref}
          className={`eye ${isBlinking ? 'is-blink' : ''}`}
        >
          <span
            ref={pupil1Ref}
            className="pupil"
            style={{ transform: `translate(${idleTravelX.toFixed(2)}px, ${idleTravelY.toFixed(2)}px)` }}
          />
        </span>
        <span
          ref={eye2Ref}
          className={`eye ${isBlinking ? 'is-blink' : ''}`}
        >
          <span
            ref={pupil2Ref}
            className="pupil"
            style={{ transform: `translate(${idleTravelX.toFixed(2)}px, ${idleTravelY.toFixed(2)}px)` }}
          />
        </span>
      </span>
    </button>
  );
};

export default EyeButton;
