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
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Sign in to your CivicAI account</p>
      </div>

      {/* General Error Message */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
          <span className="text-red-700 text-sm">{errors.general}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* National ID Field */}
        <div>
          <label htmlFor="national_id" className="block text-sm font-medium text-gray-700 mb-1">
            National ID *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="national_id"
              name="national_id"
              value={formData.national_id}
              onChange={handleInputChange}
              placeholder="12345678"
              maxLength={8}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                errors.national_id 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-teal-500'
              }`}
            />
          </div>
          {errors.national_id && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.national_id}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                errors.password 
                  ? 'border-red-500 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-teal-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#0D3C43] text-white py-2 px-4 rounded-md hover:bg-[#0D3C43]/90 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Logging in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Footer Links */}
      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="text-teal-700 hover:text-teal-600 font-medium transition-colors">
            Register here
          </a>
        </p>

      </div>
    </div>
  );
};

export default LoginForm;
