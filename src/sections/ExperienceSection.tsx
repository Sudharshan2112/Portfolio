import React from 'react';
import { FadeIn } from '../components/FadeIn';
import {
  Briefcase,
  Calendar,
  MapPin,
  CheckCircle2,
  Sparkles,
  Database,
  Building2,
  Cpu,
  Layers,
  ShieldCheck,
  Video,
  Activity,
} from 'lucide-react';

export const ExperienceSection: React.FC = () => {
  const metrics = [
    { label: 'YOLOv8 Vision Accuracy', value: '94.5%' },
    { label: 'Manual ETL Reduction', value: '60%' },
    { label: 'Multi-Stream Sources', value: '5+ Sources' },
    { label: 'Core Production Projects', value: '2 Projects' },
  ];

  const projects = [
    {
      title: 'Traffic Management System',
      tag: 'Computer Vision & Real-time AI',
      accuracy: '94.5% Accuracy',
      icon: <Activity className="w-5 h-5 text-cyan-400" />,
      description:
        'Directed end-to-end data gathering, mining, and processing of large-scale traffic datasets using Python and YOLOv8. Developed a production-ready traffic management system achieving 94.5% accuracy through rapid experimentation and cross-functional collaboration.',
      highlights: [
        'YOLOv8 object detection & vehicle tracking',
        'Large-scale traffic data mining & preprocessing',
        'Production-grade deployment & cross-team delivery',
      ],
      tech: ['Python', 'YOLOv8', 'Computer Vision', 'Data Mining', 'ETL'],
    },
    {
      title: 'Railways Misinformation & Fake Video Detection',
      tag: 'NLP & Semantic Analysis',
      accuracy: 'Fake vs Genuine Detection',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      description:
        'Built an NLP-based sentiment analysis system to detect fake and misleading railway-related video uploads on social media. Applied text analysis and semantic modeling to flag manipulated content, distinguishing genuine vs. fake media to support railway safety and misinformation control initiatives.',
      highlights: [
        'NLP-driven sentiment analysis & semantic modeling',
        'Automated classification of genuine vs fake video content',
        'Railway safety & public trust misinformation screening',
      ],
      tech: ['Python', 'NLP', 'Sentiment Analysis', 'Semantic Modeling', 'Text Analysis'],
    },
  ];

  const contributions = [
    'Directed end-to-end data gathering, mining, and processing of large-scale traffic datasets using Python and YOLOv8, developing a production-ready traffic management system achieving 94.5% accuracy through rapid experimentation and cross-functional collaboration.',
    'Built an NLP-based sentiment analysis system to detect fake and misleading railway-related video uploads on social media, applying text analysis and semantic modeling to flag manipulated or misinformation content.',
    'Engineered automated ETL pipelines in Python, extracting and transforming data from 5+ sources including social media and traffic data streams, creating structured data models and optimizing workflows to reduce manual effort by 60%.',
    'Applied classification and NLP techniques to distinguish genuine vs. fake video content, improving detection reliability and supporting railway safety/misinformation control initiatives.',
  ];

  const techStack = [
    'Python',
    'YOLOv8',
    'Computer Vision',
    'Natural Language Processing (NLP)',
    'Sentiment Analysis',
    'Semantic Modeling',
    'Automated ETL Pipelines',
    'Data Mining',
    'Classification',
    'Traffic Analytics',
    'Social Media Data Streams',
  ];

  return (
    <section
      id="experience"
      className="bg-[#0C0C0C] text-[#D7E2EA] px-5 sm:px-8 md:px-12 py-20 sm:py-28 relative z-20 overflow-hidden"
    >
      {/* Subtle Ambient Radial Lighting */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none opacity-20"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(34, 211, 238, 0.2) 0%, rgba(52, 211, 153, 0.15) 45%, transparent 70%)',
        }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14 sm:mb-18">
          <FadeIn delay={0} y={30}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Industry Experience</span>
            </div>
            <h2
              className="hero-heading font-black uppercase text-center leading-none tracking-tight select-none mb-4"
              style={{ fontSize: 'clamp(2.8rem, 10vw, 130px)' }}
            >
              Experience
            </h2>
            <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto font-light">
              Hands-on internship experience engineering production AI/ML systems, computer vision models, NLP sentiment pipelines, and automated ETL workflows.
            </p>
          </FadeIn>
        </div>

        {/* Livnsense GreenOps Pvt. Ltd Main Card */}
        <FadeIn delay={0.15} y={25}>
          <div className="relative group bg-[#07090e]/95 border border-white/[0.14] hover:border-cyan-400/40 rounded-3xl p-6 sm:p-8 md:p-10 shadow-[0_25px_60px_rgba(0,0,0,0.9)] transition-all duration-300">
            {/* Top Glowing Glass Accent */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent pointer-events-none" />

            {/* Header: Company, Role, Team, Duration, Location */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 pb-7 border-b border-white/10">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>AI/ML Engineering Intern</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-medium uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Data Scientist Team</span>
                  </span>
                </div>

                <div className="flex items-center gap-2.5 mt-1">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    Livnsense GreenOps Pvt. Ltd
                  </h3>
                </div>
              </div>

              {/* Date & Location Badges */}
              <div className="flex flex-wrap items-center md:flex-col md:items-end gap-2 text-xs font-mono shrink-0">
                <span className="flex items-center gap-1.5 text-cyan-300 font-semibold px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>April 2025 ~ July 2025</span>
                </span>
                <span className="flex items-center gap-1 text-gray-400 px-3 py-1 rounded-xl">
                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                  <span>Bangalore, India</span>
                </span>
              </div>
            </div>

            {/* Core Overview Summary */}
            <div className="py-6 border-b border-white/10">
              <p className="text-sm sm:text-base text-gray-200 leading-relaxed font-normal">
                Focused on <span className="text-white font-semibold">AI/ML Engineering role</span> built a <span className="text-cyan-400 font-medium">YOLOv8-based traffic management system (94.5% accuracy)</span> and an <span className="text-emerald-400 font-medium">NLP-driven sentiment analysis system</span> to detect fake railway-related video uploads on social media, utilizing automated Python ETL pipelines to reduce manual data processing by <span className="text-cyan-300 font-semibold">60%</span>.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-6 border-b border-white/10">
              {metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between"
                >
                  <span className="text-[11px] sm:text-xs text-gray-400 font-mono leading-tight">
                    {m.label}
                  </span>
                  <span className="text-lg sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-mono mt-2">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>

            {/* 2 Projects Section */}
            <div className="py-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs uppercase font-mono tracking-widest text-cyan-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Featured Internship Projects (2 Core Deliverables)</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-5 sm:p-6 rounded-2xl bg-white/[0.025] hover:bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10">
                            {proj.icon}
                          </div>
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                              {proj.tag}
                            </span>
                            <h5 className="text-base sm:text-lg font-bold text-white">
                              {proj.title}
                            </h5>
                          </div>
                        </div>
                      </div>

                      <div className="inline-block mb-3 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {proj.accuracy}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-4">
                        {proj.description}
                      </p>

                      <ul className="space-y-1.5 mb-4 text-xs text-gray-400">
                        {proj.highlights.map((h, hIdx) => (
                          <li key={hIdx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                      {proj.tech.map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/[0.04] text-gray-300 border border-white/5"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Contributions Checklist */}
            <div className="py-6 border-b border-white/10 space-y-3">
              <h4 className="text-xs uppercase font-mono tracking-widest text-emerald-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Key Responsibilities &amp; Impact</span>
              </h4>
              <ul className="space-y-3 text-xs sm:text-sm text-gray-300">
                {contributions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technologies & Skills Used */}
            <div className="pt-6">
              <span className="text-xs text-white/50 font-mono mb-3 block flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Technologies &amp; Domain Expertise:</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {techStack.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg text-xs font-mono bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border border-white/10 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
