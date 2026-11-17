import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  onOpenContact: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenContact }) => {
  const [activeSection, setActiveSection] = useState<string>('hero');
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navItems = [
    { id: 'about', label: 'About', href: '#about' },
    { id: 'services', label: 'Services', href: '#services' },
    { id: 'projects', label: 'Projects', href: '#projects' },
    { id: 'contact', label: 'Contact', href: '#contact' },
  ];

  // Track scroll position for sticky header style & scroll spy
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);

      const sections = ['about', 'services', 'projects', 'contact'];
      const scrollPos = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            return;
          }
        }
      }
      if (window.scrollY < 300) {
        setActiveSection('hero');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    id: string
  ) => {
    if (id === 'contact') {
      e.preventDefault();
      onOpenContact();
      setMobileMenuOpen(false);
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <motion.header
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-all duration-300 px-4 sm:px-6 md:px-10 ${
        isScrolled ? 'pt-3 pb-3' : 'pt-5 sm:pt-7 pb-2'
      }`}
    >
      {/* Floating Frosted Glass Dock Container */}
      <div
        className={`w-full max-w-5xl mx-auto flex items-center justify-between transition-all duration-300 rounded-full px-4 py-2 sm:px-6 sm:py-2.5 ${
          isScrolled
            ? 'bg-[#121316]/85 backdrop-blur-2xl border border-white/12 shadow-[0_16px_40px_rgba(0,0,0,0.7)]'
            : 'bg-[#141518]/60 backdrop-blur-md border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
        }`}
      >
        {/* Brand / Moniker on Left */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 group no-underline"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7621B0] to-[#B600A8] flex items-center justify-center text-white font-black text-xs shadow-md shadow-purple-900/40 group-hover:scale-105 transition-transform duration-200">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-space font-bold tracking-wider text-xs sm:text-sm text-white group-hover:text-[#BBCCD7] transition-colors uppercase">
              Sudharshan
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/90 font-medium">
                Available
              </span>
            </div>
          </div>
        </a>

        {/* Center: Stylish Navigator Links with Sliding Pill (No 01, 02, etc.) */}
        <nav
          className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1.5 rounded-full border border-white/[0.08]"
          onMouseLeave={() => setHoveredSection(null)}
          aria-label="Main Navigation"
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            const isHovered = hoveredSection === item.id;

            return (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, item.id)}
                onMouseEnter={() => setHoveredSection(item.id)}
                className={`relative px-4 sm:px-5 py-1.5 rounded-full text-xs font-space font-medium uppercase tracking-wider transition-colors duration-200 select-none ${
                  isActive
                    ? 'text-white font-semibold'
                    : isHovered
                    ? 'text-white'
                    : 'text-[#D7E2EA]/75 hover:text-white'
                }`}
              >
                <span>{item.label}</span>

                {/* Sliding highlight pill */}
                {isHovered && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 bg-white/10 rounded-full border border-white/20 -z-10 shadow-sm"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Active glow dot */}
                {isActive && !isHovered && (
                  <motion.div
                    layoutId="active-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#B600A8] to-purple-400 shadow-[0_0_8px_#B600A8]"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Right Controls: Quick Contact Pill */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenContact}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-xs font-space font-semibold uppercase tracking-wider text-white transition-all duration-200 cursor-pointer shadow-lg hover:scale-105 active:scale-95"
            style={{
              background:
                'linear-gradient(123deg, #18011F 7%, #B600A8 37%, #7621B0 72%, #BE4C00 100%)',
              boxShadow: '0 0 12px rgba(182, 0, 168, 0.35)',
            }}
          >
            <span>Let&apos;s Talk</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-4 right-4 mt-2 p-4 bg-[#141518]/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl flex flex-col gap-2 z-50 text-[#D7E2EA]"
          >
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href, item.id)}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/10 transition-colors uppercase font-space font-semibold text-sm"
              >
                <span>{item.label}</span>
                <ArrowUpRight className="w-4 h-4 opacity-50" />
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
