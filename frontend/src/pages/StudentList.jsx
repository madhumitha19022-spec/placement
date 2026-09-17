import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Filter,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import { studentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Modal, { ConfirmDialog } from '../components/Modal';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner, { EmptyState } from '../components/LoadingSpinner';

const StudentList = () => {
  const { isAdmin } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    register_number: '',
    name: '',
    email: '',
    phone: '',
    department: 'IT',
    year: 4,
    cgpa: '',
    skills: '',
    resume: '',
  });

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (deptFilter) params.department = deptFilter;

      const res = await studentAPI.getAll(params);
      setStudents(res.data || []);
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to fetch students list.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchStudents();
    }, 250);
    return () => clearTimeout(timeout);
  }, [search, deptFilter]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedStudentId(null);
    setFormData({
      register_number: '',
      name: '',
      email: '',
      phone: '',
      department: 'IT',
      year: 4,
      cgpa: '',
      skills: '',
      resume: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (student) => {
    setIsEditing(true);
    setSelectedStudentId(student.id);
    setFormData({
      register_number: student.register_number,
      name: student.name,
      email: student.email,
      phone: student.phone,
      department: student.department,
      year: student.year,
      cgpa: student.cgpa,
      skills: student.skills || '',
      resume: student.resume || '',
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.register_number.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setAlert({ type: 'danger', message: 'Name, Register Number, Email, and Phone are required.' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setAlert({ type: 'danger', message: 'Please provide a valid student email address.' });
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setAlert({ type: 'danger', message: 'Phone number must contain between 7 and 15 digits.' });
      return;
    }

    const cgpaNum = parseFloat(formData.cgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setAlert({ type: 'danger', message: 'CGPA must be a valid number between 0.00 and 10.00.' });
      return;
    }

    setFormLoading(true);

    const payload = {
      ...formData,
      register_number: formData.register_number.trim().toUpperCase(),
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      cgpa: cgpaNum.toFixed(2),
      year: parseInt(formData.year, 10),
    };

    try {
      if (isEditing) {
        await studentAPI.update(selectedStudentId, payload);
        setAlert({ type: 'success', message: `Student '${payload.name}' updated successfully.` });
      } else {
        await studentAPI.create(payload);
        setAlert({ type: 'success', message: `Student '${payload.name}' registered successfully.` });
      }
      setModalOpen(false);
      fetchStudents();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to save student record.' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);

    try {
      await studentAPI.delete(deleteId);
      setAlert({ type: 'success', message: 'Student record removed successfully.' });
      setDeleteId(null);
      fetchStudents();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to delete student record.' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', color: 'var(--slate-900)' }}>Students Management</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.92rem' }}>
            Manage student records, branches, CGPA eligibility, and placement profiles.
          </p>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Add Student</span>
          </button>
        )}
      </div>

      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      {/* Toolbar: Search & Department Filter */}
      <div className="table-container">
        <div className="table-toolbar">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by student name, roll number, email, or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Filter size={16} color="var(--slate-500)" />
            <select
              className="filter-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="MECH">MECH</option>
              <option value="CIVIL">CIVIL</option>
              <option value="AIDS">AIDS</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        {loading ? (
          <LoadingSpinner message="Fetching students..." />
        ) : students.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No Students Found"
            description="No student records match your current search or department filter."
            action={
              isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
                  <Plus size={16} />
                  <span>Register First Student</span>
                </button>
              )
            }
          />
        ) : (
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Roll / Reg No.</th>
                  <th>Student Name</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>CGPA</th>
                  <th>Contact Info</th>
                  <th>Skills</th>
                  {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                      {student.register_number}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{student.name}</div>
                      {student.resume && (
                        <a
                          href={student.resume}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}
                        >
                          <span>Resume</span>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--slate-100)', color: 'var(--slate-800)' }}>
                        {student.department}
                      </span>
                    </td>
                    <td>Year {student.year}</td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color: parseFloat(student.cgpa) >= 8.0 ? 'var(--success-text)' : 'var(--slate-800)',
                        }}
                      >
                        {student.cgpa}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.84rem' }}>{student.email}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)' }}>{student.phone}</div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '200px', fontSize: '0.8rem', color: 'var(--slate-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={student.skills}>
                        {student.skills || '—'}
                      </div>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEditModal(student)}
                            title="Edit Student"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            style={{ color: 'var(--danger-main)' }}
                            onClick={() => setDeleteId(student.id)}
                            title="Delete Student"
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

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={isEditing ? 'Edit Student Record' : 'Register New Student'}
          maxWidth="620px"
        >
          <form onSubmit={handleFormSubmit}>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Register Number <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="register_number"
                    className="form-control"
                    placeholder="e.g. 21IT001"
                    value={formData.register_number}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Student Full Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="student@college.edu"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Phone Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    Department <span className="required">*</span>
                  </label>
                  <select
                    name="department"
                    className="form-control"
                    value={formData.department}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="AIDS">AIDS</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Current Year <span className="required">*</span>
                  </label>
                  <select
                    name="year"
                    className="form-control"
                    value={formData.year}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year (Final)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    CGPA (0 - 10) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    name="cgpa"
                    className="form-control"
                    placeholder="8.50"
                    value={formData.cgpa}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Technical Skills</label>
                <input
                  type="text"
                  name="skills"
                  className="form-control"
                  placeholder="e.g. Python, Django, SQL, React"
                  value={formData.skills}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resume Link / Portfolio</label>
                <input
                  type="url"
                  name="resume"
                  className="form-control"
                  placeholder="https://example.com/resume.pdf"
                  value={formData.resume}
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
                {formLoading ? 'Saving...' : isEditing ? 'Update Student' : 'Save Student'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student Record"
        message="Are you sure you want to delete this student? All associated applications and placement records will also be removed."
        loading={deleteLoading}
      />
    </div>
  );
};

export default StudentList;
