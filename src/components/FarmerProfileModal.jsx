import React, { useState } from 'react';
import { Icon } from './Icons';

export function FarmerProfileModal({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  settings,
  onSaveSettings
}) {
  if (!isOpen) return null;

  const [formData, setFormData] = useState({ ...profile });
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [soundVolume, setSoundVolume] = useState(settings.soundVolume);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfile(formData);
    onSaveSettings({
      ...settings,
      soundEnabled,
      soundVolume
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container profile-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Icon name="user" size={20} color="#16a34a" />
            </div>
            <div>
              <h3 className="modal-title">
                Farmer Profile & Settings
              </h3>
              <p className="modal-subtitle">
                Manage your farm credentials and notification preferences
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="x" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Farmer Name</label>
              <input
                type="text"
                name="farmerName"
                value={formData.farmerName || ''}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Farm / Holding Name</label>
              <input
                type="text"
                name="farmName"
                value={formData.farmName || ''}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>District / Farm Location</label>
              <input
                type="text"
                name="district"
                value={formData.district || ''}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Total Farm Area (Acres)</label>
              <input
                type="text"
                name="landSize"
                value={formData.landSize || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group full-width">
              <label>Primary Crops Grown</label>
              <input
                type="text"
                name="primaryCrops"
                value={formData.primaryCrops || ''}
                onChange={handleChange}
                placeholder="e.g. Paddy, Tomato, Banana, Sugarcane"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Soil Classification</label>
              <input
                type="text"
                name="soilType"
                value={formData.soilType || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="settings-divider" />

          {/* Sound Notification Preferences */}
          <div className="sound-pref-box">
            <div className="sound-pref-header">
              <div className="sound-pref-icon">
                <Icon name={soundEnabled ? 'volume-2' : 'volume-x'} size={20} color="#16a34a" />
              </div>
              <div className="sound-pref-info">
                <h4>Mild Wildlife Detection Alert Sound</h4>
                <p>
                  Gentle Web Audio two-tone harmonic chime alerts you when animals are detected.
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {soundEnabled && (
              <div className="volume-slider-wrap">
                <span className="vol-label">Volume: {Math.round(soundVolume * 100)}%</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                  className="volume-slider"
                />
              </div>
            )}
          </div>

          {saveSuccess && (
            <div className="save-success-banner">
              <Icon name="check" size={16} />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Icon name="check" size={16} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
