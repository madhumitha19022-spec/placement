import axios from 'axios';

// Base API configuration with auto-detection for local dev and deployed Render backend
let rawBase = import.meta.env.VITE_API_URL;
if (!rawBase || rawBase.trim() === '') {
  rawBase = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? 'http://127.0.0.1:8000/api'
    : 'https://placement-p0qd.onrender.com/api';
}
rawBase = rawBase.replace(/\/+$/, '');
if (!rawBase.endsWith('/api')) {
  rawBase = `${rawBase}/api`;
}
const API_BASE_URL = rawBase;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Token to outgoing requests if authenticated
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Format and handle API errors cleanly for frontend display
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';
    if (error.response) {
      const data = error.response.data;
      if (typeof data === 'string') {
        if (data.trim().startsWith('<')) {
          message = `Server responded with status ${error.response.status} (${error.response.statusText || 'Error'}). Please check backend connection.`;
        } else {
          message = data;
        }
      } else if (data.detail) {
        message = data.detail;
      } else if (data.error) {
        if (typeof data.error === 'string') {
          message = data.error;
        } else if (typeof data.error === 'object') {
          const firstKey = Object.keys(data.error)[0];
          const val = data.error[firstKey];
          message = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
        }
      } else if (typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const val = data[firstKey];
        message = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
      }
    } else if (error.request) {
      message = 'Cannot connect to backend server. Make sure the backend service is running and awake.';
    }
    return Promise.reject(new Error(message));
  }
);

// =====================================================================
// API SERVICES
// =====================================================================

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  register: (studentData) => api.post('/auth/register/', studentData),
  getMe: () => api.get('/auth/me/'),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats/'),
};

export const studentAPI = {
  getAll: (params) => api.get('/students/', { params }),
  getById: (id) => api.get(`/students/${id}/`),
  create: (data) => api.post('/students/', data),
  update: (id, data) => api.patch(`/students/${id}/`, data),
  delete: (id) => api.delete(`/students/${id}/`),
  getProfile: () => api.get('/students/profile/'),
  updateProfile: (data) => api.patch('/students/profile/', data),
};

export const companyAPI = {
  getAll: (params) => api.get('/companies/', { params }),
  getById: (id) => api.get(`/companies/${id}/`),
  create: (data) => api.post('/companies/', data),
  update: (id, data) => api.patch(`/companies/${id}/`, data),
  delete: (id) => api.delete(`/companies/${id}/`),
};

export const driveAPI = {
  getAll: (params) => api.get('/drives/', { params }),
  getById: (id) => api.get(`/drives/${id}/`),
  create: (data) => api.post('/drives/', data),
  update: (id, data) => api.patch(`/drives/${id}/`, data),
  delete: (id) => api.delete(`/drives/${id}/`),
  apply: (driveId, remarks) => api.post(`/drives/${driveId}/apply/`, { remarks }),
};

export const applicationAPI = {
  getAll: (params) => api.get('/applications/', { params }),
  getById: (id) => api.get(`/applications/${id}/`),
  create: (data) => api.post('/applications/', data),
  updateStatus: (id, statusData) => api.patch(`/applications/${id}/update_status/`, statusData),
  delete: (id) => api.delete(`/applications/${id}/`),
};

export const resultAPI = {
  getAll: (params) => api.get('/results/', { params }),
  getById: (id) => api.get(`/results/${id}/`),
  create: (data) => api.post('/results/', data),
  update: (id, data) => api.patch(`/results/${id}/`, data),
  delete: (id) => api.delete(`/results/${id}/`),
};

export default api;
