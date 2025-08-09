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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
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
          label: status
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

  /**
   * Filter feedback list based on selected filters
   */
  const filteredFeedback = feedbackList.filter(item => {
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading your feedback history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error Loading History</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
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
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Feedback History</h2>
            <p className="text-gray-600 mt-1">
              {totalCount} total submission{totalCount !== 1 ? 's' : ''}
            </p>
          </div>
          
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FunnelIcon className="h-4 w-4 text-gray-400 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
              <option value="water_sanitation">Water & Sanitation</option>
              <option value="security">Security</option>
              <option value="environment">Environment</option>
              <option value="governance">Governance</option>
              <option value="economic">Economic</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="divide-y divide-gray-200">
        {filteredFeedback.length === 0 ? (
          <div className="px-6 py-12 text-center">
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
            const statusConfig = getStatusConfig(item.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate mr-3">
                        {item.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <span className="font-medium">ID:</span>
                        <code className="ml-1 font-mono">{item.tracking_id}</code>
                      </span>
                      <span>{getCategoryDisplay(item.category)}</span>
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {onTrackFeedback && (
                      <button
                        onClick={() => onTrackFeedback(item.tracking_id)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Track
                      </button>
                    )}
                    {onViewDetails && (
                      <button
                        onClick={() => onViewDetails(item.id)}
                        className="flex items-center text-gray-600 hover:text-gray-800 text-sm"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        View
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalCount > itemsPerPage && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} to{' '}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} results
            </div>
            
            <div className="flex items-center space-x-2">
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
                Previous
              </button>
              
              <span className="text-sm text-gray-700">
                Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
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
                Next
                <ChevronRightIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackHistory;
