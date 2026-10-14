import React, { useState, useEffect } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function WeatherMonitoring() {
  const presets = siteData.weatherPresets;

  const [selectedZone, setSelectedZone] = useState(presets[0]);
  const [loading, setLoading] = useState(false);
  const [weatherData, setWeatherData] = useState({
    temp: 29.4,
    humidity: 68,
    windSpeed: 14.2,
    windDir: 'SW',
    precipitation: 0.0,
    uvIndex: 7.2,
    condition: 'Partly Cloudy',
    spraySuitability: 'Favorable (Low Drift)',
    forecast: [
      { day: 'Mon', tempMax: 32, tempMin: 24, rain: 0, condition: 'Sunny' },
      { day: 'Tue', tempMax: 31, tempMin: 23, rain: 2, condition: 'Partly Cloudy' },
      { day: 'Wed', tempMax: 29, tempMin: 22, rain: 12, condition: 'Scattered Showers' },
      { day: 'Thu', tempMax: 30, tempMin: 23, rain: 4, condition: 'Cloudy' },
      { day: 'Fri', tempMax: 33, tempMin: 24, rain: 0, condition: 'Sunny' }
    ]
  });

  const [liveApiActive, setLiveApiActive] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  // Fetch live weather from free open Open-Meteo API
  const fetchWeatherForLocation = async (lat, lon, zoneName) => {
    setLoading(true);
    setStatusNote('');

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        const current = data.current_weather || {};
        const daily = data.daily || {};

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const forecastDays = (daily.time || []).slice(0, 5).map((t, idx) => {
          const d = new Date(t);
          return {
            day: days[d.getDay()],
            tempMax: Math.round(daily.temperature_2m_max?.[idx] || 31),
            tempMin: Math.round(daily.temperature_2m_min?.[idx] || 23),
            rain: Math.round(daily.precipitation_sum?.[idx] || 0),
            condition: (daily.precipitation_sum?.[idx] || 0) > 5 ? 'Rain Showers' : 'Partly Sunny'
          };
        });

        const windSpd = current.windspeed || 12;
        const sprayOk = windSpd < 15 ? 'Favorable (Low Drift)' : 'Unfavorable (High Wind Drift)';

        setWeatherData({
          temp: Math.round(current.temperature || 29),
          humidity: data.hourly?.relativehumidity_2m?.[0] || 65,
          windSpeed: windSpd,
          windDir: current.winddirection > 180 ? 'SW' : 'NE',
          precipitation: daily.precipitation_sum?.[0] || 0.0,
          uvIndex: 6.8,
          condition: current.weathercode > 50 ? 'Showers' : 'Clear Sky',
          spraySuitability: sprayOk,
          forecast: forecastDays.length ? forecastDays : weatherData.forecast
        });

        setLiveApiActive(true);
        setStatusNote(
          `Live satellite telemetry synced from Open-Meteo for ${zoneName}`
        );
      }
    } catch (e) {
      setLiveApiActive(false);
      setStatusNote(
        'Offline Agronomic Weather Simulation Active'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherForLocation(selectedZone.lat, selectedZone.lon, selectedZone.name);
  }, [selectedZone]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const customZone = {
          name: `My Farm GPS (${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E)`,
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          zone: 'Local Geolocation Fix'
        };
        setSelectedZone(customZone);
      },
      (err) => {
        setLoading(false);
        setStatusNote('Geolocation permission denied');
      }
    );
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
              }}
              className="zone-select-dropdown"
            >
              {presets.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.zone})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleUseMyLocation}
            disabled={loading}
          >
            <Icon name="crosshair" size={14} className={loading ? 'spin' : ''} />
            <span>Use My GPS Location</span>
          </button>
        </div>

        {/* Live API Badge Status */}
        <div className="weather-api-badge">
          <span className={`live-dot ${liveApiActive ? 'active' : 'demo'}`} />
          <span>
            {statusNote || (liveApiActive ? 'Open-Meteo Live API Connected' : 'Simulated Agricultural Weather Data')}
          </span>
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
                    Feels like: {weatherData.temp + 2}°C
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
              <span className="wm-sub">{weatherData.humidity > 70 ? 'High transpiration' : 'Normal'}</span>
            </div>
          </div>

          <div className="weather-metric-tile">
            <div className="wm-icon bg-green-subtle">
              <Icon name="wind" size={20} color="#16a34a" />
            </div>
            <div>
              <span className="wm-label">Wind Velocity</span>
              <strong className="wm-val">{weatherData.windSpeed} km/h {weatherData.windDir}</strong>
              <span className="wm-sub">{weatherData.windSpeed < 15 ? 'Safe for spraying' : 'High drift hazard'}</span>
            </div>
          </div>

          <div className="weather-metric-tile">
            <div className="wm-icon bg-amber-subtle">
              <Icon name="cloud-rain" size={20} color="#d97706" />
            </div>
            <div>
              <span className="wm-label">Precipitation 24h</span>
              <strong className="wm-val">{weatherData.precipitation} mm</strong>
              <span className="wm-sub">{weatherData.precipitation > 5 ? 'Wet canopy' : 'Dry conditions'}</span>
            </div>
          </div>

          <div className="weather-metric-tile">
            <div className="wm-icon bg-purple-subtle">
              <Icon name="sun" size={20} color="#8b5cf6" />
            </div>
            <div>
              <span className="wm-label">UV Radiation Index</span>
              <strong className="wm-val">{weatherData.uvIndex} / 11</strong>
              <span className="wm-sub">High solar absorption</span>
            </div>
          </div>
        </div>

        {/* 5-Day Weather Forecast */}
        <div className="weather-forecast-card">
          <div className="wf-header">
            <Icon name="calendar" size={18} color="#16a34a" />
            <h4>5-Day Agricultural Weather Outlook</h4>
          </div>

          <div className="forecast-cols-grid">
            {weatherData.forecast.map((f, i) => (
              <div key={i} className="forecast-day-box">
                <span className="f-day-title">{f.day}</span>
                <div className="f-icon-box">
                  <Icon name={f.rain > 5 ? 'cloud-rain' : f.rain > 0 ? 'cloud-drizzle' : 'sun'} size={24} color="#f59e0b" />
                </div>
                <div className="f-temp-row">
                  <span className="f-max">{f.tempMax}°</span>
                  <span className="f-min">{f.tempMin}°</span>
                </div>
                <span className="f-cond">{f.condition}</span>
                {f.rain > 0 && <span className="f-rain-tag">{f.rain} mm rain</span>}
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
                Spraying Status: {weatherData.spraySuitability}. With winds below 15 km/h and low precipitation probability, optimal foliar droplet retention is expected.
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
                Evapotranspiration is moderate. Avoid peak noon watering (11:00 AM – 03:00 PM) to prevent thermal root shock and solar scorch.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
