import React, { useMemo } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type SupportedTag =
  | 'div'
  | 'header'
  | 'section'
  | 'article'
  | 'p'
  | 'span'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'ul'
  | 'li';

interface FadeInProps extends HTMLMotionProps<'div'> {
  children?: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  as?: SupportedTag;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const FadeIn: React.FC<FadeInProps> = ({
  children,
  className = '',
  delay = 0,
  duration = 0.7,
  x = 0,
  y = 30,
  as = 'div',
  style,
  onClick,
  ...props
}) => {
  // Use motion.create() as specified in the prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = useMemo(() => (motion.create as any)(as), [as]);

  return (
    <Component
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '50px', amount: 0 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
      style={style}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
};
