/**
 * Login Form Component
 * Handles user authentication with Kenyan National ID validation
 */

import React, { useState } from 'react';
import { Eye, EyeOff, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { LoginFormData, LoginFormErrors } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  // Authentication context
  const { login, isLoading } = useAuth();

  // Form state
  const [formData, setFormData] = useState<LoginFormData>({
    national_id: '',
    password: '',
  });

  // Form validation errors
  const [errors, setErrors] = useState<LoginFormErrors>({});

  // Password visibility toggle
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Validate National ID format (exactly 8 digits)
   */
  const validateNationalId = (nationalId: string): string | undefined => {
    if (!nationalId) {
      return 'National ID is required';
    }
    
    // Remove any non-digit characters for validation
    const digitsOnly = nationalId.replace(/\D/g, '');
    
    if (digitsOnly.length !== 8) {
      return 'National ID must be exactly 8 digits';
    }
    
    return undefined;
  };

  /**
   * Validate password
   */
  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    return undefined;
  };

  /**
   * Validate entire form
   */
  const validateForm = (): boolean => {
    const newErrors: LoginFormErrors = {};

    // Validate national ID
    const nationalIdError = validateNationalId(formData.national_id);
    if (nationalIdError) {
      newErrors.national_id = nationalIdError;
    }

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input changes with real-time validation
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // For national ID, only allow digits and limit to 8 characters
    if (name === 'national_id') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 8);
      setFormData(prev => ({ ...prev, [name]: digitsOnly }));
      
      // Clear error if field becomes valid
      if (errors.national_id && digitsOnly.length === 8) {
        setErrors(prev => ({ ...prev, national_id: undefined }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      // Clear error when user starts typing
      if (errors[name as keyof LoginFormErrors]) {
        setErrors(prev => ({ ...prev, [name]: undefined }));
      }
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear general error
    setErrors(prev => ({ ...prev, general: undefined }));

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      await login(formData.national_id, formData.password);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setErrors(prev => ({ ...prev, general: errorMessage }));
      onError?.(errorMessage);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-3 sm:p-4 lg:p-6 card-mobile">
      {/* Header */}
      <div className="text-center mb-3 sm:mb-4 lg:mb-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mobile-text-adjust">Welcome Back</h2>
        <p className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm lg:text-base">Sign in to your CivicAI account</p>
      </div>

      {/* General Error Message */}
      {errors.general && (
        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
          <span className="text-red-700 text-xs sm:text-sm break-words">{errors.general}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 form-mobile">
        {/* National ID Field */}
        <div>
          <label htmlFor="national_id" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            National ID *
          </label>
          <input
            type="text"
            id="national_id"
            name="national_id"
            value={formData.national_id}
            onChange={handleInputChange}
            placeholder="12345678"
            maxLength={8}
            className={`w-full px-3 py-2.5 sm:py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors text-base ${
              errors.national_id
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-green-500'
            }`}
            style={{ fontSize: '16px' }} // Prevents zoom on iOS
          />
          {errors.national_id && (
            <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-start">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0 mt-0.5" />
              <span className="break-words">{errors.national_id}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className={`w-full pl-3 pr-10 sm:pr-12 py-2.5 sm:py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors text-base ${
                errors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-green-500'
              }`}
              style={{ fontSize: '16px' }} // Prevents zoom on iOS
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors touch-target p-1"
            >
              {showPassword ? <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Eye className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs sm:text-sm text-red-600 flex items-start">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0 mt-0.5" />
              <span className="break-words">{errors.password}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-3 sm:py-3.5 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-base font-medium btn-mobile touch-target min-h-[44px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span>Logging in...</span>
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-3 sm:mt-4 lg:mt-6 text-center">
        <p className="text-xs sm:text-sm text-gray-500">
          🇰🇪 Secure login with your Kenyan National ID
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
