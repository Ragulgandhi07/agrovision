import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { LiveDashboard } from './components/LiveDashboard';
import { AICropHealth } from './components/AICropHealth';
import { WildlifeDetection } from './components/WildlifeDetection';
import { SmartIrrigation } from './components/SmartIrrigation';
import { WeatherMonitoring } from './components/WeatherMonitoring';
import { CropCareLibrary } from './components/CropCareLibrary';
import { DetectionHistory } from './components/DetectionHistory';
import { Reports } from './components/Reports';
import { HowItWorks } from './components/HowItWorks';
import { About } from './components/About';
import { Footer } from './components/Footer';
import { FarmerProfileModal } from './components/FarmerProfileModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';

import {
  getUserSettings,
  saveUserSettings,
  getFarmerProfile,
  saveFarmerProfile,
  getNotifications,
  markNotificationAsRead,
  clearNotifications
} from './utils/storage';
import { playMildWildlifeChime } from './utils/audioAlert';

export function App() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // User Settings State (Sound Alert, Volume)
  const [settings, setSettings] = useState(() => getUserSettings());
  const soundEnabled = settings.soundEnabled ?? true;
  const soundVolume = settings.soundVolume ?? 0.35;

  // Farmer Profile State
  const [profile, setProfile] = useState(() => getFarmerProfile());

  // Notifications State
  const [notifications, setNotifications] = useState(() => getNotifications());

  // Modals state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Trigger to synchronize counters and history across dashboard, history, and reports
  const [refreshTrigger, setRefreshTrigger] = useState(Date.now());

  // Online / Offline network listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const triggerRefresh = () => {
    setRefreshTrigger(Date.now());
    setNotifications(getNotifications());
  };

  const handleToggleSound = () => {
    const nextSettings = { ...settings, soundEnabled: !soundEnabled };
    setSettings(nextSettings);
    saveUserSettings(nextSettings);
    if (!soundEnabled) {
      playMildWildlifeChime({ volume: soundVolume, force: true });
    }
  };

  const handleChangeVolume = (newVol) => {
    const nextSettings = { ...settings, soundVolume: newVol };
    setSettings(nextSettings);
    saveUserSettings(nextSettings);
  };

  const handleSaveProfile = (newProfile) => {
    setProfile(newProfile);
    saveFarmerProfile(newProfile);
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveUserSettings(newSettings);
  };

  const handleMarkNotifRead = (id) => {
    const updated = markNotificationAsRead(id);
    setNotifications(updated);
  };

  const handleClearNotifs = () => {
    const updated = clearNotifications();
    setNotifications(updated);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="agrovision-app">
      {/* Low-Network / Offline Notification Banner */}
      {!isOnline && (
        <div className="offline-network-banner" role="alert">
          <span>⚠️ Offline Mode Active: Local agronomic cache and client-side demonstration inference operational.</span>
        </div>
      )}

      {/* 1. Sticky Navigation Bar */}
      <Navbar
        unreadCount={unreadNotifCount}
        onOpenNotifications={() => setIsNotifOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        soundEnabled={soundEnabled}
        onTestSound={() => playMildWildlifeChime({ volume: soundVolume, force: true })}
      />

      <main>
        {/* 2. Hero Section */}
        <Hero />

        {/* 3. Core Features Showcase */}
        <Features />

        {/* 4. Smart Farming Telemetry Dashboard */}
        <LiveDashboard
          refreshTrigger={refreshTrigger}
        />

        {/* 5. AI Crop Disease Detection Module */}
        <AICropHealth
          onScanSaved={triggerRefresh}
        />

        {/* 6. Advanced Wildlife Detection Module */}
        <WildlifeDetection
          soundEnabled={soundEnabled}
          soundVolume={soundVolume}
          onToggleSound={handleToggleSound}
          onChangeVolume={handleChangeVolume}
          onEventLogged={triggerRefresh}
        />

        {/* 7. Smart Irrigation Module */}
        <SmartIrrigation />

        {/* 8. Agricultural Weather Radar */}
        <WeatherMonitoring />

        {/* 9. Crop Care & Farming Guidance Library */}
        <CropCareLibrary />

        {/* 10. Unified Detection History */}
        <DetectionHistory
          refreshTrigger={refreshTrigger}
        />

        {/* 11. Farm Dossier & Report Generator */}
        <Reports />

        {/* 12. Operational Workflow & Farmer Benefits */}
        <HowItWorks />

        {/* 13. About AgroVision & SIH Architecture */}
        <About />
      </main>

      {/* 14. Global Footer */}
      <Footer />

      {/* Farmer Profile Modal */}
      <FarmerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotifRead}
        onClearAll={handleClearNotifs}
      />

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
