import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { LiveProjectButton } from './LiveProjectButton';
import { DepthCarousel } from './DepthCarousel';
import { ProjectItem } from '../types';
import { Maximize2, Layers, Grid, X, ExternalLink } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectItem;
  index: number;
  totalCards: number;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  index,
  totalCards,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeView, setActiveView] = useState<'carousel' | 'grid'>('carousel');
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'start start'],
  });

  // Target scale when scrolling through sticky stack
  const targetScale = 1 - (totalCards - 1 - index) * 0.03;
  const scale = useTransform(scrollYProgress, [0, 1], [1, targetScale]);

  const stickyTop = 76 + index * 26;

  const hasCarousel = Boolean(project.carouselItems && project.carouselItems.length > 0);

  return (
    <div
      ref={containerRef}
      className="min-h-[85vh] sm:min-h-[90vh] flex items-start justify-center sticky mb-10 sm:mb-14"
      style={{
        top: `${stickyTop}px`,
      }}
    >
      <motion.div
        style={{
          scale,
          willChange: 'transform',
          transformOrigin: 'top center',
        }}
        className="w-full max-w-6xl bg-[#07090e] border border-white/[0.18] rounded-[28px] sm:rounded-[36px] md:rounded-[44px] p-4 sm:p-6 md:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_40px_rgba(6,182,212,0.1)] relative overflow-hidden transform-gpu"
      >
        {/* Shiny Top-Edge Glass Specular Line */}
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

        {/* Ambient 3D Floor Lighting */}
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full pointer-events-none opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)',
          }}
        />

        {/* Top row: Number, Category, Title, View Switcher & Live Project Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-white/[0.12] relative z-10">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Number: large shiny metallic text */}
            <span
              className="font-black bg-gradient-to-b from-white via-[#D7E2EA] to-white/30 bg-clip-text text-transparent leading-none select-none drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
              style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)' }}
            >
              {project.number}
            </span>

            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                {project.category}
              </span>
              <h3
                className="font-bold uppercase text-white tracking-tight leading-snug"
                style={{ fontSize: 'clamp(1.1rem, 2vw, 2rem)' }}
              >
                {project.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
            {/* View Switcher if carousel is available */}
            {hasCarousel && (
              <div className="flex items-center bg-white/[0.05] p-1 rounded-full border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveView('carousel')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                    activeView === 'carousel'
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                  aria-label="3D Depth Flow view"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>3D Depth Flow</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('grid')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all duration-200 ${
                    activeView === 'grid'
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                      : 'text-white/60 hover:text-white'
                  }`}
                  aria-label="Multi-View Grid"
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>Multi-View</span>
                </button>
              </div>
            )}

            <LiveProjectButton
              href={project.liveUrl}
              label="Live Project"
              showIcon
            />
          </div>
        </div>

        {/* ============================================================== */}
        {/* MAIN DISPLAY AREA: 3D Depth Carousel OR Polished Image Grid   */}
        {/* ============================================================== */}
        <div className="pt-5 sm:pt-7 relative z-10">
          {hasCarousel && activeView === 'carousel' ? (
            <div className="w-full">
              <DepthCarousel
                items={project.carouselItems!}
                initialIndex={0}
                loop={true}
                autoplay={false}
              />
            </div>
          ) : (
            /* Bottom row: High-Clarity Two-column image grid */
            <div className="grid grid-cols-1 md:grid-cols-10 gap-4 sm:gap-6 items-stretch">
              {/* Left column (40% width): 2 stacked images */}
              <div className="md:col-span-4 flex flex-col gap-4 sm:gap-6 justify-between">
                {/* Image 1 */}
                <div
                  className="group relative w-full overflow-hidden rounded-2xl bg-[#05080e] border border-white/[0.15] hover:border-cyan-400/50 transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.6)] cursor-pointer"
                  style={{
                    aspectRatio: '16 / 9.5',
                  }}
                  onClick={() =>
                    setLightboxImage({
                      src: project.col1Image1,
                      title: `${project.title} - View 1`,
                    })
                  }
                >
                  <img
                    src={project.col1Image1}
                    alt={`${project.title} preview 1`}
                    loading="lazy"
                    className="w-full h-full object-contain p-1.5 sm:p-2 group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                    style={{
                      imageRendering: '-webkit-optimize-contrast',
                    }}
                  />

                  {/* Shiny Glass Specular Sheen */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
                    }}
                  />

                  {/* Enlarge Hint */}
                  <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-white/10">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Image 2 */}
                <div
                  className="group relative w-full overflow-hidden rounded-2xl bg-[#05080e] border border-white/[0.15] hover:border-cyan-400/50 transition-all duration-300 shadow-[0_10px_25px_rgba(0,0,0,0.6)] cursor-pointer"
                  style={{
                    aspectRatio: '16 / 9.5',
                  }}
                  onClick={() =>
                    setLightboxImage({
                      src: project.col1Image2,
                      title: `${project.title} - View 2`,
                    })
                  }
                >
                  <img
                    src={project.col1Image2}
                    alt={`${project.title} preview 2`}
                    loading="lazy"
                    className="w-full h-full object-contain p-1.5 sm:p-2 group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                    style={{
                      imageRendering: '-webkit-optimize-contrast',
                    }}
                  />

                  {/* Shiny Glass Specular Sheen */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-70 transition-opacity"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
                    }}
                  />

                  {/* Enlarge Hint */}
                  <div className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-white/10">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              {/* Right column (60% width): 1 large featured image */}
              <div
                className="group relative md:col-span-6 overflow-hidden rounded-2xl bg-[#05080e] border border-white/[0.15] hover:border-cyan-400/50 transition-all duration-300 shadow-[0_15px_35px_rgba(0,0,0,0.7)] flex items-center justify-center cursor-pointer min-h-[260px] sm:min-h-[340px]"
                onClick={() =>
                  setLightboxImage({
                    src: project.col2Image,
                    title: `${project.title} - Primary View`,
                  })
                }
              >
                <img
                  src={project.col2Image}
                  alt={`${project.title} hero feature`}
                  loading="lazy"
                  className="w-full h-full object-contain p-2 sm:p-3 group-hover:scale-[1.015] transition-transform duration-500 ease-out"
                  style={{
                    imageRendering: '-webkit-optimize-contrast',
                  }}
                />

                {/* Shiny Glass Specular Sheen */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%, rgba(6,182,212,0.06) 100%)',
                  }}
                />

                {/* Enlarge Hint */}
                <div className="absolute top-3 right-3 p-1.5 sm:p-2 rounded-lg bg-black/60 backdrop-blur-md text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-white/10 flex items-center gap-1.5 text-xs">
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline font-mono">Enlarge</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ============================================================== */}
      {/* FULL-RESOLUTION LIGHTBOX MODAL FOR GRID IMAGES                 */}
      {/* ============================================================== */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-xl animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-6xl w-full max-h-[92vh] flex flex-col items-center bg-[#07090e] border border-white/20 rounded-2xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-mono font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {project.category}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white">
                  {lightboxImage.title}
                </h4>
              </div>

              <div className="flex items-center gap-2">
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <span>Live Project</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  aria-label="Close preview"
                  className="p-1.5 rounded-lg text-white/70 hover:text-white bg-white/5 hover:bg-white/15 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative w-full flex-1 flex items-center justify-center p-2 sm:p-4 overflow-auto bg-black/40">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.title}
                className="max-w-full max-h-[75vh] object-contain rounded-lg border border-white/10 shadow-2xl"
                style={{
                  imageRendering: '-webkit-optimize-contrast',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
