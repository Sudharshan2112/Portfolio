import React from 'react';
import { FadeIn } from '../components/FadeIn';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectItem } from '../types';

export const ProjectsSection: React.FC = () => {
  const projects: ProjectItem[] = [
    {
      id: 'sudharshan-01',
      number: '01',
      category: 'Analytics & BI · 3D Showcase',
      title: 'HR Analytics Dashboard',
      description: 'Power BI · DAX · 1,470 records modeled with promotion & retrenchment KPIs',
      liveUrl: 'https://github.com/Sudharshan2112/HR-Dashboard-Analytics',
      githubUrl: 'https://github.com/Sudharshan2112/HR-Dashboard-Analytics',
      col1Image1: '/projects/hr-dashboard/hr-action-1600.webp',
      col1Image2: '/projects/hr-dashboard/hr-detail-1600.webp',
      col2Image: '/projects/hr-dashboard/hr-home-1600.webp',
      carouselItems: [
        {
          src: '/projects/hr-dashboard/hr-home-1600.webp',
          alt: 'HR Dashboard - Home View',
          title: 'Home View',
          tag: 'Overview & Demographics',
          description:
            'Headcount (1,470), gender split (60% Male / 40% Female), service tenure distribution, job level breakdown, and distance status commute mix.',
          href: 'https://github.com/Sudharshan2112/HR-Dashboard-Analytics',
        },
        {
          src: '/projects/hr-dashboard/hr-action-1600.webp',
          alt: 'HR Dashboard - Action View',
          title: 'Action View',
          tag: 'Talent & Attrition KPIs',
          description:
            'Actionable workforce intelligence: 72 employees due for promotion (4.9%) and 117 flagged for retrenchment with named lists and departmental filters.',
          href: 'https://github.com/Sudharshan2112/HR-Dashboard-Analytics',
        },
        {
          src: '/projects/hr-dashboard/hr-detail-1600.webp',
          alt: 'HR Dashboard - Detail View',
          title: 'Detail View',
          tag: 'Department & Satisfaction',
          description:
            'Departmental distribution, job satisfaction rankings (569 High / 459 Low / 442 Medium), overtime breakdown (71.7% No / 28.3% Yes), and role compensation rates.',
          href: 'https://github.com/Sudharshan2112/HR-Dashboard-Analytics',
        },
      ],
    },
    {
      id: 'sudharshan-02',
      number: '02',
      category: 'Machine Learning · 3D Showcase',
      title: 'Flight Price Prediction',
      description: 'Python · scikit-learn · Flask · 92% cross-validated R² across 13,354 records',
      liveUrl: 'https://github.com/Sudharshan2112/Flight_Price_Prediction',
      githubUrl: 'https://github.com/Sudharshan2112/Flight_Price_Prediction',
      col1Image1: '/img/flight-classes.jpg',
      col1Image2: '/img/flight-form.jpg',
      col2Image: '/img/flight-hero.jpg',
      carouselItems: [
        {
          src: '/img/flight-hero.jpg',
          alt: 'Flight Price Prediction - Model Analytics',
          title: 'Fare Analytics & Overview',
          tag: 'Predictive Machine Learning',
          description:
            'Predictive fare modeling leveraging Random Forest & Gradient Boosting ensembles achieving 92% cross-validated R² across 13,354 flight records.',
          href: 'https://github.com/Sudharshan2112/Flight_Price_Prediction',
        },
        {
          src: '/img/flight-form.jpg',
          alt: 'Flight Price Prediction - Interactive Inference Interface',
          title: 'Interactive Inference Engine',
          tag: 'Real-time Route & Fare Estimator',
          description:
            'Production-grade Flask interface accepting multi-stop flight parameters, date/time components, and carrier classes for instantaneous price estimation.',
          href: 'https://github.com/Sudharshan2112/Flight_Price_Prediction',
        },
        {
          src: '/img/flight-classes.jpg',
          alt: 'Flight Price Prediction - Carrier & Class Analytics',
          title: 'Airline & Route Class Distribution',
          tag: 'Feature Importance & Market Segmentation',
          description:
            'In-depth feature engineering analyzing carrier premiums, departure peak surcharges, duration correlates, and seat tier price elasticities.',
          href: 'https://github.com/Sudharshan2112/Flight_Price_Prediction',
        },
      ],
    },
    {
      id: 'sudharshan-03',
      number: '03',
      category: 'Cloud & Mobile · 3D Showcase',
      title: 'Food Pantry System',
      description: 'Android · Firebase Firestore & Messaging · Google Maps location sync',
      liveUrl: 'https://github.com/Sudharshan2112/Food-Pantry/tree/master/Food%20pantry',
      githubUrl: 'https://github.com/Sudharshan2112/Food-Pantry/tree/master/Food%20pantry',
      col1Image1: '/projects/food-pantry/food-pantry-details.jpg',
      col1Image2: '/projects/food-pantry/food-pantry-request.jpg',
      col2Image: '/projects/food-pantry/food-pantry-dashboard.jpg',
      carouselItems: [
        {
          src: '/projects/food-pantry/food-pantry-dashboard.jpg',
          alt: 'Food Pantry - Recent Donations Feed',
          title: 'Recent Donations Feed',
          tag: 'Real-time Community Food Stream',
          description:
            'Live donation activity feed with donor records (Sujatha, Community Donors), distance indicators (1.2 km away), and instant Donate Food actions.',
          href: 'https://github.com/Sudharshan2112/Food-Pantry/tree/master/Food%20pantry',
          fit: 'contain',
        },
        {
          src: '/projects/food-pantry/food-pantry-details.jpg',
          alt: 'Food Pantry - Meal Item Details',
          title: 'Donation Details',
          tag: 'Itemized Food Breakdown & Expiry',
          description:
            'Transparent meal cataloging (Roti 10 pcs, Bhaji 2 kg, Sweets 1 kg, Rice 3 kg), donor trust score (4.8 ★), and precise consumption cutoff timestamps.',
          href: 'https://github.com/Sudharshan2112/Food-Pantry/tree/master/Food%20pantry',
          fit: 'contain',
        },
        {
          src: '/projects/food-pantry/food-pantry-request.jpg',
          alt: 'Food Pantry - Claim & Dispatch',
          title: 'Food Request & Dispatch',
          tag: 'Geolocation Sync & Pickup',
          description:
            'Direct Request Food pipeline connecting recipients with verified distribution hubs near Hotel Hindustan International Select, Bangalore.',
          href: 'https://github.com/Sudharshan2112/Food-Pantry/tree/master/Food%20pantry',
          fit: 'contain',
        },
      ],
    },
  ];

  return (
    <section
      id="projects"
      className="bg-[#0C0C0C] rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] -mt-10 sm:-mt-12 md:-mt-14 relative z-10 px-4 sm:px-6 md:px-10 pt-20 sm:pt-28 pb-32 overflow-hidden"
    >
      {/* Subtle Ambient Radial Glow for Shiny 3D Finish */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none opacity-25"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.25) 0%, rgba(16, 185, 129, 0.15) 35%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto mb-14 sm:mb-20 text-center relative z-10">
        {/* Heading: "Project" */}
        <FadeIn delay={0} y={30}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Interactive 3D Portfolio</span>
          </div>
          <h2
            className="hero-heading font-black uppercase text-center leading-none tracking-tight select-none"
            style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
          >
            Project
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
            Explore interactive analytics, predictive machine learning models, and production cloud systems.
          </p>
        </FadeIn>
      </div>

      {/* 3 sticky-stacking project cards */}
      <div className="max-w-6xl mx-auto flex flex-col gap-10 sm:gap-14 relative z-10">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={index}
            totalCards={projects.length}
          />
        ))}
      </div>
    </section>
  );
};
