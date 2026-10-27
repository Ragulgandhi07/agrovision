import React, { useState, useEffect, useRef } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function Hero() {
  const { hero } = siteData;
  const heroRef = useRef(null);

  // Animated counters state
  const [counts, setCounts] = useState(() => {
    const initial = {};
    hero.stats.forEach((s) => {
      initial[s.id] = 0;
    });
    return initial;
  });

  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 2000;
          const startTime = performance.now();

          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const nextCounts = {};
            hero.stats.forEach((s) => {
              nextCounts[s.id] = Math.round(s.target * easeOut);
            });
            setCounts(nextCounts);

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.15 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, [hasAnimated, hero.stats]);

  const formatStatNumber = (val) => {
    return val >= 1000 ? val.toLocaleString() : val;
  };

  return (
    <section id="home" className="hero-section" ref={heroRef}>
      {/* Background with Dark Forest Overlay */}
      <div className="hero-bg-overlay" />
      <div className="hero-glow-orb" />

      <div className="container">
        {/* Main Hero Copy */}
        <div className="hero-content">
          <div className="badge badge-dark">
            <span className="badge-dot" />
            {hero.badge}
          </div>

          <h1 className="hero-title">
            AgroVision – <span>Real-Time Farm Monitoring App</span>
          </h1>

          <p className="hero-subtitle">
            {hero.subheadline}
          </p>

          {/* 3 Call-To-Action Buttons */}
          <div className="hero-ctas-triple">
            <a href="#dashboard" className="btn btn-primary">
              <Icon name="gauge" size={18} color="#ffffff" />
              {hero.ctaDashboard}
            </a>
            <a href="#weather" className="btn btn-glass">
              <Icon name="cloud-sun" size={18} color="#86efac" />
              Live Weather & GPS
            </a>
            <a href="#crop-disease" className="btn btn-glass">
              <Icon name="leaf" size={18} color="#86efac" />
              {hero.ctaCrop}
            </a>
          </div>

          {/* Quick Platform Pillars */}
          <div className="hero-trust-badges">
            <span className="trust-pill">
              <Icon name="crosshair" size={14} color="#86efac" /> Live Weather & GPS
            </span>
            <span className="trust-pill">
              <Icon name="droplets" size={14} color="#86efac" /> Soil & Field Telemetry
            </span>
            <span className="trust-pill">
              <Icon name="bell" size={14} color="#86efac" /> Smart Condition Alerts
            </span>
            <span className="trust-pill">
              <Icon name="cpu" size={14} color="#86efac" /> AI Edge Diagnostics
            </span>
          </div>
        </div>

        {/* 4 Stat Cards counting up from 0 */}
        <div className="hero-stats-wrapper">
          {hero.stats.map((item) => (
            <div key={item.id} className="hero-stat-card">
              <div className="stat-number">
                {formatStatNumber(counts[item.id] || 0)}
                {item.suffix}
              </div>
              <div className="stat-label">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
