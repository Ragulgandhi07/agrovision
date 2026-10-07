import React from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function Features() {
  const features = siteData.features;

  return (
    <section id="features" className="section features-section">
      <div className="container">
        <div className="section-header">
          <div className="badge">
            <span className="badge-dot" />
            Cutting-Edge Precision Agronomy
          </div>
          <h2 className="section-title">Built for Modern High-Efficiency Farms</h2>
          <p className="section-subtitle">
            From hyper-local micro-climate prediction to sub-inch root irrigation and autonomous edge vision,
            explore our modular suite of agricultural intelligence tools.
          </p>
        </div>

        {/* Responsive Grid of 8 Feature Cards */}
        <div className="features-grid">
          {features.map((feat) => (
            <div key={feat.id} className="feature-card">
              <div className="feature-header">
                <div className="feature-icon-wrapper">
                  <Icon name={feat.icon} size={24} />
                </div>
                <span className="feature-tag">{feat.tag}</span>
              </div>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-desc">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
