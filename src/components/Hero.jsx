import React, { useState, useEffect, useRef } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function Hero() {
  const { badge, headline, subheadline, ctaPrimary, ctaSecondary, stats } = siteData.hero;
  const heroRef = useRef(null);

  // Animated counters state: { water: 0, yield: 0, pesticide: 0, farmers: 0 }
  const [counts, setCounts] = useState(() => {
    const initial = {};
    stats.forEach((s) => {
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

          // Animate counters up from 0 to target
          const duration = 2000; // 2 seconds
          const startTime = performance.now();

          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic: 1 - pow(1 - progress, 3)
            const easeOut = 1 - Math.pow(1 - progress, 3);

            const nextCounts = {};
            stats.forEach((s) => {
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
      { threshold: 0.2 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, [hasAnimated, stats]);

  const formatStatNumber = (val) => {
    return val >= 1000 ? val.toLocaleString() : val;
  };

  return (
    <section id="home" className="hero-section" ref={heroRef}>
      {/* Background with Dark Gradient Overlay */}
      <div className="hero-bg-overlay" />
      <div className="hero-glow-orb" />

      <div className="container">
        {/* Main Hero Copy */}
        <div className="hero-content">
          <div className="badge badge-dark">
            <span className="badge-dot" />
            {badge}
          </div>

          <h1 className="hero-title">
            Transforming Agriculture with <span>AI & Precision IoT</span>
          </h1>

          <p className="hero-subtitle">
            {subheadline}
          </p>

          <div className="hero-ctas">
            <a href={ctaPrimary.href} className="btn btn-primary">
              <Icon name="gauge" size={18} color="#ffffff" />
              {ctaPrimary.text}
            </a>
            <a href={ctaSecondary.href} className="btn btn-glass">
              {ctaSecondary.text}
              <Icon name="arrow-right" size={18} color="#ffffff" />
            </a>
          </div>
        </div>

        {/* 4 Stat Cards counting up from 0 */}
        <div className="hero-stats-wrapper">
          {stats.map((item) => (
            <div key={item.id} className="hero-stat-card">
              <div className="stat-number">
                {formatStatNumber(counts[item.id] || 0)}
                {item.suffix}
              </div>
              <div className="stat-label">{item.label}</div>
              <div className="stat-desc">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
