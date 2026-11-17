import React, { useRef, useEffect, useState } from 'react';

interface MagnetProps {
  children: React.ReactNode;
  padding?: number;
  strength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Magnet: React.FC<MagnetProps> = ({
  children,
  padding = 150,
  strength = 3,
  activeTransition = 'transform 0.3s ease-out',
  inactiveTransition = 'transform 0.6s ease-in-out',
  className = '',
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<string>('translate3d(0px, 0px, 0px)');
  const [transitionStyle, setTransitionStyle] = useState<string>(inactiveTransition);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const node = ref.current;
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const isInside =
        e.clientX >= rect.left - padding &&
        e.clientX <= rect.right + padding &&
        e.clientY >= rect.top - padding &&
        e.clientY <= rect.bottom + padding;

      if (isInside) {
        const deltaX = (e.clientX - centerX) / strength;
        const deltaY = (e.clientY - centerY) / strength;
        setTransitionStyle(activeTransition);
        setTransformStyle(`translate3d(${deltaX}px, ${deltaY}px, 0px)`);
      } else {
        setTransitionStyle(inactiveTransition);
        setTransformStyle('translate3d(0px, 0px, 0px)');
      }
    };

    const handleMouseLeave = () => {
      setTransitionStyle(inactiveTransition);
      setTransformStyle('translate3d(0px, 0px, 0px)');
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [padding, strength, activeTransition, inactiveTransition]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: transformStyle,
        transition: transitionStyle,
        willChange: 'transform',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
