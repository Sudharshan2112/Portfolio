import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

interface LiveProjectButtonProps {
  label?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  showIcon?: boolean;
}

export const LiveProjectButton: React.FC<LiveProjectButtonProps> = ({
  label = 'Live Project',
  href,
  onClick,
  className = '',
  showIcon = false,
}) => {
  const buttonContent = (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`rounded-full border-2 border-[#D7E2EA] text-[#D7E2EA] font-medium uppercase tracking-widest hover:bg-[#D7E2EA]/10 transition-colors duration-200 inline-flex items-center gap-2 justify-center px-8 py-3 sm:px-10 sm:py-3.5 text-sm sm:text-base cursor-pointer ${className}`}
    >
      <span>{label}</span>
      {showIcon && <ArrowUpRight className="w-4 h-4 ml-1" />}
    </motion.button>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block no-underline"
      >
        {buttonContent}
      </a>
    );
  }

  return buttonContent;
};
