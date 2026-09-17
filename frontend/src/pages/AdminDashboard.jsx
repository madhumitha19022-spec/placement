import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Briefcase,
  FileSpreadsheet,
  Award,
  TrendingUp,
  PlusCircle,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardAPI.getStats();
      setStats(res.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner message="Loading placement dashboard analytics..." />;

  return (
    <div className="dashboard-page">
      {/* Top Banner / Welcome */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--slate-900)' }}>Placement Officer Dashboard</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.92rem' }}>
            Campus recruitment overview, drive pipelines, and student progress metrics.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/admin/drives" className="btn btn-primary btn-sm">
            <PlusCircle size={16} />
            <span>Create Drive</span>
          </Link>
          <Link to="/admin/companies" className="btn btn-secondary btn-sm">
            <Building2 size={16} />
            <span>Add Company</span>
          </Link>
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Total Students"
          value={stats?.total_students || 0}
          subtext="Enrolled candidates"
          icon={Users}
          color="var(--primary-600)"
          bgTint="var(--primary-50)"
        />
        <StatCard
          title="Partner Companies"
          value={stats?.total_companies || 0}
          subtext="Recruiting organizations"
          icon={Building2}
          color="#0284c7"
          bgTint="#e0f2fe"
        />
        <StatCard
          title="Active Drives"
          value={stats?.active_drives || 0}
          subtext={`${stats?.total_drives || 0} total drives scheduled`}
          icon={Briefcase}
          color="#16a34a"
          bgTint="#dcfce7"
        />
        <StatCard
          title="Total Applications"
          value={stats?.total_applications || 0}
          subtext="Across all company drives"
          icon={FileSpreadsheet}
          color="#d97706"
          bgTint="#fef3c7"
        />
        <StatCard
          title="Placed Students"
          value={`${stats?.placed_students || 0} (${stats?.placement_percentage || 0}%)`}
          subtext="Official offers accepted"
          icon={Award}
          color="#7c3aed"
          bgTint="#f3e8ff"
        />
        <StatCard
          title="Highest Offered CTC"
          value={stats?.max_package ? `${stats.max_package} LPA` : '0 LPA'}
          subtext={`Avg CTC: ${stats?.avg_package || 0} LPA`}
          icon={TrendingUp}
          color="#059669"
          bgTint="#ecfdf5"
        />
      </div>

      {/* Two Column Layout: Department Distribution & Recent Applications */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Department Placement Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Department-wise Placement</h3>
              <p className="card-subtitle">Placed students distribution by engineering branch</p>
            </div>
            <Link to="/admin/students" className="btn btn-secondary btn-sm">
              <span>View All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats?.department_summary && stats.department_summary.length > 0 ? (
              stats.department_summary.map((dept) => (
                <div key={dept.department}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                      {dept.name} ({dept.department})
                    </span>
                    <span style={{ color: 'var(--slate-600)' }}>
                      <strong>{dept.placed}</strong> / {dept.total} ({dept.percentage}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${dept.percentage}%`,
                        height: '100%',
                        background: 'var(--gradient-primary)',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease-in-out'
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                No student data recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Recent Applications Pipeline */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Applications</h3>
              <p className="card-subtitle">Latest student submissions for campus drives</p>
            </div>
            <Link to="/admin/applications" className="btn btn-secondary btn-sm">
              <span>Manage All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Company & Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_applications && stats.recent_applications.length > 0 ? (
                  stats.recent_applications.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{app.student_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>{app.student_register_number} ({app.student_department})</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{app.company_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{app.job_role}</div>
                      </td>
                      <td>
                        <StatusBadge status={app.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '24px' }}>
                      No applications submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
