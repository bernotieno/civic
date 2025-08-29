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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto w-full max-w-sm sm:max-w-md">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            🇰🇪 CivicAI
          </h1>
          <p className="text-base sm:text-lg text-gray-600">
            Kenya's Premier Civic Engagement Platform
          </p>
        </div>
      </div>

      {/* Registration Form */}
      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-sm sm:max-w-md">
        <RegistrationForm 
          onSuccess={handleRegistrationSuccess}
          onError={handleRegistrationError}
        />
      </div>

      {/* Navigation Links */}
      <div className="mt-4 sm:mt-6 text-center px-4">
        <button
          onClick={() => navigate('/')}
          className="text-teal-700 hover:text-teal-600 font-medium text-sm"
        >
          ← Back to Home
        </button>
      </div>


    </div>
  );
};

export default RegisterPage;
