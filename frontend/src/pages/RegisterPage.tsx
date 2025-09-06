/**
 * Registration Page Component
 * Full page wrapper for the registration form
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RegistrationForm from '../components/RegistrationForm';
import { AuthUser } from '../types';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleRegistrationSuccess = (user: AuthUser) => {
    setRegistrationStatus('success');
    console.log('Registration successful for user:', user);
    
    // Redirect to dashboard or home page after a short delay
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 2000);
  };

  const handleRegistrationError = (error: string) => {
    setRegistrationStatus('error');
    setErrorMessage(error);
    console.error('Registration failed:', error);
  };

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
            Join CivicAI
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600">
            Kenya's Premier Civic Engagement Platform
          </p>
        </div>
      </div>

      {/* Registration Form */}
      <div className="mt-4 sm:mt-6 lg:mt-8 mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-md">
        <RegistrationForm
          onSuccess={handleRegistrationSuccess}
          onError={handleRegistrationError}
        />
      </div>

      {/* Navigation */}
      <div className="mt-4 sm:mt-6 text-center space-y-2 sm:space-y-3 px-3 sm:px-0">
        <p className="text-xs sm:text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-medium transition-colors touch-target inline-block py-1 px-2 -mx-2 rounded"
            style={{ color: '#0D3C43' }}
          >
            Sign In
          </button>
        </p>
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 text-xs sm:text-sm transition-colors touch-target inline-block py-2 px-3 -mx-3 rounded"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 sm:mt-8 lg:mt-12 text-center space-mobile">
        <p className="text-xs text-gray-500">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Secure • Private • Government-Approved
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
