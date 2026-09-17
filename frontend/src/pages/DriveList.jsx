import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Calendar,
  Users,
  Eye,
  Check,
  XCircle,
  MapPin
} from 'lucide-react';
import { driveAPI, companyAPI, applicationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal, { ConfirmDialog } from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner, { EmptyState } from '../components/LoadingSpinner';

const DriveList = () => {
  const { isAdmin, isStudent, studentProfile } = useAuth();

  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    company: '',
    job_role: '',
    description: '',
    package: '',
    eligibility_cgpa: '',
    eligible_department: 'All',
    drive_date: '',
    application_deadline: '',
    vacancies: 1,
    status: 'Upcoming',
  });

  // Apply Modal State (for students)
  const [applyModalDrive, setApplyModalDrive] = useState(null);
  const [applyRemarks, setApplyRemarks] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  // Drive Details Modal State
  const [detailsDrive, setDetailsDrive] = useState(null);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;

      const [drivesRes, compsRes, appsRes] = await Promise.all([
        driveAPI.getAll(params),
        companyAPI.getAll(),
        isStudent ? applicationAPI.getAll() : Promise.resolve({ data: [] }),
      ]);

      setDrives(drivesRes.data || []);
      setCompanies(compsRes.data || []);
      setMyApplications(appsRes.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to fetch placement drives.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchData();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, statusFilter]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedDriveId(null);
    setFormData({
      company: companies.length > 0 ? companies[0].id : '',
      job_role: '',
      description: '',
      package: '',
      eligibility_cgpa: '',
      eligible_department: 'All',
      drive_date: '',
      application_deadline: '',
      vacancies: 5,
      status: 'Upcoming',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (drive) => {
    setIsEditing(true);
    setSelectedDriveId(drive.id);
    setFormData({
      company: drive.company,
      job_role: drive.job_role,
      description: drive.description,
      package: drive.package,
      eligibility_cgpa: drive.eligibility_cgpa,
      eligible_department: drive.eligible_department,
      drive_date: drive.drive_date,
      application_deadline: drive.application_deadline,
      vacancies: drive.vacancies,
      status: drive.status,
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company || !formData.job_role.trim() || !formData.package || !formData.eligibility_cgpa) {
      setAlert({ type: 'danger', message: 'Please complete all required fields.' });
      return;
    }

    const pkgNum = parseFloat(formData.package);
    if (isNaN(pkgNum) || pkgNum <= 0) {
      setAlert({ type: 'danger', message: 'CTC Package must be a positive number greater than 0.' });
      return;
    }

    const cgpaNum = parseFloat(formData.eligibility_cgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setAlert({ type: 'danger', message: 'Eligibility CGPA must be between 0.00 and 10.00.' });
      return;
    }

    const vacNum = parseInt(formData.vacancies, 10);
    if (isNaN(vacNum) || vacNum < 1) {
      setAlert({ type: 'danger', message: 'Estimated vacancies must be at least 1.' });
      return;
    }

    if (formData.drive_date && formData.application_deadline && formData.application_deadline > formData.drive_date) {
      setAlert({ type: 'danger', message: 'Application deadline cannot be after the recruitment drive date.' });
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        ...formData,
        package: pkgNum.toFixed(2),
        eligibility_cgpa: cgpaNum.toFixed(2),
        vacancies: vacNum,
      };

      if (isEditing) {
        await driveAPI.update(selectedDriveId, payload);
        setAlert({ type: 'success', message: `Drive for '${payload.job_role}' updated successfully.` });
      } else {
        await driveAPI.create(payload);
        setAlert({ type: 'success', message: `Drive for '${payload.job_role}' scheduled successfully.` });
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to save drive details.' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyModalDrive) return;

    setApplyLoading(true);
    try {
      await driveAPI.apply(applyModalDrive.id, applyRemarks);
      setAlert({
        type: 'success',
        message: `Application submitted for ${applyModalDrive.company_name} - ${applyModalDrive.job_role}!`,
      });
      setApplyModalDrive(null);
      fetchData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Could not submit application.' });
    } finally {
      setApplyLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);

    try {
      await driveAPI.delete(deleteId);
      setAlert({ type: 'success', message: 'Placement drive removed successfully.' });
      setDeleteId(null);
      fetchData();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to delete placement drive.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  const myAppliedIds = new Set(myApplications.map((a) => a.placement_drive));
  const studentCgpa = parseFloat(studentProfile?.cgpa || '0');
  const studentDept = (studentProfile?.department || '').toUpperCase();

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--slate-900)' }}>Placement Drives</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.92rem' }}>
            Schedule and browse campus recruitment opportunities, eligibility rules, and drive dates.
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Schedule Placement Drive</span>
          </button>
        )}
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
              placeholder="Search by role, company name, or description..."
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
              <option value="">All Drive Statuses</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Fetching recruitment drives..." />
        ) : drives.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No Drives Scheduled"
            description="No placement drives match the current search or status filter."
            action={
              isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
                  <Plus size={16} />
                  <span>Create Drive</span>
                </button>
              )
            }
          />
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Company & Role</th>
                  <th>CTC Package</th>
                  <th>Eligibility Criteria</th>
                  <th>Drive Timeline</th>
                  <th>Vacancies</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drives.map((drive) => {
                  const alreadyApplied = myAppliedIds.has(drive.id);
                  const isEligibleCgpa = studentCgpa >= parseFloat(drive.eligibility_cgpa);
                  const depts = drive.eligible_department.split(',').map((d) => d.trim().toUpperCase());
                  const isEligibleDept = depts.includes('ALL') || depts.includes(studentDept);
                  const isEligible = isEligibleCgpa && isEligibleDept;

                  return (
                    <tr key={drive.id}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.96rem', color: 'var(--slate-900)' }}>
                          {drive.job_role}
                        </div>
                        <div style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.86rem' }}>
                          {drive.company_name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', maxWidth: '280px', marginTop: '3px' }}>
                          {drive.description}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, color: 'var(--primary-600)', fontSize: '1.02rem' }}>
                          {drive.package} LPA
                        </span>
                      </td>
                      <td>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                            Min. {drive.eligibility_cgpa} CGPA
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                          Branches: {drive.eligible_department}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} color="var(--slate-400)" />
                          <span>Drive: {drive.drive_date}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--danger-text)', marginTop: '2px' }}>
                          Deadline: {drive.application_deadline}
                        </div>
                      </td>
                      <td>
                        <span className="badge" style={{ background: 'var(--slate-100)', color: 'var(--slate-700)' }}>
                          {drive.vacancies} open
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={drive.status} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setDetailsDrive(drive)}
                            title="View Drive Details"
                          >
                            <Eye size={14} />
                            <span>Details</span>
                          </button>

                          {isAdmin ? (
                            <>
                              <button
                                className="btn-icon"
                                onClick={() => handleOpenEditModal(drive)}
                                title="Edit Drive"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="btn-icon"
                                style={{ color: 'var(--danger-main)' }}
                                onClick={() => setDeleteId(drive.id)}
                                title="Delete Drive"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              {alreadyApplied ? (
                                <span className="badge badge-applied">Applied</span>
                              ) : isEligible ? (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    setApplyModalDrive(drive);
                                    setApplyRemarks('Interested in this role.');
                                  }}
                                >
                                  Apply
                                </button>
                              ) : (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  disabled
                                  title={!isEligibleCgpa ? `Requires ${drive.eligibility_cgpa} CGPA` : 'Dept not eligible'}
                                >
                                  Ineligible
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Drive Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={isEditing ? 'Edit Placement Drive' : 'Schedule New Placement Drive'}
          maxWidth="640px"
        >
          <form onSubmit={handleFormSubmit}>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Recruiting Company <span className="required">*</span>
                  </label>
                  <select
                    name="company"
                    className="form-control"
                    value={formData.company}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name} ({c.location})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Job Role / Designation <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="job_role"
                    className="form-control"
                    placeholder="e.g. Software Development Engineer"
                    value={formData.job_role}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows={3}
                  placeholder="Key responsibilities, technology stack, and expectations..."
                  value={formData.description}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    CTC Package (in LPA) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="package"
                    className="form-control"
                    placeholder="e.g. 8.50"
                    value={formData.package}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Minimum CGPA <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    name="eligibility_cgpa"
                    className="form-control"
                    placeholder="e.g. 7.50"
                    value={formData.eligibility_cgpa}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Eligible Branches <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="eligible_department"
                    className="form-control"
                    placeholder="e.g. All or CSE,IT,ECE"
                    value={formData.eligible_department}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Recruitment Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="drive_date"
                    className="form-control"
                    value={formData.drive_date}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Application Deadline <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="application_deadline"
                    className="form-control"
                    value={formData.application_deadline}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Estimated Vacancies</label>
                  <input
                    type="number"
                    min="1"
                    name="vacancies"
                    className="form-control"
                    value={formData.vacancies}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Drive Status</label>
                  <select
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
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
                {formLoading ? 'Saving...' : isEditing ? 'Update Drive' : 'Schedule Drive'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Student Apply Modal */}
      {applyModalDrive && (
        <Modal
          isOpen={Boolean(applyModalDrive)}
          onClose={() => setApplyModalDrive(null)}
          title={`Apply: ${applyModalDrive.company_name}`}
        >
          <form onSubmit={handleApplySubmit}>
            <div className="modal-body">
              <div style={{ marginBottom: '14px', background: 'var(--slate-50)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--slate-900)' }}>
                  {applyModalDrive.job_role}
                </div>
                <div style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.9rem' }}>
                  {applyModalDrive.company_name} • {applyModalDrive.package} LPA
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--slate-500)', marginTop: '4px' }}>
                  Eligibility requirement: {applyModalDrive.eligibility_cgpa} CGPA (Your CGPA: {studentProfile?.cgpa})
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks / Note for Placement Officer</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={applyRemarks}
                  onChange={(e) => setApplyRemarks(e.target.value)}
                  placeholder="Express your key skills, project highlights, or why you are a fit..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setApplyModalDrive(null)}
                disabled={applyLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={applyLoading}
              >
                {applyLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Placement Drive Details Modal */}
      {detailsDrive && (
        <Modal
          isOpen={Boolean(detailsDrive)}
          onClose={() => setDetailsDrive(null)}
          title={`Placement Drive: ${detailsDrive.job_role}`}
          maxWidth="700px"
        >
          <div className="modal-body">
            {/* Header info box */}
            <div style={{ background: 'var(--slate-50)', padding: '18px', borderRadius: '12px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                    {detailsDrive.job_role}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary-700)', fontSize: '0.95rem' }}>
                      {detailsDrive.company_name}
                    </span>
                    {detailsDrive.company_location && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <MapPin size={13} /> {detailsDrive.company_location}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                    {detailsDrive.package} LPA
                  </span>
                  <StatusBadge status={detailsDrive.status} />
                </div>
              </div>

              {detailsDrive.description && (
                <div style={{ marginTop: '14px', fontSize: '0.9rem', color: 'var(--slate-700)', lineHeight: '1.5' }}>
                  {detailsDrive.description}
                </div>
              )}
            </div>

            {/* Timeline & Vacancies Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
              <div style={{ padding: '12px', border: '1px solid var(--slate-200)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Drive Date</div>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.95rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} color="var(--primary-600)" />
                  <span>{detailsDrive.drive_date}</span>
                </div>
              </div>

              <div style={{ padding: '12px', border: '1px solid var(--slate-200)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Application Deadline</div>
                <div style={{ fontWeight: 700, color: 'var(--danger-text)', fontSize: '0.95rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} color="var(--danger-main)" />
                  <span>{detailsDrive.application_deadline}</span>
                </div>
              </div>

              <div style={{ padding: '12px', border: '1px solid var(--slate-200)', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>Open Positions</div>
                <div style={{ fontWeight: 700, color: 'var(--slate-900)', fontSize: '0.95rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={15} color="var(--slate-600)" />
                  <span>{detailsDrive.vacancies} Vacancies</span>
                </div>
              </div>
            </div>

            {/* Eligibility Assessment Card */}
            <div style={{ border: '1px solid var(--slate-200)', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '10px' }}>
                Eligibility Criteria Evaluation
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                {/* CGPA Check */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--slate-50)', borderRadius: '6px' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Minimum Required CGPA:</span> {detailsDrive.eligibility_cgpa}
                    {isStudent && <span style={{ color: 'var(--slate-500)', marginLeft: '8px' }}>(Your CGPA: {studentCgpa})</span>}
                  </div>
                  {isStudent && (
                    studentCgpa >= parseFloat(detailsDrive.eligibility_cgpa) ? (
                      <span style={{ color: 'var(--success-main)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <Check size={16} /> Eligible
                      </span>
                    ) : (
                      <span style={{ color: 'var(--danger-main)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <XCircle size={16} /> Below Requirement
                      </span>
                    )
                  )}
                </div>

                {/* Department Check */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--slate-50)', borderRadius: '6px' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Eligible Branches:</span> {detailsDrive.eligible_department}
                    {isStudent && <span style={{ color: 'var(--slate-500)', marginLeft: '8px' }}>(Your Branch: {studentDept})</span>}
                  </div>
                  {isStudent && (
                    (() => {
                      const depts = detailsDrive.eligible_department.split(',').map(d => d.trim().toUpperCase());
                      const isEligibleDept = depts.includes('ALL') || depts.includes(studentDept);
                      return isEligibleDept ? (
                        <span style={{ color: 'var(--success-main)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <Check size={16} /> Eligible
                        </span>
                      ) : (
                        <span style={{ color: 'var(--danger-main)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <XCircle size={16} /> Ineligible Branch
                        </span>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDetailsDrive(null)}
            >
              Close
            </button>

            {isAdmin ? (
              <Link
                to={`/admin/applications?search=${encodeURIComponent(detailsDrive.job_role)}`}
                className="btn btn-primary"
                onClick={() => setDetailsDrive(null)}
              >
                <span>View Drive Applicants ({detailsDrive.total_applications || 0})</span>
              </Link>
            ) : (
              myAppliedIds.has(detailsDrive.id) ? (
                <span className="badge badge-applied" style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
                  Already Applied
                </span>
              ) : (
                (() => {
                  const isEligibleCgpa = studentCgpa >= parseFloat(detailsDrive.eligibility_cgpa);
                  const depts = detailsDrive.eligible_department.split(',').map(d => d.trim().toUpperCase());
                  const isEligibleDept = depts.includes('ALL') || depts.includes(studentDept);
                  const isEligible = isEligibleCgpa && isEligibleDept;

                  return isEligible ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        const target = detailsDrive;
                        setDetailsDrive(null);
                        setApplyModalDrive(target);
                        setApplyRemarks('Interested in this role.');
                      }}
                    >
                      Apply for this Drive
                    </button>
                  ) : (
                    <button className="btn btn-secondary" disabled>
                      Criteria Not Met
                    </button>
                  );
                })()
              )
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Placement Drive"
        message="Are you sure you want to delete this placement drive? All associated student applications will be removed."
        loading={deleteLoading}
      />
    </div>
  );
};

export default DriveList;
