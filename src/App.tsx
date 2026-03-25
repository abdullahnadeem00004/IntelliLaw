import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard';
import CaseList from './pages/CaseList';
import CaseDetail from './pages/CaseDetail';
import Hearings from './pages/Hearings';
import Documents from './pages/Documents';
import Tasks from './pages/Tasks';
import Clients from './pages/Clients';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import NewCase from './pages/NewCase';
import Login from './pages/Login';
import RoleSelection from './pages/RoleSelection';
import RoleLogin from './pages/RoleLogin';
import FirmOnboarding from './pages/FirmOnboarding';
import LawyerOnboarding from './pages/LawyerOnboarding';
import ClientOnboarding from './pages/ClientOnboarding';
import OAuthCallback from './pages/OAuthCallback';
import ClientPortal from './pages/ClientPortal';
import CaseAnalysis from './pages/CaseAnalysis';
import LegalResearch from './pages/LegalResearch';
import Notifications from './pages/Notifications';
import Calendar from './pages/Calendar';
import Team from './pages/Team';
import Reports from './pages/Reports';
import Messaging from './pages/Messaging';
import FirmProfile from './pages/FirmProfile';
import KnowledgeBase from './pages/KnowledgeBase';
import AdminUsers from './pages/AdminUsers';
import { FirebaseProvider } from './components/FirebaseProvider';
import ErrorBoundary from './components/ErrorBoundary';
import { UserRole } from './types';

export default function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/auth/login/:role" element={<RoleLogin />} />
            <Route path="/onboarding/firm" element={<FirmOnboarding />} />
            <Route path="/onboarding/lawyer" element={<LawyerOnboarding />} />
            <Route path="/onboarding/client" element={<ClientOnboarding />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />

            {/* Client Portal Route (No Sidebar/Topbar) */}
            <Route path="/client-portal" element={<ClientPortal />} />

            {/* Main Application Layout */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />

              {/* Case Management - Lawyers, Staff, Admin */}
              <Route path="cases" element={<PrivateRoute allowedRoles={[UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN]}><CaseList /></PrivateRoute>} />
              <Route path="cases/new" element={<PrivateRoute allowedRoles={[UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN]}><NewCase /></PrivateRoute>} />
              <Route path="cases/:id" element={<PrivateRoute allowedRoles={[UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN]}><CaseDetail /></PrivateRoute>} />

              {/* Legal Analysis - Lawyers, Admin */}
              <Route path="analysis" element={<PrivateRoute allowedRoles={[UserRole.LAWYER, UserRole.ADMIN]}><CaseAnalysis /></PrivateRoute>} />
              <Route path="research" element={<PrivateRoute allowedRoles={[UserRole.LAWYER, UserRole.ADMIN]}><LegalResearch /></PrivateRoute>} />

              {/* Hearings - Lawyers, Staff, Admin */}
              <Route path="hearings" element={<PrivateRoute allowedRoles={[UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN]}><Hearings /></PrivateRoute>} />

              {/* Available to All */}
              <Route path="calendar" element={<Calendar />} />
              <Route path="documents" element={<Documents />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="knowledge-base" element={<KnowledgeBase />} />
              <Route path="messaging" element={<Messaging />} />
              <Route path="settings" element={<Settings />} />

              {/* Team & Firm Management - Lawyers, Admin */}
              <Route path="team" element={<PrivateRoute allowedRoles={[UserRole.LAWYER, UserRole.ADMIN]}><Team /></PrivateRoute>} />
              <Route path="firm-profile" element={<PrivateRoute allowedRoles={[UserRole.LAWYER, UserRole.ADMIN]}><FirmProfile /></PrivateRoute>} />

              {/* Clients - Lawyers, Staff, Admin */}
              <Route path="clients" element={<PrivateRoute allowedRoles={[UserRole.LAWYER, UserRole.STAFF, UserRole.ADMIN]}><Clients /></PrivateRoute>} />

              {/* Admin Only */}
              <Route path="billing" element={<PrivateRoute allowedRoles={[UserRole.ADMIN]}><Billing /></PrivateRoute>} />
              <Route path="reports" element={<PrivateRoute allowedRoles={[UserRole.ADMIN]}><Reports /></PrivateRoute>} />
              <Route path="admin/users" element={<PrivateRoute allowedRoles={[UserRole.ADMIN]}><AdminUsers /></PrivateRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}



















