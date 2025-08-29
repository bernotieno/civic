/**
 * Login Page Component
 * Full page wrapper for the login form with Kenyan theme and branding
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardRoute } from '../utils/roleBasedRouting';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  
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

    // Redirect immediately on success
    if (user) {
      const dashboardRoute = getDashboardRoute(user);
      navigate(dashboardRoute, { replace: true });
    }
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto w-full max-w-sm sm:max-w-md">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {t('auth.welcomeBack')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {t('auth.signInToContinue')}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {loginStatus === 'error' && errorMessage && (
        <div className="mx-auto w-full max-w-sm sm:max-w-md mt-4 sm:mt-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">{t('common.error')}</p>
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-sm sm:max-w-md">
        <LoginForm
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
        />
      </div>

      {/* Navigation Links */}
      <div className="mt-4 sm:mt-6 text-center px-4">
        <button
          onClick={() => navigate('/')}
          className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          ← {t('navigation.home')}
        </button>
      </div>


    </div>
  );
};

export default LoginPage;
