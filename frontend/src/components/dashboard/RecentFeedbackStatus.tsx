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
  feedback: FeedbackItem[];
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

  const config = statusConfig[status];
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
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate mb-2">
            {feedback.title}
          </h3>
          <div className="flex items-center space-x-3 mb-3">
            <StatusBadge status={feedback.status} />
            <CategoryBadge category={feedback.category} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(feedback.created_at)}
          </div>
          <div className="flex items-center font-mono">
            <FileText className="h-4 w-4 mr-1" />
            {feedback.tracking_id}
          </div>
        </div>
        
        <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium">
          View Details
          <ExternalLink className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

const RecentFeedbackStatus: React.FC<RecentFeedbackStatusProps> = ({ feedback }) => {
  if (feedback.length === 0) {
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
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Recent Feedback</h2>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all feedback →
        </button>
      </div>

      <div className="space-y-4">
        {feedback.map((item) => (
          <FeedbackCard key={item.id} feedback={item} />
        ))}
      </div>

      {/* Status Legend */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Status Guide</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <span className="text-gray-600">Submitted - Received by government</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
            <span className="text-gray-600">Under Review - Being evaluated</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
            <span className="text-gray-600">In Progress - Action being taken</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
            <span className="text-gray-600">Resolved - Issue addressed</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentFeedbackStatus;
