import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import LoadingSkeleton from './LoadingSkeleton';
import CustomAlert from './CustomAlert';
import { useAlert } from '../hooks/useAlert';

interface Bill {
  id: string;
  bill_number: string;
  title: string;
  description: string;
  summary: string;
  sponsor: string;
  committee?: string;
  status: string;
  status_display: string;
  introduced_date?: string;
  first_reading_date?: string;
  committee_deadline?: string;
  public_participation_open: boolean;
  participation_deadline?: string;
  document?: string;
  image?: string;
  created_at: string;
}

const BillsList: React.FC = () => {
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [displayedBills, setDisplayedBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [committeeFilter, setCommitteeFilter] = useState('');
  const billsPerPage = 6;
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    content: '',
    category: 'legislation',
    priority: 'medium',
    is_anonymous: false
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const { alert, showSuccess, showError, showWarning, hideAlert } = useAlert();

  useEffect(() => {
    // Load bills immediately but defer other operations
    fetchBills();
    checkAuthentication();
  }, []);

  useEffect(() => {
    // Only fetch user profile when needed (when user tries to interact)
    if (isAuthenticated && expandedFeedback) {
      fetchUserProfile();
    }
  }, [isAuthenticated, expandedFeedback]);

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

  const fetchBills = async () => {
    setLoading(true);
    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('http://127.0.0.1:8000/api/public/bills/', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        const bills = data.data || [];
        
        setAllBills(bills);
        setFilteredBills(bills);
        setDisplayedBills(bills.slice(0, billsPerPage));
      } else {
        console.error('Failed to fetch bills');
        setAllBills([]);
        setFilteredBills([]);
        setDisplayedBills([]);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timed out');
      } else {
        console.error('Error fetching bills:', error);
      }
      setAllBills([]);
      setFilteredBills([]);
      setDisplayedBills([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search effect
  useEffect(() => {
    let filtered = allBills.filter(bill => {
      const matchesSearch = bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bill.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bill.bill_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || bill.status === statusFilter;
      const matchesCommittee = !committeeFilter || (bill.committee && bill.committee.includes(committeeFilter));
      
      return matchesSearch && matchesStatus && matchesCommittee;
    });
    
    setFilteredBills(filtered);
    setDisplayedBills(filtered.slice(0, billsPerPage));
    setCurrentPage(1);
  }, [searchTerm, statusFilter, committeeFilter, allBills]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'first_reading': return 'bg-blue-100 text-blue-700';
      case 'committee_stage': return 'bg-yellow-100 text-yellow-700';
      case 'second_reading': return 'bg-orange-100 text-orange-700';
      case 'third_reading': return 'bg-purple-100 text-purple-700';
      case 'presidential_assent': return 'bg-indigo-100 text-indigo-700';
      case 'enacted': return 'bg-green-100 text-green-700';
      case 'withdrawn': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const loadMoreBills = () => {
    const nextPage = currentPage + 1;
    const startIndex = currentPage * billsPerPage;
    const endIndex = startIndex + billsPerPage;
    const newBills = filteredBills.slice(startIndex, endIndex);
    
    setDisplayedBills(prev => [...prev, ...newBills]);
    setCurrentPage(nextPage);
  };

  const hasMoreBills = displayedBills.length < filteredBills.length;

  // Get unique values for filters
  const uniqueCommittees = [...new Set(allBills.map(b => b.committee).filter(Boolean))];
  const uniqueStatuses = [...new Set(allBills.map(b => b.status))];

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCommitteeFilter('');
  };

  const toggleFeedbackForm = (billId: string) => {
    if (expandedFeedback === billId) {
      setExpandedFeedback(null);
    } else {
      setExpandedFeedback(billId);
      setFeedbackData({
        content: '',
        category: 'legislation',
        priority: 'medium',
        is_anonymous: false
      });
      // Fetch user profile only when feedback form is opened
      if (isAuthenticated && !userProfile) {
        fetchUserProfile();
      }
    }
  };

  const submitFeedback = async (billId: string) => {
    if (!userProfile) {
      showWarning('Profile Required', 'User profile not loaded. Please refresh the page.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Get user's county ID from profile
      const countyResponse = await fetch('http://127.0.0.1:8000/api/locations/counties/');
      const countiesData = await countyResponse.json();
      const userCounty = countiesData.find((county: any) => county.name === userProfile.county_name);
      
      if (!userCounty) {
        showError('County Error', 'Could not determine your county. Please contact support.');
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
          related_bill_id: billId
        })
      });

      if (response.ok) {
        const result = await response.json();
        showSuccess('Success', `Feedback submitted successfully! Tracking ID: ${result.data.tracking_id}`);
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
        showError('Submission Failed', `Failed to submit feedback: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showError('Error', 'Error submitting feedback');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="py-8 pt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Parliamentary Bills</h1>
              <p className="text-xl text-gray-600">Loading bills...</p>
            </div>
            <LoadingSkeleton />
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Parliamentary Bills</h1>
          <p className="text-xl text-gray-600">Engage with current parliamentary bills and legislation</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search bills by title, number, or description..."
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
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>

            <select
              value={committeeFilter}
              onChange={(e) => setCommitteeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Committees</option>
              {uniqueCommittees.map(committee => (
                <option key={committee} value={committee}>{committee}</option>
              ))}
            </select>

            <div></div>

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Clear Filters
            </button>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {displayedBills.length} of {filteredBills.length} bills
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 justify-center">
          {displayedBills.map((bill) => (
            <div
              key={bill.id}
              className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200 w-full max-w-sm"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-4 pt-4">
                <h3 className="font-bold text-lg text-gray-800">{bill.bill_number}</h3>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(bill.status)}`}>
                  {bill.status_display}
                </span>
              </div>

              {/* Image */}
              {bill.image && (
                <div className="mt-2">
                  <img
                    src={`http://127.0.0.1:8000${bill.image}`}
                    alt={bill.title}
                    className="w-full h-36 object-cover rounded-md px-4"
                  />
                </div>
              )}

              {/* Title and Description */}
              <div className="px-4 mt-2">
                <h4 className="font-semibold text-gray-900 mb-1">{bill.title}</h4>
                <p className="text-gray-600 text-sm">{bill.summary || bill.description}</p>
              </div>

              {/* Sponsor + Committee */}
              <div className="px-4 mt-3 text-sm text-gray-700">
                <div className="flex items-center gap-1 mb-1">
                  <Users size={16} />
                  <span>Sponsor: {bill.sponsor}</span>
                </div>
                {bill.committee && (
                  <div className="text-xs text-gray-500">
                    Committee: {bill.committee}
                  </div>
                )}
                <button
                  onClick={() => navigate(`/bill/${bill.id}`)}
                  className="text-blue-600 hover:underline font-medium flex items-center gap-1 mt-2"
                >
                  View Full Details →
                </button>
              </div>

              {/* Actions */}
              <div className="px-4 py-4">
                <div className="text-center mb-2">
                  {isAuthenticated ? (
                    <button 
                      onClick={() => navigate(`/bill/${bill.id}`)}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out"
                    >
                      View Details
                    </button>
                  ) : (
                    <button 
                      onClick={() => navigate('/login')}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out"
                    >
                      Login to Engage
                    </button>
                  )}
                </div>
                
                {/* Submit Feedback Button */}
                {isAuthenticated && (
                  <button
                    onClick={() => toggleFeedbackForm(bill.id)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm px-4 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={16} />
                    Submit Feedback
                    {expandedFeedback === bill.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}
              </div>

              {/* Inline Feedback Form */}
              {expandedFeedback === bill.id && isAuthenticated && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="mt-4 space-y-3">

                    
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
                        id={`anonymous-${bill.id}`}
                        checked={feedbackData.is_anonymous}
                        onChange={(e) => setFeedbackData({...feedbackData, is_anonymous: e.target.checked})}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <label htmlFor={`anonymous-${bill.id}`} className="text-sm text-gray-700">
                        Submit anonymously
                      </label>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitFeedback(bill.id)}
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
        {hasMoreBills && (
          <div className="text-center mt-8">
            <button
              onClick={loadMoreBills}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Load More Bills
            </button>
          </div>
        )}
      </div>
      </div>
      <Footer />
      
      {/* Custom Alert */}
      <CustomAlert
        type={alert.type}
        title={alert.title}
        message={alert.message}
        isOpen={alert.isOpen}
        onClose={hideAlert}
      />
    </div>
  );
};

export default BillsList;