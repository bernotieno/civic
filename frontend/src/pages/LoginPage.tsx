/**
 * Login Page Component
 * Full page wrapper for the login form with Kenyan theme and branding
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardRoute, getRoleDisplayName } from '../utils/roleBasedRouting';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [loginStatus, setLoginStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRoute(user);
      navigate(dashboardRoute, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  /**
   * Handle successful login
   */
  const handleLoginSuccess = () => {
    setLoginStatus('success');
    setErrorMessage('');
    
    // Show success message briefly, then redirect
    setTimeout(() => {
      if (user) {
        const dashboardRoute = getDashboardRoute(user);
        navigate(dashboardRoute, { replace: true });
      }
    }, 1500);
  };

  /**
   * Handle login error
   */
  const handleLoginError = (error: string) => {
    setLoginStatus('error');
    setErrorMessage(error);
    console.error('Login failed:', error);
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-red-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Kenyan Flag Colors Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-black via-red-600 to-green-600"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-green-600 via-red-600 to-black"></div>
      </div>

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🇰🇪 CivicAI
          </h1>
          <p className="text-lg text-gray-600 mb-1">
            Kenya's Premier Civic Engagement Platform
          </p>
          <p className="text-sm text-gray-500">
            Connecting Citizens with Government
          </p>
        </div>
      </div>

      {/* Success Message */}
      {loginStatus === 'success' && user && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md mt-6 relative z-10">
          <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
            <div>
              <p className="text-green-800 font-medium">Login Successful!</p>
              <p className="text-green-700 text-sm">
                Welcome back, {getRoleDisplayName(user)} from {user.county_name}
              </p>
              <p className="text-green-600 text-xs mt-1">
                Redirecting to your dashboard...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {loginStatus === 'error' && errorMessage && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md mt-6 relative z-10">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Login Failed</p>
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <LoginForm 
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
        />
      </div>

      {/* Navigation Links */}
      <div className="mt-6 text-center relative z-10">
        <button
          onClick={() => navigate('/')}
          className="text-green-600 hover:text-green-500 font-medium text-sm transition-colors mr-4"
        >
          ← Back to Home
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => navigate('/register')}
          className="text-green-600 hover:text-green-500 font-medium text-sm transition-colors ml-4"
        >
          Create Account →
        </button>
      </div>

      {/* Footer Information */}
      <div className="mt-8 text-center relative z-10">
        <div className="max-w-md mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-sm border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              🔐 Secure Authentication
            </h3>
            <p className="text-xs text-gray-600 mb-2">
              Login securely using your 8-digit Kenyan National ID and password.
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Encrypted
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                GDPR Compliant
              </span>
              <span className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Role-Based Access
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Role Information */}
      <div className="mt-6 text-center relative z-10">
        <div className="max-w-lg mx-auto">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Access Levels</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="font-semibold text-blue-800">👤 Citizens</div>
              <div className="text-blue-600 mt-1">Submit & track feedback</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="font-semibold text-green-800">🏛️ Officials</div>
              <div className="text-green-600 mt-1">Manage responses</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="font-semibold text-purple-800">⚙️ Admins</div>
              <div className="text-purple-600 mt-1">System management</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
