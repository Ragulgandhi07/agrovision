import React, { useState } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function LiveDashboard() {
  const initial = siteData.dashboardInitial;

  // Active sector state
  const [sector, setSector] = useState('North Orchard • Sector 4B');
  // Sensors state
  const [sensors, setSensors] = useState(initial.sensors);
  // Weather state
  const [weather, setWeather] = useState(initial.weather);
  // Weekly moisture bar chart state
  const [weeklyMoisture, setWeeklyMoisture] = useState(initial.weeklyMoisture);
  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState('Just now (18:24:10)');
  // Spinning indicator state for the refresh button
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Helper function to re-randomize data
  const handleRefreshData = () => {
    setIsRefreshing(true);

    setTimeout(() => {
      // Re-randomize sensor values
      const newSensors = sensors.map((sensor) => {
        let newVal = sensor.value;
        let newPct = sensor.percentage;
        let newStatus = sensor.status;
        let statusType = sensor.statusType;
        let trend = sensor.trend;

        if (sensor.id === 'temp') {
          newVal = parseFloat((22 + Math.random() * 9).toFixed(1)); // 22.0 to 31.0
          newPct = Math.round(((newVal - 10) / (45 - 10)) * 100);
          newStatus = newVal > 29 ? 'Warm' : newVal < 24 ? 'Mild' : 'Optimal';
          statusType = newVal > 29 ? 'warning' : 'success';
          trend = `${newVal > 26 ? '+' : '-'}${(Math.random() * 1.5).toFixed(1)}°C trend`;
        } else if (sensor.id === 'humidity') {
          newVal = Math.round(50 + Math.random() * 35); // 50 to 85%
          newPct = newVal;
          newStatus = newVal > 75 ? 'Humid' : newVal < 55 ? 'Dry' : 'Normal';
          statusType = newVal > 75 ? 'warning' : 'success';
          trend = 'Canopy transpiration balanced';
        } else if (sensor.id === 'moisture') {
          newVal = Math.round(34 + Math.random() * 32); // 34 to 66%
          newPct = newVal;
          newStatus = newVal < 38 ? 'Low' : newVal > 60 ? 'Saturated' : 'Good';
          statusType = newVal < 38 ? 'warning' : 'success';
          trend = newVal < 38 ? 'Irrigation valve opening' : 'Moisture holding steady';
        } else if (sensor.id === 'rainfall') {
          newVal = parseFloat((Math.random() * 25).toFixed(1)); // 0.0 to 25.0 mm
          newPct = Math.min(100, Math.round((newVal / 40) * 100));
          newStatus = newVal === 0 ? 'Dry' : newVal > 18 ? 'Heavy' : 'Moderate';
          statusType = 'info';
          trend = newVal > 0 ? 'Accumulated precipitation' : 'No rain recorded in 24h';
        } else if (sensor.id === 'crop-health') {
          newVal = Math.round(91 + Math.random() * 8); // 91 to 99%
          newPct = newVal;
          newStatus = newVal >= 95 ? 'Excellent' : 'Good';
          statusType = 'success';
          trend = `NDVI 0.${84 + Math.floor(Math.random() * 8)} canopy index`;
        } else if (sensor.id === 'water-level') {
          newVal = Math.round(72 + Math.random() * 24); // 72 to 96%
          newPct = newVal;
          newStatus = newVal > 80 ? 'Sufficient' : 'Adequate';
          statusType = 'success';
          trend = `${Math.round(newVal / 6)} days reserve capacity`;
        }

        return {
          ...sensor,
          value: newVal,
          percentage: newPct,
          status: newStatus,
          statusType,
          trend
        };
      });

      // Re-randomize 7-day soil moisture
      const newWeekly = [
        { day: 'Mon', value: Math.round(35 + Math.random() * 30), status: 'Good' },
        { day: 'Tue', value: Math.round(35 + Math.random() * 30), status: 'Good' },
        { day: 'Wed', value: Math.round(45 + Math.random() * 30), status: 'Irrigated' },
        { day: 'Thu', value: Math.round(38 + Math.random() * 28), status: 'Good' },
        { day: 'Fri', value: Math.round(36 + Math.random() * 32), status: 'Good' },
        { day: 'Sat', value: Math.round(35 + Math.random() * 25), status: 'Moderate' },
        { day: 'Sun', value: Math.round(40 + Math.random() * 30), status: 'Good' }
      ];

      // Re-randomize weather snippet
      const newWeatherTemp = `${Math.round(23 + Math.random() * 8)}°C`;
      const newWind = `${(6 + Math.random() * 7).toFixed(1)} km/h ${['N', 'NW', 'W', 'NE'][Math.floor(Math.random() * 4)]}`;
      const newUv = `${(4.5 + Math.random() * 3.5).toFixed(1)} High`;

      setSensors(newSensors);
      setWeeklyMoisture(newWeekly);
      setWeather((prev) => ({
        ...prev,
        temp: newWeatherTemp,
        wind: newWind,
        uvIndex: newUv
      }));

      // Update timestamp
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastUpdated(`Today at ${timeStr}`);
      setIsRefreshing(false);
    }, 450);
  };

  const handleSectorChange = (e) => {
    setSector(e.target.value);
    handleRefreshData();
  };

  return (
    <section id="dashboard" className="section dashboard-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge badge-dark">
            <span className="badge-dot" />
            Interactive Farm IoT Telemetry
          </div>
          <h2 className="section-title light">Live Precision Farm Dashboard</h2>
          <p className="section-subtitle light">
            Simulate real-time field telemetry across our IoT edge nodes. Click &ldquo;Refresh Data&rdquo; to simulate live incoming sensor readings.
          </p>
        </div>

        {/* Dashboard Top Toolbar */}
        <div className="dashboard-toolbar">
          <div className="dash-status-group">
            <div className="dash-pulse-badge">
              <span className="pulse-dot" />
              CONNECTED TO LORAWAN GATEWAY
            </div>

            <select
              className="dash-sector-selector"
              value={sector}
              onChange={handleSectorChange}
              aria-label="Select Farm Sector"
            >
              <option value="North Orchard • Sector 4B">North Orchard • Sector 4B</option>
              <option value="Vineyard Block 12 • South Ridge">Vineyard Block 12 • South Ridge</option>
              <option value="East Corn & Soy • Parcel 7">East Corn &amp; Soy • Parcel 7</option>
              <option value="Greenhouse Microclimate #2">Greenhouse Microclimate #2</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="dash-updated-text">
              Last updated: <strong style={{ color: '#ffffff' }}>{lastUpdated}</strong>
            </span>

            <button
              type="button"
              className={`btn-refresh ${isRefreshing ? 'spinning' : ''}`}
              onClick={handleRefreshData}
              disabled={isRefreshing}
            >
              <Icon name="refresh" size={16} color="#ffffff" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* 6 Core Sensor Cards */}
        <div className="sensor-cards-grid">
          {sensors.map((sensor) => (
            <div key={sensor.id} className="sensor-card">
              <div className="sensor-card-top">
                <div className="sensor-icon-box">
                  <Icon name={sensor.icon} size={22} color="#4ade80" />
                </div>
                <span className={`sensor-badge ${sensor.statusType}`}>
                  {sensor.status}
                </span>
              </div>

              <div className="sensor-label">{sensor.name}</div>

              <div className="sensor-value-row">
                <span className="sensor-value">{sensor.value}</span>
                <span className="sensor-unit">{sensor.unit}</span>
              </div>

              {/* Progress Bar */}
              <div className="sensor-bar-bg" title={`${sensor.percentage}% capacity`}>
                <div
                  className="sensor-bar-fill"
                  style={{ width: `${sensor.percentage}%` }}
                />
              </div>

              <div className="sensor-trend">
                <Icon name="trending-up" size={14} color="#86efac" />
                <span>{sensor.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Secondary Row: Weather Card + 7-Day Soil Moisture Bar Chart */}
        <div className="dashboard-extra-grid">
          {/* Weather Card */}
          <div className="dash-panel">
            <div className="dash-panel-title">
              <span>Sector Microclimate Station</span>
              <span className="dash-pulse-badge" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                Active Telemetry
              </span>
            </div>

            <div className="weather-header">
              <div className="weather-current">
                <div style={{ color: '#4ade80' }}>
                  <Icon name="cloud-sun" size={44} />
                </div>
                <div>
                  <div className="weather-temp">{weather.temp}</div>
                  <div className="weather-condition">{weather.condition}</div>
                  <div className="weather-location">{sector}</div>
                </div>
              </div>
            </div>

            <div className="weather-grid-metrics">
              <div className="weather-metric-item">
                <div className="metric-label">Wind Velocity</div>
                <div className="metric-val">{weather.wind}</div>
              </div>
              <div className="weather-metric-item">
                <div className="metric-label">Solar UV Index</div>
                <div className="metric-val">{weather.uvIndex}</div>
              </div>
              <div className="weather-metric-item">
                <div className="metric-label">Atm. Pressure</div>
                <div className="metric-val">{weather.pressure}</div>
              </div>
              <div className="weather-metric-item">
                <div className="metric-label">Dew Point</div>
                <div className="metric-val">{weather.dewPoint}</div>
              </div>
            </div>
          </div>

          {/* 7-Day Soil Moisture Bar Chart */}
          <div className="dash-panel">
            <div className="dash-panel-title">
              <span>7-Day Soil Moisture History (% VWC)</span>
              <span style={{ fontSize: '0.8rem', color: '#86efac', fontWeight: 600 }}>
                Target: 40% - 60%
              </span>
            </div>

            <div className="chart-container">
              {weeklyMoisture.map((dayItem, idx) => (
                <div key={idx} className="chart-bar-column">
                  <div className="chart-bar-track" title={`${dayItem.day}: ${dayItem.value}% (${dayItem.status})`}>
                    <div
                      className="chart-bar-inner"
                      style={{ height: `${(dayItem.value / 80) * 100}%` }}
                    >
                      <span className="chart-value-tooltip">{dayItem.value}%</span>
                    </div>
                  </div>
                  <span className="chart-day-label">{dayItem.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
