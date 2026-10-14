import React, { useState } from 'react';
import { Icon } from './Icons';

export function NotificationCenterModal({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onClearAll
}) {
  if (!isOpen) return null;

  const [filter, setFilter] = useState('all');

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'warning':
        return <span className="notif-badge badge-warning">Alert</span>;
      case 'danger':
        return <span className="notif-badge badge-danger">Critical</span>;
      case 'info':
      default:
        return <span className="notif-badge badge-info">Info</span>;
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'wildlife':
        return <Icon name="shield-alert" size={18} color="#eab308" />;
      case 'crop':
        return <Icon name="leaf" size={18} color="#16a34a" />;
      case 'irrigation':
        return <Icon name="droplet" size={18} color="#0284c7" />;
      case 'weather':
        return <Icon name="cloud-sun" size={18} color="#f59e0b" />;
      default:
        return <Icon name="bell" size={18} color="#16a34a" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-container notification-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <Icon name="bell" size={20} color="#16a34a" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="modal-title">
                  AgroVision Notification Center
                </h3>
                {unreadCount > 0 && (
                  <span className="unread-pill">{unreadCount} New</span>
                )}
              </div>
              <p className="modal-subtitle">
                Live alerts across wildlife, crops, moisture, and weather
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="notif-filter-tabs">
          {[
            { id: 'all', label: 'All' },
            { id: 'wildlife', label: 'Wildlife' },
            { id: 'crop', label: 'Crop Health' },
            { id: 'irrigation', label: 'Irrigation' },
            { id: 'weather', label: 'Weather' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              className={`notif-tab-btn ${filter === tab.id ? 'active' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="notif-list-container">
          {filteredNotifs.length === 0 ? (
            <div className="empty-notif-box">
              <Icon name="check-circle" size={32} color="#16a34a" />
              <p>No alerts in this category.</p>
            </div>
          ) : (
            filteredNotifs.map(n => (
              <div
                key={n.id}
                className={`notif-item ${!n.read ? 'unread' : ''}`}
                onClick={() => onMarkAsRead(n.id)}
              >
                <div className="notif-icon-col">
                  {getIconForType(n.type)}
                </div>
                <div className="notif-body-col">
                  <div className="notif-top-line">
                    <span className="notif-title">{n.title}</span>
                    {getSeverityBadge(n.severity)}
                  </div>
                  <p className="notif-text">{n.message}</p>
                  <div className="notif-meta">
                    <span className="notif-time">{n.time}</span>
                    {!n.read && (
                      <span className="mark-read-hint">Click to mark read</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onClearAll}
            disabled={notifications.length === 0}
          >
            <Icon name="trash" size={14} />
            Clear All Notifications
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
