import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Calendar, MapPin, Tag, User, FileText, MessageSquare } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const TrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [feedback, setFeedback] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setFeedback({
        id: id || 'FB1234567890',
        title: 'Pothole repair needed on Main Street',
        description: 'There is a large pothole on Main Street near the intersection with Oak Avenue that poses a safety hazard for vehicles and pedestrians.',
        category: 'Infrastructure',
        location: 'California',
        priority: 'high',
        status: 'in-progress',
        submittedDate: '2025-01-15T10:30:00Z',
        lastUpdated: '2025-01-18T14:20:00Z',
        assignedTo: 'City Public Works Department',
        estimatedCompletion: '2025-01-25T00:00:00Z',
        timeline: [
          {
            date: '2025-01-15T10:30:00Z',
            status: 'submitted',
            title: 'Feedback Submitted',
            description: 'Your feedback has been received and assigned tracking ID ' + (id || 'FB1234567890')
          },
          {
            date: '2025-01-16T09:15:00Z',
            status: 'reviewed',
            title: 'Initial Review Completed',
            description: 'Your feedback has been reviewed and categorized. It has been forwarded to the appropriate department.'
          },
          {
            date: '2025-01-17T11:45:00Z',
            status: 'assigned',
            title: 'Assigned to Department',
            description: 'Your feedback has been assigned to the City Public Works Department for action.'
          },
          {
            date: '2025-01-18T14:20:00Z',
            status: 'in-progress',
            title: 'Work in Progress',
            description: 'Our team has begun addressing your feedback. Repair crew has been scheduled for site inspection.'
          }
        ],
        attachments: [
          { name: 'pothole_photo_1.jpg', type: 'image', size: '2.3 MB' },
          { name: 'location_details.pdf', type: 'document', size: '156 KB' }
        ],
        updates: [
          {
            date: '2025-01-18T14:20:00Z',
            author: 'Public Works Supervisor',
            message: 'Thank you for reporting this issue. Our inspection team has confirmed the pothole and scheduled it for repair. We expect to complete the work by January 25th, weather permitting.'
          }
        ]
      });
      setIsLoading(false);
    }, 1000);
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'reviewed': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'assigned': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'in-progress': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'resolved': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'closed': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="min-h-screen py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="max-w-md mx-auto text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Feedback Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't find feedback with the ID you provided. Please check the tracking ID and try again.
            </p>
            <Button>
              Submit New Feedback
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Feedback Tracking
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track the progress of your feedback submission
            </p>
          </div>

          {/* Feedback Details */}
          <Card className="mb-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {feedback.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    ID: {feedback.id}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(feedback.submittedDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-right space-y-2">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(feedback.status)}`}>
                  {feedback.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className={`block px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(feedback.priority)}`}>
                  {feedback.priority.replace(/\b\w/g, l => l.toUpperCase())} Priority
                </span>
              </div>
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              {feedback.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Tag className="w-4 h-4 mr-2" />
                <span>Category: {feedback.category}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Location: {feedback.location}</span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <User className="w-4 h-4 mr-2" />
                <span>Assigned to: {feedback.assignedTo}</span>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Progress Timeline
            </h3>

            <div className="relative">
              {feedback.timeline.map((event: any, index: number) => (
                <div key={index} className="flex items-start mb-6 last:mb-0">
                  <div className="flex-shrink-0 mr-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(event.status)}`}>
                      <div className="w-3 h-3 bg-current rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {event.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {event.description}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                        {new Date(event.date).toLocaleDateString()} at{' '}
                        {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {feedback.status !== 'resolved' && feedback.status !== 'closed' && (
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                      <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Resolution Expected
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Estimated completion: {new Date(feedback.estimatedCompletion).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Updates */}
          {feedback.updates && feedback.updates.length > 0 && (
            <Card className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Official Updates
              </h3>

              <div className="space-y-4">
                {feedback.updates.map((update: any, index: number) => (
                  <div key={index} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {update.author}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(update.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">
                      {update.message}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline">
                Subscribe to Updates
              </Button>
              <Button variant="outline">
                Share Feedback
              </Button>
              {(feedback.status === 'resolved' || feedback.status === 'closed') && (
                <Button>
                  Rate Our Response
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;