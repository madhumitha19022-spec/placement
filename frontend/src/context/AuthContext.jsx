import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [studentProfile, setStudentProfile] = useState(() => {
    const saved = localStorage.getItem('student_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          setUser({
            id: res.data.id,
            username: res.data.username,
            email: res.data.email,
            name: res.data.name,
            role: res.data.role,
          });
          if (res.data.student_profile) {
            setStudentProfile(res.data.student_profile);
            localStorage.setItem('student_profile', JSON.stringify(res.data.student_profile));
          }
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    const res = await authAPI.login({ username, password });
    const { token: newToken, user: userData, student_profile: profile } = res.data;

    setToken(newToken);
    setUser(userData);
    setStudentProfile(profile || null);

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (profile) {
      localStorage.setItem('student_profile', JSON.stringify(profile));
    } else {
      localStorage.removeItem('student_profile');
    }
    return userData;
  };

  const register = async (studentData) => {
    const res = await authAPI.register(studentData);
    const { token: newToken, user: userData, student_profile: profile } = res.data;

    setToken(newToken);
    setUser(userData);
    setStudentProfile(profile || null);

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    if (profile) {
      localStorage.setItem('student_profile', JSON.stringify(profile));
    }
    return userData;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setStudentProfile(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('student_profile');
  };

  const refreshProfile = (updatedProfile) => {
    setStudentProfile(updatedProfile);
    localStorage.setItem('student_profile', JSON.stringify(updatedProfile));
  };

  const value = {
    user,
    role: user?.role || null,
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student',
    studentProfile,
    token,
    loading,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
