import React from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function About() {
  const { aboutProject } = siteData;

  return (
    <section id="about" className="section about-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge">
            <span className="badge-dot" />
            Project Architecture & SIH Overview
          </div>
          <h2 className="section-title">
            AgroVision – System Architecture & Mission
          </h2>
          <p className="section-subtitle">
            Engineered for college evaluation and SIH-style innovation showcases: combining AI vision, harmless acoustics, and IoT telemetry.
          </p>
        </div>

        {/* 2-Column Pitch Overview */}
        <div className="about-overview-grid">
          {/* Problem Statement Card */}
          <div className="about-card problem-card">
            <div className="card-badge-row">
              <span className="card-tag tag-problem">Problem Statement</span>
              <Icon name="shield-alert" size={20} color="#ef4444" />
            </div>
            <h3>Dual Compounding Agricultural Hazards</h3>
            <p className="about-p">
              {aboutProject.problemStatement}
            </p>
            <div className="metric-callout">
              <strong>35%+</strong>
              <span>Average harvest loss caused by nocturnal wildlife incursions and unmanaged foliar blights</span>
            </div>
          </div>

          {/* Proposed Solution Card */}
          <div className="about-card solution-card">
            <div className="card-badge-row">
              <span className="card-tag tag-solution">Proposed Solution</span>
              <Icon name="check-circle" size={20} color="#16a34a" />
            </div>
            <h3>Unified Non-Invasive Digital Agronomy</h3>
            <p className="about-p">
              {aboutProject.proposedSolution}
            </p>
            <div className="features-mini-pills">
              <span><Icon name="camera" size={13} /> YOLOv8 Wildlife AI</span>
              <span><Icon name="leaf" size={13} /> Foliar Pathology</span>
              <span><Icon name="volume-2" size={13} /> Mild Audio Alert</span>
              <span><Icon name="droplets" size={13} /> Multi-Depth Telemetry</span>
            </div>
          </div>
        </div>

        {/* Technical Architecture Stack Grid */}
        <div className="tech-stack-container">
          <h3 className="sub-title-center">
            Full-Stack Technical Implementation
          </h3>

          <div className="tech-stack-grid">
            <div className="tech-box">
              <div className="tech-icon-wrap">
                <Icon name="globe" size={24} color="#16a34a" />
              </div>
              <h4>Frontend Ecosystem</h4>
              <p>React 18 + Vite, Modular SPA Architecture, Vanilla CSS Design System, Web Audio API chime synthesis, MediaDevices Live Camera API, Geolocation API.</p>
            </div>

            <div className="tech-box">
              <div className="tech-icon-wrap">
                <Icon name="cpu" size={24} color="#8b5cf6" />
              </div>
              <h4>AI / Computer Vision</h4>
              <p>YOLOv8 Object Detection (Trained for Wild Boars, Elephants, Deer, Monkeys) + MobileNetV3 / ResNet Foliar Pathology Classifier for early blights and rusts.</p>
            </div>

            <div className="tech-box">
              <div className="tech-icon-wrap">
                <Icon name="database" size={24} color="#0284c7" />
              </div>
              <h4>REST Backend Integration</h4>
              <p>Python FastAPI / Flask modular server with endpoints for image inference (/predict-crop, /predict-wildlife) and sensor telemetry ingestion.</p>
            </div>

            <div className="tech-box">
              <div className="tech-icon-wrap">
                <Icon name="sensor" size={24} color="#d97706" />
              </div>
              <h4>IoT Field Hardware</h4>
              <p>ESP32 low-power microcontroller + Multi-depth capacitive soil probes (10/30/60cm) + LoRaWAN 868/915MHz long-range gateway with solar battery backup.</p>
            </div>
          </div>
        </div>

        {/* Honest Limitations & Future Roadmap */}
        <div className="limitations-roadmap-grid">
          <div className="limitations-box">
            <h4>
              <Icon name="alert-triangle" size={18} color="#d97706" />
              Current Environment & Honest Demonstration State
            </h4>
            <p>
              {aboutProject.limitationsHonesty}
            </p>
          </div>

          <div className="roadmap-box">
            <h4>
              <Icon name="trending-up" size={18} color="#16a34a" />
              Future Roadmap & Field Expansion
            </h4>
            <ul className="roadmap-list">
              {aboutProject.futureRoadmap.map((r, idx) => (
                <li key={idx}>
                  <Icon name="arrow-right" size={14} color="#16a34a" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
