import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, ThumbsUp, ThumbsDown, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';

interface Project {
  id: string;
  title: string;
  description: string;
  project_type: string;
  status: string;
  budget: string | null;
  implementing_ministry?: string;
  target_beneficiaries?: string;
  start_date?: string;
  end_date?: string;
  public_participation_open: boolean;
  participation_deadline?: string;
  image: string | null;
  document: string | null;
  created_by: string;
  created_at: string;
}

const ProjectList: React.FC = () => {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [displayedProjects, setDisplayedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [countyFilter, setCountyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const projectsPerPage = 6;
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    content: '',
    category: 'infrastructure',
    priority: 'medium',
    is_anonymous: false
  });
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchProjects();
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  const checkAuthentication = () => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  };

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // Fetch public projects - no auth needed for public view
      const response = await fetch('http://127.0.0.1:8000/api/public/projects/');
      
      if (response.ok) {
        const data = await response.json();
        const projects = data.data || [];
        
        // Transform backend data to match frontend interface
        const transformedProjects = projects.map((p: any) => ({
          id: p.id,
          name: p.title,
          title: p.title,
          description: p.description,
          project_type: p.project_type,
          category: p.project_type,
          status: p.status,
          budget: p.budget ? `KSh ${Number(p.budget).toLocaleString()}` : 'Budget not specified',
          implementing_ministry: p.implementing_ministry,
          target_beneficiaries: p.target_beneficiaries,
          start_date: p.start_date,
          end_date: p.end_date,
          public_participation_open: p.public_participation_open,
          participation_deadline: p.participation_deadline,
          image: p.image ? `http://127.0.0.1:8000${p.image}` : '/api/placeholder/400/300',
          document: p.document ? `http://127.0.0.1:8000${p.document}` : null,
          created_by: p.created_by,
          created_at: p.created_at
        }));
        
        setAllProjects(transformedProjects);
        setFilteredProjects(transformedProjects);
        setDisplayedProjects(transformedProjects.slice(0, projectsPerPage));
      } else {
        console.error('Failed to fetch projects');
        setAllProjects([]);
        setFilteredProjects([]);
        setDisplayedProjects([]);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setAllProjects([]);
      setFilteredProjects([]);
      setDisplayedProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search effect
  useEffect(() => {
    let filtered = allProjects.filter(project => {
      const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || project.status === statusFilter;
      const matchesMinistry = !countyFilter || (project.implementing_ministry && project.implementing_ministry.includes(countyFilter));
      const matchesCategory = !categoryFilter || project.project_type === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesMinistry && matchesCategory;
    });
    
    setFilteredProjects(filtered);
    setDisplayedProjects(filtered.slice(0, projectsPerPage));
    setCurrentPage(1);
  }, [searchTerm, statusFilter, countyFilter, categoryFilter, allProjects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'proposed': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const loadMoreProjects = () => {
    const nextPage = currentPage + 1;
    const startIndex = currentPage * projectsPerPage;
    const endIndex = startIndex + projectsPerPage;
    const newProjects = filteredProjects.slice(startIndex, endIndex);
    
    setDisplayedProjects(prev => [...prev, ...newProjects]);
    setCurrentPage(nextPage);
  };

  const hasMoreProjects = displayedProjects.length < filteredProjects.length;

  // Get unique values for filters
  const uniqueMinistries = [...new Set(allProjects.map(p => p.implementing_ministry).filter(Boolean))];
  const uniqueCategories = [...new Set(allProjects.map(p => p.project_type))];
  const uniqueStatuses = [...new Set(allProjects.map(p => p.status))];

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCountyFilter('');
    setCategoryFilter('');
  };

  const toggleFeedbackForm = (projectId: string) => {
    if (expandedFeedback === projectId) {
      setExpandedFeedback(null);
    } else {
      setExpandedFeedback(projectId);
      setFeedbackData({
        content: '',
        category: 'infrastructure',
        priority: 'medium',
        is_anonymous: false
      });
    }
  };

  const submitFeedback = async (projectId: string) => {
    if (!userProfile) {
      alert('User profile not loaded. Please refresh the page.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Get user's county ID from profile
      const countyResponse = await fetch('http://127.0.0.1:8000/api/locations/counties/');
      const countiesData = await countyResponse.json();
      const userCounty = countiesData.find((county: any) => county.name === userProfile.county_name);
      
      if (!userCounty) {
        alert('Could not determine your county. Please contact support.');
        return;
      }

      const response = await fetch('http://127.0.0.1:8000/api/feedback/submit/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: feedbackData.content,
          category: feedbackData.category,
          priority: feedbackData.priority,
          county_id: userCounty.id,
          related_project_id: projectId
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Feedback submitted successfully! Tracking ID: ${result.data.tracking_id}`);
        setExpandedFeedback(null);
        setFeedbackData({
          content: '',
          category: 'infrastructure',
          priority: 'medium',
          is_anonymous: false
        });
      } else {
        const errorData = await response.json();
        console.error('Feedback submission error:', errorData);
        alert(`Failed to submit feedback: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-8 pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">National Projects</h1>
          <p className="text-xl text-gray-600">Discover ongoing national development projects and parliamentary initiatives</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search projects by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Ministries</option>
              {uniqueMinistries.map(ministry => (
                <option key={ministry} value={ministry}>{ministry}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {displayedProjects.length} of {filteredProjects.length} projects
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 justify-center">
          {displayedProjects.map((project) => (
            <div
              key={project.id}
              className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200 w-full max-w-sm"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-4 pt-4">
                <h3 className="font-bold text-lg text-gray-800">{project.name}</h3>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(project.status)}`}>
                  {project.status}
                </span>
              </div>

              {/* Image */}
              <div className="mt-2">
                <img
                  src={project.image}
                  alt={project.name}
                  className="w-full h-36 object-cover rounded-md px-4"
                />
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm px-4 mt-2">{project.description}</p>

              {/* Budget + Ministry */}
              <div className="px-4 mt-3 text-sm text-gray-700">
                <div className="flex items-center gap-1 mb-1">
                  <Users size={16} />
                  <span>{project.budget}</span>
                </div>
                {project.implementing_ministry && (
                  <div className="text-xs text-gray-500">
                    Ministry: {project.implementing_ministry}
                  </div>
                )}
                <button
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="text-blue-600 hover:underline font-medium flex items-center gap-1 mt-2"
                >
                  View Full Details →
                </button>
              </div>

              {/* Actions */}
              <div className="px-4 py-4">
                <div className="flex justify-between items-center gap-2 mb-2">
                  {isAuthenticated ? (
                    <>
                      <div className="flex gap-2">
                        <button className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-100">
                          <ThumbsUp size={14} /> Support
                        </button>
                        <button className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-100">
                          <ThumbsDown size={14} /> Oppose
                        </button>
                      </div>
                      <button 
                        onClick={() => navigate(`/project/${project.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md font-medium"
                      >
                        View Details
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => navigate('/login')}
                          className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-100 text-gray-500"
                        >
                          <ThumbsUp size={14} /> Login to Support
                        </button>
                        <button 
                          onClick={() => navigate('/login')}
                          className="flex items-center gap-1 border border-gray-300 rounded-md px-3 py-1 text-sm hover:bg-gray-100 text-gray-500"
                        >
                          <ThumbsDown size={14} /> Login to Oppose
                        </button>
                      </div>
                      <button 
                        onClick={() => navigate('/login')}
                        className="bg-gray-400 text-white text-sm px-4 py-2 rounded-md font-medium"
                      >
                        Login to Engage
                      </button>
                    </>
                  )}
                </div>
                
                {/* Submit Feedback Button */}
                {isAuthenticated && (
                  <button
                    onClick={() => toggleFeedbackForm(project.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-md font-medium flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={16} />
                    Submit Feedback
                    {expandedFeedback === project.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>

              {/* Inline Feedback Form */}
              {expandedFeedback === project.id && isAuthenticated && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="mt-4 space-y-3">

                    
                    <div>
                      <textarea
                        placeholder="Your feedback on this project..."
                        value={feedbackData.content}
                        onChange={(e) => setFeedbackData({...feedbackData, content: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={feedbackData.category}
                        onChange={(e) => setFeedbackData({...feedbackData, category: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="infrastructure">Infrastructure Development</option>
                        <option value="budget">Budget & Finance</option>
                        <option value="healthcare">Healthcare Policy</option>
                        <option value="education">Education Policy</option>
                        <option value="agriculture">Agriculture & Food Security</option>
                        <option value="environment">Environment & Climate</option>
                        <option value="security">National Security</option>
                        <option value="governance">Governance & Oversight</option>
                        <option value="economic">Economic Policy</option>
                        <option value="social">Social Services</option>
                        <option value="other">Other National Issues</option>
                      </select>
                      
                      <select
                        value={feedbackData.priority}
                        onChange={(e) => setFeedbackData({...feedbackData, priority: e.target.value})}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`anonymous-${project.id}`}
                        checked={feedbackData.is_anonymous}
                        onChange={(e) => setFeedbackData({...feedbackData, is_anonymous: e.target.checked})}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <label htmlFor={`anonymous-${project.id}`} className="text-sm text-gray-700">
                        Submit anonymously
                      </label>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitFeedback(project.id)}
                        disabled={!feedbackData.content}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm px-4 py-2 rounded-md font-medium"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setExpandedFeedback(null)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMoreProjects && (
          <div className="text-center mt-8">
            <button
              onClick={loadMoreProjects}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Load More Projects
            </button>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProjectList;