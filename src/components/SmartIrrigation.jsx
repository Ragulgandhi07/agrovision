import React, { useState } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function SmartIrrigation() {
  const { badge, title, subtitle, flowSteps, gauge, explanationSteps } = siteData.smartIrrigation;
  
  // Interactive gauge toggle / slider demo
  const [moistureLevel, setMoistureLevel] = useState(gauge.current);

  // SVG Gauge calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (moistureLevel / 100) * circumference;

  const getMoistureStatus = (val) => {
    if (val < 35) return { text: 'Water Stress • Valve Triggered', color: '#ef4444' };
    if (val > 70) return { text: 'Saturated • Valve Off', color: '#3b82f6' };
    return { text: 'Optimal Hydration', color: '#16a34a' };
  };

  const currentStatus = getMoistureStatus(moistureLevel);

  return (
    <section id="irrigation" className="section irrigation-section">
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

        {/* Visual Flow Diagram: Sensor -> Controller -> Valve -> Irrigation */}
        <div className="irrigation-flow-container">
          <div className="flow-title">Autonomous Closed-Loop Control Flow</div>

          <div className="flow-steps-grid">
            {flowSteps.map((step, idx) => (
              <React.Fragment key={step.step}>
                <div className="flow-step-card">
                  <div className="flow-step-badge">0{step.step}</div>
                  <div className="flow-step-icon">
                    <Icon name={step.icon} size={24} color="#16a34a" />
                  </div>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>

                {/* Arrow connector between cards (not on last card) */}
                {idx < flowSteps.length - 1 && (
                  <div className="flow-arrow-indicator" aria-hidden="true">
                    <Icon name="arrow-right" size={14} color="#16a34a" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Two-Column Details: Circular SVG Gauge (Left) + 4-Step Explanation (Right) */}
        <div className="irrigation-details-grid">
          {/* Circular SVG Moisture Gauge */}
          <div className="gauge-card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--color-text)' }}>
              Live Root-Zone Moisture Gauge
            </h3>

            <div className="svg-gauge-wrap">
              <svg className="svg-gauge" viewBox="0 0 220 220">
                {/* Background Ring */}
                <circle
                  className="gauge-bg-circle"
                  cx="110"
                  cy="110"
                  r={radius}
                />
                {/* Colored Fill Arc */}
                <circle
                  className="gauge-fill-circle"
                  cx="110"
                  cy="110"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  stroke={currentStatus.color}
                />
              </svg>

              <div className="gauge-center-content">
                <div className="gauge-pct">{moistureLevel}%</div>
                <div className="gauge-pct-sub">VWC Ratio</div>
              </div>
            </div>

            <div className="gauge-status-pill" style={{ color: currentStatus.color }}>
              <span className="badge-dot" style={{ backgroundColor: currentStatus.color, boxShadow: `0 0 8px ${currentStatus.color}` }} />
              {currentStatus.text}
            </div>

            <div className="gauge-substatus" style={{ marginBottom: '16px' }}>
              {gauge.substatus}
            </div>

            {/* Interactive Moisture Slider to test gauge */}
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '6px' }}>
                <span>Simulate Sensor Value:</span>
                <strong>{moistureLevel}%</strong>
              </div>
              <input
                type="range"
                min="15"
                max="90"
                value={moistureLevel}
                onChange={(e) => setMoistureLevel(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                aria-label="Simulate moisture gauge value"
              />
            </div>
          </div>

          {/* 4-Step Numbered Explanation */}
          <div className="explanation-list">
            {explanationSteps.map((step) => (
              <div key={step.number} className="explanation-item">
                <div className="step-num-bubble">{step.number}</div>
                <div className="explanation-body">
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
