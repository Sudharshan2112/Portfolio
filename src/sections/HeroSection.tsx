import React, { useState, useEffect } from 'react';
import { FadeIn } from '../components/FadeIn';
import { ContactButton } from '../components/ContactButton';
import { FocusReveal } from '../components/FocusReveal';
import { GlassTabs } from '../components/GlassTabs';
import { ArrowDownRight, Github, Linkedin, Mail, MapPin, Check, Copy, ExternalLink } from 'lucide-react';

interface HeroSectionProps {
  onOpenContact: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onOpenContact }) => {
  // Roles for keyboard typing effect
  const roles = [
    'Data Scientist',
    'AI - ML Engineer',
    'Data Analyst',
    'AI Engineer',
    'Gen AI Engineer',
    'Power-BI Developer',
  ];

  const [roleIndex, setRoleIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEmailMenuOpen, setIsEmailMenuOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  // Keyboard typing effect (typing, 2-sec pause, backspacing, cycling)
  useEffect(() => {
    const currentWord = roles[roleIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayText === currentWord) {
      // Finished typing word, hold for 2 seconds as requested
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting && displayText === '') {
      // Finished deleting word, advance to next role
      setIsDeleting(false);
      setRoleIndex((prev) => (prev + 1) % roles.length);
      timeout = setTimeout(() => {}, 300);
    } else {
      // Typing or deleting speed
      const speed = isDeleting ? 45 : 85;
      timeout = setTimeout(() => {
        setDisplayText((prev) =>
          isDeleting
            ? currentWord.substring(0, prev.length - 1)
            : currentWord.substring(0, prev.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, roleIndex, roles]);

  // Slides for left half photo
  const photos = ['/img/sudharshan-real.jpg', '/img/sudharshan-3d.png'];
  const [photoIndex, setPhotoIndex] = useState(0);

  // Photo transition every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [photos.length]);

  return (
    <section
      id="top"
      className="relative min-h-screen w-full flex flex-col md:flex-row bg-[#000000] text-white overflow-hidden select-none"
    >
      {/* ============================================================== */}
      {/* GLASS TABS TOP NAVIGATION                                      */}
      {/* ============================================================== */}
      <header className="absolute top-0 inset-x-0 z-40 flex items-center justify-end px-5 sm:px-8 md:px-14 py-5 sm:py-7 pointer-events-auto">
        <GlassTabs onOpenContact={onOpenContact} />
      </header>

      {/* ============================================================== */}
      {/* LEFT HALF: 50% Full-Bleed Photo                                */}
      {/* ============================================================== */}
      <div className="w-full md:w-1/2 h-[55vh] md:h-screen relative overflow-hidden bg-[#070709]">
        {photos.map((src, idx) => {
          const isCurrent = idx === photoIndex;
          return (
            <div
              key={src}
              className={`absolute inset-0 transition-all duration-1000 ease-out ${
                isCurrent
                  ? 'opacity-100 scale-100 z-10 pointer-events-auto'
                  : 'opacity-0 scale-105 z-0 pointer-events-none'
              }`}
            >
              <img
                src={src}
                alt="Sudharshan"
                className="w-full h-full object-cover object-top filter grayscale contrast-[1.18] brightness-[0.92]"
                style={{
                  imageRendering: '-webkit-optimize-contrast',
                }}
              />

              {/* High-fashion vignette & edge gradient */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to right, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.6) 100%), linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 35%)',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* RIGHT HALF: 50% Solid Black Editorial Section                 */}
      {/* ============================================================== */}
      <div className="w-full md:w-1/2 min-h-[45vh] md:h-screen flex flex-col justify-between p-6 sm:p-10 md:p-12 lg:p-16 xl:p-20 bg-[#000000] z-10 pt-24 sm:pt-28 md:pt-36 pb-10 sm:pb-14">
        {/* Top Information Block */}
        <FadeIn delay={0.1} y={20}>
          {/* Availability, Location & Open to Work Anywhere */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-5 text-[11px] sm:text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              Available for Hire
            </span>
            <span className="text-white/30">•</span>
            <span className="inline-flex items-center gap-1 text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Bangalore, India</span>
            </span>
            <span className="text-white/30">•</span>
            <span className="text-cyan-400 font-medium">
              Open to work Anywhere
            </span>
          </div>

          <div className="text-xs font-mono uppercase tracking-widest text-cyan-400/90 mb-2">
            MCA &bull; PES University
          </div>

          {/* KEYBOARD TYPING EFFECT TITLE (Arial Black, font size 18px) */}
          <div className="flex items-center mb-2.5">
            <h2
              className="flex items-baseline flex-wrap gap-x-2"
              style={{
                fontFamily: "'Arial Black', Arial, Gadget, sans-serif",
                fontSize: '18px',
                lineHeight: '1.4',
                letterSpacing: '-0.01em',
              }}
            >
              {/* "I'm an" in white bold font */}
              <span className="text-white font-bold">I'm an</span>

              {/* Role name in reference cyan font (#22d3ee) */}
              <span className="relative inline-flex items-center border-b-2 border-[#22d3ee] pb-0.5">
                <span className="text-[#22d3ee]">{displayText}</span>
                <span
                  className="inline-block w-[2px] h-[0.9em] bg-[#22d3ee] ml-1 animate-pulse align-middle"
                  style={{
                    boxShadow: '0 0 10px #22d3ee',
                  }}
                />
              </span>
            </h2>
          </div>

          {/* FOCUS REVEAL TEXT EFFECT FOR SHORT DESCRIPTION (Bold + Pure White Font) */}
          <div className="mt-2 mb-4 max-w-xl">
            <FocusReveal
              lines={[
                {
                  text: 'Builds and deploys [machine] [learning] and [AI] solutions using [Python], [SQL], [scikit-learn], [TensorFlow/PyTorch] and [LLMs].',
                  className: 'text-sm sm:text-base font-bold text-white leading-relaxed mb-2',
                },
                {
                  text: 'Turns raw data into decisions through [EDA], [predictive] modeling and [Power-BI] dashboards, including an HR analytics [dashboard] covering 1,470 employees.',
                  className: 'text-sm sm:text-base font-bold text-white leading-relaxed',
                },
              ]}
              blur={4}
              bracketColor="#22d3ee"
              padX={6}
              padY={2}
            />
          </div>
        </FadeIn>

        {/* Bottom Block: Explore Work & Green Contact Button on the Right */}
        <FadeIn delay={0.2} y={20} className="w-full pt-8">
          {/* Action Buttons Row: Socials on Left, Green Contact Button on the Right */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <span>Work</span>
                <ArrowDownRight className="w-3.5 h-3.5 text-cyan-400" />
              </a>

              {/* Minimalist Social Links */}
              <div className="flex items-center gap-1 text-white/50">
                <a
                  href="https://github.com/Sudharshan2112"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub Profile"
                  className="p-2 rounded-full hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://www.linkedin.com/in/sudharshan-ns-81a707224/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn Profile"
                  className="p-2 rounded-full hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Linkedin className="w-4 h-4" />
                </a>

                {/* Email Direct Selector (Google Gmail, Outlook, Copy) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsEmailMenuOpen((prev) => !prev)}
                    aria-label="Send Email to nssbhat.2002@gmail.com"
                    title="Send Email (Gmail / Outlook)"
                    className={`p-2 rounded-full transition-all duration-150 ${
                      isEmailMenuOpen
                        ? 'text-cyan-400 bg-white/15'
                        : 'hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                  </button>

                  {isEmailMenuOpen && (
                    <>
                      {/* Backdrop to close on click outside */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsEmailMenuOpen(false)}
                      />

                      {/* Floating Glass Popover */}
                      <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-[#12141a]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl z-50 text-xs">
                        <div className="px-2.5 py-1.5 border-b border-white/10 mb-1">
                          <div className="text-[10px] uppercase font-mono tracking-wider text-white/40">
                            Direct Email
                          </div>
                          <div className="text-white font-mono font-medium truncate">
                            nssbhat.2002@gmail.com
                          </div>
                        </div>

                        {/* Google Gmail */}
                        <a
                          href="https://mail.google.com/mail/?view=cm&fs=1&to=nssbhat.2002@gmail.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsEmailMenuOpen(false)}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors font-medium group"
                        >
                          <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                          <span>Google Gmail</span>
                          <ExternalLink className="w-3 h-3 ml-auto opacity-40 group-hover:opacity-100" />
                        </a>

                        {/* Outlook / Default Mail App */}
                        <a
                          href="mailto:nssbhat.2002@gmail.com"
                          onClick={() => setIsEmailMenuOpen(false)}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors font-medium group"
                        >
                          <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                          <span>Outlook / Mail App</span>
                          <ExternalLink className="w-3 h-3 ml-auto opacity-40 group-hover:opacity-100" />
                        </a>

                        {/* Copy Email Address */}
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('nssbhat.2002@gmail.com');
                            setEmailCopied(true);
                            setTimeout(() => setEmailCopied(false), 2000);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors font-medium text-left"
                        >
                          {emailCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Copied to Clipboard!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 opacity-60" />
                              <span>Copy Address</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* White Glow Box Contact Button with White-Black Shaded Ink */}
            <ContactButton
              onClick={onOpenContact}
              label="Contact Me"
              variant="white-black"
            />
          </div>
        </FadeIn>
      </div>

      {/* ============================================================== */}
      {/* SIGNATURE EVANS EFFECT: GIGANTIC OUTLINE TEXT                 */}
      {/* ============================================================== */}
      <div
        className="absolute inset-x-0 z-20 pointer-events-none select-none text-center px-1 pb-[2px]"
        style={{
          top: 'calc(50% + 100px)',
          transform: 'translateY(calc(-50% - 2px))',
        }}
      >
        <h1
          className="font-black uppercase tracking-tight leading-none whitespace-nowrap text-transparent transition-all duration-500 pb-[2px]"
          style={{
            fontFamily: "'Kanit', sans-serif",
            fontSize: 'clamp(3.2rem, 13vw, 205px)',
            WebkitTextStroke: '2px rgba(255, 255, 255, 0.95)',
            textShadow: '0 0 25px rgba(0, 0, 0, 0.9)',
            paddingBottom: '2px',
          }}
        >
          SUDHARSHAN
        </h1>
      </div>
    </section>
  );
};
