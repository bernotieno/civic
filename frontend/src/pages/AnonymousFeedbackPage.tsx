/**
 * Anonymous Feedback Page
 * Dedicated page for anonymous feedback submission with proper state management
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AnonymousFeedbackForm from '../components/feedback/AnonymousFeedbackForm';
import FeedbackSuccess from '../components/feedback/FeedbackSuccess';
import FeedbackError from '../components/feedback/FeedbackError';
import FeedbackTracker from '../components/feedback/FeedbackTracker';
import { 
  ArrowLeftIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

type PageView = 'form' | 'success' | 'error' | 'tracker';

interface SubmissionData {
  feedback_id: string;
  tracking_id: string;
  status: string;
  submitted_at: string;
  location_path: string;
}

const AnonymousFeedbackPage: React.FC = () => {
  useDocumentTitle('Anonymous Feedback - CivicAI');

  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<PageView>('form');
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorType, setErrorType] = useState<'validation' | 'rate_limit' | 'auth' | 'network' | 'server' | 'permission'>('server');

  /**
   * Handle successful feedback submission
   */
  const handleSubmissionSuccess = (trackingId: string, data: any) => {
    setSubmissionData({
      feedback_id: data.feedback_id || data.id,
      tracking_id: trackingId,
      status: data.status || 'submitted',
      submitted_at: data.submitted_at || new Date().toISOString(),
      location_path: data.location_path || 'Anonymous Location'
    });
    setCurrentView('success');
  };

  /**
   * Handle feedback submission error
   */
  const handleSubmissionError = (error: string) => {
    setErrorMessage(error);
    
    // Determine error type based on error message
    if (error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('maximum submissions')) {
      setErrorType('rate_limit');
    } else if (error.toLowerCase().includes('validation') || error.toLowerCase().includes('required')) {
      setErrorType('validation');
    } else if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      setErrorType('network');
    } else if (error.toLowerCase().includes('session') || error.toLowerCase().includes('expired')) {
      setErrorType('auth');
    } else {
      setErrorType('server');
    }
    
    setCurrentView('error');
  };

  /**
   * Navigate back to form
   */
  const handleBackToForm = () => {
    setCurrentView('form');
    setErrorMessage('');
    setSubmissionData(null);
  };

  /**
   * Navigate to tracker
   */
  const handleTrackFeedback = (trackingId?: string) => {
    setCurrentView('tracker');
  };

  /**
   * Navigate back to home
   */
  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="pt-24 pb-12">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={handleGoHome}
                  className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Anonymous Feedback</h1>
                  <p className="text-gray-600 mt-1">
                    Submit feedback without revealing your identity
                  </p>
                </div>
              </div>
              
              {/* View Toggle */}
              <div className="flex space-x-2">
                <button
                  onClick={handleBackToForm}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentView === 'form'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  Submit
                </button>
                <button
                  onClick={() => handleTrackFeedback()}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentView === 'tracker'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                  Track
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Features Banner */}
        {currentView === 'form' && (
          <div className="bg-blue-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start">
                  <ShieldCheckIcon className="h-6 w-6 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Complete Privacy</p>
                    <p className="text-xs text-blue-100">No personal data stored</p>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-start">
                  <ClockIcon className="h-6 w-6 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">2-Hour Sessions</p>
                    <p className="text-xs text-blue-100">Automatic expiry</p>
                  </div>
                </div>
                <div className="flex items-center justify-center md:justify-start">
                  <UserIcon className="h-6 w-6 mr-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">3 Submissions</p>
                    <p className="text-xs text-blue-100">Per session limit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {currentView === 'form' && (
            <AnonymousFeedbackForm
              onSubmissionSuccess={handleSubmissionSuccess}
              onSubmissionError={handleSubmissionError}
            />
          )}

          {currentView === 'success' && submissionData && (
            <FeedbackSuccess
              trackingId={submissionData.tracking_id}
              submissionData={submissionData}
              onTrackFeedback={handleTrackFeedback}
              onViewSubmissions={() => {}} // Not applicable for anonymous users
              onSubmitAnother={handleBackToForm}
            />
          )}

          {currentView === 'error' && (
            <FeedbackError
              error={errorMessage}
              errorType={errorType}
              onRetry={handleBackToForm}
              onGoBack={handleBackToForm}
              onLogin={() => navigate('/login')}
            />
          )}

          {currentView === 'tracker' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Track Anonymous Feedback</h2>
                  <p className="text-gray-600">
                    Enter your tracking ID to check the status of your anonymous feedback submission.
                  </p>
                </div>
                
                <FeedbackTracker
                  initialTrackingId={submissionData?.tracking_id || ''}
                  onTrackingResult={(result) => {
                    console.log('Tracking result:', result);
                  }}
                />
              </div>

              {/* Help Section */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">Need Help?</h3>
                <div className="space-y-2 text-sm text-yellow-800">
                  <p><strong>Lost your tracking ID?</strong> Unfortunately, we cannot recover tracking IDs for anonymous submissions to protect your privacy.</p>
                  <p><strong>No response yet?</strong> Government departments typically respond within 3-5 business days.</p>
                  <p><strong>Want to submit more feedback?</strong> You can create a new anonymous session or register for an account to track all your submissions.</p>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={handleBackToForm}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
                  >
                    Submit New Feedback
                  </button>
                  <button
                    onClick={() => navigate('/register')}
                    className="px-4 py-2 bg-white text-yellow-700 border border-yellow-300 rounded-md hover:bg-yellow-50 text-sm font-medium"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA Section */}
        {currentView === 'form' && (
          <div className="bg-gray-100 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Want to track all your feedback?
                </h3>
                <p className="text-gray-600 mb-4">
                  Create a free account to manage your submissions, receive notifications, and access advanced features.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => navigate('/register')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-6 py-2 bg-white text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50 font-medium"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AnonymousFeedbackPage;
