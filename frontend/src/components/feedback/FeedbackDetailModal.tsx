/**
 * Enhanced Feedback Detail Modal Component
 * Shows comprehensive feedback details including government responses
 */

import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { apiService } from '../../services/api';

interface FeedbackResponse {
  id: string;
  content: string;
  is_public: boolean;
  created_at: string;
  responder_name: string;
  responder_role: string;
}

interface DetailedFeedback {
  id: string;
  tracking_id: string;
  title: string;
  content: string;
  category: string;
  category_display: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  created_at: string;
  updated_at: string;
  response_count: number;
  last_response_at: string | null;
  view_count: number;
  location_path: string;
  is_anonymous: boolean;
  responses: FeedbackResponse[];
  timeline: Array<{
    action: string;
    timestamp: string;
    description: string;
  }>;
}

interface FeedbackDetailModalProps {
  feedbackId: string | null;
  onClose: () => void;
  onTrackFeedback?: (trackingId: string) => void;
}

export const FeedbackDetailModal: React.FC<FeedbackDetailModalProps> = ({
  feedbackId,
  onClose,
  onTrackFeedback,
}) => {
  const [feedback, setFeedback] = useState<DetailedFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load detailed feedback data
   */
  const loadFeedbackDetail = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading feedback detail for ID:', id);
      const response = await apiService.getFeedbackDetail(id);
      
      if (response.success && response.data?.feedback) {
        console.log('✅ Feedback detail loaded:', response.data.feedback);
        setFeedback(response.data.feedback);
      } else {
        console.error('❌ Failed to load feedback detail:', response);
        setError('Failed to load feedback details');
      }
    } catch (err) {
      console.error('❌ Error loading feedback detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feedback details');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load data when feedbackId changes
   */
  useEffect(() => {
    if (feedbackId) {
      loadFeedbackDetail(feedbackId);
    }
  }, [feedbackId]);

  /**
   * Get status configuration
   */
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          icon: ClockIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Pending Review'
        };
      case 'in_review':
        return {
          icon: EyeIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: 'Under Review'
        };
      case 'responded':
        return {
          icon: ChatBubbleLeftRightIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Responded'
        };
      case 'resolved':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Resolved'
        };
      case 'closed':
        return {
          icon: ExclamationCircleIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: 'Closed'
        };
      default:
        return {
          icon: ClockIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          label: status
        };
    }
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  if (!feedbackId) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-6 border w-full max-w-5xl shadow-lg rounded-md bg-white m-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Feedback Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading feedback details...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error Loading Details</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={() => feedbackId && loadFeedbackDetail(feedbackId)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Content */}
        {feedback && (
          <div className="space-y-6">
            {/* Main Feedback Information */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{feedback.title}</h4>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusConfig(feedback.status).bgColor} ${getStatusConfig(feedback.status).color}`}>
                      {React.createElement(getStatusConfig(feedback.status).icon, { className: "h-3 w-3 mr-1" })}
                      {feedback.status_display}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                      {feedback.priority_display || feedback.priority}
                    </span>
                    {feedback.is_anonymous && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        👤 Anonymous
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <div className="bg-white p-4 rounded-md border">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{feedback.content}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tracking ID</label>
                  <p className="mt-1 text-gray-900 font-mono">{feedback.tracking_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-gray-900">{feedback.category_display}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Submitted</label>
                  <p className="mt-1 text-gray-900">{formatDate(feedback.created_at)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Views</label>
                  <p className="mt-1 text-gray-900">{feedback.view_count} views</p>
                </div>
              </div>
            </div>

            {/* Government Responses */}
            {feedback.responses && feedback.responses.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Government Responses ({feedback.responses.length})
                </h4>
                <div className="space-y-4">
                  {feedback.responses.map((response) => (
                    <div key={response.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium text-green-800">{response.responder_name}</p>
                              <p className="text-xs text-green-600">{response.responder_role}</p>
                            </div>
                            <p className="text-xs text-green-600">{formatDate(response.created_at)}</p>
                          </div>
                          <div className="text-sm text-green-700">
                            <p className="whitespace-pre-wrap">{response.content}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Responses Message */}
            {(!feedback.responses || feedback.responses.length === 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <ClockIcon className="h-5 w-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">
                      Awaiting Government Response
                    </h4>
                    <p className="mt-1 text-sm text-yellow-700">
                      Your feedback is being reviewed by the relevant government department. 
                      You will receive a response once it has been processed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Timeline */}
            {feedback.timeline && feedback.timeline.length > 0 && (
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Activity Timeline</h4>
                <div className="flow-root">
                  <ul className="-mb-8">
                    {feedback.timeline.map((event, eventIdx) => (
                      <li key={eventIdx}>
                        <div className="relative pb-8">
                          {eventIdx !== feedback.timeline.length - 1 ? (
                            <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                <ClockIcon className="h-4 w-4 text-white" />
                              </span>
                            </div>
                            <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-gray-500">{event.description}</p>
                              </div>
                              <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                {formatDate(event.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        {feedback && (
          <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
            {onTrackFeedback && (
              <button
                onClick={() => {
                  onTrackFeedback(feedback.tracking_id);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-3"
              >
                Track This Feedback
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackDetailModal;
