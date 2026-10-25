import React, { useState, useEffect, useCallback } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';
import { getCurrentGPSLocation, fetchLiveWeather } from '../utils/geoWeather';

export function WeatherMonitoring() {
  const presets = siteData.weatherPresets;

  const [selectedZone, setSelectedZone] = useState(presets[0]);
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [activeGpsFix, setActiveGpsFix] = useState(null); // { lat, lon, accuracy, placeName }
  const [statusNote, setStatusNote] = useState('');
  const [liveApiActive, setLiveApiActive] = useState(false);

  // Weather state (seeded with sensible defaults, overwritten by live Open-Meteo API)
  const [weatherData, setWeatherData] = useState({
    temp: 29,
    feelsLike: 32,
    humidity: 68,
    windSpeed: 12.5,
    windDir: 'SW',
    precipitation: 0.0,
    uvIndex: 7.2,
    condition: 'Partly Cloudy',
    spraySuitability: 'Favorable (Low Drift)',
    lastUpdated: 'Loading live telemetry...',
    forecast: [
      { day: 'Mon', tempMax: 32, tempMin: 24, rain: 0, condition: 'Sunny' },
      { day: 'Tue', tempMax: 31, tempMin: 23, rain: 2, condition: 'Partly Cloudy' },
      { day: 'Wed', tempMax: 29, tempMin: 22, rain: 12, condition: 'Rain Showers' },
      { day: 'Thu', tempMax: 30, tempMin: 23, rain: 4, condition: 'Cloudy' },
      { day: 'Fri', tempMax: 33, tempMin: 24, rain: 0, condition: 'Sunny' }
    ]
  });

  // Load weather for active zone/coordinates
  const loadWeatherData = useCallback(async (lat, lon, zoneName, forceRefresh = false) => {
    setLoading(true);
    setStatusNote('');

    try {
      const live = await fetchLiveWeather(lat, lon, forceRefresh);
      setWeatherData(live);
      setLiveApiActive(true);
      setStatusNote(`Live Open-Meteo satellite & ground telemetry synced for ${zoneName}`);
    } catch (err) {
      console.warn('Weather fetch fallback:', err.message);
      setLiveApiActive(false);
      setStatusNote(`Weather API notice: ${err.message}. Showing cached agricultural parameters.`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch weather whenever selected zone changes
  useEffect(() => {
    loadWeatherData(selectedZone.lat, selectedZone.lon, selectedZone.name);
  }, [selectedZone, loadWeatherData]);

  // Handle GPS location request with complete error handling
  const handleUseMyLocation = async () => {
    setIsLocating(true);
    setGpsError('');
    setStatusNote('Requesting browser geolocation permission...');

    try {
      const gps = await getCurrentGPSLocation();
      setActiveGpsFix(gps);

      const customZone = {
        name: `My Farm GPS • ${gps.placeName}`,
        lat: gps.lat,
        lon: gps.lon,
        zone: `Accuracy ±${gps.accuracy}m`,
        isGps: true
      };

      setSelectedZone(customZone);
      setStatusNote(`GPS Locked: ${gps.lat.toFixed(4)}°N, ${gps.lon.toFixed(4)}°E (${gps.placeName})`);
    } catch (err) {
      console.warn('Geolocation error:', err);
      setGpsError(err.message || 'Could not acquire GPS position.');
      setStatusNote(err.message || 'GPS location unavailable.');
    } finally {
      setIsLocating(false);
    }
  };

  // Manual refresh button
  const handleManualRefresh = () => {
    loadWeatherData(selectedZone.lat, selectedZone.lon, selectedZone.name, true);
  };

  return (
    <section id="weather" className="section weather-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge">
            <span className="badge-dot" />
            Agricultural Weather Radar
          </div>
          <h2 className="section-title">
            Hyper-Local Microclimate & Spraying Advisories
          </h2>
          <p className="section-subtitle">
            Real-time agro-meteorological monitoring to safeguard spraying windows, prevent drift loss, and schedule irrigation.
          </p>
        </div>

        {/* Location Selector Toolbar */}
        <div className="weather-zone-bar">
          <div className="zone-select-wrap">
            <Icon name="map-pin" size={18} color="#16a34a" />
            <select
              value={selectedZone.name}
              onChange={(e) => {
                const z = presets.find((p) => p.name === e.target.value) || presets[0];
                setSelectedZone(z);
                setGpsError('');
              }}
              className="zone-select-dropdown"
            >
              {activeGpsFix && (
                <option value={selectedZone.name}>
                  📍 {selectedZone.name} ({selectedZone.zone})
                </option>
              )}
              {presets.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.zone})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              id="weather-gps-btn"
              className="btn btn-outline btn-sm"
              onClick={handleUseMyLocation}
              disabled={isLocating || loading}
              title="Acquire live GPS coordinates from your device"
            >
              <Icon name="crosshair" size={14} className={isLocating ? 'spin' : ''} />
              <span>{isLocating ? 'Acquiring GPS...' : 'Use My GPS Location'}</span>
            </button>

            <button
              type="button"
              id="weather-refresh-btn"
              className="btn btn-outline btn-sm"
              onClick={handleManualRefresh}
              disabled={loading}
              title="Refresh live weather from Open-Meteo API"
            >
              <Icon name="refresh" size={14} className={loading ? 'spin' : ''} />
              <span>{loading ? 'Syncing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Active GPS Information or Error Pill */}
        {gpsError && (
          <div className="camera-error-banner" style={{ margin: '10px 0', padding: '8px 14px' }}>
            <Icon name="alert-triangle" size={16} color="#ef4444" />
            <span style={{ fontSize: '0.85rem' }}>{gpsError}</span>
          </div>
        )}

        {activeGpsFix && selectedZone.isGps && (
          <div className="telemetry-banner-notice" style={{ margin: '10px 0', padding: '8px 14px', background: 'rgba(22, 163, 74, 0.1)', borderColor: '#22c55e' }}>
            <div className="telemetry-badge-pulse">
              <span className="live-dot" />
              <span style={{ fontSize: '0.85rem' }}>
                <strong>Actual Device GPS Locked:</strong> {activeGpsFix.lat.toFixed(4)}° N, {activeGpsFix.lon.toFixed(4)}° E • {activeGpsFix.placeName} (Precision ±{activeGpsFix.accuracy}m)
              </span>
            </div>
          </div>
        )}

        {/* Live API Badge Status */}
        <div className="weather-api-badge">
          <span className={`live-dot ${liveApiActive ? 'active' : 'demo'}`} />
          <span>
            {statusNote || (liveApiActive ? 'Open-Meteo Live Satellite Telemetry Connected' : 'Agricultural Meteorological Fallback')}
          </span>
          {weatherData.lastUpdated && (
            <span style={{ marginLeft: 'auto', fontSize: '0.8rem', opacity: 0.85 }}>
              Updated: {weatherData.lastUpdated}
            </span>
          )}
        </div>

        {/* Current Weather Highlights Grid */}
        <div className="weather-current-grid">
          {/* Main Card: Temperature & Condition */}
          <div className="weather-hero-card">
            <div className="wh-left">
              <span className="wh-zone-tag">{selectedZone.name}</span>
              <div className="wh-temp-row">
                <span className="wh-temp">{weatherData.temp}°C</span>
                <div className="wh-condition-col">
                  <span className="wh-condition">{weatherData.condition}</span>
                  <span className="wh-feels">
                    Feels like: {weatherData.feelsLike}°C
                  </span>
                </div>
              </div>
            </div>

            <div className="wh-icon-wrap">
              <Icon name="cloud-sun" size={64} color="#f59e0b" />
            </div>
          </div>

          {/* 4 Metric Tiles */}
          <div className="weather-metric-tile">
            <div className="wm-icon bg-blue-subtle">
              <Icon name="droplet" size={20} color="#0284c7" />
            </div>
            <div>
              <span className="wm-label">Relative Humidity</span>
              <strong className="wm-val">{weatherData.humidity}%</strong>
              <span className="wm-sub">{weatherData.humidity > 70 ? 'High transpiration' : 'Optimal canopy humidity'}</span>
            </div>
          </div>

          <div className="weather-metric-tile">
            <div className="wm-icon bg-green-subtle">
              <Icon name="wind" size={20} color="#16a34a" />
            </div>
            <div>
              <span className="wm-label">Wind Velocity</span>
              <strong className="wm-val">{weatherData.windSpeed} km/h {weatherData.windDir}</strong>
              <span className="wm-sub">{weatherData.windSpeed < 15 ? 'Safe for foliar spraying' : 'High drift hazard'}</span>
            </div>
          </div>

          <div className="weather-metric-tile">
            <div className="wm-icon bg-amber-subtle">
              <Icon name="cloud-rain" size={20} color="#d97706" />
            </div>
            <div>
              <span className="wm-label">Precipitation (Current / 24h)</span>
              <strong className="wm-val">{weatherData.precipitation} mm</strong>
              <span className="wm-sub">{weatherData.precipitation > 1.0 ? 'Active rain / wet foliage' : 'Dry conditions'}</span>
            </div>
          </div>

          <div className="weather-metric-tile">
            <div className="wm-icon bg-purple-subtle">
              <Icon name="sun" size={20} color="#8b5cf6" />
            </div>
            <div>
              <span className="wm-label">UV Radiation Index</span>
              <strong className="wm-val">{weatherData.uvIndex} / 11</strong>
              <span className="wm-sub">Optimal solar absorption</span>
            </div>
          </div>
        </div>

        {/* 5-Day Weather Forecast */}
        <div className="weather-forecast-card">
          <div className="wf-header">
            <Icon name="calendar" size={18} color="#16a34a" />
            <h4>5-Day Agricultural Weather Outlook (Open-Meteo)</h4>
          </div>

          <div className="forecast-cols-grid">
            {weatherData.forecast.map((f, i) => (
              <div key={i} className="forecast-day-box">
                <span className="f-day-title">{f.day}</span>
                <div className="f-icon-box">
                  <Icon
                    name={f.rain > 5 ? 'cloud-rain' : f.rain > 0 ? 'cloud-drizzle' : 'sun'}
                    size={24}
                    color="#f59e0b"
                  />
                </div>
                <div className="f-temp-row">
                  <span className="f-max">{f.tempMax}°</span>
                  <span className="f-min">{f.tempMin}°</span>
                </div>
                <span className="f-cond">{f.condition}</span>
                {f.rain > 0 ? (
                  <span className="f-rain-tag">{f.rain} mm rain</span>
                ) : (
                  <span className="f-rain-tag" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' }}>Dry</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Agricultural Advisories Box */}
        <div className="farming-weather-advisory">
          <div className="adv-col">
            <div className="adv-icon">
              <Icon name="shield-alert" size={22} color="#16a34a" />
            </div>
            <div>
              <h4>Foliar Spraying & Biopesticide Window</h4>
              <p>
                Spraying Status: <strong>{weatherData.spraySuitability}</strong>. Current wind velocity of {weatherData.windSpeed} km/h and {weatherData.precipitation} mm rainfall determine application safety and droplet retention.
              </p>
            </div>
          </div>

          <div className="adv-col">
            <div className="adv-icon">
              <Icon name="droplets" size={22} color="#0284c7" />
            </div>
            <div>
              <h4>Irrigation Scheduling Guidance</h4>
              <p>
                Canopy relative humidity is at {weatherData.humidity}%. {weatherData.precipitation > 2 ? 'Recent rainfall detected; postpone planned irrigation.' : 'Evapotranspiration is normal. Avoid watering between 11:00 AM - 03:00 PM.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
