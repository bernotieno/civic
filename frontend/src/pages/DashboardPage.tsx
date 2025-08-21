/**
 * Dashboard Page Component
 * Role-aware dashboard for authenticated users - Citizens Dashboard
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CitizensDashboard from '../components/dashboard/CitizensDashboard';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard
  if (user.role === 'citizen') {
    return <CitizensDashboard />;
  }

  // Redirect admin users to admin dashboard
  if (user.role === 'super_admin' || user.role === 'national_official' || user.role === 'regional_official' || user.role === 'local_official') {
    navigate('/admin-dashboard', { replace: true });
    return null;
  }

  // Fallback for other roles
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard Coming Soon</h2>
        <p className="text-gray-600 mb-4">
          Dashboard for {user.role_display} is under development.
        </p>
        <p className="text-sm text-gray-500">
          Role: {user.role} | County: {user.county_name}
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
