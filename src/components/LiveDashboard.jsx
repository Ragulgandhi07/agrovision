import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { getWildlifeHistory, getCropHistory } from '../utils/storage';

export function LiveDashboard({ refreshTrigger }) {
  // Sector and telemetry states
  const [activeSector, setActiveSector] = useState('Sector 2B • Tomato Polyhouse');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now (Live Telemetry)');

  // Dynamic counts loaded from storage + demo records
  const [cropScans, setCropScans] = useState([]);
  const [wildlifeEvents, setWildlifeEvents] = useState([]);

  // Telemetry metrics
  const [telemetry, setTelemetry] = useState({
    soilMoisture: 42,
    soilTemp: 26.4,
    ambientTemp: 29.5,
    humidity: 64,
    waterReserve: 84,
    valveState: 'Auto-Standby'
  });

  // Load latest scans and wildlife events from storage
  useEffect(() => {
    const updateDashboardData = () => {
      setCropScans(getCropHistory());
      setWildlifeEvents(getWildlifeHistory());
    };
    updateDashboardData();

    window.addEventListener('storage', updateDashboardData);
    return () => window.removeEventListener('storage', updateDashboardData);
  }, [refreshTrigger]);

  // Refresh handler that simulates real field telemetry update
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setTelemetry({
        soilMoisture: Math.round(36 + Math.random() * 24),
        soilTemp: parseFloat((24.5 + Math.random() * 4).toFixed(1)),
        ambientTemp: parseFloat((27 + Math.random() * 6).toFixed(1)),
        humidity: Math.round(55 + Math.random() * 25),
        waterReserve: Math.round(75 + Math.random() * 20),
        valveState: Math.random() > 0.5 ? 'Active Micro-Drip' : 'Auto-Standby'
      });
      const timeStr = new Date().toLocaleTimeString();
      setLastUpdated(`Refreshed at ${timeStr}`);
      setIsRefreshing(false);
    }, 600);
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
              Real-time multi-depth sensor telemetry, perimeter event stream, and automated diagnostics.
            </p>
          </div>

          <div className="dashboard-actions-group">
            {/* Sector Selector */}
            <select
              value={activeSector}
              onChange={(e) => setActiveSector(e.target.value)}
              className="sector-select"
            >
              <option value="Sector 1A • Paddy East">Sector 1A • Paddy East</option>
              <option value="Sector 2B • Tomato Polyhouse">Sector 2B • Tomato Polyhouse</option>
              <option value="Sector 3C • Sugarcane Block">Sector 3C • Sugarcane Block</option>
              <option value="Sector 4D • Banana Grove">Sector 4D • Banana Grove</option>
            </select>

            {/* Refresh Button */}
            <button
              type="button"
              className={`btn btn-outline btn-sm ${isRefreshing ? 'loading' : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <Icon name="refresh" size={16} className={isRefreshing ? 'spin' : ''} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>
        </div>

        {/* Telemetry Status Banner (Honest Hardware / Simulation Badge) */}
        <div className="telemetry-banner-notice">
          <div className="telemetry-badge-pulse">
            <span className="live-dot" />
            <span className="telemetry-mode-text">
              Telemetry Mode: ESP32 LoRaWAN Gateway Ready • Active Simulation Feed
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
              <span className="kpi-desc">AI foliage pathogen diagnostics</span>
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
              <span className="kpi-desc">Wild boar, elephant, deer alerts</span>
            </div>
          </div>

          {/* Card 3: Soil Moisture */}
          <div className="kpi-card">
            <div className="kpi-icon-wrap bg-blue-subtle">
              <Icon name="droplets" size={22} color="#0284c7" />
            </div>
            <div className="kpi-content">
              <span className="kpi-label">Root-Zone Moisture</span>
              <div className="kpi-value-row">
                <span className="kpi-value">{telemetry.soilMoisture}%</span>
                <span className={`kpi-tag ${telemetry.soilMoisture < 35 ? 'danger' : 'positive'}`}>
                  {telemetry.soilMoisture < 35 ? 'Low' : 'Optimal'}
                </span>
              </div>
              <span className="kpi-desc">Capacitive 30cm probe telemetry</span>
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
                <span className="kpi-value" style={{ fontSize: '1.25rem', paddingTop: '4px' }}>
                  {telemetry.valveState}
                </span>
              </div>
              <span className="kpi-desc">Water tank capacity: {telemetry.waterReserve}%</span>
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
              {wildlifeEvents.slice(0, 3).map((w) => (
                <div key={w.id} className="dash-event-item">
                  <img
                    src={w.thumbnail || 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?auto=format&fit=crop&w=120&q=80'}
                    alt={w.species}
                    className="event-thumb"
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
                      Model Confidence: <strong>{w.confidence}</strong> ({w.source})
                    </div>
                  </div>
                </div>
              ))}
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
              {cropScans.slice(0, 3).map((c) => (
                <div key={c.id} className="dash-event-item">
                  <img
                    src={c.image || 'https://images.unsplash.com/photo-1592417817098-8f3d6910985b?auto=format&fit=crop&w=120&q=80'}
                    alt={c.crop}
                    className="event-thumb"
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
              ))}
            </div>
          </div>
        </div>

        {/* 7-Day Soil Moisture & Weather Preview Bar */}
        <div className="dash-bottom-summary-card">
          <div className="moisture-chart-wrap">
            <h4>7-Day Root-Zone Soil Moisture Trend (%)</h4>
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
            <h4>Weather Quick Glance</h4>
            <div className="weather-compact-row">
              <Icon name="sun" size={32} color="#f59e0b" />
              <div>
                <span className="wc-temp">{telemetry.ambientTemp}°C</span>
                <span className="wc-condition">Clear Sky • Mild Breeze</span>
              </div>
            </div>
            <div className="wc-details">
              <span>Humidity: {telemetry.humidity}%</span>
              <span>Precipitation: 10%</span>
            </div>
            <a href="#weather" className="btn btn-outline btn-sm full-width" style={{ marginTop: '12px' }}>
              <Icon name="cloud-sun" size={16} />
              Open Full Weather Radar
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
