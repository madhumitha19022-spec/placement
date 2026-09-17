import React, { useState, useEffect } from 'react';
import {
  Award,
  Search,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { resultAPI, applicationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal, { ConfirmDialog } from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner, { EmptyState } from '../components/LoadingSpinner';

const ResultList = () => {
  const { isAdmin } = useAuth();

  const [results, setResults] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    application: '',
    result_status: 'Selected',
    package: '',
    joining_date: '',
    remarks: '',
  });

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.result_status = statusFilter;

      const [resRes, appsRes] = await Promise.all([
        resultAPI.getAll(params),
        isAdmin ? applicationAPI.getAll() : Promise.resolve({ data: [] }),
      ]);

      setResults(resRes.data || []);
      setApplications(appsRes.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to fetch placement results.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchResults();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedResultId(null);
    setFormData({
      application: applications.length > 0 ? applications[0].id : '',
      result_status: 'Selected',
      package: '',
      joining_date: '',
      remarks: 'Offer letter issued.',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (result) => {
    setIsEditing(true);
    setSelectedResultId(result.id);
    setFormData({
      application: result.application,
      result_status: result.result_status,
      package: result.package,
      joining_date: result.joining_date || '',
      remarks: result.remarks || '',
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.application || !formData.package) {
      setAlert({ type: 'danger', message: 'Application and package are required.' });
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        package: parseFloat(formData.package).toFixed(2),
        joining_date: formData.joining_date || null,
      };

      if (isEditing) {
        await resultAPI.update(selectedResultId, payload);
        setAlert({ type: 'success', message: 'Placement result updated successfully.' });
      } else {
        await resultAPI.create(payload);
        setAlert({ type: 'success', message: 'Official placement result recorded.' });
      }
      setModalOpen(false);
      fetchResults();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to save placement result.' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);

    try {
      await resultAPI.delete(deleteId);
      setAlert({ type: 'success', message: 'Placement result removed.' });
      setDeleteId(null);
      fetchResults();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to delete placement result.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--slate-900)' }}>Campus Placement Results</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.92rem' }}>
            Official list of selected students, offered CTC packages, and corporate joining details.
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Record Placement Result</span>
          </button>
        )}
      </div>

      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Toolbar */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search results by student name, roll number, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching placement offers..." />
        ) : results.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No Results Recorded Yet"
            description="Official placement results will be displayed here once candidates receive offers."
            action={
              isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
                  <Plus size={16} />
                  <span>Record First Offer</span>
                </button>
              )
            }
          />
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Placed Student</th>
                  <th>Company & Role</th>
                  <th>Offered CTC</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th>HR / Cell Remarks</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {results.map((res) => (
                  <tr key={res.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                        {res.student_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                        {res.student_register_number} • Dept of {res.student_department}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{res.company_name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)' }}>{res.job_role}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#059669', fontSize: '1.05rem' }}>
                        {res.package} LPA
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} color="var(--slate-400)" />
                        <span>{res.joining_date || 'TBD'}</span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={res.result_status} />
                    </td>
                    <td>
                      <div style={{ fontSize: '0.84rem', color: 'var(--slate-600)', maxWidth: '240px' }}>
                        {res.remarks || '—'}
                      </div>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEditModal(res)}
                            title="Edit Result"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--danger-main)' }}
                            onClick={() => setDeleteId(res.id)}
                            title="Delete Result"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Result Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={isEditing ? 'Edit Placement Result' : 'Record Placement Result'}
          maxWidth="550px"
        >
          <form onSubmit={handleFormSubmit}>
            <div className="modal-body">
              {!isEditing && (
                <div className="form-group">
                  <label className="form-label">
                    Select Student Application <span className="required">*</span>
                  </label>
                  <select
                    name="application"
                    className="form-control"
                    value={formData.application}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Application</option>
                    {applications.map((app) => (
                      <option key={app.id} value={app.id}>
                        {app.student_name} ({app.student_register_number}) - {app.company_name} ({app.job_role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Result Status <span className="required">*</span>
                  </label>
                  <select
                    name="result_status"
                    className="form-control"
                    value={formData.result_status}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="Selected">Selected</option>
                    <option value="Not Selected">Not Selected</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Offered CTC (in LPA) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="package"
                    className="form-control"
                    placeholder="e.g. 10.50"
                    value={formData.package}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Expected Date of Joining</label>
                <input
                  type="date"
                  name="joining_date"
                  className="form-control"
                  value={formData.joining_date}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Placement Officer Remarks</label>
                <textarea
                  name="remarks"
                  className="form-control"
                  rows={2}
                  value={formData.remarks}
                  onChange={handleFormChange}
                  placeholder="Offer letter issued, location details, etc."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setModalOpen(false)}
                disabled={formLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={formLoading}
              >
                {formLoading ? 'Saving...' : isEditing ? 'Update Result' : 'Record Result'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Placement Result"
        message="Are you sure you want to delete this placement result record?"
        loading={deleteLoading}
      />
    </div>
  );
};

export default ResultList;
