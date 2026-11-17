import React from 'react';
import { InkButton } from './InkButton';

export interface ContactButtonProps {
  label?: string;
  onClick?: () => void;
  href?: string;
  className?: string;
  /** Color theme variant: 'white-black' (default white glow with white-black shaded gradient), 'green', 'cyan', or 'violet' */
  variant?: 'white-black' | 'black-glow' | 'green' | 'cyan' | 'violet';
}

/**
 * Signature ContactButton.
 * Features a white glow with viscous ink button effects and white-black shaded gradient,
 * high-contrast glass border, and luminous white halo aura.
 */
export const ContactButton: React.FC<ContactButtonProps> = ({
  label = 'Contact Me',
  onClick,
  href,
  className = '',
  variant = 'white-black',
}) => {
  const isCyan = variant === 'cyan';
  const isViolet = variant === 'violet';
  const isGreen = variant === 'green';

  // White-black shaded gradient matching the user's high-fashion monochrome specification
  const gradient = isCyan
    ? 'linear-gradient(135deg, #38BDF8 0%, #06B6D4 35%, #2563EB 75%, #1D4ED8 100%)'
    : isViolet
    ? 'linear-gradient(135deg, #C084FC 0%, #9333EA 35%, #6366F1 75%, #3B82F6 100%)'
    : isGreen
    ? 'linear-gradient(135deg, #34D399 0%, #10B981 35%, #059669 75%, #047857 100%)'
    : 'linear-gradient(135deg, #3A3A3C 0%, #1C1C1E 45%, #000000 90%)';

  // Luminous pure white glow
  const glow = isCyan
    ? 'rgba(6, 182, 212, 0.85)'
    : isViolet
    ? 'rgba(168, 85, 247, 0.85)'
    : isGreen
    ? 'rgba(52, 211, 153, 0.85)'
    : 'rgba(255, 255, 255, 0.95)';

  // Viscous ink strands shaded in white, silver, and black tones
  const strandColors = isCyan
    ? ['#38BDF8', '#06B6D4', '#2563EB', '#1D4ED8']
    : isViolet
    ? ['#C084FC', '#9333EA', '#6366F1', '#3B82F6']
    : isGreen
    ? ['#34D399', '#10B981', '#059669', '#047857']
    : ['#FFFFFF', '#E4E4E7', '#A1A1AA', '#27272A', '#FFFFFF'];

  // Button surface: white-black shaded with brilliant white glow & specular rim
  const buttonBorderShadow = isCyan
    ? 'border border-cyan-300/50 shadow-[0_0_24px_rgba(6,182,212,0.65),0_0_48px_rgba(37,99,235,0.4),inset_0_1px_3px_rgba(255,255,255,0.45)] text-white font-space font-bold'
    : isViolet
    ? 'border border-purple-300/50 shadow-[0_0_24px_rgba(168,85,247,0.65),0_0_48px_rgba(99,102,241,0.4),inset_0_1px_3px_rgba(255,255,255,0.45)] text-white font-space font-bold'
    : isGreen
    ? 'border border-emerald-400/50 shadow-[0_0_24px_rgba(52,211,153,0.65),0_0_48px_rgba(16,185,129,0.4),inset_0_1px_3px_rgba(255,255,255,0.45)] text-white font-space font-bold'
    : 'bg-gradient-to-b from-[#2E2E32] via-[#141416] to-[#040405] border border-white/50 hover:border-white shadow-[0_0_25px_rgba(255,255,255,0.65),0_0_50px_rgba(255,255,255,0.32),inset_0_1px_2px_rgba(255,255,255,0.85)] text-white font-space font-bold transition-all duration-300 hover:shadow-[0_0_35px_rgba(255,255,255,0.95),0_0_75px_rgba(255,255,255,0.5),inset_0_1px_3px_rgba(255,255,255,1)]';

  return (
    <InkButton
      label={label}
      onClick={onClick}
      href={href}
      className={className}
      color="brand-gradient"
      backgroundGradient={gradient}
      strandColors={strandColors}
      glowColor={glow}
      enableGlow={true}
      strandCount={5}
      maxStretch={220}
      buttonClassName={buttonBorderShadow}
    />
  );
};

export default ContactButton;
