import React from 'react';
import { Menu, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ onToggleSidebar, title }) => {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <button
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="header-title">{title || 'Placement Management System'}</h1>
      </div>

      <div className="header-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="badge"
            style={{
              background: isAdmin ? 'var(--primary-50)' : '#ecfdf5',
              color: isAdmin ? 'var(--primary-700)' : '#047857',
              border: `1px solid ${isAdmin ? 'var(--primary-200)' : '#a7f3d0'}`,
              padding: '6px 12px',
              fontSize: '0.8rem',
            }}
          >
            {isAdmin ? '🛡️ Admin / Officer' : '🎓 Student'}
          </span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--slate-800)' }}>
            {user?.name || user?.username}
          </span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={logout}
          title="Sign Out"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <LogOut size={15} />
          <span style={{ display: 'none', md: 'inline' }}>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
