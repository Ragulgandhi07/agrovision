import React, { useState, useEffect } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavLinkClick = () => {
    setMobileMenuOpen(false);
  };

  // Nav links to show in main header: Home, About, Features, Dashboard, Contact
  const primaryNavItems = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'Dashboard', href: '#dashboard' },
    { name: 'Contact', href: '#contact' }
  ];

  return (
    <>
      <header className={`navbar-wrapper ${isScrolled ? 'scrolled' : 'transparent'}`}>
        <div className="container navbar-inner">
          {/* Logo + Name */}
          <a href="#home" className="brand-logo" onClick={handleNavLinkClick}>
            <div className="brand-icon-box">
              <Icon name="sprout" size={22} color="#ffffff" />
            </div>
            <span className="brand-name">
              {siteData.brand.name}
              <span className="brand-dot-accent">.</span>
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav>
            <ul className="nav-desktop-links">
              {primaryNavItems.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="nav-link">
                    {item.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right Action + Hamburger */}
          <div className="nav-actions">
            <a href="#dashboard" className="btn btn-primary btn-sm btn-desktop-only">
              Live Demo
            </a>

            {/* Hamburger Button for Mobile */}
            <button
              type="button"
              className="hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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

      {/* Mobile Drawer */}
      <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        <ul className="mobile-nav-list">
          {primaryNavItems.map((item) => (
            <li key={item.name}>
              <a href={item.href} onClick={handleNavLinkClick}>
                {item.name}
              </a>
            </li>
          ))}
          <li>
            <a
              href="#dashboard"
              className="btn btn-primary btn-sm"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={handleNavLinkClick}
            >
              Explore Live Dashboard
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}
