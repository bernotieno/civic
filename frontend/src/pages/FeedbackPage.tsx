/**
 * Main Feedback Page
 * Integrates all feedback components with proper state management and routing
 */

import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthContext from '../contexts/AuthContext';
import FeedbackForm from '../components/feedback/FeedbackForm';
import FeedbackSuccess from '../components/feedback/FeedbackSuccess';
import FeedbackError from '../components/feedback/FeedbackError';
import FeedbackTracker from '../components/feedback/FeedbackTracker';
import FeedbackHistory from '../components/feedback/FeedbackHistory';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  ClockIcon, 
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

type FeedbackPageView = 'form' | 'success' | 'error' | 'tracker' | 'history';

interface SubmissionData {
  feedback_id: string;
  tracking_id: string;
  status: string;
  submitted_at: string;
  location_path: string;
}

export const FeedbackPage: React.FC = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [currentView, setCurrentView] = useState<FeedbackPageView>('form');
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorType, setErrorType] = useState<'validation' | 'rate_limit' | 'auth' | 'network' | 'server' | 'permission'>('server');

  /**
   * Handle URL parameters for initial view
   */
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam && ['form', 'tracker', 'history'].includes(viewParam)) {
      setCurrentView(viewParam as FeedbackPageView);
    }
  }, [searchParams]);

  /**
   * Handle successful feedback submission
   */
  const handleSubmissionSuccess = (trackingId: string, data: SubmissionData) => {
    setSubmissionData(data);
    setCurrentView('success');
  };

  /**
   * Handle feedback submission error
   */
  const handleSubmissionError = (error: string) => {
    setErrorMessage(error);
    
    // Determine error type based on error message
    if (error.toLowerCase().includes('validation') || error.toLowerCase().includes('required')) {
      setErrorType('validation');
    } else if (error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('exceeded')) {
      setErrorType('rate_limit');
    } else if (error.toLowerCase().includes('authentication') || error.toLowerCase().includes('login')) {
      setErrorType('auth');
    } else if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      setErrorType('network');
    } else if (error.toLowerCase().includes('permission') || error.toLowerCase().includes('access')) {
      setErrorType('permission');
    } else {
      setErrorType('server');
    }
    
    setCurrentView('error');
  };

  /**
   * Handle navigation to tracking
   */
  const handleTrackFeedback = (trackingId: string) => {
    setCurrentView('tracker');
    setSearchParams({ view: 'tracker' });
  };

  /**
   * Handle navigation to history
   */
  const handleViewSubmissions = () => {
    setCurrentView('history');
    setSearchParams({ view: 'history' });
  };

  /**
   * Handle navigation back to form
   */
  const handleBackToForm = () => {
    setCurrentView('form');
    setSearchParams({ view: 'form' });
    setErrorMessage('');
    setSubmissionData(null);
  };

  /**
   * Handle tab navigation
   */
  const handleTabNavigation = (view: FeedbackPageView) => {
    setCurrentView(view);
    setSearchParams({ view });
  };

  /**
   * Handle login redirect
   */
  const handleLogin = () => {
    navigate('/login');
  };

  /**
   * Check authentication
   */
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mb-4">
            <DocumentTextIcon className="h-12 w-12 text-blue-600 mx-auto" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in to submit feedback to your county government.
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => handleTabNavigation('form')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'form'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PlusIcon className="h-4 w-4 inline mr-2" />
              Submit Feedback
            </button>

            <button
              onClick={() => handleTabNavigation('tracker')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'tracker'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MagnifyingGlassIcon className="h-4 w-4 inline mr-2" />
              Track Feedback
            </button>

            <button
              onClick={() => handleTabNavigation('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClockIcon className="h-4 w-4 inline mr-2" />
              My History
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'form' && (
          <FeedbackForm
            user={user}
            onSubmissionSuccess={handleSubmissionSuccess}
            onSubmissionError={handleSubmissionError}
          />
        )}

        {currentView === 'success' && submissionData && (
          <FeedbackSuccess
            trackingId={submissionData.tracking_id}
            submissionData={submissionData}
            onTrackFeedback={handleTrackFeedback}
            onViewSubmissions={handleViewSubmissions}
            onSubmitAnother={handleBackToForm}
          />
        )}

        {currentView === 'error' && (
          <FeedbackError
            error={errorMessage}
            errorType={errorType}
            onRetry={handleBackToForm}
            onGoBack={handleBackToForm}
            onLogin={handleLogin}
          />
        )}

        {currentView === 'tracker' && (
          <FeedbackTracker
            initialTrackingId={submissionData?.tracking_id || ''}
            onTrackingResult={(result) => {
              // Handle tracking result if needed
              console.log('Tracking result:', result);
            }}
          />
        )}

        {currentView === 'history' && (
          <FeedbackHistory
            onViewDetails={(feedbackId) => {
              // Navigate to detailed view (future implementation)
              console.log('View details for:', feedbackId);
            }}
            onTrackFeedback={(trackingId) => {
              setCurrentView('tracker');
            }}
          />
        )}
      </div>

      {/* Help Section */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">How to Submit Feedback</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Fill out the form with detailed information</li>
                <li>• Select the appropriate category and priority</li>
                <li>• Choose your location in the hierarchy</li>
                <li>• Submit and receive a tracking ID</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tracking Your Feedback</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Use your tracking ID to check status</li>
                <li>• No login required for tracking</li>
                <li>• Receive updates as status changes</li>
                <li>• View official responses when available</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Response Times</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Urgent:</strong> 2-6 hours</li>
                <li>• <strong>High:</strong> 6-24 hours</li>
                <li>• <strong>Medium:</strong> 1-3 days</li>
                <li>• <strong>Low:</strong> 3-7 days</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
