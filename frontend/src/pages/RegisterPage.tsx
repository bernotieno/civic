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
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8" style={{ backgroundColor: '#E2FCF7' }}>
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="CivicAI Logo"
              className="h-16 w-auto"
              onError={(e) => {
                // Fallback if logo.png doesn't exist
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-16 h-16 rounded-lg items-center justify-center" style={{ backgroundColor: '#0D3C43' }}>
              <span className="text-white font-bold text-2xl">C</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join CivicAI
          </h1>
          <p className="text-lg text-gray-600">
            Kenya's Premier Civic Engagement Platform
          </p>
        </div>
      </div>

      {/* Registration Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <RegistrationForm
          onSuccess={handleRegistrationSuccess}
          onError={handleRegistrationError}
        />
      </div>

      {/* Navigation */}
      <div className="mt-6 text-center space-y-3">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-medium transition-colors"
            style={{ color: '#0D3C43' }}
          >
            Sign In
          </button>
        </p>
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
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
