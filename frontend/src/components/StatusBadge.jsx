import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toLowerCase();

  let className = 'badge ';
  switch (normalized) {
    case 'applied':
      className += 'badge-applied';
      break;
    case 'shortlisted':
      className += 'badge-shortlisted';
      break;
    case 'interview':
      className += 'badge-interview';
      break;
    case 'selected':
      className += 'badge-selected';
      break;
    case 'rejected':
    case 'not selected':
      className += 'badge-rejected';
      break;
    case 'upcoming':
      className += 'badge-upcoming';
      break;
    case 'ongoing':
      className += 'badge-ongoing';
      break;
    case 'completed':
      className += 'badge-completed';
      break;
    default:
      className += 'badge-applied';
  }

  return <span className={className}>{status}</span>;
};

export default StatusBadge;
