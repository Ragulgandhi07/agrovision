import React from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function HowItWorks() {
  const workflow = siteData.workflow;
  const benefits = siteData.benefits;

  return (
    <section id="how-it-works" className="section how-it-works-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge">
            <span className="badge-dot" />
            Operational Workflow
          </div>
          <h2 className="section-title">
            How AgroVision Operates in the Field
          </h2>
          <p className="section-subtitle">
            A continuous 4-step feedback loop: from field scouting to AI inference, gentle alerting, and precision water delivery.
          </p>
        </div>

        {/* 4 Step Workflow Grid */}
        <div className="workflow-steps-grid">
          {workflow.map((item, index) => (
            <div key={item.step} className="workflow-step-card">
              <div className="step-badge-row">
                <span className="step-number">{item.step}</span>
                <div className="step-icon-box">
                  <Icon name={item.icon} size={22} color="#16a34a" />
                </div>
              </div>
              <h3 className="step-title">{item.title}</h3>
              <p className="step-desc">{item.desc}</p>
              {index < workflow.length - 1 && <div className="step-arrow-indicator" />}
            </div>
          ))}
        </div>

        {/* Benefits Section for Farmers */}
        <div className="benefits-wrapper" style={{ marginTop: '60px' }}>
          <div className="section-header" style={{ marginBottom: '32px' }}>
            <h3 className="section-title" style={{ fontSize: '1.6rem' }}>
              Key Benefits for Farm Operators
            </h3>
            <p className="section-subtitle">
              Engineered to reduce avoidable crop loss, prevent wildlife conflict safely, and conserve vital water supplies.
            </p>
          </div>

          <div className="benefits-grid">
            {benefits.map((b, i) => (
              <div key={i} className="benefit-card">
                <div className="benefit-icon-box">
                  <Icon name={b.icon} size={24} color="#16a34a" />
                </div>
                <h4>{b.title}</h4>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA to Explore Dashboard */}
          <div className="workflow-cta-banner">
            <div>
              <h4>Ready to Monitor Your Farm Telemetry?</h4>
              <p>
                Inspect live simulated moisture telemetry, recent scan history, and active alert channels.
              </p>
            </div>
            <a href="#dashboard" className="btn btn-primary">
              <Icon name="gauge" size={18} />
              Explore Farming Dashboard
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
