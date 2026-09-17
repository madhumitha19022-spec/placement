import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Save,
  GraduationCap,
  Mail,
  Phone,
  BookOpen,
  Award,
  ExternalLink,
  Code2
} from 'lucide-react';
import { studentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AlertBanner from '../components/AlertBanner';
import LoadingSpinner from '../components/LoadingSpinner';

const StudentProfile = () => {
  const { user, studentProfile, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    name: '',
    register_number: '',
    email: '',
    phone: '',
    department: 'IT',
    year: 4,
    cgpa: '',
    skills: '',
    resume: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await studentAPI.getProfile();
        setFormData({
          name: res.data.name,
          register_number: res.data.register_number,
          email: res.data.email,
          phone: res.data.phone,
          department: res.data.department,
          year: res.data.year,
          cgpa: res.data.cgpa,
          skills: res.data.skills || '',
          resume: res.data.resume || '',
        });
        refreshProfile(res.data);
      } catch (err) {
        if (studentProfile) {
          setFormData({
            name: studentProfile.name,
            register_number: studentProfile.register_number,
            email: studentProfile.email,
            phone: studentProfile.phone,
            department: studentProfile.department,
            year: studentProfile.year,
            cgpa: studentProfile.cgpa,
            skills: studentProfile.skills || '',
            resume: studentProfile.resume || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ type: '', message: '' });

    if (!formData.name.trim()) {
      setAlert({ type: 'danger', message: 'Student Name cannot be empty.' });
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

    setSaveLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        cgpa: cgpaNum.toFixed(2),
        skills: formData.skills.trim(),
        resume: formData.resume.trim(),
      };

      const res = await studentAPI.updateProfile(payload);
      refreshProfile(res.data);
      setAlert({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update profile.' });
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;

  return (
    <div className="page-container" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--slate-900)' }}>Candidate Profile</h2>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.92rem' }}>
          Keep your academic credentials, technical skills, and resume updated for placement drives.
        </p>
      </div>

      <AlertBanner type={alert.type} message={alert.message} onClose={() => setAlert({ type: '', message: '' })} />

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--slate-100)', marginBottom: '24px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              fontWeight: 800,
            }}
          >
            {formData.name ? formData.name.charAt(0).toUpperCase() : 'S'}
          </div>

          <div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--slate-900)' }}>{formData.name}</h3>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.88rem' }}>
              Roll No: <strong>{formData.register_number}</strong> • Dept of {formData.department} (Year {formData.year})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Register Number</label>
              <input
                type="text"
                className="form-control"
                value={formData.register_number}
                disabled
                style={{ background: 'var(--slate-100)', cursor: 'not-allowed' }}
              />
              <span className="form-hint">Register number cannot be altered</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">College Email</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                disabled
                style={{ background: 'var(--slate-100)', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                name="phone"
                className="form-control"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department / Branch</label>
              <input
                type="text"
                className="form-control"
                value={formData.department}
                disabled
                style={{ background: 'var(--slate-100)', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cumulative CGPA (0.00 - 10.00)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                name="cgpa"
                className="form-control"
                value={formData.cgpa}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Technical Skills & Technologies</label>
            <input
              type="text"
              name="skills"
              className="form-control"
              placeholder="e.g. Python, Django, React, SQL, AWS"
              value={formData.skills}
              onChange={handleChange}
            />
            <span className="form-hint">Used by placement officers and company filters</span>
          </div>

          <div className="form-group">
            <label className="form-label">Online Resume Link / Portfolio</label>
            <input
              type="url"
              name="resume"
              className="form-control"
              placeholder="https://drive.google.com/your-resume.pdf"
              value={formData.resume}
              onChange={handleChange}
            />
            {formData.resume && (
              <div style={{ marginTop: '6px' }}>
                <a
                  href={formData.resume}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={14} />
                  <span>Preview current resume document</span>
                </a>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saveLoading}
            >
              <Save size={16} />
              <span>{saveLoading ? 'Updating Profile...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfile;
