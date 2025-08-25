import React, { useState } from 'react';

interface Project {
  id: string;
  title: string;
  description: string;
  project_type: string;
  status: string;
  budget: string | null;
  start_date: string | null;
  end_date: string | null;
  image: string | null;
  document: string | null;
  county: string;
  created_by: string;
  created_at: string;
}

interface ProjectDetailsModalProps {
  project: Project;
  onClose: () => void;
}

const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({ project, onClose }) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousSession, setAnonymousSession] = useState<string | null>(null);

  const createAnonymousSession = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/anonymous/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          county_id: 1 // You might need to get this from project or user context
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.session_id;
      }
      return null;
    } catch (error) {
      console.error('Error creating anonymous session:', error);
      return null;
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      let endpoint = '';
      let requestBody: any = {
        title: `Feedback on project: ${project.title}`,
        content: feedback,
        category: 'other', // You might want to map project_type to feedback category
        priority: 'medium',
        county_id: 1 // You'll need to get the actual county ID
      };
      
      if (isAnonymous) {
        // Create anonymous session if not exists
        let sessionId = anonymousSession;
        if (!sessionId) {
          sessionId = await createAnonymousSession();
          if (!sessionId) {
            throw new Error('Failed to create anonymous session');
          }
          setAnonymousSession(sessionId);
        }
        
        endpoint = 'http://localhost:8000/api/feedback/anonymous/';
        requestBody.session_id = sessionId;
      } else {
        endpoint = 'http://localhost:8000/api/feedback/submit/';
      }
      
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (!isAnonymous) {
        const token = localStorage.getItem('access_token');
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });
      
      if (response.ok) {
        const data = await response.json();
        setShowSuccess(true);
        setFeedback('');
        
        // Show tracking ID to user
        alert(`Feedback submitted successfully! Tracking ID: ${data.data.tracking_id}`);
        
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        alert(`Failed to submit feedback: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
              <p className="text-gray-600">{project.county} County</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {project.image && (
            <div className="mb-6">
              <img 
                src={`http://localhost:8000${project.image}`} 
                alt={project.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">Budget</h3>
              <p className="text-xl font-bold text-blue-600">
                {project.budget ? `KSh ${Number(project.budget).toLocaleString()}` : 'Not specified'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">Category</h3>
              <p className="text-gray-700">{project.project_type}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-1">Created</h3>
              <p className="text-gray-700">{new Date(project.created_at).toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          {project.start_date && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-1">Start Date</h3>
                <p className="text-gray-700">{new Date(project.start_date).toLocaleDateString('en-GB')}</p>
              </div>
              {project.end_date && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">End Date</h3>
                  <p className="text-gray-700">{new Date(project.end_date).toLocaleDateString('en-GB')}</p>
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Project Overview</h3>
            <p className="text-gray-700 leading-relaxed">{project.description}</p>
          </div>

          {project.document && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Project Document</h3>
              <a 
                href={`http://localhost:8000${project.document}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                📄 Download Project Document
              </a>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Project Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Created by: <span className="font-medium text-gray-900">{project.created_by}</span></p>
              <p className="text-sm text-gray-600">Created on: <span className="font-medium text-gray-900">{new Date(project.created_at).toLocaleDateString('en-GB')}</span></p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Share Your Feedback</h3>
            <div className="space-y-4">
              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">Submit Anonymously</div>
                  <div className="text-xs text-gray-600">
                    {isAnonymous ? 'Your identity will be completely hidden' : 'Your name will be associated with this feedback'}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your thoughts about this project..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  <p>Your feedback helps improve county projects</p>
                  {isAnonymous && (
                    <p className="text-xs text-blue-600 mt-1">
                      🔒 Anonymous submission - your identity will be protected
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSubmitFeedback}
                  disabled={!feedback.trim() || isSubmitting}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Submitting...' : `Submit ${isAnonymous ? 'Anonymously' : 'Feedback'}`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showSuccess && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <p className="font-medium">Feedback submitted successfully!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsModal;