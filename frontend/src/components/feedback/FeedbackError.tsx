/**
 * Feedback Submission Error Component
 * Handles various error scenarios with appropriate messaging and recovery options
 */

import React from 'react';
import { 
  ExclamationTriangleIcon, 
  ClockIcon, 
  ShieldExclamationIcon,
  WifiIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface FeedbackErrorProps {
  error: string;
  errorType?: 'validation' | 'rate_limit' | 'auth' | 'network' | 'server' | 'permission';
  rateLimitInfo?: {
    remaining: number;
    resetTime?: string;
  };
  onRetry?: () => void;
  onGoBack?: () => void;
  onLogin?: () => void;
}

export const FeedbackError: React.FC<FeedbackErrorProps> = ({
  error,
  errorType = 'server',
  rateLimitInfo,
  onRetry,
  onGoBack,
  onLogin,
}) => {
  /**
   * Get error configuration based on type
   */
  const getErrorConfig = () => {
    switch (errorType) {
      case 'validation':
        return {
          icon: ExclamationTriangleIcon,
          title: 'Validation Error',
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          textColor: 'text-red-700',
          showRetry: false,
          showGoBack: true,
        };
      
      case 'rate_limit':
        return {
          icon: ClockIcon,
          title: 'Rate Limit Exceeded',
          color: 'yellow',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          iconColor: 'text-yellow-600',
          titleColor: 'text-yellow-900',
          textColor: 'text-yellow-700',
          showRetry: false,
          showGoBack: true,
        };
      
      case 'auth':
        return {
          icon: ShieldExclamationIcon,
          title: 'Authentication Required',
          color: 'blue',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900',
          textColor: 'text-blue-700',
          showRetry: false,
          showGoBack: false,
        };
      
      case 'network':
        return {
          icon: WifiIcon,
          title: 'Network Error',
          color: 'gray',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-600',
          titleColor: 'text-gray-900',
          textColor: 'text-gray-700',
          showRetry: true,
          showGoBack: true,
        };
      
      case 'permission':
        return {
          icon: ShieldExclamationIcon,
          title: 'Permission Denied',
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          textColor: 'text-red-700',
          showRetry: false,
          showGoBack: true,
        };
      
      default: // server
        return {
          icon: ExclamationTriangleIcon,
          title: 'Server Error',
          color: 'red',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900',
          textColor: 'text-red-700',
          showRetry: true,
          showGoBack: true,
        };
    }
  };

  const config = getErrorConfig();
  const IconComponent = config.icon;

  /**
   * Format rate limit reset time
   */
  const formatResetTime = (resetTime?: string) => {
    if (!resetTime) return 'tomorrow';
    
    try {
      const resetDate = new Date(resetTime);
      const now = new Date();
      const diffHours = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      if (diffHours <= 1) return 'in about an hour';
      if (diffHours < 24) return `in ${diffHours} hours`;
      return 'tomorrow';
    } catch {
      return 'tomorrow';
    }
  };

  /**
   * Get detailed error message based on type
   */
  const getDetailedMessage = () => {
    switch (errorType) {
      case 'rate_limit':
        return (
          <div className="space-y-3">
            <p>You have exceeded the daily submission limit for feedback.</p>
            {rateLimitInfo && (
              <div className="bg-yellow-100 border border-yellow-300 rounded-md p-3">
                <p className="text-sm font-medium text-yellow-900">Rate Limit Details:</p>
                <ul className="text-sm text-yellow-800 mt-1 space-y-1">
                  <li>• Remaining submissions today: <strong>{rateLimitInfo.remaining}</strong></li>
                  <li>• Limit resets: <strong>{formatResetTime(rateLimitInfo.resetTime)}</strong></li>
                  <li>• Daily limit: <strong>10 submissions</strong> (Citizens)</li>
                </ul>
              </div>
            )}
            <p className="text-sm">
              This limit helps prevent spam and ensures all feedback receives proper attention from government officials.
            </p>
          </div>
        );
      
      case 'auth':
        return (
          <div className="space-y-3">
            <p>You need to be logged in to submit feedback.</p>
            <p className="text-sm">
              Authentication ensures your feedback is properly attributed and you can track its progress.
            </p>
          </div>
        );
      
      case 'network':
        return (
          <div className="space-y-3">
            <p>Unable to connect to the server. Please check your internet connection.</p>
            <p className="text-sm">
              This could be due to a temporary network issue or server maintenance.
            </p>
          </div>
        );
      
      case 'permission':
        return (
          <div className="space-y-3">
            <p>You don't have permission to submit feedback for the selected county.</p>
            <p className="text-sm">
              Citizens can only submit feedback to their home county. Government officials may have broader access based on their role.
            </p>
          </div>
        );
      
      case 'validation':
        return (
          <div className="space-y-3">
            <p>Please correct the following issues with your submission:</p>
            <div className="text-sm bg-white border border-red-200 rounded-md p-3">
              {error}
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-3">
            <p>An unexpected error occurred while processing your feedback submission.</p>
            <p className="text-sm">
              Our technical team has been notified. Please try again in a few minutes.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Error Header */}
      <div className={`${config.bgColor} border-b ${config.borderColor} px-6 py-4`}>
        <div className="flex items-center">
          <IconComponent className={`h-8 w-8 ${config.iconColor} mr-3`} />
          <div>
            <h2 className={`text-xl font-bold ${config.titleColor}`}>{config.title}</h2>
            <p className={`${config.textColor} mt-1`}>
              There was a problem with your feedback submission
            </p>
          </div>
        </div>
      </div>

      {/* Error Details */}
      <div className="px-6 py-6">
        <div className={`${config.textColor} space-y-4`}>
          {getDetailedMessage()}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          {config.showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Try Again
            </button>
          )}
          
          {errorType === 'auth' && onLogin && (
            <button
              onClick={onLogin}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <ShieldExclamationIcon className="h-4 w-4 mr-2" />
              Login
            </button>
          )}
          
          {config.showGoBack && onGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Go Back to Form
            </button>
          )}
        </div>

        {/* Help Information */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Need Help?</h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p>• Check our <a href="/help" className="text-blue-600 hover:text-blue-800 underline">Help Center</a> for common issues</p>
            <p>• Contact support at <a href="mailto:support@civicai.ke" className="text-blue-600 hover:text-blue-800 underline">support@civicai.ke</a></p>
            <p>• For urgent issues, call the county helpline directly</p>
          </div>
        </div>

        {/* Technical Details (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 bg-gray-100 border border-gray-300 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-700 mb-1">Technical Details (Dev Only):</h4>
            <pre className="text-xs text-gray-600 whitespace-pre-wrap">{error}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackError;
