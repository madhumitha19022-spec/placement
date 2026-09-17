import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Briefcase,
  FileSpreadsheet,
  Award,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { driveAPI, applicationAPI, resultAPI, studentAPI } from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import AlertBanner from '../components/AlertBanner';
import Modal from '../components/Modal';

const StudentDashboard = () => {
  const { user, studentProfile, refreshProfile } = useAuth();

  const [drives, setDrives] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Apply Modal state
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [applyRemarks, setApplyRemarks] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [drivesRes, appsRes, resultsRes, profileRes] = await Promise.all([
        driveAPI.getAll(),
        applicationAPI.getAll(),
        resultAPI.getAll(),
        studentAPI.getProfile().catch(() => ({ data: studentProfile }))
      ]);

      if (profileRes?.data) {
        refreshProfile(profileRes.data);
      }

      setDrives(drivesRes.data || []);
      setMyApplications(appsRes.data || []);
      setMyResults(resultsRes.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load student dashboard information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyClick = (drive) => {
    setSelectedDrive(drive);
    setApplyRemarks('Interested in this role. Resume submitted.');
  };

  const handleConfirmApply = async (e) => {
    e.preventDefault();
    if (!selectedDrive) return;

    setApplyLoading(true);
    setError('');

    try {
      await driveAPI.apply(selectedDrive.id, applyRemarks);
      setSuccess(`Application submitted successfully for ${selectedDrive.company_name} - ${selectedDrive.job_role}!`);
      setSelectedDrive(null);
      fetchData(); // Refresh apps
    } catch (err) {
      setError(err.message || 'Application submission failed.');
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading your placement dashboard..." />;

  const myAppliedDriveIds = new Set(myApplications.map((app) => app.placement_drive));
  const studentCgpa = parseFloat(studentProfile?.cgpa || '0');
  const studentDept = (studentProfile?.department || '').toUpperCase();

  // Check offer letter
  const selectedOffer = myResults.find((r) => r.result_status === 'Selected');

  return (
    <div className="student-dashboard">
      {/* Student Profile Overview Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
          color: 'white',
          marginBottom: '24px',
          border: 'none',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.4)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <GraduationCap size={36} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white' }}>
                  {studentProfile?.name || user?.name}
                </h2>
                <span
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    fontSize: '0.75rem',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontWeight: 600,
                  }}
                >
                  {studentProfile?.register_number}
                </span>
              </div>
              <p style={{ color: '#c7d2fe', fontSize: '0.9rem', marginTop: '4px' }}>
                Department of {studentProfile?.department} • Year {studentProfile?.year} • College Placement Candidate
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '10px 18px',
                borderRadius: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#a5b4fc' }}>
                Current CGPA
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8' }}>
                {studentProfile?.cgpa || '0.00'}
              </div>
            </div>

            <Link
              to="/student/profile"
              className="btn"
              style={{ background: 'white', color: '#312e81', fontWeight: 700 }}
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <AlertBanner type="success" message={success} onClose={() => setSuccess('')} />
      <AlertBanner type="error" message={error} onClose={() => setError('')} />

      {/* Official Offer Letter Banner (if selected) */}
      {selectedOffer && (
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            color: 'white',
            marginBottom: '24px',
            border: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '14px', borderRadius: '14px' }}>
              <Sparkles size={32} color="#fde047" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a7f3d0', fontWeight: 700 }}>
                🎉 Congratulations! Official Campus Placement Offer Issued
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'white', margin: '4px 0' }}>
                Selected at {selectedOffer.company_name} for {selectedOffer.job_role}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#e6fffa' }}>
                Package CTC: <strong>{selectedOffer.package} LPA</strong> • Expected Joining: {selectedOffer.joining_date || 'To be scheduled'}
              </p>
              {selectedOffer.remarks && (
                <p style={{ fontSize: '0.85rem', color: '#bbf7d0', marginTop: '4px', fontStyle: 'italic' }}>
                  Remarks: "{selectedOffer.remarks}"
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student KPI Stats Grid */}
      <div className="stats-grid">
        <StatCard
          title="Active Drives"
          value={drives.filter((d) => d.status === 'Upcoming' || d.status === 'Ongoing').length}
          subtext="Recruitment drives open"
          icon={Briefcase}
          color="var(--primary-600)"
          bgTint="var(--primary-50)"
        />
        <StatCard
          title="Applications Sent"
          value={myApplications.length}
          subtext="Applied drives"
          icon={FileSpreadsheet}
          color="#0284c7"
          bgTint="#e0f2fe"
        />
        <StatCard
          title="Shortlisted / Interviews"
          value={myApplications.filter((a) => a.status === 'Shortlisted' || a.status === 'Interview').length}
          subtext="Active recruitment rounds"
          icon={Calendar}
          color="#d97706"
          bgTint="#fef3c7"
        />
        <StatCard
          title="Placement Offers"
          value={myResults.filter((r) => r.result_status === 'Selected').length}
          subtext="Official company offers"
          icon={Award}
          color="#059669"
          bgTint="#ecfdf5"
        />
      </div>

      {/* Available Placement Drives & Eligibility Check */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Available Placement Drives</h3>
            <p className="card-subtitle">Explore open campus recruitment drives and verify your eligibility</p>
          </div>
          <Link to="/student/drives" className="btn btn-secondary btn-sm">
            <span>View All Drives</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Package (CTC)</th>
                <th>Min. CGPA</th>
                <th>Deadline</th>
                <th>Eligibility</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {drives && drives.length > 0 ? (
                drives.slice(0, 5).map((drive) => {
                  const alreadyApplied = myAppliedDriveIds.has(drive.id);
                  const isEligibleCgpa = studentCgpa >= parseFloat(drive.eligibility_cgpa);
                  const eligibleDepts = drive.eligible_department.split(',').map((d) => d.trim().toUpperCase());
                  const isEligibleDept = eligibleDepts.includes('ALL') || eligibleDepts.includes(studentDept);
                  const isEligible = isEligibleCgpa && isEligibleDept;

                  return (
                    <tr key={drive.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{drive.company_name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>{drive.company_location}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{drive.job_role}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{drive.package} LPA</span>
                      </td>
                      <td>{drive.eligibility_cgpa} CGPA</td>
                      <td style={{ fontSize: '0.85rem' }}>{drive.application_deadline}</td>
                      <td>
                        {alreadyApplied ? (
                          <span className="badge badge-applied">Applied</span>
                        ) : isEligible ? (
                          <span className="badge badge-selected">✓ Eligible</span>
                        ) : (
                          <span
                            className="badge badge-rejected"
                            title={!isEligibleCgpa ? `Requires ${drive.eligibility_cgpa} CGPA` : 'Dept not eligible'}
                          >
                            {!isEligibleCgpa ? `CGPA < ${drive.eligibility_cgpa}` : 'Dept Ineligible'}
                          </span>
                        )}
                      </td>
                      <td>
                        {alreadyApplied ? (
                          <span style={{ fontSize: '0.82rem', color: 'var(--slate-500)', fontWeight: 500 }}>
                            Submitted
                          </span>
                        ) : isEligible ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleApplyClick(drive)}
                          >
                            Apply Now
                          </button>
                        ) : (
                          <button className="btn btn-secondary btn-sm" disabled title="Eligibility criteria not met">
                            Not Eligible
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '24px' }}>
                    No placement drives available right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Applications Tracking */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">My Application History</h3>
            <p className="card-subtitle">Real-time status updates on your job applications</p>
          </div>
          <Link to="/student/applications" className="btn btn-secondary btn-sm">
            <span>All Applications</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Package</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {myApplications && myApplications.length > 0 ? (
                myApplications.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{app.company_name}</td>
                    <td style={{ fontWeight: 500 }}>{app.job_role}</td>
                    <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{app.package} LPA</td>
                    <td style={{ fontSize: '0.85rem' }}>{app.application_date}</td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td style={{ fontSize: '0.84rem', color: 'var(--slate-600)' }}>
                      {app.remarks || 'Under review'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--slate-400)', padding: '24px' }}>
                    You have not applied for any placement drives yet. Explore available drives above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Apply Confirmation Modal */}
      {selectedDrive && (
        <Modal
          isOpen={Boolean(selectedDrive)}
          onClose={() => setSelectedDrive(null)}
          title={`Apply for ${selectedDrive.company_name}`}
        >
          <form onSubmit={handleConfirmApply}>
            <div className="modal-body">
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '0.92rem', color: 'var(--slate-600)' }}>
                  You are about to submit your application for:
                </p>
                <div style={{ margin: '12px 0', padding: '12px 16px', background: 'var(--slate-50)', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)' }}>
                    {selectedDrive.job_role}
                  </div>
                  <div style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.9rem' }}>
                    {selectedDrive.company_name} • {selectedDrive.package} LPA
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                    Drive Date: {selectedDrive.drive_date} • Application Deadline: {selectedDrive.application_deadline}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Applicant Statement / Remarks</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={applyRemarks}
                  onChange={(e) => setApplyRemarks(e.target.value)}
                  placeholder="Mention your relevant skills or interest in this role..."
                />
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                ℹ️ Your profile information (CGPA: {studentProfile?.cgpa}, Dept: {studentProfile?.department}, Skills: {studentProfile?.skills || 'N/A'}) will be submitted to the placement officer.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedDrive(null)}
                disabled={applyLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={applyLoading}
              >
                {applyLoading ? 'Submitting...' : 'Confirm & Submit Application'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StudentDashboard;
