import React from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function About() {
  const { badge, title, subtitle, description, checklist, cards } = siteData.about;

  return (
    <section id="about" className="section about-section">
      <div className="container">
        <div className="about-grid">
          {/* Left Column: Descriptive copy + checklist */}
          <div className="about-copy">
            <div>
              <div className="badge">
                <span className="badge-dot" />
                {badge}
              </div>
              <h2 className="section-title">{title}</h2>
              <p className="section-subtitle" style={{ marginBottom: '16px' }}>
                {subtitle}
              </p>
              <p>{description}</p>
            </div>

            {/* Checklist */}
            <ul className="about-checklist">
              {checklist.map((item, idx) => (
                <li key={idx} className="about-check-item">
                  <div className="check-icon-circle">
                    <Icon name="check" size={14} color="#16a34a" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div style={{ marginTop: '12px' }}>
              <a href="#features" className="btn btn-secondary btn-sm">
                Explore Full Tech Suite
                <Icon name="arrow-right" size={16} />
              </a>
            </div>
          </div>

          {/* Right Column: Stack of 3 Icon Cards */}
          <div className="about-cards-stack">
            {cards.map((card, idx) => (
              <div key={idx} className="about-icon-card">
                <div className="about-icon-box">
                  <Icon name={card.icon} size={26} color="#16a34a" />
                </div>
                <div className="about-card-body">
                  <h3>
                    <span>{card.title}</span>
                    <span className="about-mini-badge">{card.badge}</span>
                  </h3>
                  <p>{card.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
