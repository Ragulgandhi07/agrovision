import React from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function HowItWorks() {
  const { badge, title, subtitle, steps } = siteData.howItWorks;

  return (
    <section id="how-it-works" className="section how-it-works-section">
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

        {/* 5-Step Process (Horizontal on Desktop, Stacked on Mobile) */}
        <div className="steps-flow-container">
          {steps.map((step, idx) => (
            <React.Fragment key={step.stepNumber}>
              <div className="step-card">
                <span className="step-num-pill">STEP {step.stepNumber}</span>

                <div className="step-icon-wrap">
                  <Icon name={step.icon} size={24} color="#16a34a" />
                </div>

                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.description}</p>

                <div className="step-highlight-tag">
                  ★ {step.highlight}
                </div>
              </div>

              {/* Arrow Connector between steps */}
              {idx < steps.length - 1 && (
                <div className="step-arrow-connector" aria-hidden="true">
                  <Icon name="arrow-right" size={20} color="#16a34a" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
