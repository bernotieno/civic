/**
 * Feedback Submission Success Component
 * Displays success message with tracking information and next steps
 */

import React, { useState } from 'react';
import { CheckCircleIcon, ClipboardDocumentIcon, EyeIcon, ListBulletIcon } from '@heroicons/react/24/outline';

interface FeedbackSuccessProps {
  trackingId: string;
  submissionData: {
    feedback_id: string;
    status: string;
    submitted_at: string;
    location_path: string;
  };
  onTrackFeedback: (trackingId: string) => void;
  onViewSubmissions: () => void;
  onSubmitAnother: () => void;
}

export const FeedbackSuccess: React.FC<FeedbackSuccessProps> = ({
  trackingId,
  submissionData,
  onTrackFeedback,
  onViewSubmissions,
  onSubmitAnother,
}) => {
  const [copied, setCopied] = useState(false);

  /**
   * Copy tracking ID to clipboard
   */
  const copyTrackingId = async () => {
    try {
      await navigator.clipboard.writeText(trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy tracking ID:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = trackingId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /**
   * Format submission date
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
    } catch (error) {
      return dateString;
    }
  };

  /**
   * Get status display information
   */
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          label: 'Pending Review',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          description: 'Your feedback has been received and is awaiting initial review by the relevant department.'
        };
      case 'in_review':
        return {
          label: 'Under Review',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          description: 'Government officials are currently reviewing your feedback and assessing the situation.'
        };
      case 'responded':
        return {
          label: 'Response Provided',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          description: 'The government has provided an official response to your feedback.'
        };
      default:
        return {
          label: 'Submitted',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          description: 'Your feedback has been successfully submitted to the government.'
        };
    }
  };

  const statusInfo = getStatusInfo(submissionData.status);

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Success Header */}
      <div className="bg-green-50 border-b border-green-200 px-6 py-4">
        <div className="flex items-center">
          <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-green-900">Feedback Submitted Successfully!</h2>
            <p className="text-green-700 mt-1">
              Your feedback has been received and will be reviewed by the appropriate government department.
            </p>
          </div>
        </div>
      </div>

      {/* Tracking Information */}
      <div className="px-6 py-6 space-y-6">
        {/* Tracking ID Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-1">Your Tracking ID</h3>
              <p className="text-blue-700 text-sm mb-2">
                Save this ID to track your feedback status and view responses
              </p>
              <div className="flex items-center space-x-2">
                <code className="bg-white px-3 py-2 rounded border text-lg font-mono text-blue-900 select-all">
                  {trackingId}
                </code>
                <button
                  onClick={copyTrackingId}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  title="Copy tracking ID"
                >
                  <ClipboardDocumentIcon className="h-4 w-4 mr-1" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className={`${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-lg p-4`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Status</h3>
          <div className="flex items-center mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          <p className={`text-sm ${statusInfo.color}`}>
            {statusInfo.description}
          </p>
        </div>

        {/* Submission Details */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Submission Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Submitted:</span>
              <span className="text-gray-900 font-medium">{formatDate(submissionData.submitted_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="text-gray-900 font-medium">{submissionData.location_path}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reference ID:</span>
              <span className="text-gray-900 font-medium font-mono">{submissionData.feedback_id}</span>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">What Happens Next?</h3>
          <div className="space-y-2 text-sm text-yellow-800">
            <div className="flex items-start">
              <span className="inline-block w-6 h-6 bg-yellow-200 text-yellow-900 rounded-full text-xs font-bold text-center leading-6 mr-2 mt-0.5">1</span>
              <span>Your feedback will be reviewed by the relevant government department within 1-3 business days.</span>
            </div>
            <div className="flex items-start">
              <span className="inline-block w-6 h-6 bg-yellow-200 text-yellow-900 rounded-full text-xs font-bold text-center leading-6 mr-2 mt-0.5">2</span>
              <span>You'll receive updates on the status of your feedback as it progresses through the review process.</span>
            </div>
            <div className="flex items-start">
              <span className="inline-block w-6 h-6 bg-yellow-200 text-yellow-900 rounded-full text-xs font-bold text-center leading-6 mr-2 mt-0.5">3</span>
              <span>Government officials may contact you for additional information if needed.</span>
            </div>
            <div className="flex items-start">
              <span className="inline-block w-6 h-6 bg-yellow-200 text-yellow-900 rounded-full text-xs font-bold text-center leading-6 mr-2 mt-0.5">4</span>
              <span>You'll be notified when an official response is available.</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onTrackFeedback(trackingId)}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <EyeIcon className="h-4 w-4 mr-2" />
            Track This Feedback
          </button>
          
          <button
            onClick={onViewSubmissions}
            className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            <ListBulletIcon className="h-4 w-4 mr-2" />
            View All My Submissions
          </button>
          
          <button
            onClick={onSubmitAnother}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Submit Another Feedback
          </button>
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Important:</strong> Keep your tracking ID safe. You can use it to check the status of your feedback 
                at any time, even without logging in. Government responses and updates will be linked to this tracking ID.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSuccess;
