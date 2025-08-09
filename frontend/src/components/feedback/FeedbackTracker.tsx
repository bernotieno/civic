/**
 * Feedback Tracking Component
 * Allows users to track feedback status using tracking ID (public access)
 */

import React, { useState } from 'react';
import { MagnifyingGlassIcon, ClockIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { FeedbackTrackingResponse } from '../../types';
import { apiService } from '../../services/api';

interface FeedbackTrackerProps {
  initialTrackingId?: string;
  onTrackingResult?: (result: FeedbackTrackingResponse) => void;
}

export const FeedbackTracker: React.FC<FeedbackTrackerProps> = ({
  initialTrackingId = '',
  onTrackingResult,
}) => {
  const [trackingId, setTrackingId] = useState(initialTrackingId);
  const [isSearching, setIsSearching] = useState(false);
  const [trackingResult, setTrackingResult] = useState<FeedbackTrackingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle tracking ID search
   */
  const handleTrackFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trackingId.trim()) {
      setError('Please enter a tracking ID');
      return;
    }

    setIsSearching(true);
    setError(null);
    setTrackingResult(null);

    try {
      const result = await apiService.trackFeedback(trackingId.trim());
      setTrackingResult(result);
      
      if (onTrackingResult) {
        onTrackingResult(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track feedback';
      setError(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Get status display configuration
   */
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          icon: ClockIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Pending Review',
          description: 'Your feedback is awaiting initial review'
        };
      case 'in_review':
        return {
          icon: ClockIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Under Review',
          description: 'Government officials are reviewing your feedback'
        };
      case 'responded':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Response Provided',
          description: 'An official response has been provided'
        };
      case 'resolved':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Resolved',
          description: 'The issue has been resolved'
        };
      case 'closed':
        return {
          icon: ExclamationCircleIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Closed',
          description: 'This feedback has been closed'
        };
      default:
        return {
          icon: ClockIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Unknown Status',
          description: 'Status information unavailable'
        };
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Africa/Nairobi'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Track Your Feedback</h2>
        <p className="text-gray-600">
          Enter your tracking ID to check the status of your feedback submission.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleTrackFeedback} className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="trackingId" className="sr-only">
              Tracking ID
            </label>
            <input
              type="text"
              id="trackingId"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter your tracking ID (e.g., FB-2024-001234)"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSearching}
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || !trackingId.trim()}
            className={`px-6 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isSearching || !trackingId.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSearching ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Searching...
              </span>
            ) : (
              <span className="flex items-center">
                <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                Track
              </span>
            )}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Tracking Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="text-sm text-red-600 mt-2">
                <p>Please check that:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Your tracking ID is correct and complete</li>
                  <li>The feedback was submitted successfully</li>
                  <li>You're using the exact tracking ID provided</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tracking Results */}
      {trackingResult && trackingResult.success && trackingResult.data && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className={`${getStatusConfig(trackingResult.data.status).bgColor} border ${getStatusConfig(trackingResult.data.status).borderColor} rounded-lg p-6`}>
            <div className="flex items-start">
              {React.createElement(getStatusConfig(trackingResult.data.status).icon, {
                className: `h-6 w-6 ${getStatusConfig(trackingResult.data.status).color} mr-3 mt-1`
              })}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {trackingResult.data.title}
                </h3>
                <div className="flex items-center mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusConfig(trackingResult.data.status).bgColor} ${getStatusConfig(trackingResult.data.status).color}`}>
                    {getStatusConfig(trackingResult.data.status).label}
                  </span>
                </div>
                <p className={`text-sm ${getStatusConfig(trackingResult.data.status).color}`}>
                  {getStatusConfig(trackingResult.data.status).description}
                </p>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 font-medium">Tracking ID:</span>
                <p className="text-gray-900 font-mono">{trackingResult.data.tracking_id}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Category:</span>
                <p className="text-gray-900">{trackingResult.data.category_display}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Submitted:</span>
                <p className="text-gray-900">{formatDate(trackingResult.data.submitted_at)}</p>
              </div>
              <div>
                <span className="text-gray-600 font-medium">Location:</span>
                <p className="text-gray-900">{trackingResult.data.location_path}</p>
              </div>
              {trackingResult.data.response_count > 0 && (
                <>
                  <div>
                    <span className="text-gray-600 font-medium">Responses:</span>
                    <p className="text-gray-900">{trackingResult.data.response_count}</p>
                  </div>
                  {trackingResult.data.last_response_at && (
                    <div>
                      <span className="text-gray-600 font-medium">Last Response:</span>
                      <p className="text-gray-900">{formatDate(trackingResult.data.last_response_at)}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Response Information */}
          {trackingResult.data.response_count > 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Official Response Available</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Government officials have provided {trackingResult.data.response_count} response(s) to your feedback.
                    {trackingResult.data.last_response_at && (
                      <span> The most recent response was on {formatDate(trackingResult.data.last_response_at)}.</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <ClockIcon className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Awaiting Response</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    No official responses have been provided yet. Government officials typically respond within 1-3 business days depending on the priority level and complexity of the issue.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Information */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">How to Use Tracking</h3>
        <div className="text-sm text-gray-700 space-y-1">
          <p>• Your tracking ID was provided when you submitted feedback</p>
          <p>• Tracking IDs typically start with "FB-" followed by year and numbers</p>
          <p>• You can track feedback without logging in using just the tracking ID</p>
          <p>• Bookmark this page with your tracking ID for easy access</p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackTracker;
