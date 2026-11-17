import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { AnimatedText } from '../components/AnimatedText';
import { Magnet } from '../components/Magnet';
import { GraduationCap, MapPin, Award, BrainCircuit, Network } from 'lucide-react';

interface AboutSectionProps {
  onOpenContact: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onOpenContact }) => {
  const bio =
    "I find the story in raw data, then build the model or dashboard that lets a team act on it. With a Master's in Data Analytics & Computer Science from PES University, i focus on machine learning, predictive modeling, and interactive visual systems. Let's build something incredible together!";

  return (
    <section
      id="about"
      className="relative min-h-screen flex flex-col items-center justify-center bg-[#0C0C0C] px-5 sm:px-8 md:px-10 py-20 overflow-hidden"
    >
      {/* 4 Decorative 3D Images in Corners */}

      {/* Top-left: Moon icon */}
      <FadeIn
        delay={0.1}
        x={-80}
        y={0}
        duration={0.9}
        className="absolute top-[4%] left-[1%] sm:left-[2%] md:left-[4%] z-10 pointer-events-none"
      >
        <Magnet padding={80} strength={4}>
          <img
            src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/moon_icon.11395d36.png"
            alt="3D Moon icon"
            className="w-[120px] sm:w-[160px] md:w-[210px] filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
            loading="lazy"
          />
        </Magnet>
      </FadeIn>

      {/* Bottom-left: 3D object */}
      <FadeIn
        delay={0.25}
        x={-80}
        y={0}
        duration={0.9}
        className="absolute bottom-[8%] left-[3%] sm:left-[6%] md:left-[10%] z-10 pointer-events-none"
      >
        <Magnet padding={80} strength={4}>
          <img
            src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/p59_1.4659672e.png"
            alt="3D object"
            className="w-[100px] sm:w-[140px] md:w-[180px] filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
            loading="lazy"
          />
        </Magnet>
      </FadeIn>

      {/* Top-right: Lego icon */}
      <FadeIn
        delay={0.15}
        x={80}
        y={0}
        duration={0.9}
        className="absolute top-[4%] right-[1%] sm:right-[2%] md:right-[4%] z-10 pointer-events-none"
      >
        <Magnet padding={80} strength={4}>
          <img
            src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/lego_icon-1.703bb594.png"
            alt="3D Lego icon"
            className="w-[120px] sm:w-[160px] md:w-[210px] filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
            loading="lazy"
          />
        </Magnet>
      </FadeIn>

      {/* Bottom-right: 3D group */}
      <FadeIn
        delay={0.3}
        x={80}
        y={0}
        duration={0.9}
        className="absolute bottom-[8%] right-[3%] sm:right-[6%] md:right-[10%] z-10 pointer-events-none"
      >
        <Magnet padding={80} strength={4}>
          <img
            src="https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/Group_134-1.2e04f3ce.png"
            alt="3D group"
            className="w-[130px] sm:w-[170px] md:w-[220px] filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)]"
            loading="lazy"
          />
        </Magnet>
      </FadeIn>

      {/* Main Content Container with specified gaps */}
      <div className="flex flex-col items-center justify-center text-center max-w-4xl z-20">
        {/* Heading */}
        <FadeIn delay={0} y={40}>
          <h2
            className="hero-heading font-black uppercase leading-none tracking-tight text-center"
            style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
          >
            About me
          </h2>
        </FadeIn>

        {/* Gap between heading and text: gap-10 sm:gap-14 md:gap-16 */}
        <div className="h-10 sm:h-14 md:h-16" />

        {/* Animated paragraph with character-by-character scroll opacity */}
        <div className="max-w-[560px] px-4">
          <AnimatedText
            text={bio}
            className="text-[#D7E2EA] font-medium text-center leading-relaxed"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.35rem)' }}
          />
        </div>

        {/* Highlights / Credentials */}
        <FadeIn delay={0.2} y={20} className="w-full max-w-4xl mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-left">
            {/* Location */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-1.5 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono uppercase">
                <MapPin className="w-3.5 h-3.5" />
                <span>Location</span>
              </div>
              <div className="font-semibold text-sm text-white">Bangalore, IN</div>
            </div>

            {/* Degree with complete word University */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-1.5 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-1.5 text-xs text-purple-400 font-mono uppercase">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Degree</span>
              </div>
              <div className="font-semibold text-sm text-white leading-snug">
                MCA · PES University
              </div>
            </div>

            {/* Specialization Column */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-1.5 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono uppercase">
                <Network className="w-3.5 h-3.5" />
                <span>Specialization</span>
              </div>
              <div className="font-semibold text-sm text-white leading-snug">
                Data Analytics &amp; Networks
              </div>
            </div>

            {/* AI Accuracy */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-1.5 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono uppercase">
                <BrainCircuit className="w-3.5 h-3.5" />
                <span>AI Accuracy</span>
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-sm text-white leading-tight">96% Model R² Score</div>
                <div className="text-[11px] sm:text-xs text-emerald-300 font-medium leading-tight">94.5% YOLOv8 Model</div>
              </div>
            </div>

            {/* Certifications */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-1.5 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-mono uppercase">
                <Award className="w-3.5 h-3.5" />
                <span>Certifications</span>
              </div>
              <div className="space-y-0.5">
                <div className="font-semibold text-sm text-white leading-tight">Claude Architect</div>
                <div className="text-[11px] sm:text-xs text-amber-300 font-medium leading-tight">&amp; Data Scientist</div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
