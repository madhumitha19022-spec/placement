import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  MapPin,
  Briefcase,
  Globe,
  Mail,
  Phone,
  Eye
} from 'lucide-react';
import { companyAPI, driveAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal, { ConfirmDialog } from '../components/Modal';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner, { EmptyState } from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const CompanyList = () => {
  const { isAdmin } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    location: '',
    industry: '',
  });

  // Details Modal State
  const [detailsCompany, setDetailsCompany] = useState(null);
  const [companyDrives, setCompanyDrives] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(false);

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();

      const res = await companyAPI.getAll(params);
      setCompanies(res.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to fetch companies.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCompanies();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedCompanyId(null);
    setFormData({
      company_name: '',
      description: '',
      email: '',
      phone: '',
      website: '',
      location: '',
      industry: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (company) => {
    setIsEditing(true);
    setSelectedCompanyId(company.id);
    setFormData({
      company_name: company.company_name,
      description: company.description,
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
      location: company.location,
      industry: company.industry,
    });
    setModalOpen(true);
  };

  const handleOpenDetailsModal = async (company) => {
    setDetailsCompany(company);
    setLoadingDrives(true);
    try {
      const res = await driveAPI.getAll({ company: company.id });
      setCompanyDrives(res.data || []);
    } catch (err) {
      console.warn('Could not load company placement drives:', err);
      setCompanyDrives([]);
    } finally {
      setLoadingDrives(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company_name.trim() || !formData.location.trim() || !formData.industry.trim()) {
      setAlert({ type: 'danger', message: 'Company Name, Location, and Industry are required.' });
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setAlert({ type: 'danger', message: 'Please enter a valid HR / Recruiter email address.' });
      return;
    }

    if (formData.phone) {
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length < 7 || digits.length > 15) {
        setAlert({ type: 'danger', message: 'Phone number must contain between 7 and 15 digits.' });
        return;
      }
    }

    setFormLoading(true);
    try {
      if (isEditing) {
        await companyAPI.update(selectedCompanyId, formData);
        setAlert({ type: 'success', message: `Company '${formData.company_name}' updated successfully.` });
      } else {
        await companyAPI.create(formData);
        setAlert({ type: 'success', message: `Company '${formData.company_name}' added successfully.` });
      }
      setModalOpen(false);
      fetchCompanies();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to save company details.' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);

    try {
      await companyAPI.delete(deleteId);
      setAlert({ type: 'success', message: 'Company removed successfully.' });
      setDeleteId(null);
      fetchCompanies();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to delete company.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--slate-900)' }}>Recruiting Companies</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.92rem' }}>
            Browse partner organizations, hiring industries, and recruitment drives.
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Add Company</span>
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
              placeholder="Search companies by name, industry, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading partner companies..." />
        ) : companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No Companies Found"
            description="No recruiting companies match your search criteria."
            action={
              isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
                  <Plus size={16} />
                  <span>Add First Company</span>
                </button>
              )
            }
          />
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Industry / Domain</th>
                  <th>Location</th>
                  <th>Contact Details</th>
                  <th>Placement Drives</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--slate-900)' }}>
                        {company.company_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', maxWidth: '280px', marginTop: '2px' }}>
                        {company.description}
                      </div>
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                        >
                          <Globe size={12} />
                          <span>Website</span>
                          <ExternalLink size={10} />
                        </a>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}>
                        {company.industry}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.86rem' }}>
                        <MapPin size={14} color="var(--slate-400)" />
                        <span>{company.location}</span>
                      </div>
                    </td>
                    <td>
                      {company.email && (
                        <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} color="var(--slate-400)" />
                          <span>{company.email}</span>
                        </div>
                      )}
                      {company.phone && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Phone size={12} color="var(--slate-400)" />
                          <span>{company.phone}</span>
                        </div>
                      )}
                      {!company.email && !company.phone && <span style={{ color: 'var(--slate-400)', fontSize: '0.82rem' }}>—</span>}
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                        {company.total_drives || 0} Drives
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleOpenDetailsModal(company)}
                          title="View Company Details"
                        >
                          <Eye size={14} />
                          <span>Details</span>
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              className="btn-icon"
                              onClick={() => handleOpenEditModal(company)}
                              title="Edit Company"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="btn-icon"
                              style={{ color: 'var(--danger-main)' }}
                              onClick={() => setDeleteId(company.id)}
                              title="Delete Company"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
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

      {/* Company Details Modal */}
      {detailsCompany && (
        <Modal
          isOpen={Boolean(detailsCompany)}
          onClose={() => setDetailsCompany(null)}
          title={`Company Details: ${detailsCompany.company_name}`}
          maxWidth="680px"
        >
          <div className="modal-body">
            <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--slate-900)', margin: 0 }}>
                    {detailsCompany.company_name}
                  </h3>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}>
                      {detailsCompany.industry}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} /> {detailsCompany.location}
                    </span>
                  </div>
                </div>
                {detailsCompany.website && (
                  <a
                    href={detailsCompany.website}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <Globe size={14} />
                    <span>Visit Website</span>
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>

              <div style={{ marginTop: '14px', fontSize: '0.9rem', color: 'var(--slate-700)', lineHeight: '1.5' }}>
                {detailsCompany.description}
              </div>

              <div style={{ display: 'flex', gap: '20px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--slate-200)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                {detailsCompany.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-600)' }}>
                    <Mail size={14} color="var(--primary-600)" />
                    <span>{detailsCompany.email}</span>
                  </div>
                )}
                {detailsCompany.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-600)' }}>
                    <Phone size={14} color="var(--primary-600)" />
                    <span>{detailsCompany.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Placement Drives Hosted by this Company */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Briefcase size={16} color="var(--primary-600)" />
                <span>Recruitment Drives ({companyDrives.length})</span>
              </h4>

              {loadingDrives ? (
                <div style={{ padding: '20px 0' }}>
                  <LoadingSpinner message="Fetching placement drives..." />
                </div>
              ) : companyDrives.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', background: 'var(--slate-50)', borderRadius: '8px', color: 'var(--slate-500)', fontSize: '0.88rem' }}>
                  No active recruitment drives currently scheduled for this company.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                  {companyDrives.map((drive) => (
                    <div
                      key={drive.id}
                      style={{
                        padding: '12px 16px',
                        border: '1px solid var(--slate-200)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--slate-900)', fontSize: '0.92rem' }}>
                          {drive.job_role}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)', display: 'flex', gap: '12px', marginTop: '2px' }}>
                          <span>Min CGPA: {drive.eligibility_cgpa}</span>
                          <span>Branches: {drive.eligible_department}</span>
                          <span>Deadline: {drive.application_deadline}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary-600)', fontSize: '0.95rem' }}>
                          {drive.package} LPA
                        </span>
                        <StatusBadge status={drive.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDetailsCompany(null)}
            >
              Close
            </button>
            <Link
              to={isAdmin ? '/admin/drives' : '/student/drives'}
              className="btn btn-primary"
              onClick={() => setDetailsCompany(null)}
            >
              <span>View All Drives</span>
            </Link>
          </div>
        </Modal>
      )}

      {/* Add / Edit Company Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={isEditing ? 'Edit Company Information' : 'Add Recruiting Company'}
          maxWidth="600px"
        >
          <form onSubmit={handleFormSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">
                  Company Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="company_name"
                  className="form-control"
                  placeholder="e.g. Google or Infosys"
                  value={formData.company_name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Overview / Description <span className="required">*</span>
                </label>
                <textarea
                  name="description"
                  className="form-control"
                  rows={3}
                  placeholder="Brief description of the organization and its hiring domain..."
                  value={formData.description}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Industry Domain <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="industry"
                    className="form-control"
                    placeholder="e.g. IT Services / AI / FinTech"
                    value={formData.industry}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Headquarters / Location <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    className="form-control"
                    placeholder="e.g. Bengaluru / Chennai"
                    value={formData.location}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">HR / Recruiter Email</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="campus@company.com"
                    value={formData.email}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-control"
                    placeholder="+91 80 1234 5678"
                    value={formData.phone}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Careers / Website URL</label>
                <input
                  type="url"
                  name="website"
                  className="form-control"
                  placeholder="https://company.com/careers"
                  value={formData.website}
                  onChange={handleFormChange}
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
                {formLoading ? 'Saving...' : isEditing ? 'Update Company' : 'Add Company'}
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
        title="Delete Company Record"
        message="Are you sure you want to delete this company? All associated placement drives and applications will also be deleted."
        loading={deleteLoading}
      />
    </div>
  );
};

export default CompanyList;
