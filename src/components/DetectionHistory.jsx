import React, { useState, useEffect } from 'react';
import { Icon } from './Icons';
import {
  getWildlifeHistory,
  getCropHistory,
  deleteWildlifeEvent,
  deleteCropScan,
  clearWildlifeHistory,
  clearCropHistory,
  exportToCSV
} from '../utils/storage';
import { handleImageFallback, DEFAULT_CROP_IMAGE, DEFAULT_WILDLIFE_IMAGE } from '../utils/imageFallbacks';

export function DetectionHistory({ refreshTrigger }) {
  const [wildlifeList, setWildlifeList] = useState([]);
  const [cropList, setCropList] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all', 'wildlife', 'crop'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const loadData = () => {
    setWildlifeList(getWildlifeHistory());
    setCropList(getCropHistory());
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  // Combine and format records
  const combinedRecords = [
    ...wildlifeList.map((w) => ({
      ...w,
      category: 'wildlife',
      title: w.speciesCommon || w.species,
      detail: w.location,
      badgeText: `${w.threatLevel || 'Medium'} Threat`,
      badgeClass: w.threatLevel?.toLowerCase() || 'medium'
    })),
    ...cropList.map((c) => ({
      ...c,
      category: 'crop',
      title: `${c.crop} – ${c.condition}`,
      detail: c.treatment,
      badgeText: c.status,
      badgeClass: c.status === 'Healthy' ? 'positive' : 'warning'
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filtered
  const filteredRecords = combinedRecords.filter((r) => {
    const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.title.toLowerCase().includes(q) ||
      (r.detail && r.detail.toLowerCase().includes(q)) ||
      r.id.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const handleDelete = (item) => {
    if (window.confirm('Are you sure you want to delete this detection record?')) {
      if (item.category === 'wildlife') {
        deleteWildlifeEvent(item.id);
      } else {
        deleteCropScan(item.id);
      }
      loadData();
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all detection logs?')) {
      clearWildlifeHistory();
      clearCropHistory();
      loadData();
    }
  };

  const handleExportCSV = () => {
    if (!filteredRecords.length) return;
    const rows = filteredRecords.map((r) => ({
      ID: r.id,
      Category: r.category.toUpperCase(),
      Title: r.title,
      Confidence: r.confidence,
      Timestamp: r.timestamp,
      Status: r.status,
      Details: r.detail
    }));
    exportToCSV(`AgroVision_Detection_Ledger_${Date.now()}.csv`, rows);
  };

  return (
    <section id="history" className="section history-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="badge">
            <span className="badge-dot" />
            Unified Detection History
          </div>
          <h2 className="section-title">
            Crop Diagnostic & Wildlife Surveillance Ledger
          </h2>
          <p className="section-subtitle">
            Audit-ready historical records of foliage pathology scans and perimeter intrusion events with CSV export and printing.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="history-toolbar">
          <div className="toolbar-left">
            <div className="filter-pill-group">
              {[
                { id: 'all', label: 'All Records' },
                { id: 'crop', label: 'Crop Scans' },
                { id: 'wildlife', label: 'Wildlife Incidents' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`hist-filter-pill ${categoryFilter === f.id ? 'active' : ''}`}
                  onClick={() => setCategoryFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="hist-search-wrap">
              <Icon name="search" size={16} />
              <input
                type="text"
                placeholder="Search by ID, crop, or animal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="toolbar-right">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleExportCSV}
              disabled={filteredRecords.length === 0}
            >
              <Icon name="download" size={16} />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => window.print()}
            >
              <Icon name="printer" size={16} />
              <span>Print Ledger</span>
            </button>

            <button
              type="button"
              className="btn btn-glass btn-sm"
              onClick={handleClear}
              disabled={filteredRecords.length === 0}
              title="Clear all records"
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="ledger-card">
          <div className="table-responsive-wrapper">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Media</th>
                  <th>Type</th>
                  <th>Log ID</th>
                  <th>Classification / Species</th>
                  <th>Confidence</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-ledger-td">
                      <Icon name="check-circle" size={32} color="#16a34a" />
                      <p>No detection records match your filter criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => (
                    <tr key={item.id} className="ledger-row">
                      <td>
                        <img
                          src={item.image || item.thumbnail || (item.category === 'wildlife' ? DEFAULT_WILDLIFE_IMAGE : DEFAULT_CROP_IMAGE)}
                          alt={item.title}
                          className="ledger-thumb"
                          onError={(e) => handleImageFallback(e, item.category === 'wildlife' ? 'wildlife' : 'crop')}
                          onClick={() => setSelectedItem(item)}
                        />
                      </td>
                      <td>
                        <span className={`cat-chip ${item.category}`}>
                          <Icon name={item.category === 'wildlife' ? 'shield-alert' : 'leaf'} size={12} />
                          {item.category === 'wildlife' ? 'Wildlife' : 'Crop'}
                        </span>
                      </td>
                      <td>
                        <span className="code-pill">{item.id}</span>
                      </td>
                      <td>
                        <div className="cell-title-wrap">
                          <strong>{item.title}</strong>
                          <span className="cell-sub-detail text-ellipsis">{item.detail}</span>
                        </div>
                      </td>
                      <td>
                        <span className="conf-pill">{item.confidence}</span>
                      </td>
                      <td>
                        <span className="time-cell">{item.timestamp}</span>
                      </td>
                      <td>
                        <span className={`status-badge-pill ${item.badgeClass}`}>
                          {item.badgeText}
                        </span>
                      </td>
                      <td>
                        <div className="table-btn-actions">
                          <button
                            type="button"
                            className="icon-action-btn"
                            onClick={() => setSelectedItem(item)}
                            title="View record details"
                          >
                            <Icon name="eye" size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-action-btn delete"
                            onClick={() => handleDelete(item)}
                            title="Delete record"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Item Details Modal */}
        {selectedItem && (
          <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
            <div className="modal-container event-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">
                    {selectedItem.category === 'wildlife' ? 'Wildlife Incident' : 'Crop Pathology Scan'}: {selectedItem.id}
                  </h3>
                  <span className="modal-subtitle">{selectedItem.timestamp}</span>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setSelectedItem(null)}
                >
                  <Icon name="x" size={20} />
                </button>
              </div>

              <div className="event-modal-body">
                <img
                  src={selectedItem.image || selectedItem.thumbnail || (selectedItem.category === 'wildlife' ? DEFAULT_WILDLIFE_IMAGE : DEFAULT_CROP_IMAGE)}
                  alt={selectedItem.title}
                  className="modal-event-img"
                  onError={(e) => handleImageFallback(e, selectedItem.category === 'wildlife' ? 'wildlife' : 'crop')}
                />
                <div className="modal-event-fields">
                  <div className="m-field full">
                    <span>Classification / Title:</span>
                    <strong style={{ fontSize: '1.1rem' }}>{selectedItem.title}</strong>
                  </div>
                  <div className="m-field">
                    <span>Confidence Metric:</span>
                    <strong>{selectedItem.confidence}</strong>
                  </div>
                  <div className="m-field">
                    <span>Record Status:</span>
                    <strong>{selectedItem.status || selectedItem.badgeText}</strong>
                  </div>
                  <div className="m-field full">
                    <span>Details & Prescribed Remedy:</span>
                    <p>{selectedItem.detail || selectedItem.treatment || 'Verified field telemetry.'}</p>
                  </div>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => window.print()}
                >
                  <Icon name="printer" size={15} />
                  Print Single Report
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
