import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  FileSpreadsheet,
  Award,
  UserCheck,
  GraduationCap,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin, isStudent, logout } = useAuth();

  const adminNavItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/companies', label: 'Companies', icon: Building2 },
    { to: '/admin/drives', label: 'Placement Drives', icon: Briefcase },
    { to: '/admin/applications', label: 'Applications', icon: FileSpreadsheet },
    { to: '/admin/results', label: 'Placement Results', icon: Award },
  ];

  const studentNavItems = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/companies', label: 'Companies', icon: Building2 },
    { to: '/student/drives', label: 'Browse Drives', icon: Briefcase },
    { to: '/student/applications', label: 'My Applications', icon: FileSpreadsheet },
    { to: '/student/results', label: 'Placement Results', icon: Award },
    { to: '/student/profile', label: 'My Profile', icon: UserCheck },
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <>
      <div className={`sidebar-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo-icon">
            <GraduationCap size={22} />
          </div>
          <div className="sidebar-logo-text">
            <span>CAREER PORTAL</span>
            <span className="sidebar-logo-sub">Placement Cell</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">
            {isAdmin ? 'ADMINISTRATION' : 'STUDENT PORTAL'}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (window.innerWidth <= 900) onClose();
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-mini-card">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || user?.username}</span>
              <span className="user-role-badge">{isAdmin ? 'Placement Officer' : 'Student'}</span>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={logout}
            style={{ width: '100%', justifyContent: 'center', background: 'transparent', color: 'var(--slate-400)', borderColor: 'var(--slate-700)' }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
