/**
 * User Registration Form Component
 * Handles user registration with Kenyan National ID validation and location hierarchy
 */

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Lock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  County, 
  LocationHierarchy, 
  RegistrationData, 
  FormErrors,
  AuthUser 
} from '../types';
import { apiService } from '../services/api';

interface RegistrationFormProps {
  onSuccess?: (user: AuthUser) => void;
  onError?: (error: string) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess, onError }) => {
  // Form state
  const [formData, setFormData] = useState<RegistrationData>({
    national_id: '',
    name: '',
    email: '',
    password: '',
    county_id: 0,
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Location data
  const [counties, setCounties] = useState<County[]>([]);

  // Loading states for dropdowns
  const [loadingCounties, setLoadingCounties] = useState(true);

  // Load counties on component mount
  useEffect(() => {
    loadCounties();
  }, []);

  const loadCounties = async () => {
    try {
      setLoadingCounties(true);
      const countiesData = await apiService.getCounties();
      console.log('Counties data received:', countiesData); // Debug log

      // Ensure countiesData is an array
      if (Array.isArray(countiesData)) {
        setCounties(countiesData);
      } else {
        console.error('Counties data is not an array:', countiesData);
        setCounties([]);
        setErrors(prev => ({ ...prev, general: 'Invalid counties data format.' }));
      }
    } catch (error) {
      console.error('Failed to load counties:', error);
      setCounties([]); // Ensure counties is always an array
      setErrors(prev => ({ ...prev, general: 'Failed to load counties. Please refresh the page.' }));
    } finally {
      setLoadingCounties(false);
    }
  };



  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_id') ? parseInt(value) || 0 : value
    }));

    // Clear specific field error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // No additional hierarchy handling needed for county-only selection
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // National ID validation
    if (!formData.national_id) {
      newErrors.national_id = 'National ID is required';
    } else if (!apiService.validateNationalId(formData.national_id)) {
      newErrors.national_id = 'National ID must be exactly 8 digits';
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // County validation
    if (!formData.county_id) {
      newErrors.county_id = 'Please select your county';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await apiService.register(formData);
      
      if (response.success && response.user) {
        setIsSuccess(true);
        onSuccess?.(response.user);
      } else {
        // Handle API validation errors
        if (response.errors) {
          const apiErrors: FormErrors = {};
          Object.entries(response.errors).forEach(([key, messages]) => {
            apiErrors[key as keyof FormErrors] = messages[0];
          });
          setErrors(apiErrors);
        } else {
          setErrors({ general: response.message || 'Registration failed' });
        }
        onError?.(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setErrors({ general: errorMessage });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="text-center">
          <CheckCircle className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-green-500 mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            Your account has been created successfully. You can now access the CivicAI platform.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Register for CivicAI</h2>
        <p className="text-sm sm:text-base text-gray-600 mt-2">Create your account to engage with the National Assembly</p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700 text-sm">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        {/* National ID Field */}
        <div>
          <label htmlFor="national_id" className="block text-sm font-medium text-gray-700 mb-1">
            Kenyan National ID *
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
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.national_id ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.national_id && (
            <p className="mt-1 text-sm text-red-600">{errors.national_id}</p>
          )}
        </div>

        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="John Doe Kiprop"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="john.kiprop@gmail.com"
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
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
              className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
        </div>

        {/* County Selection */}
        <div>
          <label htmlFor="county_id" className="block text-sm font-medium text-gray-700 mb-1">
            County *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              id="county_id"
              name="county_id"
              value={formData.county_id}
              onChange={handleInputChange}
              disabled={loadingCounties}
              className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                errors.county_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">
                {loadingCounties ? 'Loading counties...' : 'Select your county'}
              </option>
              {Array.isArray(counties) && counties.map((county) => (
                <option key={county.id} value={county.id}>
                  {county.name}
                </option>
              ))}
            </select>
          </div>
          {errors.county_id && (
            <p className="mt-1 text-sm text-red-600">{errors.county_id}</p>
          )}
        </div>



        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#0D3C43] text-white py-2 px-4 rounded-md hover:bg-[#0D3C43]/90 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-teal-700 hover:text-teal-600 font-medium">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegistrationForm;
