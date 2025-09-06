/**
 * Recent Feedback Status Component
 * List/card view of user's recent feedback submissions with status tracking
 */

import React from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  ExternalLink,
  Calendar,
  Tag
} from 'lucide-react';
import { FeedbackItem } from '../../types';

interface RecentFeedbackStatusProps {
  recentFeedback: FeedbackItem[];
}

const StatusBadge: React.FC<{ status: FeedbackItem['status'] }> = ({ status }) => {
  const statusConfig = {
    submitted: {
      label: 'Submitted',
      icon: FileText,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      iconColor: 'text-gray-500'
    },
    under_review: {
      label: 'Under Review',
      icon: Clock,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    in_review: {
      label: 'In Review',
      icon: Clock,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      iconColor: 'text-gray-500'
    },
    in_progress: {
      label: 'In Progress',
      icon: AlertCircle,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    },
    resolved: {
      label: 'Resolved',
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      iconColor: 'text-green-600'
    }
  };

  const config = statusConfig[status] || statusConfig.submitted;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
      <Icon className={`h-4 w-4 mr-1.5 ${config.iconColor}`} />
      {config.label}
    </span>
  );
};

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const categoryConfig: Record<string, { label: string; color: string }> = {
    infrastructure: { label: 'Infrastructure', color: 'bg-orange-100 text-orange-800' },
    healthcare: { label: 'Healthcare', color: 'bg-red-100 text-red-800' },
    education: { label: 'Education', color: 'bg-purple-100 text-purple-800' },
    utilities: { label: 'Utilities', color: 'bg-blue-100 text-blue-800' },
    environment: { label: 'Environment', color: 'bg-green-100 text-green-800' },
    safety: { label: 'Public Safety', color: 'bg-yellow-100 text-yellow-800' },
    other: { label: 'Other', color: 'bg-gray-100 text-gray-800' }
  };

  const config = categoryConfig[category] || categoryConfig.other;

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${config.color}`}>
      <Tag className="h-3 w-3 mr-1" />
      {config.label}
    </span>
  );
};

const FeedbackCard: React.FC<{ feedback: FeedbackItem }> = ({ feedback }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 sm:p-4 hover:bg-white hover:shadow-sm transition-all duration-200">
      <div className="mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2">
            {feedback.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={feedback.status} />
            <CategoryBadge category={feedback.category} />
            {feedback.is_anonymous && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                👤 Anonymous
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-500">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">{formatDate(feedback.created_at)}</span>
          </div>
          <div className="flex items-center font-mono">
            <FileText className="h-4 w-4 mr-1" />
            <span className="text-xs sm:text-sm">{feedback.tracking_id}</span>
          </div>
        </div>
        
        <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm self-start sm:self-auto">
          View Details
          <ExternalLink className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

const RecentFeedbackStatus: React.FC<RecentFeedbackStatusProps> = ({ recentFeedback }) => {
  // Add safety check for recentFeedback
  const safeFeedback = recentFeedback || [];
  
  if (safeFeedback.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback submitted yet</h3>
        <p className="text-gray-600 mb-4">
          Start making a difference by submitting your first feedback to the government.
        </p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Submit Your First Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium self-start sm:self-auto">
          View all →
        </button>
      </div>

      <div className="space-y-3">
        {safeFeedback.slice(0, 3).map((item) => (
          <FeedbackCard key={item.id} feedback={item} />
        ))}
      </div>
    </div>
  );
};

export default RecentFeedbackStatus;
