import React, { useState } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function AICropHealth() {
  const { badge, title, subtitle, stats, sampleDetections, detectableDiseases } = siteData.aiCropHealth;
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);

  const activeDetection = sampleDetections[activeSampleIndex] || sampleDetections[0];

  return (
    <section id="crop-health" className="section crop-health-section">
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

        <div className="crop-health-grid">
          {/* Left Column: Phone Mockup Demo with Scanning Animation */}
          <div className="phone-mockup-wrap">
            <div className="phone-device">
              <div className="phone-notch" />

              <div className="phone-screen">
                {/* Camera Viewfinder */}
                <div
                  className="phone-camera-feed"
                  style={{
                    backgroundImage: activeSampleIndex === 0
                      ? `linear-gradient(180deg, rgba(6, 30, 14, 0.3) 0%, rgba(6, 30, 14, 0.75) 100%), url('https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=800&q=80')`
                      : `linear-gradient(180deg, rgba(30, 15, 6, 0.3) 0%, rgba(30, 15, 6, 0.75) 100%), url('https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80')`
                  }}
                >
                  {/* HUD Corner Reticle */}
                  <div className="scanner-hud-reticle" />

                  {/* Animated Laser Scanning Line */}
                  <div className="laser-scan-line" />

                  {/* Bounding Box on Leaf */}
                  <div className="scan-bounding-box">
                    <span className="box-hud-label">
                      AI RETICLE: {activeDetection.condition.toUpperCase()}
                    </span>
                  </div>

                  {/* Floating Result Card inside Phone */}
                  <div className="phone-result-card">
                    <div className="result-card-header">
                      <span
                        className="result-status-tag"
                        style={{
                          backgroundColor: activeDetection.id === 'healthy' ? '#16a34a' : '#ea580c'
                        }}
                      >
                        {activeDetection.status}
                      </span>
                      <span className="result-confidence">
                        Confidence {activeDetection.confidence}
                      </span>
                    </div>

                    <div className="result-crop-name">{activeDetection.crop}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#86efac' }}>
                      {activeDetection.condition}
                    </div>

                    <p className="result-desc">{activeDetection.treatment}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: '8px' }}>
                      <span>Nitrogen: {activeDetection.nitrogenLevel}</span>
                      <span>{activeDetection.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Interactive phone sample switcher buttons */}
                <div style={{ padding: '8px 12px', background: '#0b2615', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setActiveSampleIndex(0)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '8px',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeSampleIndex === 0 ? '#16a34a' : '#143e24',
                      color: '#ffffff'
                    }}
                  >
                    Healthy Leaf
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSampleIndex(1)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      borderRadius: '8px',
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                      background: activeSampleIndex === 1 ? '#ea580c' : '#143e24',
                      color: '#ffffff'
                    }}
                  >
                    Rust Sample
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 4 Stat Tiles + List of Detectable Diseases */}
          <div className="crop-health-info">
            {/* 4 Stat Tiles */}
            <div className="crop-stat-tiles">
              {stats.map((stat, idx) => (
                <div key={idx} className="crop-stat-tile">
                  <div className="crop-stat-val">{stat.value}</div>
                  <div className="crop-stat-label">{stat.label}</div>
                  <div className="crop-stat-desc">{stat.desc}</div>
                </div>
              ))}
            </div>

            {/* List of Detectable Diseases */}
            <div className="disease-catalog-box">
              <h4>Detectable Pathogens &amp; Stress Conditions</h4>
              <div className="disease-tags-list">
                {detectableDiseases.map((dis, idx) => (
                  <div key={idx} className="disease-tag-row">
                    <span className="disease-name">
                      <Icon name="leaf" size={16} color="#16a34a" />
                      {dis.name}
                    </span>
                    <div className="disease-meta">
                      <span className="disease-type-badge">{dis.type}</span>
                      <span
                        className={`disease-risk ${
                          dis.risk === 'Critical'
                            ? 'risk-critical'
                            : dis.risk === 'High'
                            ? 'risk-high'
                            : dis.risk === 'Moderate'
                            ? 'risk-moderate'
                            : 'risk-low'
                        }`}
                      >
                        {dis.risk} Risk
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
