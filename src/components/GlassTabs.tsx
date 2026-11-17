import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export interface TabItem {
  id: string;
  label: string;
  href?: string;
  isAction?: boolean;
}

interface GlassTabsProps {
  tabs?: TabItem[];
  activeTab?: string;
  onSelectTab?: (id: string) => void;
  onOpenContact?: () => void;
  className?: string;
}

const DEFAULT_TABS: TabItem[] = [
  { id: 'about', label: 'About', href: '#about' },
  { id: 'services', label: 'Services', href: '#services' },
  { id: 'experience', label: 'Experience', href: '#experience' },
  { id: 'work', label: 'Work', href: '#projects' },
  { id: 'contact', label: 'Contact', isAction: true },
];

/**
 * Pure Glass Tabs Navigation (No outside enclosing box)
 * "A tab switch whose selection is a thick lens of liquid glass — it bends
 * the track under its rim, throws orbiting rainbow glints, and squeezes,
 * lands and wobbles between tabs, clearly indicating which tab is active."
 */
export const GlassTabs: React.FC<GlassTabsProps> = ({
  tabs = DEFAULT_TABS,
  activeTab: externalActiveTab,
  onSelectTab,
  onOpenContact,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<string>(externalActiveTab || tabs[0].id);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  useEffect(() => {
    if (externalActiveTab) {
      setActiveTab(externalActiveTab);
    }
  }, [externalActiveTab]);

  // Scroll spy to sync with active section as user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      const sectionIds = ['about', 'services', 'experience', 'projects'];

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveTab(id === 'projects' ? 'work' : id);
            return;
          }
        }
      }
      if (window.scrollY < 300) {
        setActiveTab('about');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (e: React.MouseEvent, tab: TabItem) => {
    if (tab.isAction) {
      e.preventDefault();
      setActiveTab(tab.id);
      if (onOpenContact) {
        onOpenContact();
      }
      return;
    }

    if (tab.href) {
      e.preventDefault();
      setActiveTab(tab.id);
      if (onSelectTab) {
        onSelectTab(tab.id);
      }
      const target = document.querySelector(tab.href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    /* NO outside enclosing box: clean borderless flex row */
    <nav
      aria-label="Navigation Tabs"
      className={`relative inline-flex items-center gap-1 sm:gap-2 pointer-events-auto select-none ${className}`}
      onMouseLeave={() => setHoveredTab(null)}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isHovered = hoveredTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={(e) => handleClick(e, tab)}
            onMouseEnter={() => setHoveredTab(tab.id)}
            className="relative px-3.5 sm:px-4 md:px-5 py-2 text-xs uppercase tracking-[0.18em] font-medium transition-colors duration-200 z-10 focus:outline-none rounded-full select-none"
          >
            {/* THICK LENS OF LIQUID GLASS for the active tab only */}
            {isActive && (
              <motion.div
                layoutId="liquid-glass-lens"
                className="absolute inset-0 rounded-full pointer-events-none z-0 overflow-hidden"
                transition={{
                  type: 'spring',
                  stiffness: 420,
                  damping: 26,
                  mass: 0.8,
                }}
                style={{
                  /* Liquid glass refraction styling */
                  background:
                    'linear-gradient(135deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.10) 45%, rgba(255, 255, 255, 0.18) 100%)',
                  backdropFilter: 'blur(16px) saturate(190%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(190%)',
                  border: '1px solid rgba(255, 255, 255, 0.45)',
                  boxShadow: `
                    inset 0 1.5px 2px rgba(255, 255, 255, 0.85),
                    inset 0 -1.5px 2px rgba(0, 0, 0, 0.35),
                    0 8px 25px rgba(0, 0, 0, 0.5),
                    0 0 16px rgba(255, 255, 255, 0.25)
                  `,
                }}
              >
                {/* Orbiting / subtle rainbow glints across the glass lens */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-45 mix-blend-color-dodge animate-pulse"
                  style={{
                    background:
                      'linear-gradient(115deg, transparent 15%, rgba(255, 90, 190, 0.35) 30%, rgba(34, 211, 238, 0.45) 50%, rgba(250, 204, 21, 0.35) 70%, transparent 88%)',
                  }}
                />

                {/* Top specular reflection rim highlight */}
                <div
                  className="absolute top-0 inset-x-2 h-[1px] rounded-full pointer-events-none opacity-90"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95) 50%, transparent)',
                  }}
                />
              </motion.div>
            )}

            {/* Subtle hover feedback for inactive tabs */}
            {!isActive && isHovered && (
              <motion.div
                layoutId="liquid-glass-hover"
                className="absolute inset-0 rounded-full bg-white/[0.06] border border-white/10 pointer-events-none z-0"
                transition={{ duration: 0.15 }}
              />
            )}

            {/* Tab Label: Stark white & bold on active tab so the user clearly knows which tab is active */}
            <span
              className={`relative z-10 transition-all duration-200 ${
                isActive
                  ? 'text-white font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                  : 'text-white/60 hover:text-white font-medium'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default GlassTabs;
