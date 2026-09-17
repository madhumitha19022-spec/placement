import React from 'react';

export const LoadingSpinner = ({ message = 'Loading placement records...' }) => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
};

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-icon">
          <Icon size={32} />
        </div>
      )}
      <h4 className="empty-title">{title}</h4>
      {description && <p className="empty-desc">{description}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
};

export default LoadingSpinner;
