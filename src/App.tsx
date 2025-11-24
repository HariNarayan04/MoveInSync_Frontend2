import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { ToastContainer } from './factory/ToastFactory';
import { ProtectedRoute } from './utils/ProtectedRoute';
import { AdminRoute } from './utils/AdminRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { FloorsPage } from './pages/FloorsPage';
import { syncService } from './services/SyncService';

function App() {
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    // Initialize sync service (IndexedDB, background sync, etc.)
    syncService.initialize().catch((error) => {
      console.error('Failed to initialize sync service:', error);
    });
  }, []);

  useEffect(() => {
    // Listen for unauthorized events from httpClient
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/floors"
            element={
              <AdminRoute>
                <FloorsPage />
              </AdminRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 - Redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Global Toast Container */}
        <ToastContainer />
      </div>
    </BrowserRouter>
  );
}

export default App;
