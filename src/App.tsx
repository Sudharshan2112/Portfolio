import { useState, useEffect } from 'react';
import { HeroSection } from './sections/HeroSection';
import { MarqueeSection } from './sections/MarqueeSection';
import { AboutSection } from './sections/AboutSection';
import { ServicesSection } from './sections/ServicesSection';
import { ExperienceSection } from './sections/ExperienceSection';
import { ProjectsSection } from './sections/ProjectsSection';
import { FooterSection } from './sections/FooterSection';
import { ContactModal } from './components/ContactModal';

export function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  useEffect(() => {
    document.title = 'Sudharshan NS -- Portfolio';
  }, []);

  return (
    <div
      className="bg-[#0C0C0C] min-h-screen text-[#D7E2EA] font-kanit antialiased selection:bg-[#B600A8]/30 selection:text-white relative"
      style={{ overflowX: 'clip' }}
    >
      {/* 1. HERO SECTION */}
      <HeroSection onOpenContact={() => setIsContactOpen(true)} />

      {/* 2. MARQUEE SECTION */}
      <MarqueeSection />

      {/* 3. ABOUT SECTION */}
      <AboutSection onOpenContact={() => setIsContactOpen(true)} />

      {/* 4. SERVICES SECTION */}
      <ServicesSection />

      {/* 5. EXPERIENCE SECTION */}
      <ExperienceSection />

      {/* 6. PROJECTS SECTION */}
      <ProjectsSection />

      {/* FOOTER & CONTACT SECTION */}
      <FooterSection onOpenContact={() => setIsContactOpen(true)} />

      {/* CONTACT MODAL */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}

export default App;
