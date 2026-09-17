import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const AlertBanner = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  let Icon = Info;
  let alertClass = 'alert-info';

  if (type === 'success') {
    Icon = CheckCircle2;
    alertClass = 'alert-success';
  } else if (type === 'danger' || type === 'error') {
    Icon = AlertCircle;
    alertClass = 'alert-danger';
  } else if (type === 'warning') {
    Icon = AlertTriangle;
    alertClass = 'alert-warning';
  }

  return (
    <div className={`alert ${alertClass}`}>
      <Icon size={20} style={{ flexShrink: 0, marginTop: '1px' }} />
      <div style={{ flex: 1 }}>{message}</div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '2px' }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
