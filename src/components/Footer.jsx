import React from 'react';
import { Icon } from './Icons';

export function Footer() {
  const footerLinks1 = [
    { name: 'Home', href: '#home' },
    { name: 'Dashboard', href: '#dashboard' },
    { name: 'Crop Disease Detection', href: '#crop-disease' },
    { name: 'Wildlife Threat Detection', href: '#wildlife' },
    { name: 'Smart Irrigation', href: '#irrigation' }
  ];

  const footerLinks2 = [
    { name: 'Agricultural Weather', href: '#weather' },
    { name: 'Crop Care Library', href: '#crop-care' },
    { name: 'Detection History', href: '#history' },
    { name: 'Dossier Reports', href: '#reports' },
    { name: 'About AgroVision', href: '#about' }
  ];

  return (
    <footer className="footer-section">
      <div className="container">
        {/* Top Grid: Brand blurb + 2 link columns + Technical Specs */}
        <div className="footer-top-grid">
          {/* Brand & Mission Column */}
          <div className="footer-brand-col">
            <div className="footer-logo">
              <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
                <Icon name="sprout" size={20} color="#ffffff" />
              </div>
              <span>AgroVision<span style={{ color: 'var(--color-accent)' }}>.</span></span>
            </div>

            <p className="footer-blurb">
              AgroVision: Next-generation precision agriculture platform. Empowering farmers with AI-assisted crop health monitoring, non-harmful wildlife threat identification, and intelligent farming telemetry.
            </p>

            <div className="footer-socials">
              <a href="https://github.com/ragulgandhi07/agrovision" target="_blank" rel="noreferrer noopener" className="social-icon-btn" aria-label="GitHub Repository">
                <Icon name="github" size={16} />
              </a>
              <span className="sih-tag">SIH Smart Agriculture Project</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="footer-links-col">
            <h4>Platform Modules</h4>
            <ul className="footer-links-list">
              {footerLinks1.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools & Knowledge Column */}
          <div className="footer-links-col">
            <h4>Agronomy & Tools</h4>
            <ul className="footer-links-list">
              {footerLinks2.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.name}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Technical Specs Column */}
          <div className="footer-links-col">
            <h4>Technology Stack</h4>
            <ul className="footer-specs-list">
              <li><strong>AI Models:</strong> YOLOv8 + MobileNetV3</li>
              <li><strong>Audio:</strong> Web Audio Harmonic Chime</li>
              <li><strong>Vision:</strong> MediaDevices Camera Stream</li>
              <li><strong>IoT Ready:</strong> ESP32 LoRaWAN Gateway</li>
              <li><strong>Weather:</strong> Open-Meteo Satellite Feed</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright notice & System Status Pill */}
        <div className="footer-bottom-bar">
          <div>
            © 2026 AgroVision – Smart Farming and AI-Based Detection System. Built for college project demonstration & SIH presentation.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="footer-system-status">
              <span className="badge-dot" style={{ width: '6px', height: '6px', backgroundColor: '#22c55e' }} />
              AI Inference & Telemetry: Operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
