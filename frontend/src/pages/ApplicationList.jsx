import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  Edit2,
  Trash2,
  Award,
  Eye,
  Check,
  XCircle,
  Sparkles
} from 'lucide-react';
import { applicationAPI, resultAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal, { ConfirmDialog } from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner, { EmptyState } from '../components/LoadingSpinner';

const ApplicationList = () => {
  const { isAdmin, isStudent } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Update Status Modal
  const [selectedApp, setSelectedApp] = useState(null);
  const [newStatus, setNewStatus] = useState('Applied');
  const [remarks, setRemarks] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Quick Result Modal (when changing to Selected)
  const [recordResult, setRecordResult] = useState(false);
  const [offerPackage, setOfferPackage] = useState('');
  const [joiningDate, setJoiningDate] = useState('');

  // Application Status Details Modal State
  const [detailsApp, setDetailsApp] = useState(null);

  // Student Withdraw Application State
  const [withdrawApp, setWithdrawApp] = useState(null);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const res = await applicationAPI.getAll(params);
      setApplications(res.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to load applications.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchApplications();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  const handleOpenStatusModal = (app) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setRemarks(app.remarks || '');
    setRecordResult(app.status === 'Selected');
    setOfferPackage(app.package || '');
    setJoiningDate('');
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    setStatusLoading(true);
    try {
      // 1. Update application status
      await applicationAPI.updateStatus(selectedApp.id, {
        status: newStatus,
        remarks: remarks.trim(),
      });

      // 2. If status is Selected and offer details are provided, record PlacementResult
      if (newStatus === 'Selected' && offerPackage) {
        await resultAPI.create({
          application: selectedApp.id,
          result_status: 'Selected',
          package: parseFloat(offerPackage).toFixed(2),
          joining_date: joiningDate || null,
          remarks: remarks.trim() || 'Selected in campus drive.',
        }).catch((err) => {
          console.warn('Result might already exist or need update:', err.message);
        });
      }

      setAlert({
        type: 'success',
        message: `Application for ${selectedApp.student_name} updated to '${newStatus}'.`,
      });
      setSelectedApp(null);
      fetchApplications();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update application status.' });
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);

    try {
      await applicationAPI.delete(deleteId);
      setAlert({ type: 'success', message: 'Application deleted successfully.' });
      setDeleteId(null);
      fetchApplications();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to delete application.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleWithdrawConfirm = async () => {
    if (!withdrawApp) return;
    setDeleteLoading(true);

    try {
      await applicationAPI.delete(withdrawApp.id);
      setAlert({
        type: 'success',
        message: `Application for ${withdrawApp.job_role} at ${withdrawApp.company_name} withdrawn successfully.`,
      });
      setWithdrawApp(null);
      fetchApplications();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to withdraw application.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--slate-900)' }}>
            {isAdmin ? 'Drive Applications Tracking' : 'My Placement Applications'}
          </h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.92rem' }}>
            {isAdmin
              ? 'Review candidate submissions, shortlisting rounds, interview stages, and final selections.'
              : 'Track the status and progress of all your campus placement drive applications.'}
          </p>
        </div>
      </div>

      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Toolbar: Search & Status Filter */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by student name, roll number, company, or job role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Filter size={16} color="var(--slate-500)" />
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Application Statuses</option>
              <option value="Applied">Applied</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview">Interview</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading applications..." />
        ) : applications.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="No Applications Found"
            description="No applications match the current filter or search criteria."
          />
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  {isAdmin && <th>Student Details</th>}
                  <th>Company & Role</th>
                  <th>CTC Package</th>
                  <th>Applied On</th>
                  <th>Status</th>
                  <th>Officer Remarks</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    {isAdmin && (
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                          {app.student_name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                          {app.student_register_number} • {app.student_department} (CGPA: {app.student_cgpa})
                        </div>
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                        {app.company_name}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>
                        {app.job_role}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                        {app.package} LPA
                      </span>
                    </td>
                    <td style={{ fontSize: '0.86rem' }}>{app.application_date}</td>
                    <td>
                      <StatusBadge status={app.status} />
                    </td>
                    <td>
                      <div style={{ fontSize: '0.84rem', color: 'var(--slate-600)', maxWidth: '240px' }}>
                        {app.remarks || '—'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setDetailsApp(app)}
                          title="View Detailed Application Status"
                        >
                          <Eye size={14} />
                          <span>Status</span>
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenStatusModal(app)}
                              title="Update Status"
                            >
                              <Edit2 size={14} />
                              <span>Update</span>
                            </button>
                            <button
                              className="btn-icon"
                              style={{ color: 'var(--danger-main)' }}
                              onClick={() => setDeleteId(app.id)}
                              title="Delete Application"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}

                        {isStudent && app.status === 'Applied' && (
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--danger-main)' }}
                            onClick={() => setWithdrawApp(app)}
                            title="Withdraw Application"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Application Status Modal */}
      {selectedApp && (
        <Modal
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={`Update Status: ${selectedApp.student_name}`}
          maxWidth="550px"
        >
          <form onSubmit={handleStatusSubmit}>
            <div className="modal-body">
              <div style={{ background: 'var(--slate-50)', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--slate-900)' }}>
                  {selectedApp.student_name} ({selectedApp.student_register_number})
                </div>
                <div style={{ fontSize: '0.86rem', color: 'var(--primary-600)', fontWeight: 600 }}>
                  {selectedApp.company_name} - {selectedApp.job_role}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                  Branch: {selectedApp.student_department} • CGPA: {selectedApp.student_cgpa}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Application Status <span className="required">*</span>
                </label>
                <select
                  className="form-control"
                  value={newStatus}
                  onChange={(e) => {
                    setNewStatus(e.target.value);
                    if (e.target.value === 'Selected') setRecordResult(true);
                  }}
                  required
                >
                  <option value="Applied">Applied (Under Screening)</option>
                  <option value="Shortlisted">Shortlisted (Online Test Passed)</option>
                  <option value="Interview">Interview (Technical / HR Round)</option>
                  <option value="Selected">Selected (Offer Letter Issued)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Review Remarks / Round Notes</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Cleared technical interview round 2..."
                />
              </div>

              {/* If Selected, allow recording CTC & joining date */}
              {newStatus === 'Selected' && (
                <div style={{ borderTop: '1px dashed var(--slate-200)', paddingTop: '14px', marginTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: 'var(--success-text)', fontWeight: 700, fontSize: '0.88rem' }}>
                    <Award size={16} />
                    <span>Record Official Placement Result</span>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Final Offered Package (LPA)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={offerPackage}
                        onChange={(e) => setOfferPackage(e.target.value)}
                        placeholder="e.g. 9.50"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Expected Date of Joining</label>
                      <input
                        type="date"
                        className="form-control"
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedApp(null)}
                disabled={statusLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={statusLoading}
              >
                {statusLoading ? 'Updating...' : 'Save Application Status'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Application Status Details Modal */}
      {detailsApp && (
        <Modal
          isOpen={Boolean(detailsApp)}
          onClose={() => setDetailsApp(null)}
          title="Application Status & Progression"
          maxWidth="640px"
        >
          <div className="modal-body">
            {/* Target Job Header */}
            <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                    {detailsApp.job_role}
                  </h3>
                  <div style={{ fontWeight: 600, color: 'var(--primary-700)', fontSize: '0.95rem', marginTop: '4px' }}>
                    {detailsApp.company_name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                    Applicant: {detailsApp.student_name} ({detailsApp.student_register_number}) • {detailsApp.student_department}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                    {detailsApp.package} LPA
                  </span>
                  <div style={{ marginTop: '4px' }}>
                    <StatusBadge status={detailsApp.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Step Pipeline: Applied -> Shortlisted -> Interview -> Selected / Rejected */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--slate-700)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '14px' }}>
                Recruitment Stage Pipeline
              </h4>

              {(() => {
                const stages = ['Applied', 'Shortlisted', 'Interview', detailsApp.status === 'Rejected' ? 'Rejected' : 'Selected'];
                const statusOrder = { Applied: 1, Shortlisted: 2, Interview: 3, Selected: 4, Rejected: 4 };
                const currentRank = statusOrder[detailsApp.status] || 1;

                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                    {stages.map((stage, idx) => {
                      const stageRank = idx + 1;
                      const isCompleted = currentRank > stageRank || (currentRank === stageRank && stage === 'Selected');
                      const isCurrent = currentRank === stageRank;
                      const isRejected = stage === 'Rejected' && detailsApp.status === 'Rejected';

                      let circleBg = 'var(--slate-200)';
                      let circleColor = 'var(--slate-600)';
                      let labelColor = 'var(--slate-500)';

                      if (isCompleted || (isCurrent && stage !== 'Rejected')) {
                        circleBg = 'var(--primary-600)';
                        circleColor = '#ffffff';
                        labelColor = 'var(--slate-900)';
                      }
                      if (isCurrent) {
                        circleBg = isRejected ? 'var(--danger-main)' : 'var(--primary-600)';
                        circleColor = '#ffffff';
                        labelColor = isRejected ? 'var(--danger-text)' : 'var(--primary-700)';
                      }

                      return (
                        <React.Fragment key={stage}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: circleBg,
                                color: circleColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                boxShadow: isCurrent ? '0 0 0 4px rgba(79, 70, 229, 0.2)' : 'none',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              {isCompleted ? <Check size={18} /> : isRejected ? <XCircle size={18} /> : stageRank}
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: isCurrent ? 700 : 500, color: labelColor, marginTop: '6px' }}>
                              {stage}
                            </span>
                          </div>
                          {idx < stages.length - 1 && (
                            <div
                              style={{
                                flex: 1,
                                height: '3px',
                                background: currentRank > stageRank ? 'var(--primary-600)' : 'var(--slate-200)',
                                margin: '-18px 8px 0 8px',
                                zIndex: 1,
                              }}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Stage Feedback / Remarks Box */}
            <div style={{ border: '1px solid var(--slate-200)', borderRadius: '10px', padding: '16px', background: 'var(--slate-50)' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', textTransform: 'uppercase', fontWeight: 600 }}>
                Review Notes & Feedback
              </div>
              <div style={{ marginTop: '6px', fontSize: '0.92rem', color: 'var(--slate-800)', lineHeight: '1.5' }}>
                {detailsApp.remarks || 'Application received and logged into campus placement system. Awaiting next stage review.'}
              </div>
              <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--slate-500)', display: 'flex', gap: '16px' }}>
                <span>Application Date: <strong>{detailsApp.application_date}</strong></span>
              </div>
            </div>

            {/* Offer Result Banner if Selected */}
            {detailsApp.status === 'Selected' && (
              <div style={{ marginTop: '16px', padding: '14px', background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={24} color="var(--success-main)" />
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--success-text)', fontSize: '0.96rem' }}>
                    Congratulations! Placement Offer Confirmed!
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--success-text)', opacity: 0.9, marginTop: '2px' }}>
                    Offer verified by Placement Cell. Please verify your details in the Placement Results tab.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDetailsApp(null)}
            >
              Close
            </button>
            {isAdmin && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const target = detailsApp;
                  setDetailsApp(null);
                  handleOpenStatusModal(target);
                }}
              >
                <span>Change Status</span>
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Withdraw Application Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(withdrawApp)}
        onClose={() => setWithdrawApp(null)}
        onConfirm={handleWithdrawConfirm}
        title="Withdraw Application"
        message={`Are you sure you want to withdraw your application for ${withdrawApp?.job_role} at ${withdrawApp?.company_name}? You can re-apply prior to the drive deadline.`}
        confirmText="Withdraw Application"
        loading={deleteLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Application"
        message="Are you sure you want to delete this application record?"
        loading={deleteLoading}
      />
    </div>
  );
};

export default ApplicationList;
