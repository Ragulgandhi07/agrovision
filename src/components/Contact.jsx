import React, { useState } from 'react';
import { siteData } from '../siteData';
import { Icon } from './Icons';

export function Contact() {
  const { badge, title, subtitle, info, form } = siteData.contact;

  // Controlled form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    farmSize: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Wire submission to placeholder function for backend integration
  const handleBackendSubmission = async (payload) => {
    // Placeholder function: wire to your backend API or webhook here
    console.log('[SmartFarm API Demo] Form payload received:', payload);
    return new Promise((resolve) => setTimeout(resolve, 600));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    setIsSubmitting(true);
    try {
      await handleBackendSubmission(formData);
      setSubmitSuccess(true);
      // Clear form on submit as requested
      setFormData({
        name: '',
        email: '',
        phone: '',
        farmSize: '',
        message: ''
      });
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="section contact-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge">
            <span className="badge-dot" />
            {badge}
          </div>
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>

        {/* Two-Column Layout */}
        <div className="contact-grid">
          {/* Left Column: Contact Information Cards */}
          <div className="contact-info-panel">
            {info.map((item, idx) => (
              <div key={idx} className="contact-info-card">
                <div className="contact-icon-box">
                  <Icon name={item.icon} size={22} color="#16a34a" />
                </div>
                <div>
                  <h4>{item.title}</h4>
                  {item.lines.map((line, lIdx) => (
                    <p key={lIdx}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Controlled Contact Form */}
          <div className="contact-form-panel">
            <h3 className="form-header-h3">{form.title}</h3>
            <p className="form-header-p">{form.description}</p>

            {/* Success Alert Banner */}
            {submitSuccess && (
              <div className="form-success-banner" role="alert">
                <Icon name="check-circle" size={22} color="#16a34a" />
                <div>
                  <strong>Evaluation Request Sent Successfully!</strong>
                  <div style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                    An agricultural telemetry specialist will review your farm data and respond within 24 hours.
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="contact-form">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={form.fields.namePlaceholder}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={form.fields.emailPlaceholder}
                    className="form-control"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={form.fields.phonePlaceholder}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="farmSize">Total Acreage / Crops</label>
                  <input
                    type="text"
                    id="farmSize"
                    name="farmSize"
                    value={formData.farmSize}
                    onChange={handleChange}
                    placeholder={form.fields.farmSizePlaceholder}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="message">Farm Requirements &amp; Irrigation Setup *</label>
                <textarea
                  id="message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={form.fields.messagePlaceholder}
                  className="form-control"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: '6px' }}
              >
                {isSubmitting ? 'Transmitting Request...' : form.buttonText}
                <Icon name="arrow-right" size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
