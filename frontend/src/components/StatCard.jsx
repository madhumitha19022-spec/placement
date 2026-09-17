import React from 'react';

const StatCard = ({ title, value, subtext, icon: Icon, color = '#4f46e5', bgTint = '#eef2ff' }) => {
  return (
    <div className="stat-card">
      <div className="stat-info">
        <span className="stat-label">{title}</span>
        <span className="stat-value">{value}</span>
        {subtext && <span className="stat-subtext">{subtext}</span>}
      </div>
      {Icon && (
        <div className="stat-icon-wrapper" style={{ backgroundColor: bgTint, color: color }}>
          <Icon size={26} strokeWidth={2.2} />
        </div>
      )}
    </div>
  );
};

export default StatCard;
