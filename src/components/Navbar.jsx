import React, { useState, useEffect } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function Navbar({
  unreadCount,
  onOpenNotifications,
  onOpenProfile,
  soundEnabled,
  onTestSound
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState(window.location.hash || '#home');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    const handleHash = () => {
      setActiveHash(window.location.hash || '#home');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', handleHash);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  const handleNavLinkClick = (href) => {
    if (href) setActiveHash(href);
    setMobileMenuOpen(false);
  };

  const navItems = siteData.navItems;

  return (
    <>
      <header className={`navbar-wrapper ${isScrolled ? 'scrolled' : 'transparent'}`}>
        <div className="container navbar-inner">
          {/* Logo + Name */}
          <a href="#home" className="brand-logo" onClick={() => handleNavLinkClick('#home')}>
            <div className="brand-icon-box">
              <Icon name="sprout" size={22} color="#ffffff" />
            </div>
            <div className="brand-text-col">
              <span className="brand-name">
                {siteData.brand.name}
                <span className="brand-dot-accent">.</span>
              </span>
              <span className="brand-tagline-sub">Smart Farming & AI</span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav" aria-label="Main Navigation">
            <ul className="nav-desktop-links">
              {navItems.map((item) => {
                const isActive = activeHash === item.href;
                return (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      className={`nav-link ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavLinkClick(item.href)}
                    >
                      {item.label}
                      {isActive && <span className="nav-active-pill" />}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="nav-actions">
            {/* Quick Camera Access Button */}
            <a
              href="#wildlife"
              className="nav-camera-quick-btn"
              title="Open Surveillance & Camera Scanners"
              aria-label="Open Camera Scanners"
              onClick={() => handleNavLinkClick('#wildlife')}
            >
              <Icon name="camera" size={17} />
              <span className="nav-cam-text">Camera</span>
            </a>

            {/* Notification Bell with Badge */}
            <button
              type="button"
              className="nav-icon-btn notif-btn"
              onClick={onOpenNotifications}
              title="Alert Notifications"
              aria-label="View notifications"
            >
              <Icon name="bell" size={18} />
              {unreadCount > 0 && (
                <span className="nav-badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>

            {/* Farmer Profile Button */}
            <button
              type="button"
              className="nav-icon-btn profile-btn"
              onClick={onOpenProfile}
              title="Farmer Profile & Settings"
              aria-label="Farmer profile"
            >
              <Icon name="user" size={18} />
            </button>

            {/* Wildlife AI Presentation CTA */}
            <a href="#wildlife" className="btn btn-primary btn-sm btn-desktop-only" onClick={() => handleNavLinkClick('#wildlife')}>
              <Icon name="shield-alert" size={16} />
              Wildlife AI
            </a>

            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      <div
        className={`mobile-nav-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`} aria-hidden={!mobileMenuOpen}>
        <div className="mobile-drawer-header">
          <div className="mobile-brand">
            <div className="brand-icon-box" style={{ width: '32px', height: '32px' }}>
              <Icon name="sprout" size={18} color="#ffffff" />
            </div>
            <div className="brand-text-col">
              <span className="brand-name" style={{ fontSize: '1.1rem' }}>AgroVision</span>
              <span className="brand-tagline-sub">Smart Farming & AI</span>
            </div>
          </div>
          <button
            type="button"
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="x" size={20} />
          </button>
        </div>

        <ul className="mobile-nav-list">
          {navItems.map((item) => {
            const isActive = activeHash === item.href;
            return (
              <li key={item.id}>
                <a
                  href={item.href}
                  className={isActive ? 'active' : ''}
                  onClick={() => handleNavLinkClick(item.href)}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="active-dot" />}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="mobile-drawer-actions">
          <a
            href="#crop-disease"
            className="btn btn-outline btn-sm full-width"
            onClick={() => handleNavLinkClick('#crop-disease')}
            style={{ marginBottom: '8px' }}
          >
            <Icon name="camera" size={16} />
            Crop Foliage Scanner
          </a>

          <a
            href="#wildlife"
            className="btn btn-primary btn-sm full-width"
            onClick={() => handleNavLinkClick('#wildlife')}
            style={{ marginBottom: '8px' }}
          >
            <Icon name="shield-alert" size={16} />
            Launch Wildlife Camera
          </a>

          <button
            type="button"
            className="btn btn-glass btn-sm full-width"
            onClick={() => {
              onOpenProfile();
              setMobileMenuOpen(false);
            }}
          >
            <Icon name="user" size={16} />
            Farmer Profile & Settings
          </button>
        </div>
      </div>
    </>
  );
}
