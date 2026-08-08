import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ViewRoleProvider } from './context/ViewRoleContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OperatorLoginPage from './pages/OperatorLoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import KnowledgePage from './pages/KnowledgePage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import DatasetPage from './pages/DatasetPage';
import OperatorConsolePage from './pages/OperatorConsolePage';

export default function App() {
  return (
    <AuthProvider>
      <ViewRoleProvider>
        <BrowserRouter>
          <Routes>
            {/* Public SaaS Landing & Auth Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/operator/login" element={<OperatorLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Standalone Operator Terminal (Operator Role Only) */}
            <Route element={<ProtectedRoute allowedRole="operator" />}>
              <Route path="/operator" element={<OperatorConsolePage />} />
            </Route>

            {/* Protected AI Operating System Routes (Admin Role Only) */}
            <Route element={<ProtectedRoute allowedRole="admin" />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/chat" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dataset" element={<DatasetPage />} />
                <Route path="/knowledge" element={<KnowledgePage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Catch-all fallback redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ViewRoleProvider>
    </AuthProvider>
  );
}
