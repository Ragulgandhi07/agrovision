import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from './Icons';
import { getWildlifeHistory, getCropHistory } from '../utils/storage';
import {
  handleImageFallback,
  DEFAULT_CROP_IMAGE,
  DEFAULT_WILDLIFE_IMAGE,
  getWildlifeSpeciesImage
} from '../utils/imageFallbacks';
import { fetchLiveWeather } from '../utils/geoWeather';

export function LiveDashboard({ refreshTrigger }) {
  // Sector and telemetry states
  const [activeSector, setActiveSector] = useState('Sector 2B • Tomato Polyhouse');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Synchronizing live telemetry...');
  const [weatherLive, setWeatherLive] = useState(null);

  // Dynamic counts loaded from storage
  const [cropScans, setCropScans] = useState([]);
  const [wildlifeEvents, setWildlifeEvents] = useState([]);

  // Telemetry metrics
  const [telemetry, setTelemetry] = useState({
    soilMoisture: 42,
    soilTemp: 26.4,
    ambientTemp: 29.0,
    humidity: 64,
    waterReserve: 84,
    condition: 'Partly Cloudy',
    precipitation: 0.0,
    valveState: 'Auto-Standby'
  });

  // Sector coordinates mapping for real weather fetch
  const sectorCoords = {
    'Sector 1A • Paddy East': { lat: 10.787, lon: 79.1378, name: 'Paddy East (Thanjavur)' },
    'Sector 2B • Tomato Polyhouse': { lat: 11.0168, lon: 76.9558, name: 'Tomato Polyhouse (Coimbatore)' },
    'Sector 3C • Sugarcane Block': { lat: 9.9252, lon: 78.1198, name: 'Sugarcane Block (Madurai)' },
    'Sector 4D • Banana Grove': { lat: 11.6643, lon: 78.146, name: 'Banana Grove (Salem)' }
  };

  // Sync real Open-Meteo weather for the active sector
  const syncLiveWeather = useCallback(async (sectorKey, force = false) => {
    const coords = sectorCoords[sectorKey] || { lat: 10.787, lon: 79.1378 };
    try {
      const live = await fetchLiveWeather(coords.lat, coords.lon, force);
      setWeatherLive(live);
      setTelemetry((prev) => ({
        ...prev,
        ambientTemp: live.temp,
        humidity: live.humidity,
        condition: live.condition,
        precipitation: live.precipitation
      }));
      setLastUpdated(`Synced at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      console.warn('Dashboard weather sync notice:', err.message);
      setLastUpdated(`Offline Telemetry Cache (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`);
    }
  }, []);

  // Load latest scans and wildlife events from storage and sync weather
  useEffect(() => {
    const updateDashboardData = () => {
      setCropScans(getCropHistory());
      setWildlifeEvents(getWildlifeHistory());
    };
    updateDashboardData();
    syncLiveWeather(activeSector);

    window.addEventListener('storage', updateDashboardData);
    return () => window.removeEventListener('storage', updateDashboardData);
  }, [refreshTrigger, activeSector, syncLiveWeather]);

  // Refresh handler that fetches live weather and updates storage
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setCropScans(getCropHistory());
    setWildlifeEvents(getWildlifeHistory());

    await syncLiveWeather(activeSector, true);

    // Minor fluctuation for simulated capacitive probe readings
    setTelemetry((prev) => ({
      ...prev,
      soilMoisture: Math.round(38 + Math.random() * 18),
      soilTemp: parseFloat((25.0 + Math.random() * 3).toFixed(1)),
      waterReserve: Math.round(76 + Math.random() * 16),
      valveState: Math.random() > 0.5 ? 'Active Micro-Drip' : 'Auto-Standby'
    }));

    setIsRefreshing(false);
  };

  const totalCropScansCount = cropScans.length;
  const totalWildlifeCount = wildlifeEvents.length;

  return (
    <section id="dashboard" className="section dashboard-section">
      <div className="container">
        {/* Dashboard Top Header Bar */}
        <div className="dashboard-header-bar">
          <div>
            <div className="badge">
              <span className="badge-dot" />
              Smart Farming Dashboard
            </div>
            <h2 className="dashboard-title">
              Farm Telemetry & Threat Surveillance
            </h2>
            <p className="dashboard-subtitle">
              Live satellite weather telemetry, simulated multi-depth soil probe data, and edge AI intrusion logs.
            </p>
          </div>

          <div className="dashboard-actions-group">
            {/* Sector Selector */}
            <select
              value={activeSector}
              onChange={(e) => setActiveSector(e.target.value)}
              className="sector-select"
            >
              <option value="Sector 1A • Paddy East">Sector 1A • Paddy East (Cauvery Delta)</option>
              <option value="Sector 2B • Tomato Polyhouse">Sector 2B • Tomato Polyhouse (Coimbatore)</option>
              <option value="Sector 3C • Sugarcane Block">Sector 3C • Sugarcane Block (Madurai)</option>
              <option value="Sector 4D • Banana Grove">Sector 4D • Banana Grove (Salem)</option>
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              id="dashboard-refresh-btn"
              className={`btn btn-outline btn-sm ${isRefreshing ? 'loading' : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <Icon name="refresh" size={16} className={isRefreshing ? 'spin' : ''} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh Telemetry'}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Status Banner (Honest Live API vs Simulated Hardware Notice) */}
        <div className="telemetry-banner-notice">
          <div className="telemetry-badge-pulse">
            <span className="live-dot" />
            <span className="telemetry-mode-text">
              <strong>Telemetry Status:</strong> Live Open-Meteo Weather Active • Soil Telemetry in Simulated Demo Mode (Physical ESP32 Gateway Standby)
            </span>
          </div>
          <span className="last-sync-time">{lastUpdated}</span>
        </div>

        {/* Top 4 Key Metric Cards */}
        <div className="dashboard-kpi-grid">
          {/* Card 1: Total Crop Scans */}
          <div className="kpi-card">
            <div className="kpi-icon-wrap bg-green-subtle">
              <Icon name="leaf" size={22} color="#16a34a" />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Total Crop Scans</span>
              <div className="kpi-value-row">
                <span className="kpi-value">{totalCropScansCount}</span>
                <span className="kpi-tag positive">Logged</span>
              </div>
              <span className="kpi-desc">Saved foliage pathogen diagnostics</span>
            </div>
          </div>

          {/* Card 2: Total Wildlife Events */}
          <div className="kpi-card">
            <div className="kpi-icon-wrap bg-amber-subtle">
              <Icon name="shield-alert" size={22} color="#d97706" />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Wildlife Detection Events</span>
              <div className="kpi-value-row">
                <span className="kpi-value">{totalWildlifeCount}</span>
                <span className="kpi-tag warning">Monitored</span>
              </div>
              <span className="kpi-desc">Perimeter elephant & wildlife incidents</span>
            </div>
          </div>

          {/* Card 3: Soil Moisture */}
          <div className="kpi-card">
            <div className="kpi-icon-wrap bg-blue-subtle">
              <Icon name="droplets" size={22} color="#0284c7" />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Root-Zone Moisture (30cm)</span>
              <div className="kpi-value-row">
                <span className="kpi-value">{telemetry.soilMoisture}%</span>
                <span className={`kpi-tag ${telemetry.soilMoisture < 35 ? 'danger' : 'positive'}`}>
                  {telemetry.soilMoisture < 35 ? 'Low' : 'Optimal'}
                </span>
              </div>
              <span className="kpi-desc">Capacitive probe (Simulated Feed)</span>
            </div>
          </div>

          {/* Card 4: Water Reserve & Valve */}
          <div className="kpi-card">
            <div className="kpi-icon-wrap bg-purple-subtle">
              <Icon name="valve" size={22} color="#8b5cf6" />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Micro-Valve Controller</span>
              <div className="kpi-value-row">
                <span className="kpi-value" style={{ fontSize: '1.15rem', paddingTop: '4px' }}>
                  {telemetry.valveState}
                </span>
              </div>
              <span className="kpi-desc">Storage reserve: {telemetry.waterReserve}% (Simulated)</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="dashboard-quick-actions">
          <span className="qa-label">Quick Actions:</span>
          <div className="qa-buttons">
            <a href="#crop-disease" className="qa-btn">
              <Icon name="scan" size={16} />
              Analyze Crop Leaf
            </a>
            <a href="#wildlife" className="qa-btn qa-btn-warning">
              <Icon name="camera" size={16} />
              Launch Wildlife Cam
            </a>
            <a href="#irrigation" className="qa-btn">
              <Icon name="droplet" size={16} />
              Inspect Irrigation
            </a>
            <a href="#reports" className="qa-btn">
              <Icon name="file-text" size={16} />
              Export Farm Report
            </a>
          </div>
        </div>

        {/* Main Grid: Recent Wildlife Events & Recent Crop Detections */}
        <div className="dashboard-two-col-grid">
          {/* Left Column: Recent Wildlife Detection Incidents */}
          <div className="dash-panel-card">
            <div className="dash-panel-header">
              <div className="dash-panel-title">
                <Icon name="shield-alert" size={18} color="#d97706" />
                <h3>Recent Wildlife Detection Events</h3>
              </div>
              <a href="#wildlife" className="panel-link">
                View Module →
              </a>
            </div>

            <div className="dash-events-list">
              {wildlifeEvents.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8' }}>
                  <Icon name="shield-alert" size={26} color="#d97706" />
                  <p style={{ margin: '8px 0 0', fontSize: '0.88rem' }}>
                    No wildlife detection events logged yet. Upload or scan an image in Wildlife Detection.
                  </p>
                </div>
              ) : (
                wildlifeEvents.slice(0, 3).map((w) => (
                  <div key={w.id} className="dash-event-item">
                    <img
                      src={w.thumbnail || getWildlifeSpeciesImage(w.speciesCommon || w.species)}
                      alt={w.species}
                      className="event-thumb"
                      onError={(e) => handleImageFallback(e, 'wildlife', w.speciesCommon || w.species)}
                    />
                    <div className="event-info">
                      <div className="event-title-row">
                        <span className="event-name">{w.speciesCommon || w.species}</span>
                        <span className={`threat-badge ${w.threatLevel?.toLowerCase() || 'medium'}`}>
                          {w.threatLevel || 'Medium'} Threat
                        </span>
                      </div>
                      <div className="event-meta">
                        <span>{w.location}</span> • <span>{w.timestamp}</span>
                      </div>
                      <div className="event-confidence">
                        Confidence: <strong>{w.confidence}</strong> ({w.source})
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Recent Crop Health Results */}
          <div className="dash-panel-card">
            <div className="dash-panel-header">
              <div className="dash-panel-title">
                <Icon name="leaf" size={18} color="#16a34a" />
                <h3>Recent Crop Disease Detections</h3>
              </div>
              <a href="#crop-disease" className="panel-link">
                View Module →
              </a>
            </div>

            <div className="dash-events-list">
              {cropScans.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8' }}>
                  <Icon name="leaf" size={26} color="#16a34a" />
                  <p style={{ margin: '8px 0 0', fontSize: '0.88rem' }}>
                    No crop scans logged yet. Upload a leaf photo to diagnose symptoms.
                  </p>
                </div>
              ) : (
                cropScans.slice(0, 3).map((c) => (
                  <div key={c.id} className="dash-event-item">
                    <img
                      src={c.image || DEFAULT_CROP_IMAGE}
                      alt={c.crop}
                      className="event-thumb"
                      onError={(e) => handleImageFallback(e, 'crop')}
                    />
                    <div className="event-info">
                      <div className="event-title-row">
                        <span className="event-name">{c.crop} – {c.condition}</span>
                        <span className={`status-pill ${c.status === 'Healthy' ? 'status-good' : 'status-warn'}`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="event-meta">
                        <span>{c.timestamp}</span> • <span>Confidence: {c.confidence}</span>
                      </div>
                      <p className="event-snippet">{c.treatment}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 7-Day Soil Moisture & Live Weather Preview Bar */}
        <div className="dash-bottom-summary-card">
          <div className="moisture-chart-wrap">
            <h4>7-Day Root-Zone Soil Moisture Trend (%) • Capacitive Simulation</h4>
            <div className="moisture-bars">
              {[
                { day: 'Mon', val: 45, status: 'Optimal' },
                { day: 'Tue', val: 42, status: 'Optimal' },
                { day: 'Wed', val: 34, status: 'Irrigated' },
                { day: 'Thu', val: 56, status: 'Good' },
                { day: 'Fri', val: 51, status: 'Optimal' },
                { day: 'Sat', val: 46, status: 'Optimal' },
                { day: 'Sun (Today)', val: telemetry.soilMoisture, status: 'Current' }
              ].map((bar, idx) => (
                <div key={idx} className="bar-col">
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${bar.val < 38 ? 'bar-low' : 'bar-good'}`}
                      style={{ height: `${bar.val}%` }}
                    />
                  </div>
                  <span className="bar-pct">{bar.val}%</span>
                  <span className="bar-day">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dash-weather-compact">
            <h4>Live Satellite Weather (Open-Meteo)</h4>
            <div className="weather-compact-row">
              <Icon name="sun" size={32} color="#f59e0b" />
              <div>
                <span className="wc-temp">{telemetry.ambientTemp}°C</span>
                <span className="wc-condition">{telemetry.condition}</span>
              </div>
            </div>
            <div className="wc-details">
              <span>Relative Humidity: {telemetry.humidity}%</span>
              <span>Precipitation: {telemetry.precipitation} mm</span>
            </div>
            <a href="#weather" className="btn btn-outline btn-sm full-width" style={{ marginTop: '12px' }}>
              <Icon name="cloud-sun" size={16} />
              Open Hyper-Local Weather Radar
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
