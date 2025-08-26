import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Users, ExternalLink, Filter, Search, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Bill, Project } from '../../types';

interface BillsAndProjectsProps {
  onFeedbackClick?: (billId?: string, projectId?: string) => void;
}

const BillsAndProjects: React.FC<BillsAndProjectsProps> = ({ onFeedbackClick }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'bills' | 'projects'>('bills');
  const [bills, setBills] = useState<Bill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    content: '',
    category: 'legislation',
    priority: 'medium',
    is_anonymous: false
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  useEffect(() => {
    fetchUserProfile();
    fetchBillsAndProjects();
  }, []);

  const fetchBillsAndProjects = async () => {
    setLoading(true);
    try {
      // Fetch bills and projects from public API
      const [billsResponse, projectsResponse] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/public/bills/'),
        fetch('http://127.0.0.1:8000/api/public/projects/')
      ]);
      
      if (billsResponse.ok) {
        const billsData = await billsResponse.json();
        setBills(billsData.data || []);
      }
      
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching bills and projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      first_reading: 'bg-blue-100 text-blue-800',
      committee_stage: 'bg-yellow-100 text-yellow-800',
      second_reading: 'bg-orange-100 text-orange-800',
      third_reading: 'bg-purple-100 text-purple-800',
      presidential_assent: 'bg-indigo-100 text-indigo-800',
      enacted: 'bg-green-100 text-green-800',
      withdrawn: 'bg-red-100 text-red-800',
      proposed: 'bg-gray-100 text-gray-800',
      approved: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.project_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getProjectTypeCategory = (projectType: string) => {
    const typeMapping: Record<string, string> = {
      'infrastructure': 'infrastructure',
      'healthcare': 'healthcare',
      'education': 'education',
      'agriculture': 'agriculture',
      'environment': 'environment',
      'security': 'security',
      'economic': 'economic',
      'social': 'social',
      'governance': 'governance',
      'budget': 'budget'
    };
    return typeMapping[projectType] || 'other';
  };

  const toggleFeedbackForm = (id: string) => {
    if (expandedFeedback === id) {
      setExpandedFeedback(null);
    } else {
      setExpandedFeedback(id);
      
      let category = 'legislation'; // Default for bills
      
      if (activeTab === 'projects') {
        const project = projects.find(p => p.id === id);
        if (project) {
          category = getProjectTypeCategory(project.project_type);
        }
      }
      
      setFeedbackData({
        content: '',
        category,
        priority: 'medium',
        is_anonymous: false
      });
    }
  };

  const submitFeedback = async (id: string, type: 'bill' | 'project') => {
    if (!userProfile) {
      alert('User profile not loaded. Please refresh the page.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Get user's county ID from profile
      const countyResponse = await fetch('http://127.0.0.1:8000/api/locations/counties/');
      const countiesData = await countyResponse.json();
      
      // Handle both array response and paginated response
      const counties = Array.isArray(countiesData) ? countiesData : countiesData.results || [];
      const userCounty = counties.find((county: any) => county.name === userProfile.county_name);
      
      if (!userCounty) {
        alert('Could not determine your county. Please contact support.');
        return;
      }

      let response;
      
      if (feedbackData.is_anonymous) {
        // Create anonymous session first
        const sessionResponse = await fetch('http://127.0.0.1:8000/api/auth/anonymous/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            county_id: userCounty.id
          })
        });
        
        if (!sessionResponse.ok) {
          throw new Error('Failed to create anonymous session');
        }
        
        const sessionData = await sessionResponse.json();
        if (!sessionData.success) {
          throw new Error(sessionData.message || 'Failed to create anonymous session');
        }
        
        // Submit anonymous feedback
        response = await fetch('http://127.0.0.1:8000/api/feedback/anonymous/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: sessionData.session_id,
            title: `Feedback on ${type === 'bill' ? 'Bill' : 'Project'}: ${type === 'bill' ? 
              bills.find(b => b.id === id)?.title : 
              projects.find(p => p.id === id)?.title}`,
            content: feedbackData.content,
            category: feedbackData.category,
            priority: feedbackData.priority,
            county_id: userCounty.id,
            [type === 'bill' ? 'related_bill_id' : 'related_project_id']: id
          })
        });
      } else {
        // Submit authenticated feedback
        response = await fetch('http://127.0.0.1:8000/api/feedback/submit/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: `Feedback on ${type === 'bill' ? 'Bill' : 'Project'}: ${type === 'bill' ? 
              bills.find(b => b.id === id)?.title : 
              projects.find(p => p.id === id)?.title}`,
            content: feedbackData.content,
            category: feedbackData.category,
            priority: feedbackData.priority,
            county_id: userCounty.id,
            [type === 'bill' ? 'related_bill_id' : 'related_project_id']: id
          })
        });
      }

      if (response.ok) {
        const result = await response.json();
        const trackingId = result.data?.tracking_id || result.tracking_id;
        alert(`${feedbackData.is_anonymous ? 'Anonymous ' : ''}Feedback submitted successfully! Tracking ID: ${trackingId}`);
        setExpandedFeedback(null);
        setFeedbackData({
          content: '',
          category: 'legislation',
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
      alert('Error submitting feedback: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Parliamentary Bills & National Projects</h2>
        
        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab('bills')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'bills'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="inline-block w-4 h-4 mr-2" />
            Parliamentary Bills
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'projects'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="inline-block w-4 h-4 mr-2" />
            National Projects
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              {activeTab === 'bills' ? (
                <>
                  <option value="draft">Draft</option>
                  <option value="first_reading">First Reading</option>
                  <option value="committee_stage">Committee Stage</option>
                  <option value="second_reading">Second Reading</option>
                  <option value="third_reading">Third Reading</option>
                  <option value="enacted">Enacted</option>
                </>
              ) : (
                <>
                  <option value="proposed">Proposed</option>
                  <option value="approved">Approved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'bills' ? (
          <div className="space-y-6">
            {filteredBills.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No bills found matching your criteria.</p>
              </div>
            ) : (
              filteredBills.map((bill) => (
                <div key={bill.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{bill.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">Bill Number: {bill.bill_number}</p>
                      <p className="text-gray-700 mb-3">{bill.summary}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                      {bill.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Sponsor: <span className="font-medium">{bill.sponsor}</span></p>
                      {bill.committee && (
                        <p className="text-sm text-gray-600">Committee: <span className="font-medium">{bill.committee}</span></p>
                      )}
                    </div>
                    <div>
                      {bill.introduced_date && (
                        <p className="text-sm text-gray-600">
                          <Calendar className="inline-block w-4 h-4 mr-1" />
                          Introduced: {formatDate(bill.introduced_date)}
                        </p>
                      )}
                      {bill.participation_deadline && (
                        <p className="text-sm text-gray-600">
                          <Calendar className="inline-block w-4 h-4 mr-1" />
                          Participation Deadline: {formatDate(bill.participation_deadline)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      {bill.public_participation_open && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Open for Public Participation
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleFeedbackForm(bill.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                      >
                        <MessageSquare size={16} />
                        Submit Feedback
                        {expandedFeedback === bill.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedProject(null);
                          setSelectedBill(bill);
                          setShowDetailsModal(true);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                      >
                        <ExternalLink className="inline-block w-4 h-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  {/* Inline Feedback Form for Bills */}
                  {expandedFeedback === bill.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-3">
                        <div>
                          <textarea
                            placeholder="Your feedback on this bill..."
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
                            <option value="legislation">Legislation & Bills</option>
                            <option value="budget">Budget & Finance</option>
                            <option value="healthcare">Healthcare Policy</option>
                            <option value="education">Education Policy</option>
                            <option value="infrastructure">Infrastructure Development</option>
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
                            id={`anonymous-bill-${bill.id}`}
                            checked={feedbackData.is_anonymous}
                            onChange={(e) => setFeedbackData({...feedbackData, is_anonymous: e.target.checked})}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <label htmlFor={`anonymous-bill-${bill.id}`} className="text-sm text-gray-700">
                            Submit anonymously
                          </label>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitFeedback(bill.id, 'bill')}
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
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProjects.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No projects found matching your criteria.</p>
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{project.title}</h3>
                      <p className="text-gray-700 mb-3">{project.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      {project.implementing_ministry && (
                        <p className="text-sm text-gray-600">Ministry: <span className="font-medium">{project.implementing_ministry}</span></p>
                      )}
                      {project.budget && (
                        <p className="text-sm text-gray-600">Budget: <span className="font-medium">{formatCurrency(project.budget)}</span></p>
                      )}
                    </div>
                    <div>
                      {project.start_date && (
                        <p className="text-sm text-gray-600">
                          <Calendar className="inline-block w-4 h-4 mr-1" />
                          Start: {formatDate(project.start_date)}
                        </p>
                      )}
                      {project.end_date && (
                        <p className="text-sm text-gray-600">
                          <Calendar className="inline-block w-4 h-4 mr-1" />
                          End: {formatDate(project.end_date)}
                        </p>
                      )}
                    </div>
                  </div>

                  {project.target_beneficiaries && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <strong>Target Beneficiaries:</strong> {project.target_beneficiaries}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      {project.public_participation_open && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Open for Public Participation
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleFeedbackForm(project.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
                      >
                        <MessageSquare size={16} />
                        Submit Feedback
                        {expandedFeedback === project.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedBill(null);
                          setSelectedProject(project);
                          setShowDetailsModal(true);
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                      >
                        <ExternalLink className="inline-block w-4 h-4 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  {/* Inline Feedback Form for Projects */}
                  {expandedFeedback === project.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-3">
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
                          <div className="relative">
                            <select
                              value={feedbackData.category}
                              onChange={(e) => setFeedbackData({...feedbackData, category: e.target.value})}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-green-50"
                              disabled
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
                            <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                              <span className="text-xs text-green-600 font-medium">Auto-selected</span>
                            </div>
                          </div>
                          
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
                            id={`anonymous-project-${project.id}`}
                            checked={feedbackData.is_anonymous}
                            onChange={(e) => setFeedbackData({...feedbackData, is_anonymous: e.target.checked})}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <label htmlFor={`anonymous-project-${project.id}`} className="text-sm text-gray-700">
                            Submit anonymously
                          </label>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitFeedback(project.id, 'project')}
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
              ))
            )}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && (selectedBill || selectedProject) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {selectedBill ? 'Bill Details' : 'Project Details'}
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            {selectedBill && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedBill.title}</h4>
                  <p className="text-sm text-gray-600">Bill Number: {selectedBill.bill_number}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Summary</label>
                  <p className="text-sm text-gray-900">{selectedBill.summary}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedBill.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sponsor</label>
                    <p className="text-sm text-gray-900">{selectedBill.sponsor}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Committee</label>
                    <p className="text-sm text-gray-900">{selectedBill.committee || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBill.status)}`}>
                      {selectedBill.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Introduced Date</label>
                    <p className="text-sm text-gray-900">{selectedBill.introduced_date ? formatDate(selectedBill.introduced_date) : 'Not specified'}</p>
                  </div>
                </div>
              </div>
            )}
            
            {selectedProject && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedProject.title}</h4>
                  <p className="text-sm text-gray-600">National Project</p>
                </div>
                
                {selectedProject.image && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Image</label>
                    <img 
                      src={`http://localhost:8000${selectedProject.image}`} 
                      alt={selectedProject.title}
                      className="w-full max-w-md h-48 object-cover rounded-md"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900">{selectedProject.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Implementing Ministry</label>
                    <p className="text-sm text-gray-900">{selectedProject.implementing_ministry || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Budget</label>
                    <p className="text-sm text-gray-900">{selectedProject.budget ? formatCurrency(selectedProject.budget) : 'Not specified'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Beneficiaries</label>
                  <p className="text-sm text-gray-900">{selectedProject.target_beneficiaries || 'Not specified'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedProject.status)}`}>
                      {selectedProject.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project Type</label>
                    <p className="text-sm text-gray-900">{selectedProject.project_type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="text-sm text-gray-900">{selectedProject.start_date ? formatDate(selectedProject.start_date) : 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <p className="text-sm text-gray-900">{selectedProject.end_date ? formatDate(selectedProject.end_date) : 'Not specified'}</p>
                  </div>
                </div>
                
                {selectedProject.document && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Document</label>
                    <a 
                      href={`http://localhost:8000${selectedProject.document}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      📄 View Document
                    </a>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsAndProjects;