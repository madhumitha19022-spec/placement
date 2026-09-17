import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout & Reusable Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LoadingSpinner from './components/LoadingSpinner';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentList from './pages/StudentList';
import CompanyList from './pages/CompanyList';
import DriveList from './pages/DriveList';
import ApplicationList from './pages/ApplicationList';
import ResultList from './pages/ResultList';
import StudentProfile from './pages/StudentProfile';
import NotFound from './pages/NotFound';

// Protected Route Guard
const ProtectedRoute = ({ allowedRole }) => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Verifying authentication session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Redirect to user's permitted dashboard
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return <Outlet />;
};

// Authenticated Layout Shell (Sidebar + Navbar + Content)
const AppLayout = ({ title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-wrapper">
        <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} title={title} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Root Redirect Helper
const RootRedirect = () => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking placement system..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Index Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route element={<AppLayout title="Placement Officer Portal" />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/students" element={<StudentList />} />
              <Route path="/admin/companies" element={<CompanyList />} />
              <Route path="/admin/drives" element={<DriveList />} />
              <Route path="/admin/applications" element={<ApplicationList />} />
              <Route path="/admin/results" element={<ResultList />} />
            </Route>
          </Route>

          {/* Student Protected Routes */}
          <Route element={<ProtectedRoute allowedRole="student" />}>
            <Route element={<AppLayout title="Student Placement Portal" />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/companies" element={<CompanyList />} />
              <Route path="/student/drives" element={<DriveList />} />
              <Route path="/student/applications" element={<ApplicationList />} />
              <Route path="/student/results" element={<ResultList />} />
              <Route path="/student/profile" element={<StudentProfile />} />
            </Route>
          </Route>

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
