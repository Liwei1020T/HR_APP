import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './lib/queryClient';
import { ProtectedRoute, PublicRoute, RoleProtectedRoute } from './components/ProtectedRoute';

// Placeholder pages (will be implemented in Step 12-13)
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FeedbackPage from './pages/FeedbackPage';
import ChannelsPage from './pages/ChannelsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/channels" element={<ChannelsPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<RoleProtectedRoute roles={['hr', 'admin', 'superadmin']} />}>
              <Route path="/admin" element={<AdminPage />} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
