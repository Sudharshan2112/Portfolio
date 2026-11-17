import React, { useRef } from 'react';
import { ArcWave } from '../components/ArcWave';

export const MarqueeSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="relative pt-0 pb-12 sm:pb-16 overflow-hidden select-none z-10"
    >
      {/* Seamless Continuous Neural Network Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden select-none">
        <div
          className="absolute inset-0 bg-cover bg-top opacity-90 sm:opacity-95 filter brightness-125 contrast-110"
          style={{
            backgroundImage: "url('/img/phase-bg-hd.jpg')",
          }}
        />

        {/* Precision Coordinate Dot Grid */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(rgba(187, 204, 215, 0.35) 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Ambient Subtle Cyan volumetric lighting */}
        <div className="absolute -top-10 left-1/3 w-[500px] h-[300px] bg-cyan-500/15 rounded-full blur-[130px]" />

        {/* Smooth transition into About section at bottom */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, transparent 65%, #0C0C0C 100%)',
          }}
        />
      </div>

      {/* 3D Arc Wave Carousel */}
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 relative z-10">
        <ArcWave />
      </div>
    </section>
  );
};
