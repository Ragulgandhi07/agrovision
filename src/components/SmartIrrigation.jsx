import React, { useState } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function SmartIrrigation() {
  const { irrigation } = siteData;

  const [sectors, setSectors] = useState(irrigation.sectors);
  const [activeSectorId, setActiveSectorId] = useState('sec-2');
  const [valveToggling, setValveToggling] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  const activeSector = sectors.find((s) => s.id === activeSectorId) || sectors[0];

  // Manual valve toggle simulation
  const handleToggleValve = (sectorId) => {
    setValveToggling(true);
    setActionNotice('');

    setTimeout(() => {
      setSectors((prev) =>
        prev.map((s) => {
          if (s.id === sectorId) {
            const nextStatus = s.valveStatus === 'Active' ? 'Closed' : 'Active';
            const nextFlow = nextStatus === 'Active' ? '15.4 L/min' : '0 L/min';
            return {
              ...s,
              valveStatus: nextStatus,
              flowRate: nextFlow,
              lastIrrigated: nextStatus === 'Active' ? 'Just now (Manual Trigger)' : s.lastIrrigated
            };
          }
          return s;
        })
      );

      setValveToggling(false);
      setActionNotice(
        `Simulated actuator state switched to ${nextStatus === 'Active' ? 'OPEN' : 'CLOSED'} (Demo Simulation — Physical ESP32 relay not connected).`
      );
    }, 450);
  };

  return (
    <section id="irrigation" className="section irrigation-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge">
            <span className="badge-dot" />
            Precision Smart Irrigation
          </div>
          <h2 className="section-title">
            Multi-Depth Soil Hydration & Closed-Loop Drip
          </h2>
          <p className="section-subtitle">
            Multi-depth capacitive telemetry tracking volumetric water content at 10cm, 30cm, and 60cm to eliminate root asphyxiation and leaching.
          </p>
        </div>

        {/* Telemetry Hardware Mode Notice */}
        <div className="telemetry-banner-notice">
          <div className="telemetry-badge-pulse">
            <span className="live-dot demo" />
            <span>
              <strong>Hardware Status:</strong>{' '}
              Simulated Demo Data — Sensors Not Connected (Code structure ready for ESP32 & LoRaWAN integration)
            </span>
          </div>
          <span className="last-sync-time">
            Simulated Demo Feed
          </span>
        </div>

        {/* Sector Tabs Bar */}
        <div className="sector-tabs-row">
          {sectors.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`sector-tab-btn ${activeSector.id === s.id ? 'active' : ''}`}
              onClick={() => {
                setActiveSectorId(s.id);
                setActionNotice('');
              }}
            >
              <div className="sec-tab-top">
                <span className="sec-tab-name">{s.name}</span>
                <span className={`valve-pill ${s.valveStatus === 'Active' ? 'open' : 'closed'}`}>
                  {s.valveStatus === 'Active' ? 'Valve OPEN' : 'CLOSED'}
                </span>
              </div>
              <div className="sec-tab-sub">
                <span>{s.crop}</span> • <span>Moisture: {s.moisture30cm}%</span>
              </div>
            </button>
          ))}
        </div>

        {/* Sector In-Depth Telemetry Display */}
        <div className="irrigation-main-grid">
          {/* Left Column: 3 Depth Soil Probes Display */}
          <div className="probes-card">
            <div className="probes-header">
              <div className="probe-title-col">
                <Icon name="layers" size={20} color="#0284c7" />
                <h3>{activeSector.name}</h3>
              </div>
              <span className="crop-type-badge">{activeSector.crop}</span>
            </div>

            <p className="probes-desc">
              Capacitive wireless telemetry probe tracking volumetric moisture gradient across critical root strata.
            </p>

            {/* 3 Probe Depths */}
            <div className="depth-gauges-list">
              {/* Depth 1: 10cm Topsoil */}
              <div className="depth-gauge-item">
                <div className="depth-info-row">
                  <span className="depth-label">
                    <Icon name="droplet" size={16} color="#0284c7" />
                    Topsoil Strata (10cm)
                  </span>
                  <strong className="depth-val">{activeSector.moisture10cm}% VWC</strong>
                </div>
                <div className="depth-progress-track">
                  <div
                    className={`depth-progress-fill ${activeSector.moisture10cm < 35 ? 'low' : 'good'}`}
                    style={{ width: `${activeSector.moisture10cm}%` }}
                  />
                </div>
                <span className="depth-sub">Evaporation-sensitive surface boundary</span>
              </div>

              {/* Depth 2: 30cm Active Root Zone */}
              <div className="depth-gauge-item active-root">
                <div className="depth-info-row">
                  <span className="depth-label">
                    <Icon name="sprout" size={16} color="#16a34a" />
                    <strong>Active Root Zone (30cm)</strong>
                  </span>
                  <strong className="depth-val text-green">{activeSector.moisture30cm}% VWC</strong>
                </div>
                <div className="depth-progress-track">
                  <div
                    className={`depth-progress-fill ${activeSector.moisture30cm < 35 ? 'low' : 'optimal'}`}
                    style={{ width: `${activeSector.moisture30cm}%` }}
                  />
                </div>
                <span className="depth-sub">
                  {activeSector.moisture30cm < 35
                    ? 'Warning: Below wilting threshold. Irrigation recommended.'
                    : 'Optimal physiological uptake maintained.'}
                </span>
              </div>

              {/* Depth 3: 60cm Subsoil Reserve */}
              <div className="depth-gauge-item">
                <div className="depth-info-row">
                  <span className="depth-label">
                    <Icon name="layers" size={16} color="#64748b" />
                    Subsoil Deep Reserve (60cm)
                  </span>
                  <strong className="depth-val">{activeSector.moisture60cm}% VWC</strong>
                </div>
                <div className="depth-progress-track">
                  <div
                    className="depth-progress-fill deep"
                    style={{ width: `${activeSector.moisture60cm}%` }}
                  />
                </div>
                <span className="depth-sub">Deep moisture reserve; zero drainage loss</span>
              </div>
            </div>

            {/* Solenoid Valve Control Box */}
            <div className="valve-control-box">
              <div className="valve-status-info">
                <div className="v-icon-wrap">
                  <Icon name="valve" size={24} color={activeSector.valveStatus === 'Active' ? '#16a34a' : '#64748b'} />
                </div>
                <div>
                  <h4>Solenoid Actuator (Simulation):</h4>
                  <span className="valve-current">
                    {activeSector.valveStatus === 'Active'
                      ? `OPEN • Simulated Flow ${activeSector.flowRate}`
                      : 'CLOSED • Standby (Sensors Not Connected)'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className={`btn ${activeSector.valveStatus === 'Active' ? 'btn-outline' : 'btn-primary'}`}
                onClick={() => handleToggleValve(activeSector.id)}
                disabled={valveToggling}
              >
                <Icon name={activeSector.valveStatus === 'Active' ? 'square' : 'play'} size={16} />
                <span>
                  {valveToggling
                    ? 'Updating Simulation...'
                    : activeSector.valveStatus === 'Active'
                    ? 'Close Simulated Valve'
                    : 'Open Simulated Valve'}
                </span>
              </button>
            </div>

            {actionNotice && (
              <div className="success-alert-box" style={{ marginTop: '12px' }}>
                <Icon name="check" size={16} />
                <span>{actionNotice}</span>
              </div>
            )}
          </div>

          {/* Right Column: Crop Water Needs Table & Agronomy Schedule */}
          <div className="irrigation-guide-card">
            <div className="guide-header">
              <Icon name="droplets" size={20} color="#0284c7" />
              <h3>Crop Water Requirements & Micro-Drip Schedule</h3>
            </div>

            <p className="guide-sub">
              Daily evapotranspiration (ETc) calibrations based on standardized FAO-56 Penman-Monteith formulas.
            </p>

            <div className="water-needs-table-wrap">
              <table className="water-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Daily Need (mm/day)</th>
                    <th>Recommended Method</th>
                    <th>Critical Moisture Stage</th>
                  </tr>
                </thead>
                <tbody>
                  {irrigation.cropWaterNeeds.map((item, idx) => (
                    <tr key={idx} className={item.crop.includes(activeSector.crop) ? 'highlight-row' : ''}>
                      <td>
                        <strong>{item.crop}</strong>
                      </td>
                      <td>
                        <span className="mm-pill">{item.mmPerDay}</span>
                      </td>
                      <td>{item.method}</td>
                      <td>
                        <span className="stage-note">{item.criticalStage}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Smart Irrigation Advice Box */}
            <div className="irrigation-advisory-box">
              <h4>
                <Icon name="sprout" size={16} color="#16a34a" />
                Daily Agronomic Water Advisory
              </h4>
              <p>
                Scheduling micro-irrigation between 05:00 AM and 08:00 AM reduces evaporative canopy losses by 28%. Maintain steady furrow moisture for Solanaceae to avoid blossom rot.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
