import React, { useState, useEffect } from 'react';
import { FileText, Calendar, Users, ExternalLink, Filter, Search, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Bill, Project } from '../../types';

interface BillsAndProjectsProps {
  onFeedbackClick?: (billId?: string, projectId?: string) => void;
}

const BillsAndProjects: React.FC<BillsAndProjectsProps> = ({ onFeedbackClick }) => {
  const [activeTab, setActiveTab] = useState<'bills' | 'projects'>('bills');
  const [bills, setBills] = useState<Bill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    content: '',
    category: 'general',
    priority: 'medium',
    is_anonymous: false
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockBills: Bill[] = [
      {
        id: '1',
        bill_number: 'HB-2024-001',
        title: 'Digital Economy Enhancement Bill',
        description: 'A comprehensive bill to enhance Kenya\'s digital economy infrastructure and regulatory framework.',
        summary: 'This bill aims to establish a robust digital economy by improving internet connectivity, digital literacy, and e-commerce regulations.',
        sponsor: 'Hon. Jane Wanjiku (Nairobi County)',
        committee: 'ICT Committee',
        status: 'committee_stage',
        introduced_date: '2024-01-15',
        committee_deadline: '2024-03-15',
        public_participation_open: true,
        participation_deadline: '2024-02-28',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      },
      {
        id: '2',
        bill_number: 'SB-2024-002',
        title: 'Climate Change Adaptation Bill',
        description: 'Legislation to strengthen Kenya\'s climate change adaptation and mitigation strategies.',
        summary: 'Establishes frameworks for climate resilience, carbon trading, and environmental protection measures.',
        sponsor: 'Senate Committee on Environment',
        status: 'second_reading',
        introduced_date: '2024-01-10',
        public_participation_open: true,
        created_at: '2024-01-10T09:00:00Z',
        updated_at: '2024-01-25T11:15:00Z'
      }
    ];

    const mockProjects: Project[] = [
      {
        id: '1',
        title: 'National Broadband Infrastructure Project',
        description: 'Expanding high-speed internet connectivity to all 47 counties through fiber optic networks.',
        project_type: 'infrastructure',
        status: 'in_progress',
        budget: 50000000000,
        implementing_ministry: 'Ministry of ICT',
        target_beneficiaries: 'All Kenyan citizens, particularly in rural areas',
        start_date: '2024-01-01',
        end_date: '2026-12-31',
        public_participation_open: true,
        participation_deadline: '2024-03-01',
        created_at: '2023-12-01T10:00:00Z',
        updated_at: '2024-01-15T16:20:00Z'
      },
      {
        id: '2',
        title: 'Universal Healthcare Coverage Initiative',
        description: 'Implementing comprehensive healthcare coverage for all Kenyan citizens.',
        project_type: 'healthcare',
        status: 'approved',
        budget: 75000000000,
        implementing_ministry: 'Ministry of Health',
        target_beneficiaries: 'All Kenyan citizens',
        start_date: '2024-07-01',
        end_date: '2027-06-30',
        public_participation_open: true,
        created_at: '2023-11-15T14:00:00Z',
        updated_at: '2024-01-10T09:45:00Z'
      }
    ];

    setBills(mockBills);
    setProjects(mockProjects);
    setLoading(false);
  }, []);

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

  const toggleFeedbackForm = (id: string) => {
    if (expandedFeedback === id) {
      setExpandedFeedback(null);
    } else {
      setExpandedFeedback(id);
      setFeedbackData({
        content: '',
        category: 'general',
        priority: 'medium',
        is_anonymous: false
      });
    }
  };

  const submitFeedback = async (id: string, type: 'bill' | 'project') => {
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        ...feedbackData,
        ...(type === 'bill' ? { related_bill_id: id } : { related_project_id: id })
      };
      
      const response = await fetch('http://127.0.0.1:8000/api/feedback/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Feedback submitted successfully!');
        setExpandedFeedback(null);
        setFeedbackData({
          content: '',
          category: 'general',
          priority: 'medium',
          is_anonymous: false
        });
      } else {
        alert('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback');
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
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm">
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
                            <option value="general">General</option>
                            <option value="support">Support</option>
                            <option value="opposition">Opposition</option>
                            <option value="amendment">Amendment Suggestion</option>
                            <option value="concern">Concern</option>
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
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm">
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
                          <select
                            value={feedbackData.category}
                            onChange={(e) => setFeedbackData({...feedbackData, category: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          >
                            <option value="general">General</option>
                            <option value="support">Support</option>
                            <option value="opposition">Opposition</option>
                            <option value="suggestion">Suggestion</option>
                            <option value="concern">Concern</option>
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
    </div>
  );
};

export default BillsAndProjects;