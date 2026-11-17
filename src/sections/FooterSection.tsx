import React, { useState } from 'react';
import { FadeIn } from '../components/FadeIn';
import { ContactButton } from '../components/ContactButton';
import { EyeButton } from '../components/EyeButton';
import { InteractiveDataFlow } from '../components/InteractiveDataFlow';
import { Mail, Phone, Linkedin, Github, Check, Copy, ArrowUp } from 'lucide-react';

interface FooterSectionProps {
  onOpenContact: () => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ onOpenContact }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="contact" className="bg-[#0C0C0C] text-[#D7E2EA] pt-20 pb-12 px-6 md:px-10 border-t border-white/10 relative z-20">
      <div className="max-w-6xl mx-auto">
        {/* Interactive Data Flow Animation from Sudharshan's portfolio */}
        <div className="mb-14 border border-white/10 rounded-3xl p-4 sm:p-6 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs uppercase font-mono tracking-widest text-[#B600A8]">
              Interactive Pipeline
            </span>
            <span className="text-xs font-mono text-white/50">Raw Data &rarr; AI Model &rarr; Decision</span>
          </div>
          <InteractiveDataFlow />
        </div>

        {/* Main contact callout */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-16 pb-16 border-b border-white/10">
          <FadeIn delay={0.1} y={25} className="max-w-2xl">
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-none text-white mb-6">
              Turn your data into <span className="hero-heading">decisions.</span>
            </h2>
            <p className="text-base sm:text-lg text-white/70 max-w-xl font-light leading-relaxed">
              Open to collaborative data analyst, data scientist, and AI engineering roles.
              Let&apos;s build models, pipelines, and interactive digital systems that deliver real-world impact.
            </p>
          </FadeIn>

          <FadeIn delay={0.25} y={25} className="shrink-0">
            <ContactButton onClick={onOpenContact} label="Contact Me" variant="white-black" />
          </FadeIn>
        </div>

        {/* Contact Links & Quick Copy Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {/* Email */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <Mail className="w-5 h-5 text-[#BBCCD7] shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-mono uppercase text-white/40 block">Email</span>
                <a
                  href="mailto:nssbhat.2002@gmail.com"
                  className="font-medium text-white hover:text-[#BBCCD7] transition-colors truncate block"
                >
                  nssbhat.2002@gmail.com
                </a>
              </div>
            </div>
            <EyeButton copyText="nssbhat.2002@gmail.com" className="shrink-0">
              Copy
            </EyeButton>
          </div>

          {/* Phone */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <Phone className="w-5 h-5 text-[#BBCCD7] shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-mono uppercase text-white/40 block">Phone</span>
                <a
                  href="tel:+919110692112"
                  className="font-medium text-white hover:text-[#BBCCD7] transition-colors truncate block"
                >
                  +91 9110692112
                </a>
              </div>
            </div>
            <EyeButton copyText="9110692112" className="shrink-0">
              Copy
            </EyeButton>
          </div>

          {/* LinkedIn */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Linkedin className="w-5 h-5 text-[#BBCCD7]" />
              <div>
                <span className="text-xs font-mono uppercase text-white/40 block">LinkedIn</span>
                <a
                  href="https://www.linkedin.com/in/sudharshan-ns-81a707224/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-white hover:text-[#BBCCD7] transition-colors"
                >
                  linkedin.com/in/sudharshan-ns-81a707224
                </a>
              </div>
            </div>
            <a
              href="https://www.linkedin.com/in/sudharshan-ns-81a707224/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-mono border border-white/20 hover:border-white/50 hover:bg-white/10 transition-all cursor-pointer text-white/90"
            >
              Visit
            </a>
          </div>

          {/* GitHub */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Github className="w-5 h-5 text-[#BBCCD7]" />
              <div>
                <span className="text-xs font-mono uppercase text-white/40 block">GitHub</span>
                <a
                  href="https://github.com/Sudharshan2112"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-white hover:text-[#BBCCD7] transition-colors"
                >
                  github.com/Sudharshan2112
                </a>
              </div>
            </div>
            <a
              href="https://github.com/Sudharshan2112"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-mono border border-white/20 hover:border-white/50 hover:bg-white/10 transition-all cursor-pointer text-white/90"
            >
              Visit
            </a>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs font-mono text-white/50">
          <div>
            © {new Date().getFullYear()} Sudharshan NS · Data Scientist &amp; AI Creator
          </div>
          <div className="flex items-center gap-6">
            <span>Bangalore, India</span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
