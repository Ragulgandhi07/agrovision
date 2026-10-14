import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import { getFarmerProfile, getWildlifeHistory, getCropHistory, exportToCSV } from '../utils/storage';

export function Reports() {
  const [profile, setProfile] = useState({});
  const [wildlifeLogs, setWildlifeLogs] = useState([]);
  const [cropLogs, setCropLogs] = useState([]);
  const [includeWildlife, setIncludeWildlife] = useState(true);
  const [includeCrops, setIncludeCrops] = useState(true);

  useEffect(() => {
    setProfile(getFarmerProfile());
    setWildlifeLogs(getWildlifeHistory());
    setCropLogs(getCropHistory());
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportFullCSV = () => {
    const rows = [];
    if (includeCrops) {
      cropLogs.forEach((c) => {
        rows.push({
          Module: 'Crop Pathology',
          Record_ID: c.id,
          Specimen_Or_Species: `${c.crop} - ${c.condition}`,
          Confidence: c.confidence,
          Status: c.status,
          Location_Or_Notes: c.treatment,
          Timestamp: c.timestamp,
          Data_Type: c.isDemo ? 'Demonstration / Presets' : 'Live Field Scan'
        });
      });
    }

    if (includeWildlife) {
      wildlifeLogs.forEach((w) => {
        rows.push({
          Module: 'Wildlife Security',
          Record_ID: w.id,
          Specimen_Or_Species: w.species,
          Confidence: w.confidence,
          Status: w.status,
          Location_Or_Notes: `${w.location} | ${w.notes}`,
          Timestamp: w.timestamp,
          Data_Type: w.isDemo ? 'Demonstration / Presets' : 'Live Stream Event'
        });
      });
    }

    exportToCSV(`AgroVision_Official_Farm_Report_${Date.now()}.csv`, rows);
  };

  return (
    <section id="reports" className="section reports-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge">
            <span className="badge-dot" />
            Agronomy & Security Reporting
          </div>
          <h2 className="section-title">
            Automated Agricultural Inspection & Telemetry Report
          </h2>
          <p className="section-subtitle">
            Generate print-friendly inspection dossiers and CSV files distinguishing verified AI inferences, telemetry logs, and demonstration data.
          </p>
        </div>

        {/* Report Options & Controls Toolbar */}
        <div className="report-controls-card">
          <div className="report-toggles-row">
            <span className="rc-title">Include in Dossier:</span>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeCrops}
                onChange={(e) => setIncludeCrops(e.target.checked)}
              />
              <span>Crop Disease Diagnostics ({cropLogs.length})</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeWildlife}
                onChange={(e) => setIncludeWildlife(e.target.checked)}
              />
              <span>Wildlife Perimeter Events ({wildlifeLogs.length})</span>
            </label>
          </div>

          <div className="report-btn-group">
            <button type="button" className="btn btn-outline btn-sm" onClick={handleExportFullCSV}>
              <Icon name="download" size={16} />
              <span>Export Full CSV</span>
            </button>

            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Icon name="printer" size={16} />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Formal Document Canvas */}
        <div className="printable-report-paper" id="printable-farm-report">
          {/* Formal Letterhead */}
          <div className="report-letterhead">
            <div className="letterhead-brand">
              <div className="lh-logo">
                <Icon name="sprout" size={28} color="#16a34a" />
              </div>
              <div>
                <h1 className="lh-name">AgroVision</h1>
                <p className="lh-tagline">Smart Farming and AI-Based Detection System</p>
              </div>
            </div>

            <div className="letterhead-meta">
              <span className="report-badge-official">OFFICIAL FARM RECORD</span>
              <span className="report-date">
                <strong>Date:</strong> {new Date().toLocaleDateString()}
              </span>
              <span className="report-code">
                <strong>Audit Ref:</strong> AGV-{Date.now().toString().slice(-6)}
              </span>
            </div>
          </div>

          <div className="report-separator" />

          {/* Farmer & Property Profile Box */}
          <div className="report-profile-section">
            <h3 className="section-heading">1. Farm Operator & Land Demographics</h3>
            <div className="profile-details-grid">
              <div className="prof-item">
                <span className="p-label">Lead Farmer / Operator:</span>
                <strong>{profile.farmerName || 'M. Selvakumar'}</strong>
              </div>
              <div className="prof-item">
                <span className="p-label">Holding / Farm Name:</span>
                <strong>{profile.farmName || 'Green Valley Agrofarm'}</strong>
              </div>
              <div className="prof-item">
                <span className="p-label">District & Agro-Climatic Zone:</span>
                <strong>{profile.district || 'Thanjavur, Tamil Nadu'}</strong>
              </div>
              <div className="prof-item">
                <span className="p-label">Total Acreage:</span>
                <strong>{profile.landSize || '12.5 Acres'}</strong>
              </div>
              <div className="prof-item full-width">
                <span className="p-label">Active Cultivated Crops:</span>
                <strong>{profile.primaryCrops || 'Paddy, Banana, Sugarcane, Tomato'}</strong>
              </div>
            </div>
          </div>

          {/* Crop Disease Scans Section */}
          {includeCrops && (
            <div className="report-data-section">
              <h3 className="section-heading">
                2. Foliar Pathology & Crop Health Ledger
              </h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Ref ID</th>
                    <th>Crop & Condition</th>
                    <th>Confidence</th>
                    <th>Severity</th>
                    <th>Date & Time</th>
                    <th>Prescribed Agronomic Remedy</th>
                    <th>Data Source</th>
                  </tr>
                </thead>
                <tbody>
                  {cropLogs.map((c) => (
                    <tr key={c.id}>
                      <td><span className="code-pill">{c.id}</span></td>
                      <td><strong>{c.crop}</strong> – {c.condition}</td>
                      <td>{c.confidence}</td>
                      <td>{c.severity}</td>
                      <td>{c.timestamp}</td>
                      <td style={{ fontSize: '0.82rem', maxWidth: '280px' }}>{c.treatment}</td>
                      <td>
                        <span className="data-type-pill">
                          {c.isDemo ? 'Verified Sample' : 'Field Photo'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Wildlife Incidents Section */}
          {includeWildlife && (
            <div className="report-data-section" style={{ marginTop: '24px' }}>
              <h3 className="section-heading">
                3. Wildlife Perimeter Incident Ledger
              </h3>
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Species Identified</th>
                    <th>Confidence</th>
                    <th>Threat Level</th>
                    <th>Perimeter Location</th>
                    <th>Timestamp</th>
                    <th>Detection Source</th>
                  </tr>
                </thead>
                <tbody>
                  {wildlifeLogs.map((w) => (
                    <tr key={w.id}>
                      <td><span className="code-pill">{w.id}</span></td>
                      <td><strong>{w.speciesCommon || w.species}</strong></td>
                      <td>{w.confidence}</td>
                      <td>
                        <span className={`threat-badge ${w.threatLevel?.toLowerCase() || 'medium'}`}>
                          {w.threatLevel || 'Medium'}
                        </span>
                      </td>
                      <td>{w.location}</td>
                      <td>{w.timestamp}</td>
                      <td>{w.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes and Agronomist Disclaimer */}
          <div className="report-disclaimer-box">
            <h4 style={{ fontSize: '0.9rem', marginBottom: '4px' }}>
              Verification Notes & Ecological Statement
            </h4>
            <p>
              AgroVision promotes non-lethal wildlife co-existence and strictly avoids any mechanisms that harm or endanger animals. Foliar disease diagnostics serve as decision-support aids; all chemical applications should follow licensed Krishi Vigyan Kendra (KVK) guidelines.
            </p>
            <div className="signatures-row">
              <div className="sig-block">
                <span className="sig-line" />
                <span className="sig-title">Farm Operator Signature</span>
              </div>
              <div className="sig-block">
                <span className="sig-line" />
                <span className="sig-title">Agronomist / Extension Officer</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
