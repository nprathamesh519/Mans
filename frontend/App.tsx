import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import MainLayout from './components/layout/MainLayout';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const PatientRegisterPage = React.lazy(() => import('./pages/PatientRegisterPage'));
const CaretakerRegisterPage = React.lazy(() => import('./pages/CaretakerRegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const FacesPage = React.lazy(() => import('./pages/FacesPage'));
const MemoriesPage = React.lazy(() => import('./pages/MemoriesPage'));
const RemindersPage = React.lazy(() => import('./pages/RemindersPage'));
const GpsPage = React.lazy(() => import('./pages/GpsPage'));
const AlertsPage = React.lazy(() => import('./pages/AlertsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const AddFacePage = React.lazy(() => import('./pages/AddFacePage'));
const AddMemoryPage = React.lazy(() => import('./pages/AddMemoryPage'));
const AddReminderPage = React.lazy(() => import('./pages/AddReminderPage'));
import { UserRole } from './types';

const PrivateRoute: React.FC<{ children: React.ReactElement, requiredRole?: UserRole }> = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/dashboard" />;

  return children;
};

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <HashRouter>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-pink-300 border-t-pink-600 rounded-full animate-spin" /></div>}>
      <Routes>

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register/patient" element={<PatientRegisterPage />} />
        <Route path="/register/caretaker" element={<CaretakerRegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />

        <Route path="/dashboard" element={<PrivateRoute><MainLayout><DashboardPage /></MainLayout></PrivateRoute>} />
        <Route path="/faces" element={<PrivateRoute><MainLayout><FacesPage /></MainLayout></PrivateRoute>} />
        <Route path="/faces/add" element={<PrivateRoute requiredRole={UserRole.CARETAKER}><MainLayout><AddFacePage /></MainLayout></PrivateRoute>} />
        <Route path="/memories" element={<PrivateRoute><MainLayout><MemoriesPage /></MainLayout></PrivateRoute>} />
        <Route path="/memories/add" element={<PrivateRoute requiredRole={UserRole.CARETAKER}><MainLayout><AddMemoryPage /></MainLayout></PrivateRoute>} />
        <Route path="/reminders" element={<PrivateRoute><MainLayout><RemindersPage /></MainLayout></PrivateRoute>} />
        <Route path="/reminders/add" element={<PrivateRoute requiredRole={UserRole.CARETAKER}><MainLayout><AddReminderPage /></MainLayout></PrivateRoute>} />
        <Route path="/gps" element={<PrivateRoute requiredRole={UserRole.CARETAKER}><MainLayout><GpsPage /></MainLayout></PrivateRoute>} />
        <Route path="/alerts" element={<PrivateRoute requiredRole={UserRole.CARETAKER}><MainLayout><AlertsPage /></MainLayout></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute requiredRole={UserRole.CARETAKER}><MainLayout><SettingsPage /></MainLayout></PrivateRoute>} />

      </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;