/**
 * Anonymous Feedback Form Component
 * Handles anonymous session creation and feedback submission without user authentication
 */

import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon,
  Clock as ClockIcon,
  Shield as ShieldCheckIcon,
  AlertTriangle as ExclamationTriangleIcon,
  Info as InformationCircleIcon
} from 'lucide-react';
import { 
  AnonymousSession,
  AnonymousSessionStatus,
  AnonymousFeedbackData,
  County,
  FeedbackCategoryOption,
  PriorityOption
} from '../../types';
import { apiService } from '../../services/api';
import { useLocationHierarchy } from '../../hooks/useLocationHierarchy';

interface AnonymousFeedbackFormProps {
  onSubmissionSuccess: (trackingId: string, data: any) => void;
  onSubmissionError: (error: string) => void;
}

export const AnonymousFeedbackForm: React.FC<AnonymousFeedbackFormProps> = ({
  onSubmissionSuccess,
  onSubmissionError
}) => {
  // Session state
  const [currentSession, setCurrentSession] = useState<AnonymousSession | null>(null);
  const [sessionStatus, setSessionStatus] = useState<AnonymousSessionStatus | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<AnonymousFeedbackData>>({
    title: '',
    content: '',
    category: '',
    priority: 'medium',
    county_id: 0,
    sub_county_id: undefined,
    ward_id: undefined,
    village_id: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [counties, setCounties] = useState<County[]>([]);
  const [categories, setCategories] = useState<FeedbackCategoryOption[]>([]);
  const [priorityOptions] = useState<PriorityOption[]>(apiService.getPriorityOptions());
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Location hierarchy hook
  const {
    subCounties,
    wards,
    villages,
    selectCounty,
    selectSubCounty,
    selectWard,
    resetSelections
  } = useLocationHierarchy();

  /**
   * Load initial data
   */
  useEffect(() => {
    loadInitialData();
    checkExistingSession();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      setDataError(null);

      console.log('Loading counties and categories...');

      const [countiesData, categoriesResponse] = await Promise.all([
        apiService.getCounties(),
        apiService.getFeedbackCategories()
      ]);

      console.log('Counties loaded:', countiesData);
      console.log('Categories response:', categoriesResponse);

      // Counties should be a direct array
      if (Array.isArray(countiesData)) {
        setCounties(countiesData);
        console.log('Set counties:', countiesData.length);
      } else {
        console.error('Counties data is not an array:', countiesData);
        setDataError('Failed to load counties data');
      }

      // Categories should have success wrapper
      if (categoriesResponse.success && categoriesResponse.data?.categories) {
        setCategories(categoriesResponse.data.categories);
        console.log('Set categories:', categoriesResponse.data.categories.length);
      } else {
        console.error('Categories response not successful:', categoriesResponse);
        setDataError('Failed to load categories data');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      setDataError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const checkExistingSession = async () => {
    const stored = apiService.getStoredAnonymousSession();
    if (stored) {
      setCurrentSession(stored);
      setFormData(prev => ({ ...prev, county_id: stored.county_id }));
      
      // Check session status
      try {
        const status = await apiService.checkAnonymousSessionStatus(stored.session_id);
        setSessionStatus(status);
      } catch (error) {
        console.error('Error checking session status:', error);
        apiService.clearAnonymousSession();
        setCurrentSession(null);
      }
    }
  };

  /**
   * Create new anonymous session
   */
  const createAnonymousSession = async (countyId: number) => {
    if (!countyId) {
      setSessionError('Please select a county first');
      return;
    }

    setIsCreatingSession(true);
    setSessionError(null);

    try {
      const response = await apiService.createAnonymousSession(countyId);
      
      if (response.success) {
        const newSession: AnonymousSession = {
          session_id: response.session_id,
          expires_in: response.expires_in,
          max_submissions: response.max_submissions,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + (response.expires_in * 1000)).toISOString()
        };
        
        setCurrentSession(newSession);
        setFormData(prev => ({ ...prev, county_id: countyId }));
        
        // Get initial session status
        const status = await apiService.checkAnonymousSessionStatus(response.session_id);
        setSessionStatus(status);
      } else {
        setSessionError(response.message || 'Failed to create anonymous session');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      setSessionError(errorMessage);
    } finally {
      setIsCreatingSession(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Handle location hierarchy changes
    if (field === 'county_id' && value !== formData.county_id) {
      resetSelections();
      setFormData(prev => ({
        ...prev,
        county_id: value,
        sub_county_id: undefined,
        ward_id: undefined,
        village_id: undefined
      }));
      
      if (value) {
        const county = counties.find(c => c.id === value);
        if (county) {
          const locationCounty = {
            id: county.id,
            name: county.name,
            type: 'county' as const,
            level: 0,
            code: county.code,
            full_path: county.name,
            children: []
          };
          selectCounty(locationCounty);
        }
      }
    } else if (field === 'sub_county_id' && value !== formData.sub_county_id) {
      setFormData(prev => ({
        ...prev,
        sub_county_id: value,
        ward_id: undefined,
        village_id: undefined
      }));
      
      if (value) {
        const subCounty = subCounties.find(sc => sc.id === value);
        if (subCounty) {
          selectSubCounty(subCounty);
        }
      }
    } else if (field === 'ward_id' && value !== formData.ward_id) {
      setFormData(prev => ({
        ...prev,
        ward_id: value,
        village_id: undefined
      }));
      
      if (value) {
        const ward = wards.find(w => w.id === value);
        if (ward) {
          selectWard(ward);
        }
      }
    }
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 10) {
      newErrors.title = 'Title must be at least 10 characters';
    } else if (formData.title.trim().length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (!formData.content?.trim()) {
      newErrors.content = 'Description is required';
    } else if (formData.content.trim().length < 20) {
      newErrors.content = 'Description must be at least 20 characters';
    } else if (formData.content.trim().length > 2000) {
      newErrors.content = 'Description must be less than 2000 characters';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.county_id) {
      newErrors.county_id = 'County is required';
    }

    if (!currentSession) {
      newErrors.session = 'Anonymous session is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !currentSession) {
      return;
    }

    // Check session status before submission
    if (sessionStatus && !sessionStatus.can_submit) {
      onSubmissionError(sessionStatus.message);
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData: AnonymousFeedbackData = {
        session_id: currentSession.session_id,
        title: formData.title!.trim(),
        content: formData.content!.trim(),
        category: formData.category!,
        priority: formData.priority!,
        county_id: formData.county_id!,
        sub_county_id: formData.sub_county_id,
        ward_id: formData.ward_id,
        village_id: formData.village_id,
      };

      const response = await apiService.submitAnonymousFeedback(submissionData);
      
      if (response.success && response.data) {
        // Update session usage
        apiService.updateAnonymousSessionUsage();
        
        // Update session status
        const updatedStatus = await apiService.checkAnonymousSessionStatus(currentSession.session_id);
        setSessionStatus(updatedStatus);
        
        onSubmissionSuccess(response.data.tracking_id, response.data);
        
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
      } else {
        if (response.errors) {
          setErrors(response.errors);
        }
        onSubmissionError(response.message || 'Failed to submit feedback');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback';
      onSubmissionError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Start new session (clear current one)
   */
  const startNewSession = () => {
    apiService.clearAnonymousSession();
    setCurrentSession(null);
    setSessionStatus(null);
    setSessionError(null);
    setFormData({
      title: '',
      content: '',
      category: '',
      priority: 'medium',
      county_id: 0,
      sub_county_id: undefined,
      ward_id: undefined,
      village_id: undefined,
    });
  };

  // Show loading state while data is being fetched
  if (loadingData) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading counties and categories...</span>
        </div>
      </div>
    );
  }

  // Show error state if data loading failed
  if (dataError) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">Failed to Load Data</p>
              <p>{dataError}</p>
              <button
                onClick={loadInitialData}
                className="mt-2 text-red-700 hover:text-red-900 underline text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <UserIcon className="h-8 w-8 text-gray-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Anonymous Feedback</h2>
            <p className="text-gray-600">
              Submit feedback without revealing your identity. Your privacy is completely protected.
            </p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Complete Privacy Protection</p>
              <ul className="space-y-1 text-xs">
                <li>• No personal information required or stored</li>
                <li>• Sessions expire automatically after 2 hours</li>
                <li>• Maximum 3 submissions per session</li>
                <li>• Tracking ID provided for status updates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Session Status */}
      {!currentSession ? (
        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-2">Create Anonymous Session</p>
                <p>First, select your county and create an anonymous session to submit feedback.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="county-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select County <span className="text-red-500">*</span>
              </label>
              <select
                id="county-select"
                value={formData.county_id || ''}
                onChange={(e) => handleInputChange('county_id', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCreatingSession}
              >
                <option value="">Choose your county...</option>
                {counties.map((county) => (
                  <option key={county.id} value={county.id}>
                    {county.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => createAnonymousSession(formData.county_id!)}
              disabled={!formData.county_id || isCreatingSession}
              className={`px-6 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !formData.county_id || isCreatingSession
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isCreatingSession ? 'Creating...' : 'Create Session'}
            </button>
          </div>

          {sessionError && (
            <div className="mt-3 flex items-center text-sm text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              {sessionError}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Active Session Info */}
          <div className="mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">Anonymous Session Active</p>
                    <p>Session ID: <code className="bg-green-100 px-1 rounded text-xs">{currentSession.session_id}</code></p>
                    {sessionStatus && (
                      <p className="mt-1">
                        Submissions: {sessionStatus.submissions_used}/{sessionStatus.submissions_limit} used
                        {sessionStatus.can_submit ? 
                          ` • ${sessionStatus.submissions_limit - sessionStatus.submissions_used} remaining` : 
                          ' • Limit reached'
                        }
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startNewSession}
                  className="text-xs text-green-700 hover:text-green-900 underline"
                >
                  Start New Session
                </button>
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title || ''}
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
                <p className="text-xs text-gray-500 ml-auto">
                  {(formData.title || '').length}/200
                </p>
              </div>
            </div>

            {/* Content Field */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={formData.content || ''}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={6}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.content ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                }`}
                placeholder="Provide detailed information about your feedback (20-2000 characters)"
                maxLength={2000}
                disabled={isSubmitting}
              />
              <div className="flex justify-between mt-1">
                {errors.content && <p className="text-sm text-red-600">{errors.content}</p>}
                <p className="text-xs text-gray-500 ml-auto">
                  {(formData.content || '').length}/2000
                </p>
              </div>
            </div>

            {/* Category and Priority Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="category"
                  value={formData.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.category ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <option value="">Select category...</option>
                  {Array.isArray(categories) && categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority || 'medium'}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !sessionStatus?.can_submit}
                className={`px-8 py-3 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isSubmitting || !sessionStatus?.can_submit
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Anonymous Feedback'}
              </button>
            </div>

            {/* Session limit warning */}
            {sessionStatus && !sessionStatus.can_submit && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Submission Limit Reached</p>
                    <p>{sessionStatus.message}</p>
                    <button
                      type="button"
                      onClick={startNewSession}
                      className="mt-2 text-yellow-700 hover:text-yellow-900 underline text-sm"
                    >
                      Create a new session to submit more feedback
                    </button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
};

export default AnonymousFeedbackForm;
