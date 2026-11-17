import React from 'react';
import { FadeIn } from '../components/FadeIn';

interface ServiceItemData {
  number: string;
  name: string;
  description: string;
}

export const ServicesSection: React.FC = () => {
  const services: ServiceItemData[] = [
    {
      number: '01',
      name: 'Machine Learning & AI',
      description:
        'Creation of high-accuracy predictive models, tree-based ensembles, computer vision (94.5% YOLOv8), and regression architectures reaching up to 96% Model R² score tailored to business data.',
    },
    {
      number: '02',
      name: 'Analytics & Dashboards',
      description:
        'High-impact Power BI and Tableau dashboards with custom DAX calculations, KPI hierarchies, and multidimensional workforce & business metrics.',
    },
    {
      number: '03',
      name: 'Data Engineering & ETL',
      description:
        'Automated multi-source data extraction, cleaning, and quality monitoring pipelines across GCP and MySQL, reducing manual processing effort by 60%.',
    },
    {
      number: '04',
      name: 'Predictive Modeling',
      description:
        'Forecasting systems and regression pipelines for real-time ticket pricing, customer retention, and automated risk scoring with extensive feature engineering.',
    },
    {
      number: '05',
      name: 'LLM & Generative AI Integration',
      description:
        'Adding Claude or other LLMs to a business’s tools and workflows. Automating repetitive tasks such as report generation, email sorting or data entry, sentiment analysis, text classification and summarization.',
    },
  ];

  return (
    <section
      id="services"
      className="bg-[#FFFFFF] text-[#0C0C0C] rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32 relative z-20"
    >
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <FadeIn delay={0} y={30}>
          <h2
            className="text-[#0C0C0C] font-black uppercase text-center leading-none tracking-tight mb-16 sm:mb-20 md:mb-28"
            style={{ fontSize: 'clamp(3rem, 12vw, 160px)' }}
          >
            Services
          </h2>
        </FadeIn>

        {/* 5 Service items in vertical list */}
        <div className="flex flex-col">
          {services.map((item, i) => (
            <FadeIn
              key={item.number}
              delay={i * 0.1}
              y={25}
              className="py-8 sm:py-10 md:py-12 border-b border-[rgba(12,12,12,0.15)] first:border-t first:border-[rgba(12,12,12,0.15)] transition-colors hover:bg-black/[0.015]"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-6 sm:gap-10 md:gap-16">
                {/* Number on left */}
                <div
                  className="font-black text-[#0C0C0C] leading-none shrink-0 select-none"
                  style={{ fontSize: 'clamp(3rem, 10vw, 140px)' }}
                >
                  {item.number}
                </div>

                {/* Name + description stacked vertically on right */}
                <div className="flex flex-col gap-2.5 max-w-2xl sm:pt-2">
                  <h3
                    className="font-medium uppercase text-[#0C0C0C] tracking-tight leading-snug"
                    style={{ fontSize: 'clamp(1.2rem, 2.2vw, 2.1rem)' }}
                  >
                    {item.name}
                  </h3>
                  <p
                    className="font-light leading-relaxed text-[#0C0C0C] opacity-60"
                    style={{ fontSize: 'clamp(0.85rem, 1.6vw, 1.25rem)' }}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
