import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * DashboardRedirect Component
 * Automatically redirects users to their appropriate dashboard based on role
 * - Students -> /dashboard
 * - Society heads -> /society/dashboard
 * - Admins -> /society/dashboard (for now)
 * - No user -> /login
 */
const DashboardRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  switch (user.role) {
    case 'student':
      return <Navigate to="/dashboard" replace />;
    case 'society_head':
      return <Navigate to="/society/dashboard" replace />;
    case 'admin':
      return <Navigate to="/society/dashboard" replace />; // Will change to /admin/dashboard in future
    default:
      return <Navigate to="/dashboard" replace />;
  }
};

export default DashboardRedirect;
