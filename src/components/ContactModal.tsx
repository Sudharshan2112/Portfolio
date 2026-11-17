import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, MapPin, Linkedin, Github, Check, Copy } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const contactItems = [
    {
      id: 'email',
      icon: Mail,
      label: 'Email',
      value: 'nssbhat.2002@gmail.com',
      actionUrl: 'mailto:nssbhat.2002@gmail.com',
      copyValue: 'nssbhat.2002@gmail.com',
    },
    {
      id: 'phone',
      icon: Phone,
      label: 'Phone',
      value: '+91 9110692112',
      actionUrl: 'tel:+919110692112',
      copyValue: '9110692112',
    },
    {
      id: 'linkedin',
      icon: Linkedin,
      label: 'LinkedIn',
      value: 'linkedin.com/in/sudharshan-ns-81a707224',
      actionUrl: 'https://www.linkedin.com/in/sudharshan-ns-81a707224/',
      copyValue: 'https://www.linkedin.com/in/sudharshan-ns-81a707224/',
    },
    {
      id: 'github',
      icon: Github,
      label: 'GitHub',
      value: 'github.com/Sudharshan2112',
      actionUrl: 'https://github.com/Sudharshan2112',
      copyValue: 'https://github.com/Sudharshan2112',
    },
    {
      id: 'location',
      icon: MapPin,
      label: 'Location',
      value: 'Bangalore, India (Open to Roles)',
      actionUrl: undefined,
      copyValue: 'Bangalore, India',
    },
  ];

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-lg bg-[#141518] border-2 border-[#D7E2EA]/30 rounded-3xl p-6 sm:p-8 z-10 shadow-2xl shadow-purple-950/40 text-[#D7E2EA]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div>
                <span className="text-xs uppercase tracking-widest text-[#B600A8] font-semibold">Get In Touch</span>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">Let&apos;s Connect</h3>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content items */}
            <div className="space-y-3.5">
              {contactItems.map((item) => {
                const Icon = item.icon;
                const isCopied = copiedKey === item.id;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#7621B0]/30 to-[#B600A8]/30 border border-white/10 shrink-0">
                        <Icon className="w-5 h-5 text-[#BBCCD7]" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] uppercase tracking-wider text-white/50">{item.label}</div>
                        {item.actionUrl ? (
                          <a
                            href={item.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm sm:text-base font-medium text-white hover:text-[#BBCCD7] transition-colors truncate block"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <div className="text-sm sm:text-base font-medium text-white truncate">{item.value}</div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.copyValue)}
                      className={`ml-3 shrink-0 px-4 py-1.5 rounded-full text-xs sm:text-[13px] font-bold tracking-wide transition-all duration-150 inline-flex items-center gap-1.5 ${
                        isCopied
                          ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                          : 'bg-black text-white hover:bg-white/15 border border-white/20 active:scale-95'
                      }`}
                      aria-label={`Copy ${item.label}`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 opacity-60" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-white/50">
                Sudharshan NS · Bangalore, India · Available for high-impact opportunities
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
