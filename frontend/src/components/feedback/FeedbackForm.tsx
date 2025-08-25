/**
 * Comprehensive Feedback Submission Form
 * Supports Kenya's administrative hierarchy, authentication, validation, and rate limiting
 */

import React, { useState, useEffect } from 'react';
import { 
  FeedbackSubmissionData, 
  FeedbackFormErrors, 
  FeedbackCategoryOption, 
  PriorityOption,
  AuthUser 
} from '../../types';
import { apiService } from '../../services/api';
import { useLocationHierarchy } from '../../hooks/useLocationHierarchy';

interface FeedbackFormProps {
  user: AuthUser | null;
  onSuccess: (trackingId: string, data: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
  allowAnonymous?: boolean;
}

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  user,
  onSuccess,
  onError,
  onCancel,
  allowAnonymous = false
}) => {
  
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousSession, setAnonymousSession] = useState<any>(null);
  const [creatingSession, setCreatingSession] = useState(false);

  if (!user && !allowAnonymous) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to submit feedback.</p>
        </div>
      </div>
    );
  }
  // Form state
  const [formData, setFormData] = useState<FeedbackSubmissionData>({
    title: '',
    content: '',
    category: '',
    priority: 'medium',
    county_id: 0,
    sub_county_id: undefined,
    ward_id: undefined,
    village_id: undefined,
  });

  const [errors, setErrors] = useState<FeedbackFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<FeedbackCategoryOption[]>([]);
  const [priorityOptions] = useState<PriorityOption[]>(apiService.getPriorityOptions());
  const [rateLimitInfo, setRateLimitInfo] = useState<{ canSubmit: boolean; remaining: number }>({
    canSubmit: true,
    remaining: 10
  });

  // Location hierarchy hook
  const {
    counties,
    subCounties,
    wards,
    villages,
    county,
    subCounty,
    ward,
    village,
    loading: locationLoading,
    error: locationError,
    selectCounty,
    selectSubCounty,
    selectWard,
    selectVillage,
    getSelectionData,
    getLocationPath,
    loadingSubCounties,
    loadingWards,
    loadingVillages,
  } = useLocationHierarchy();

  /**
   * Load initial data on component mount
   */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load feedback categories
        const categoriesResponse = await apiService.getFeedbackCategories();
        console.log('📂 Categories response:', categoriesResponse);
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.data.categories);
        }

        // Check rate limit
        const rateLimitStatus = await apiService.checkRateLimit();
        setRateLimitInfo(rateLimitStatus);

        // Set user's county as default if available (skip for anonymous)
        if (user?.accessible_counties && !isAnonymous) {
          console.log('🏛️ Setting default county:', {
            userAccessibleCounties: user.accessible_counties,
            availableCounties: counties
          });
          
          if (user.accessible_counties.length > 0 && counties.length > 0) {
            const userCountyData = user.accessible_counties[0];
            const userCounty = counties.find(c => c.id === userCountyData.id);
            console.log('🎯 Found user county:', userCounty);
            
            if (userCounty) {
              const locationCounty = {
                id: userCounty.id,
                name: userCounty.name,
                type: 'county' as const,
                level: 0,
                code: userCounty.code || '',
                full_path: userCounty.name,
                children: []
              };
              await selectCounty(locationCounty);
              setFormData(prev => ({ ...prev, county_id: userCounty.id }));
              console.log('✅ Default county set:', userCounty.id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    if (counties.length > 0) {
      loadInitialData();
    }
  }, [counties, user, selectCounty]);

  /**
   * Update form data when location selections change
   */
  useEffect(() => {
    const locationData = getSelectionData();
    console.log('📍 Location data updated:', locationData);
    setFormData(prev => ({
      ...prev,
      county_id: locationData.county_id || 0,
      sub_county_id: locationData.sub_county_id || undefined,
      ward_id: locationData.ward_id || undefined,
      village_id: locationData.village_id || undefined,
    }));
  }, [getSelectionData]);

  /**
   * Handle anonymous mode toggle
   */
  const handleAnonymousToggle = async () => {
    if (!isAnonymous) {
      // Switching to anonymous mode - create session if county is selected
      if (formData.county_id) {
        await createAnonymousSession(formData.county_id);
      }
      setIsAnonymous(true);
    } else {
      // Switching back to authenticated mode
      setIsAnonymous(false);
      setAnonymousSession(null);
      apiService.clearAnonymousSession();
    }
  };

  /**
   * Create anonymous session for selected county
   */
  const createAnonymousSession = async (countyId: number) => {
    if (creatingSession) return;
    
    setCreatingSession(true);
    try {
      const sessionResponse = await apiService.createAnonymousSession(countyId);
      if (sessionResponse.success) {
        setAnonymousSession({
          session_id: sessionResponse.session_id,
          county_id: countyId,
          max_submissions: sessionResponse.max_submissions,
          expires_in: sessionResponse.expires_in
        });
        console.log('✅ Anonymous session created:', sessionResponse.session_id);
      } else {
        throw new Error(sessionResponse.message || 'Failed to create anonymous session');
      }
    } catch (error) {
      console.error('❌ Error creating anonymous session:', error);
      onError(error instanceof Error ? error.message : 'Failed to create anonymous session');
      setIsAnonymous(false);
    } finally {
      setCreatingSession(false);
    }
  };

  /**
   * Handle county selection change for anonymous sessions
   */
  useEffect(() => {
    if (isAnonymous && formData.county_id && !anonymousSession) {
      createAnonymousSession(formData.county_id);
    }
  }, [isAnonymous, formData.county_id]);

  /**
   * Handle form field changes
   */
  const handleInputChange = (field: keyof FeedbackSubmissionData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: FeedbackFormErrors = {};

    console.log('🔍 Validating form data:', formData);

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must not exceed 200 characters';
    }

    // Content validation
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    } else if (formData.content.length < 50) {
      newErrors.content = 'Content must be at least 50 characters';
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // County validation
    if (!formData.county_id) {
      newErrors.county_id = 'County selection is required';
    }

    // Check if user has access to selected county (skip for anonymous)
    if (formData.county_id && user?.accessible_counties && !isAnonymous) {
      const hasAccess = user.accessible_counties.some(c => c.id === formData.county_id);
      console.log('🏛️ County access check:', {
        selectedCounty: formData.county_id,
        accessibleCounties: user.accessible_counties,
        hasAccess
      });
      if (!hasAccess) {
        newErrors.county_id = 'You do not have access to submit feedback for this county';
      }
    }

    console.log('🔍 Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('🚀 Form submission started');
    console.log('👤 User object:', user);
    console.log('📝 Form data:', formData);
    console.log('🏛️ User accessible counties:', user.accessible_counties);

    // Check rate limit for authenticated users
    if (!isAnonymous && !rateLimitInfo.canSubmit) {
      onError(`Rate limit exceeded. You have ${rateLimitInfo.remaining} submissions remaining.`);
      return;
    }

    // Check anonymous session for anonymous users
    if (isAnonymous && !anonymousSession?.session_id) {
      onError('Anonymous session required. Please select a county first.');
      return;
    }

    // Validate form
    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = isAnonymous 
        ? await apiService.submitAnonymousFeedback({
            session_id: anonymousSession.session_id,
            title: formData.title,
            content: formData.content,
            category: formData.category,
            priority: formData.priority,
            county_id: formData.county_id,
            sub_county_id: formData.sub_county_id,
            ward_id: formData.ward_id,
            village_id: formData.village_id
          })
        : await apiService.submitFeedback(formData);
      
      console.log('📡 API Response:', response);
      
      if (response.success && response.data) {
        onSuccess(response.data.tracking_id, response.data);
        
        // Reset form
        setFormData({
          title: '',
          content: '',
          category: '',
          priority: 'medium',
          county_id: formData.county_id, // Keep county selection
          sub_county_id: undefined,
          ward_id: undefined,
          village_id: undefined,
        });
        
        // Update rate limit info
        const newRateLimitStatus = await apiService.checkRateLimit();
        setRateLimitInfo(newRateLimitStatus);
      } else {
        console.log('❌ Submission failed:', response);
        if (response.errors) {
          setErrors(response.errors);
        }
        onError(response.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      onError(errorMessage);
      
      // Handle rate limit errors specifically
      if (errorMessage.includes('Rate limit exceeded')) {
        const newRateLimitStatus = await apiService.checkRateLimit();
        setRateLimitInfo(newRateLimitStatus);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Get selected category details
   */
  const selectedCategory = categories.find(cat => cat.value === formData.category);
  const selectedPriority = priorityOptions.find(p => p.value === formData.priority);

  if (locationLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading counties...</span>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">
          <strong>Error loading location data:</strong> {locationError}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Submit Feedback</h2>
        <p className="text-gray-600">
          {isAnonymous 
            ? 'Submit anonymous feedback to your county government. Your identity will remain completely private.'
            : `Share your concerns with ${user?.county_name || 'your'} County Government. Your feedback will be routed to the appropriate department for review.`
          }
        </p>
        
        {/* Anonymous Mode Toggle */}
        {allowAnonymous && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900">Submission Mode</h3>
                <p className="text-xs text-blue-700 mt-1">
                  {isAnonymous ? 'Anonymous - Your identity is completely protected' : 'Authenticated - Linked to your account'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAnonymousToggle}
                disabled={creatingSession}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnonymous ? 'bg-blue-600' : 'bg-gray-200'
                } ${creatingSession ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnonymous ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {creatingSession && (
              <div className="mt-2 text-xs text-blue-600 flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                Creating anonymous session...
              </div>
            )}
            {isAnonymous && anonymousSession && (
              <div className="mt-2 text-xs text-green-700">
                ✅ Anonymous session active - {anonymousSession.max_submissions} submissions allowed
              </div>
            )}
          </div>
        )}
        
        {/* Rate limit indicator */}
        {!isAnonymous && (
          <div className="mt-3 flex items-center text-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${rateLimitInfo.canSubmit ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={rateLimitInfo.canSubmit ? 'text-green-700' : 'text-red-700'}>
              {rateLimitInfo.remaining} submissions remaining today
            </span>
          </div>
        )}
        
        {/* Anonymous session info */}
        {isAnonymous && anonymousSession && (
          <div className="mt-3 flex items-center text-sm">
            <div className="w-2 h-2 rounded-full mr-2 bg-blue-500"></div>
            <span className="text-blue-700">
              Anonymous session - {anonymousSession.max_submissions} submissions allowed
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Brief description of your issue (10-200 characters)"
            maxLength={200}
            disabled={isSubmitting}
          />
          <div className="flex justify-between mt-1">
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
            <p className="text-sm text-gray-500 ml-auto">{formData.title.length}/200</p>
          </div>
        </div>

        {/* Content Field */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Detailed Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="content"
            rows={6}
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.content ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            }`}
            placeholder="Provide detailed information about your issue (minimum 50 characters)"
            disabled={isSubmitting}
          />
          <div className="flex justify-between mt-1">
            {errors.content && <p className="text-sm text-red-600">{errors.content}</p>}
            <p className="text-sm text-gray-500 ml-auto">{formData.content.length} characters</p>
          </div>
        </div>

        {/* Category and Priority Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Field */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
            {selectedCategory && (
              <div className="mt-2 p-2 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Department:</strong> {selectedCategory.department}
                </p>
                <p className="text-sm text-blue-700">{selectedCategory.description}</p>
              </div>
            )}
          </div>

          {/* Priority Field */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority Level
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              {priorityOptions.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
            {selectedPriority && (
              <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Expected Response:</strong> {selectedPriority.timeframe}
                </p>
                <p className="text-sm text-yellow-700">{selectedPriority.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Location Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Location Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* County Selection */}
            <div>
              <label htmlFor="county" className="block text-sm font-medium text-gray-700 mb-1">
                County <span className="text-red-500">*</span>
              </label>
              <select
                id="county"
                value={county?.id || ''}
                onChange={(e) => {
                  const selectedCountyData = counties.find(c => c.id === parseInt(e.target.value));
                  if (selectedCountyData) {
                    const locationCounty = {
                      id: selectedCountyData.id,
                      name: selectedCountyData.name,
                      type: 'county' as const,
                      level: 0,
                      code: selectedCountyData.code || '',
                      full_path: selectedCountyData.name,
                      children: []
                    };
                    selectCounty(locationCounty);
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.county_id ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select County</option>
                {counties.map((countyOption) => (
                  <option key={countyOption.id} value={countyOption.id}>
                    {countyOption.name}
                  </option>
                ))}
              </select>
              {errors.county_id && <p className="text-sm text-red-600 mt-1">{errors.county_id}</p>}
            </div>

            {/* Sub-County Selection */}
            <div>
              <label htmlFor="subCounty" className="block text-sm font-medium text-gray-700 mb-1">
                Sub-County
              </label>
              <select
                id="subCounty"
                value={subCounty?.id || ''}
                onChange={(e) => {
                  const selectedSubCounty = subCounties.find(sc => sc.id === parseInt(e.target.value));
                  if (selectedSubCounty) {
                    selectSubCounty(selectedSubCounty);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || !county || loadingSubCounties}
              >
                <option value="">Select Sub-County</option>
                {subCounties.map((subCountyOption) => (
                  <option key={subCountyOption.id} value={subCountyOption.id}>
                    {subCountyOption.name}
                  </option>
                ))}
              </select>
              {loadingSubCounties && (
                <p className="text-sm text-gray-500 mt-1">Loading sub-counties...</p>
              )}
            </div>

            {/* Ward Selection */}
            <div>
              <label htmlFor="ward" className="block text-sm font-medium text-gray-700 mb-1">
                Ward
              </label>
              <select
                id="ward"
                value={ward?.id || ''}
                onChange={(e) => {
                  const selectedWard = wards.find(w => w.id === parseInt(e.target.value));
                  if (selectedWard) {
                    selectWard(selectedWard);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || !subCounty || loadingWards}
              >
                <option value="">Select Ward</option>
                {wards.map((wardOption) => (
                  <option key={wardOption.id} value={wardOption.id}>
                    {wardOption.name}
                  </option>
                ))}
              </select>
              {loadingWards && (
                <p className="text-sm text-gray-500 mt-1">Loading wards...</p>
              )}
            </div>

            {/* Village Selection */}
            <div>
              <label htmlFor="village" className="block text-sm font-medium text-gray-700 mb-1">
                Village
              </label>
              <select
                id="village"
                value={village?.id || ''}
                onChange={(e) => {
                  const selectedVillage = villages.find(v => v.id === parseInt(e.target.value));
                  if (selectedVillage) {
                    selectVillage(selectedVillage);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || !ward || loadingVillages}
              >
                <option value="">Select Village</option>
                {villages.map((villageOption) => (
                  <option key={villageOption.id} value={villageOption.id}>
                    {villageOption.name}
                  </option>
                ))}
              </select>
              {loadingVillages && (
                <p className="text-sm text-gray-500 mt-1">Loading villages...</p>
              )}
            </div>
          </div>

          {/* Location Path Display */}
          {getLocationPath() && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700">
                <strong>Selected Location:</strong> {getLocationPath()}
              </p>
            </div>
          )}
        </div>

        {/* General Error Display */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{errors.general}</p>
          </div>
        )}



        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setFormData({
                title: '',
                content: '',
                category: '',
                priority: 'medium',
                county_id: formData.county_id,
                sub_county_id: undefined,
                ward_id: undefined,
                village_id: undefined,
              });
              setErrors({});
            }}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Clear Form
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || (!isAnonymous && !rateLimitInfo.canSubmit) || (isAnonymous && !anonymousSession?.session_id)}
            className={`px-6 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isSubmitting || (!isAnonymous && !rateLimitInfo.canSubmit) || (isAnonymous && !anonymousSession?.session_id)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </span>
            ) : (
              isAnonymous ? 'Submit Anonymous Feedback' : 'Submit Feedback'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FeedbackForm;
