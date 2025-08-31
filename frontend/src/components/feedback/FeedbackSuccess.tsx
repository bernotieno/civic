/**
 * Feedback Submission Success Component
 * Displays success message with tracking information and next steps
 */

import React, { useState } from 'react';
import { CheckCircleIcon, ClipboardDocumentIcon, EyeIcon, ListBulletIcon } from '@heroicons/react/24/outline';

interface FeedbackSuccessProps {
  submissionData: {
    feedback_id: string;
    submitted_at: string;
    location_path: string;
  };
  onBackToDashboard: () => void;
  onSubmitAnother: () => void;
}

export const FeedbackSuccess: React.FC<FeedbackSuccessProps> = ({
  submissionData,
  onBackToDashboard,
  onSubmitAnother,
}) => {
  // Tracking functionality removed

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

  // Status functionality removed - feedback is simply submitted

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

      {/* Submission Confirmation */}
      <div className="px-6 py-6 space-y-6">
        {/* Confirmation Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Feedback Received</h3>
            <p className="text-blue-700 text-sm">
              Your feedback has been successfully submitted to the appropriate government department for review and action.
            </p>
          </div>
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
            onClick={onBackToDashboard}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <ListBulletIcon className="h-4 w-4 mr-2" />
            Back to Dashboard
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
                <strong>Thank you!</strong> Your feedback helps improve government services for all citizens. 
                The relevant department will review your submission and take appropriate action.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackSuccess;
