import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { About } from './components/About';
import { Features } from './components/Features';
import { LiveDashboard } from './components/LiveDashboard';
import { SmartIrrigation } from './components/SmartIrrigation';
import { AICropHealth } from './components/AICropHealth';
import { Sustainability } from './components/Sustainability';
import { HowItWorks } from './components/HowItWorks';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { Icon } from './components/Icons';

export function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="smartfarm-app">
      {/* 1. Sticky Navbar */}
      <Navbar />

      <main>
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. About Section */}
        <About />

        {/* 4. Features Section */}
        <Features />

        {/* 5. Live Dashboard Section */}
        <LiveDashboard />

        {/* 6. Smart Irrigation Section */}
        <SmartIrrigation />

        {/* 7. AI Crop Health Section */}
        <AICropHealth />

        {/* 8. Sustainability Section */}
        <Sustainability />

        {/* 9. How It Works Section */}
        <HowItWorks />

        {/* 10. Contact Section */}
        <Contact />
      </main>

      {/* 11. Footer */}
      <Footer />

      {/* Floating Scroll to Top Pill */}
      <button
        type="button"
        className={`scroll-top-btn ${showScrollTop ? 'visible' : ''}`}
        onClick={scrollToTop}
        aria-label="Scroll to top of page"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </div>
  );
}

export default App;
