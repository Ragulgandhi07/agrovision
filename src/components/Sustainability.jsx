import React, { useState, useEffect, useRef } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function Sustainability() {
  const { badge, title, subtitle, cards, ctaCard } = siteData.sustainability;
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section id="sustainability" className="section sustainability-section" ref={sectionRef}>
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge">
            <span className="badge-dot" />
            {badge}
          </div>
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>

        {/* Grid of Sustainability Cards + CTA Card */}
        <div className="sustainability-grid">
          {cards.map((card) => (
            <div key={card.id} className="sustain-card">
              <div className="sustain-card-top">
                <div className="sustain-icon-wrap">
                  <Icon name={card.icon} size={24} color="#16a34a" />
                </div>
                <div className="sustain-pct">
                  {card.value}{card.suffix}
                </div>
              </div>

              <h3 className="sustain-title">{card.title}</h3>
              <p className="sustain-desc">{card.description}</p>

              {/* Animated Progress Bar */}
              <div className="sustain-bar-track">
                <div
                  className="sustain-bar-fill"
                  style={{
                    width: isVisible ? `${card.value}%` : '0%'
                  }}
                />
              </div>

              <div className="sustain-metric-label">{card.metric}</div>
            </div>
          ))}

          {/* 6th Card: CTA Card */}
          <div className="sustain-cta-card">
            <div>
              <span className="badge badge-dark" style={{ marginBottom: '14px' }}>
                <span className="badge-dot" />
                {ctaCard.badge}
              </span>
              <h3>{ctaCard.title}</h3>
              <p>{ctaCard.description}</p>
            </div>

            <a href={ctaCard.href} className="btn btn-accent">
              {ctaCard.buttonText}
              <Icon name="arrow-right" size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
