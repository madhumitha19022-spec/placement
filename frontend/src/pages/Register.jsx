import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AlertBanner from '../components/AlertBanner';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

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
    password: '',
    confirm_password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Frontend validation
    if (!formData.name.trim() || !formData.register_number.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Please fill out all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      setError('Please enter a valid email address (e.g. name@college.edu).');
      return;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) {
      setError('Phone number must contain between 7 and 15 digits.');
      return;
    }

    const cgpaNum = parseFloat(formData.cgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setError('CGPA must be a valid number between 0.00 and 10.00.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match. Please recheck.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        register_number: formData.register_number.trim().toUpperCase(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        department: formData.department,
        year: parseInt(formData.year, 10),
        cgpa: cgpaNum.toFixed(2),
        skills: formData.skills.trim(),
        resume: formData.resume.trim(),
        password: formData.password,
      };

      await register(payload);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card auth-card-lg">
        <div className="auth-header">
          <div className="auth-logo">
            <GraduationCap size={28} />
          </div>
          <h2 className="auth-title">Student Registration</h2>
          <p className="auth-subtitle">Create your college placement account</p>
        </div>

        <AlertBanner type="error" message={error} onClose={() => setError('')} />

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Register / Roll Number <span className="required">*</span>
              </label>
              <input
                type="text"
                name="register_number"
                className="form-control"
                placeholder="e.g. 21IT055"
                value={formData.register_number}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="name"
                className="form-control"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                College Email <span className="required">*</span>
              </label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="e.g. rahul@college.edu"
                value={formData.email}
                onChange={handleChange}
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
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleChange}
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
                onChange={handleChange}
                required
              >
                <option value="CSE">Computer Science and Engineering (CSE)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ECE">Electronics & Communication (ECE)</option>
                <option value="EEE">Electrical & Electronics (EEE)</option>
                <option value="MECH">Mechanical Engineering (MECH)</option>
                <option value="CIVIL">Civil Engineering (CIVIL)</option>
                <option value="AIDS">Artificial Intelligence & Data Science (AIDS)</option>
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
                onChange={handleChange}
                required
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year (Final Year)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Cumulative CGPA (0 - 10) <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                name="cgpa"
                className="form-control"
                placeholder="e.g. 8.75"
                value={formData.cgpa}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Technical Skills (comma-separated)</label>
            <input
              type="text"
              name="skills"
              className="form-control"
              placeholder="e.g. Python, Django, React, SQL, Git"
              value={formData.skills}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Resume Link / Portfolio URL</label>
            <input
              type="url"
              name="resume"
              className="form-control"
              placeholder="https://example.com/my-resume.pdf"
              value={formData.resume}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                name="password"
                className="form-control"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                name="confirm_password"
                className="form-control"
                placeholder="Re-type your password"
                value={formData.confirm_password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? (
              <span>Registering Account...</span>
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--slate-500)' }}>
          <span>Already registered? </span>
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
