import React from 'react';
import { Icon } from './Icons';

export function Features() {
  const featureCards = [
    {
      id: 'crop-disease',
      icon: 'leaf',
      title: 'AI Crop Disease Detection',
      desc: 'Instant foliar image analysis for blights, rusts, and leaf spots with actionable bio-organic care instructions.',
      tag: 'Computer Vision',
      link: '#crop-disease'
    },
    {
      id: 'wildlife-detection',
      icon: 'shield-alert',
      title: 'Wildlife Threat Identification',
      desc: 'Perimeter monitoring for wild boars, elephants, and deer with mild two-tone alerts and safe farmer guidance.',
      tag: 'Perimeter Security',
      link: '#wildlife'
    },
    {
      id: 'smart-irrigation',
      icon: 'droplets',
      title: 'Precision Smart Irrigation',
      desc: 'Multi-depth soil moisture telemetry (10, 30, 60cm) with automated micro-valve scheduling to eliminate leaching.',
      tag: 'IoT Telemetry',
      link: '#irrigation'
    },
    {
      id: 'weather-monitoring',
      icon: 'cloud-sun',
      title: 'Agricultural Weather Radar',
      desc: 'Hyper-local temperature, rainfall, and wind tracking with agricultural spraying and frost advisories.',
      tag: 'Open-Meteo Integration',
      link: '#weather'
    },
    {
      id: 'crop-care',
      icon: 'sprout',
      title: 'Crop Care & Guidance Library',
      desc: 'Comprehensive agronomy database covering growth stages, fertilizer balance, and non-harmful wildlife deterrents.',
      tag: 'Agronomy DB',
      link: '#crop-care'
    },
    {
      id: 'reports',
      icon: 'file-text',
      title: 'Farm Logs & Incident Reports',
      desc: 'Export print-ready inspection sheets and CSV telemetry data for agricultural extension officers and KVK visits.',
      tag: 'Audit Ready',
      link: '#reports'
    }
  ];

  return (
    <section id="features" className="section features-section">
      <div className="container">
        <div className="section-header">
          <div className="badge">
            <span className="badge-dot" />
            Core Capabilities
          </div>
          <h2 className="section-title">
            Integrated Smart Agriculture Architecture
          </h2>
          <p className="section-subtitle">
            Bridging computer vision foliage diagnostics, wildlife perimeter protection, and root-zone IoT telemetry into an accessible platform.
          </p>
        </div>

        <div className="features-grid">
          {featureCards.map((feat) => (
            <a key={feat.id} href={feat.link} className="feature-card interactive-card">
              <div className="feature-icon-wrap">
                <Icon name={feat.icon} size={24} color="#16a34a" />
              </div>
              <span className="feature-tag">{feat.tag}</span>
              <h3 className="feature-title">{feat.title}</h3>
              <p className="feature-description">{feat.desc}</p>
              <div className="feature-link-row">
                <span>Launch Feature</span>
                <Icon name="arrow-right" size={16} />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
