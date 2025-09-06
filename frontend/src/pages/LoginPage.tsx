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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center safe-area-padding">
        <div className="text-center space-mobile">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-6 sm:py-8 lg:py-12 px-3 sm:px-4 lg:px-8 safe-area-padding prevent-horizontal-scroll" style={{ backgroundColor: '#E2FCF7' }}>
      {/* Header */}
      <div className="mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-md">
        <div className="text-center">
          <div className="flex justify-center mb-3 sm:mb-4 lg:mb-6">
            <img
              src="/logo.png"
              alt="CivicAI Logo"
              className="h-10 sm:h-12 lg:h-16 w-auto"
              onError={(e) => {
                // Fallback if logo.png doesn't exist
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 rounded-lg items-center justify-center" style={{ backgroundColor: '#0D3C43' }}>
              <span className="text-white font-bold text-lg sm:text-xl lg:text-2xl">C</span>
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 mobile-text-adjust">
            {t('auth.welcomeBack')}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {t('auth.signInToContinue')}
          </p>
        </div>
      </div>

      {/* Error Message */}
      {loginStatus === 'error' && errorMessage && (
        <div className="mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-md mt-3 sm:mt-4 lg:mt-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4 flex items-start">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-red-800 font-medium text-xs sm:text-sm">{t('common.error')}</p>
              <p className="text-red-700 text-xs sm:text-sm break-words">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      <div className="mt-4 sm:mt-6 lg:mt-8 mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-md">
        <LoginForm
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
        />
      </div>

      {/* Navigation */}
      <div className="mt-4 sm:mt-6 text-center space-y-2 sm:space-y-3 px-3 sm:px-0">
        <p className="text-xs sm:text-sm text-gray-600">
          {t('auth.dontHaveAccount')}{' '}
          <button
            onClick={() => navigate('/register')}
            className="font-medium transition-colors touch-target inline-block py-1 px-2 -mx-2 rounded"
            style={{ color: '#0D3C43' }}
          >
            {t('auth.signUp')}
          </button>
        </p>
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm transition-colors touch-target inline-block py-2 px-3 -mx-3 rounded"
          >
            ← {t('navigation.home')}
          </button>
        </div>
      </div>


    </div>
  );
};

export default LoginPage;
