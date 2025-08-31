/**
 * Feedback History Component
 * Displays user's feedback submission history with filtering and pagination
 */

import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { FeedbackItem, UserFeedbackListResponse } from '../../types';
import { apiService } from '../../services/api';

interface FeedbackHistoryProps {
  onViewDetails?: (feedbackId: string) => void;
  onTrackFeedback?: (trackingId: string) => void;
}

export const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({
  onViewDetails,
  onTrackFeedback,
}) => {
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const [viewingFeedback, setViewingFeedback] = useState<FeedbackItem | null>(null);

  const itemsPerPage = 10;

  /**
   * Load feedback list from API
   */
  const loadFeedbackList = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading feedback list for page:', page);
      const response: UserFeedbackListResponse = await apiService.getUserFeedbackList(itemsPerPage, page);
      console.log('📡 Feedback list response:', response);

      if (response.success && response.data) {
        console.log('✅ Feedback data received:', {
          resultsCount: response.data.results.length,
          totalCount: response.data.count,
          hasNext: !!response.data.next,
          hasPrevious: !!response.data.previous
        });

        setFeedbackList(response.data.results);
        setTotalCount(response.data.count);
        setHasNext(!!response.data.next);
        setHasPrevious(!!response.data.previous);
      } else {
        console.error('❌ API response indicates failure:', response);
        setError('Failed to load feedback history');
      }
    } catch (err) {
      console.error('❌ Error loading feedback list:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feedback history');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load data on component mount and when page changes
   */
  useEffect(() => {
    loadFeedbackList(currentPage);
  }, [currentPage]);

  /**
   * Handle page navigation
   */
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  /**
   * Get status configuration
   */
  const getStatusConfig = (status: string | undefined) => {
    const statusValue = status || 'pending';
    switch (statusValue.toLowerCase()) {
      case 'submitted':
      case 'pending':
        return {
          icon: ClockIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Pending'
        };
      case 'under_review':
      case 'in_review':
        return {
          icon: ClockIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: 'Under Review'
        };
      case 'in_progress':
        return {
          icon: ClockIcon,
          color: 'text-purple-600',
          bgColor: 'bg-purple-100',
          label: 'In Progress'
        };
      case 'resolved':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Resolved'
        };
      case 'responded':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Responded'
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
          label: statusValue
        };
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Get category display name
   */
  const getCategoryDisplay = (category: string) => {
    const categoryMap: Record<string, string> = {
      infrastructure: 'Infrastructure',
      healthcare: 'Healthcare',
      education: 'Education',
      water_sanitation: 'Water & Sanitation',
      security: 'Security',
      environment: 'Environment',
      governance: 'Governance',
      economic: 'Economic',
      other: 'Other'
    };
    return categoryMap[category] || category;
  };

  const filteredFeedback = feedbackList;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center justify-center py-12 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600 text-center">Loading your feedback history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex flex-col sm:flex-row">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mb-2 sm:mb-0 sm:mr-2 sm:mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error Loading History</h3>
              <p className="text-sm text-red-700 mt-1 break-words">{error}</p>
              <button
                onClick={() => loadFeedbackList(currentPage)}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Feedback History</h2>
            <p className="text-gray-600 mt-1">
              {totalCount} total submission{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
          

        </div>
      </div>

      {/* Feedback List */}
      <div className="divide-y divide-gray-200">
        {filteredFeedback.length === 0 ? (
          <div className="px-4 sm:px-6 py-12 text-center">
            <ExclamationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback found</h3>
            <p className="text-gray-600">
              {feedbackList.length === 0 
                ? "You haven't submitted any feedback yet."
                : "No feedback matches your current filters."
              }
            </p>
          </div>
        ) : (
          filteredFeedback.map((item) => {
            const statusConfig = getStatusConfig(item.status || 'pending');
            const StatusIcon = statusConfig.icon;
            
            return (
              <div key={item.id} className="px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.is_anonymous && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            👤 Anonymous
                          </span>
                        )}

                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-500 gap-2 sm:gap-4">
                      <span className="text-xs sm:text-sm">{getCategoryDisplay(item.category)}</span>
                      <span className="text-xs sm:text-sm">{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:ml-4">
                    <button
                      onClick={() => setViewingFeedback(item)}
                      className="flex items-center text-gray-600 hover:text-gray-800 text-sm px-3 py-1 rounded border border-gray-200 hover:bg-gray-50"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalCount > itemsPerPage && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-700 text-center sm:text-left">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} to{' '}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevious}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  hasPrevious
                    ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                }`}
              >
                <ChevronLeftIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              
              <span className="text-sm text-gray-700 px-2">
                <span className="hidden sm:inline">Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}</span>
                <span className="sm:hidden">{currentPage}/{Math.ceil(totalCount / itemsPerPage)}</span>
              </span>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNext}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  hasNext
                    ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Feedback Modal */}
      {viewingFeedback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-full max-w-3xl shadow-lg rounded-md bg-white m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Feedback Details</h3>
              <button
                onClick={() => setViewingFeedback(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">{viewingFeedback.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingFeedback.content}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-sm text-gray-900">{getCategoryDisplay(viewingFeedback.category)}</p>
                </div>

              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Submission Date</label>
                  <p className="mt-1 text-gray-900">{new Date(viewingFeedback.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              {viewingFeedback.is_anonymous && (
                <div className="p-3 bg-purple-50 rounded-md">
                  <p className="text-sm text-purple-800">
                    👤 This feedback was submitted anonymously
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setViewingFeedback(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackHistory;
