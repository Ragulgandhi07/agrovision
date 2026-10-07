import React from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function Footer() {
  const { brandText, blurb, columns, socials, bottomNotice } = siteData.footer;

  return (
    <footer className="footer-section">
      <div className="container">
        {/* Top Grid: Brand blurb + 3 link columns */}
        <div className="footer-top-grid">
          {/* Brand & Socials Column */}
          <div className="footer-brand-col">
            <div className="footer-logo">
              <div className="brand-icon-box" style={{ width: '36px', height: '36px' }}>
                <Icon name="sprout" size={20} color="#ffffff" />
              </div>
              <span>{brandText}<span style={{ color: 'var(--color-accent)' }}>.</span></span>
            </div>

            <p className="footer-blurb">{blurb}</p>

            <div className="footer-socials">
              {socials.map((soc) => (
                <a
                  key={soc.name}
                  href={soc.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="social-icon-btn"
                  aria-label={soc.name}
                >
                  <Icon name={soc.icon} size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* 3 Link Columns: Quick Links, Solutions, Resources */}
          {columns.map((col) => (
            <div key={col.title} className="footer-links-col">
              <h4>{col.title}</h4>
              <ul className="footer-links-list">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <a href={link.href}>{link.name}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright notice & System Status Pill */}
        <div className="footer-bottom-bar">
          <div>{bottomNotice}</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="footer-system-status">
              <span className="badge-dot" style={{ width: '6px', height: '6px' }} />
              Telemetry Sensors: 99.98% Operational
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
