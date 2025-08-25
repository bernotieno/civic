import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

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

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetchProject();
    checkAuthentication();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/public/projects/');
      if (response.ok) {
        const data = await response.json();
        const foundProject = data.data.find((p: Project) => p.id === id);
        setProject(foundProject || null);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthentication = () => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setShowSuccess(true);
    setFeedback('');
    
    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64 pt-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64 pt-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h2>
            <button
              onClick={() => navigate('/projects')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Back to Projects
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8 pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate('/projects')}
            className="mb-6 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Projects
          </button>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
                  <p className="text-lg text-gray-600">{project.county} County</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Budget</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {project.budget ? `KSh ${Number(project.budget).toLocaleString()}` : 'Not specified'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Category</h3>
                  <p className="text-lg text-gray-700">{project.project_type}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Created</h3>
                  <p className="text-lg text-gray-700">{new Date(project.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {project.image && (
                <div className="mb-8">
                  <img 
                    src={`http://localhost:8000${project.image}`} 
                    alt={project.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Overview</h2>
                <p className="text-gray-700 leading-relaxed">{project.description}</p>
              </div>

              {project.document && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Document</h2>
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

              <div className="border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Share Your Feedback</h2>
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <textarea
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Share your thoughts about this project..."
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        Your feedback helps improve county projects
                      </p>
                      <button
                        onClick={handleSubmitFeedback}
                        disabled={!feedback.trim() || isSubmitting}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-600 mb-4">Please log in to submit feedback and interact with this project.</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
                    >
                      Log In to Participate
                    </button>
                  </div>
                )}
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
      <Footer />
    </div>
  );
};

export default ProjectDetails;