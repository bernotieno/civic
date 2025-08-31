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

// Status badge removed - no longer tracking feedback status

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
  const categoryConfig: Record<string, { label: string; color: string }> = {
    infrastructure: { label: 'Infrastructure', color: 'bg-orange-100 text-orange-700' },
    healthcare: { label: 'Healthcare', color: 'bg-red-100 text-red-700' },
    education: { label: 'Education', color: 'bg-purple-100 text-purple-700' },
    utilities: { label: 'Utilities', color: 'bg-blue-100 text-blue-700' },
    environment: { label: 'Environment', color: 'bg-green-100 text-green-700' },
    safety: { label: 'Safety', color: 'bg-yellow-100 text-yellow-700' },
    other: { label: 'Other', color: 'bg-gray-100 text-gray-700' }
  };

  const config = categoryConfig[category] || categoryConfig.other;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
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
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      });
    }
  };

  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 hover:bg-white hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
            {feedback.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>{formatDate(feedback.created_at)}</span>
            <CategoryBadge category={feedback.category} />
          </div>
        </div>
        
        <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm ml-2">
          <ExternalLink className="h-4 w-4" />
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
