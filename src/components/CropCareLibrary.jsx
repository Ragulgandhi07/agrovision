import React, { useState } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function CropCareLibrary() {
  const crops = siteData.cropCareLibrary;

  const [selectedCropId, setSelectedCropId] = useState(crops[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('stages'); // 'stages', 'water', 'soil', 'diseases', 'wildlife'

  const activeCrop = crops.find((c) => c.id === selectedCropId) || crops[0];

  // Filter crops
  const filteredCrops = crops.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.scientificName.toLowerCase().includes(q)
    );
  });

  return (
    <section id="crop-care" className="section crop-care-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge">
            <span className="badge-dot" />
            Crop Care & Agronomy Library
          </div>
          <h2 className="section-title">
            Crop Agronomy & Sustainable Crop Protection
          </h2>
          <p className="section-subtitle">
            Searchable field agronomy covering growth milestones, precision watering, balanced nutrition, and safe wildlife bio-deterrents.
          </p>
        </div>

        {/* Search & Crop Selection Strip */}
        <div className="crop-search-strip">
          <div className="crop-search-box">
            <Icon name="search" size={18} />
            <input
              type="text"
              placeholder="Search crop by name (e.g. Rice, Tomato, Sugarcane, Cotton, Banana)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="crop-chips-list">
            {filteredCrops.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`crop-select-pill ${activeCrop.id === c.id ? 'active' : ''}`}
                onClick={() => setSelectedCropId(c.id)}
              >
                <Icon name="sprout" size={15} />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Crop Comprehensive Card */}
        <div className="crop-detail-card">
          {/* Card Top Title Banner */}
          <div className="crop-title-banner">
            <div>
              <span className="crop-scientific-name"><i>{activeCrop.scientificName}</i></span>
              <h3 className="crop-main-name">
                {activeCrop.name}
              </h3>
              <span className="crop-season-tag">
                <Icon name="calendar" size={14} />
                {activeCrop.season}
              </span>
            </div>

            <div className="crop-banner-badges">
              <span className="badge-pill bg-green-subtle">
                <Icon name="check-circle" size={14} color="#16a34a" /> Verified Agronomy Guidelines
              </span>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="crop-sub-tabs">
            {[
              { id: 'stages', icon: 'trending-up', label: 'Growth Stages' },
              { id: 'water', icon: 'droplet', label: 'Watering Guidance' },
              { id: 'soil', icon: 'layers', label: 'Soil & Fertilizer' },
              { id: 'diseases', icon: 'leaf', label: 'Common Diseases' },
              { id: 'wildlife', icon: 'shield-alert', label: 'Wildlife Deterrents' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`sub-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Display */}
          <div className="crop-tab-content-pane">
            {/* 1. Growth Stages */}
            {activeTab === 'stages' && (
              <div className="stages-timeline">
                <h4>Chronological Growth Stages & Crop Milestones</h4>
                <div className="timeline-grid">
                  {activeCrop.growthStages.map((st, i) => (
                    <div key={i} className="timeline-node">
                      <div className="node-marker">{i + 1}</div>
                      <div className="node-body">
                        <h5>{st.stage}</h5>
                        <p>{st.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Watering Guidance */}
            {activeTab === 'water' && (
              <div className="tab-text-block">
                <h4>
                  <Icon name="droplets" size={20} color="#0284c7" />
                  Field Irrigation Schedule & Water Management
                </h4>
                <p className="primary-guidance-p">
                  {activeCrop.wateringGuidance}
                </p>
                <div className="tip-box">
                  <Icon name="check-circle" size={16} color="#16a34a" />
                  <span>
                    Ensuring adequate furrow drainage avoids soil anaerobic compaction and prevents Pythium root rot.
                  </span>
                </div>
              </div>
            )}

            {/* 3. Soil & Fertilizer */}
            {activeTab === 'soil' && (
              <div className="tab-two-col">
                <div className="soil-col">
                  <h4>
                    <Icon name="layers" size={18} color="#d97706" />
                    Soil Preparation & Optimal pH
                  </h4>
                  <p>{activeCrop.soilPrep}</p>
                </div>
                <div className="fert-col">
                  <h4>
                    <Icon name="sprout" size={18} color="#16a34a" />
                    Nutrient & Fertilizer Guidance (NPK)
                  </h4>
                  <p>{activeCrop.fertilizerGuidance}</p>
                  <span className="advisor-note">
                    * Tailor fertilizer application according to your local Soil Health Card (SHC) report.
                  </span>
                </div>
              </div>
            )}

            {/* 4. Common Diseases */}
            {activeTab === 'diseases' && (
              <div className="tab-text-block">
                <h4>
                  <Icon name="shield-alert" size={20} color="#ef4444" />
                  Prevalent Foliar Pathogens & Fungal Threats
                </h4>
                <p className="primary-guidance-p">
                  {activeCrop.commonDiseases}
                </p>
                <div className="action-guide-box">
                  <Icon name="scan" size={18} color="#16a34a" />
                  <div>
                    <h5>Suspect Foliage Pathology?</h5>
                    <p>
                      Capture a close-up leaf photo and run it through our AI Crop Disease Diagnosis tool for automated confidence classification.
                    </p>
                    <a href="#crop-disease" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
                      <Icon name="scan" size={14} />
                      Launch AI Leaf Scanner
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Wildlife Deterrents */}
            {activeTab === 'wildlife' && (
              <div className="tab-text-block wildlife-tab-highlight">
                <h4>
                  <Icon name="shield" size={20} color="#16a34a" />
                  Eco-Friendly, Non-Lethal Wildlife Protection
                </h4>
                <p className="primary-guidance-p">
                  {activeCrop.wildlifeSafety}
                </p>
                <div className="non-lethal-card">
                  <h5>Approved Harmless Deterrent Strategies:</h5>
                  <ul>
                    <li>
                      <Icon name="check" size={14} color="#16a34a" />
                      <span>Chili-Grease Border Ropes (Natural olfactory repellent for elephants & boars)</span>
                    </li>
                    <li>
                      <Icon name="check" size={14} color="#16a34a" />
                      <span>Solar-Powered Intermittent LED Strobes (Disrupts nocturnal grazing)</span>
                    </li>
                    <li>
                      <Icon name="check" size={14} color="#16a34a" />
                      <span>Bio-Fencing with Agave / Sisal and Beehive corridor deterrents</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
