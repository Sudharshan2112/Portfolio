import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';

interface CharacterProps {
  char: string;
  progress: MotionValue<number>;
  range: [number, number];
}

const Character: React.FC<CharacterProps> = ({ char, progress, range }) => {
  const opacity = useTransform(progress, range, [0.2, 1]);

  return (
    <span className="relative inline-block">
      <span className="opacity-0 select-none">{char === ' ' ? '\u00A0' : char}</span>
      <motion.span style={{ opacity }} className="absolute inset-0 select-none">
        {char === ' ' ? '\u00A0' : char}
      </motion.span>
    </span>
  );
};

interface AnimatedTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedText: React.FC<AnimatedTextProps> = ({ text, className = '', style }) => {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 0.8', 'end 0.2'],
  });

  const words = text.split(' ');
  const totalCharacters = text.length;

  let globalCharIndex = 0;

  return (
    <p ref={containerRef} className={className} style={style}>
      {words.map((word, wordIndex) => {
        const characters = word.split('');
        const isLastWord = wordIndex === words.length - 1;

        return (
          <span key={wordIndex} className="inline-block whitespace-nowrap">
            {characters.map((char, charIndex) => {
              const start = globalCharIndex / totalCharacters;
              const end = (globalCharIndex + 1) / totalCharacters;
              globalCharIndex++;

              return (
                <Character
                  key={charIndex}
                  char={char}
                  progress={scrollYProgress}
                  range={[start, end]}
                />
              );
            })}
            {!isLastWord &&
              (() => {
                const spaceStart = globalCharIndex / totalCharacters;
                const spaceEnd = (globalCharIndex + 1) / totalCharacters;
                globalCharIndex++;
                return (
                  <Character
                    char=" "
                    progress={scrollYProgress}
                    range={[spaceStart, spaceEnd]}
                  />
                );
              })()}
          </span>
        );
      })}
    </p>
  );
};
