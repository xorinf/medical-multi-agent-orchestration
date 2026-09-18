import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

// Public & Auth Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import OnboardingPage from './pages/auth/OnboardingPage';
import NotFoundPage, { UnauthorizedPage } from './pages/NotFoundPage';

// Patient Pages
import PatientHomePage from './pages/patient/PatientHomePage';
import PatientChatPage from './pages/patient/PatientChatPage';
import PatientFindDoctorPage from './pages/patient/PatientFindDoctorPage';
import PatientAppointmentsPage from './pages/patient/PatientAppointmentsPage';
import PatientMessagesPage from './pages/patient/PatientMessagesPage';
import PatientProfilePage from './pages/patient/PatientProfilePage';

// Doctor Pages
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';
import DoctorQueuePage from './pages/doctor/DoctorQueuePage';
import DoctorCuratorPage from './pages/doctor/DoctorCuratorPage';
import DoctorAppointmentsPage from './pages/doctor/DoctorAppointmentsPage';
import DoctorPatientsPage from './pages/doctor/DoctorPatientsPage';
import DoctorMessagesPage from './pages/doctor/DoctorMessagesPage';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';

// Admin Pages
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminPendingPage from './pages/admin/AdminPendingPage';
import AdminDoctorsPage from './pages/admin/AdminDoctorsPage';
import AdminPatientsPage from './pages/admin/AdminPatientsPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Role redirection helper
const RoleRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'doctor') return <Navigate to="/doctor" replace />;
  return <Navigate to="/app" replace />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public & Authentication */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/verify" element={<VerifyEmailPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/portal" element={<RoleRedirect />} />

              {/* Patient Protected Area */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute allowedRoles={['patient']}>
                    <AppLayout title="Patient Health Portal" />
                  </ProtectedRoute>
                }
              >
                <Route index element={<PatientHomePage />} />
                <Route path="chat" element={<PatientChatPage />} />
                <Route path="doctors" element={<PatientFindDoctorPage />} />
                <Route path="appointments" element={<PatientAppointmentsPage />} />
                <Route path="messages" element={<PatientMessagesPage />} />
                <Route path="profile" element={<PatientProfilePage />} />
              </Route>

              {/* Doctor Protected Area */}
              <Route
                path="/doctor"
                element={
                  <ProtectedRoute allowedRoles={['doctor']}>
                    <AppLayout title="Physician Clinical Workspace" />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DoctorDashboardPage />} />
                <Route path="queue" element={<DoctorQueuePage />} />
                <Route path="curator" element={<DoctorCuratorPage />} />
                <Route path="appointments" element={<DoctorAppointmentsPage />} />
                <Route path="patients" element={<DoctorPatientsPage />} />
                <Route path="messages" element={<DoctorMessagesPage />} />
                <Route path="profile" element={<DoctorProfilePage />} />
              </Route>

              {/* Admin Protected Area */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout title="System Administration" />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminOverviewPage />} />
                <Route path="overview" element={<AdminOverviewPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="users/pending" element={<AdminPendingPage />} />
                <Route path="doctors/pending" element={<AdminPendingPage />} />
                <Route path="doctors" element={<AdminDoctorsPage />} />
                <Route path="patients" element={<AdminPatientsPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="audit" element={<AdminAuditPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              {/* Seamless Path Aliases */}
              <Route path="/chat" element={<Navigate to="/app/chat" replace />} />
              <Route path="/doctors" element={<Navigate to="/app/doctors" replace />} />
              <Route path="/appointments" element={<Navigate to="/app/appointments" replace />} />
              <Route path="/queue" element={<Navigate to="/doctor/queue" replace />} />
              <Route path="/curator" element={<Navigate to="/doctor/curator" replace />} />

              {/* Error Pages */}
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
