import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const { user, isAdmin } = useAuth();
  const targetHome = !user ? '/login' : isAdmin ? '/admin/dashboard' : '/student/dashboard';

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '30px',
      }}
    >
      <div
        style={{
          width: '70px',
          height: '70px',
          borderRadius: '50%',
          background: '#fee2e2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <AlertTriangle size={36} />
      </div>
      <h1 style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--slate-900)' }}>404</h1>
      <h2 style={{ fontSize: '1.4rem', color: 'var(--slate-700)', marginBottom: '10px' }}>Page Not Found</h2>
      <p style={{ color: 'var(--slate-500)', maxWidth: '420px', marginBottom: '24px' }}>
        The page you are trying to access does not exist or has been moved.
      </p>
      <Link to={targetHome} className="btn btn-primary">
        <Home size={18} />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};

export default NotFound;
