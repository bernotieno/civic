import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import Header from './Header';
import Footer from './Footer';
import LoadingSkeleton from './LoadingSkeleton';
import { getBillStatusColor, getBillStatusStyle, getBillStatusOptions } from '../constants/billStatuses';
import { useCustomPopup } from '../hooks/useCustomPopup';

interface Bill {
  id: string;
  bill_number: string;
  title: string;
  description: string;
  summary: string; // HTML formatted summary for display
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
  const { showSuccess, showError } = useCustomPopup();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sponsorFilter, setSponsorFilter] = useState('');
  const [debouncedSponsorFilter, setDebouncedSponsorFilter] = useState('');
  const [sortBy, setSortBy] = useState('-created_at');
  const [pagination, setPagination] = useState<any>(null);
  const [availableFilters, setAvailableFilters] = useState<any>(null);
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

  // Debounce search terms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSponsorFilter(sponsorFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [sponsorFilter]);

  useEffect(() => {
    checkAuthentication();
    fetchBills();
  }, [currentPage, debouncedSearchTerm, statusFilter, debouncedSponsorFilter, sortBy]);

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
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('page_size', '20');

      if (debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim());
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      if (debouncedSponsorFilter.trim()) {
        params.append('sponsor', debouncedSponsorFilter.trim());
      }
      if (sortBy) {
        params.append('sort', sortBy);
      }

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`http://127.0.0.1:8000/api/public/bills/?${params.toString()}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        setBills(data.data || []);
        setPagination(data.pagination || null);
        setAvailableFilters(data.filters || null);
      } else {
        console.error('Failed to fetch bills');
        setBills([]);
        setPagination(null);
        setAvailableFilters(null);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timed out');
      } else {
        console.error('Error fetching bills:', error);
      }
      setBills([]);
      setPagination(null);
      setAvailableFilters(null);
    } finally {
      setLoading(false);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, statusFilter, debouncedSponsorFilter, sortBy]);

  // Use centralized status configuration
  const statusOptions = getBillStatusOptions();

  const loadMoreBills = () => {
    if (pagination && pagination.has_next) {
      setCurrentPage(currentPage + 1);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter('');
    setSponsorFilter('');
    setDebouncedSponsorFilter('');
    setSortBy('-created_at');
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
      showError('User profile not loaded. Please refresh the page.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Get user's county ID from profile
      const countyResponse = await fetch('http://127.0.0.1:8000/api/locations/counties/');
      const countiesData = await countyResponse.json();
      const userCounty = countiesData.find((county: any) => county.name === userProfile.county_name);
      
      if (!userCounty) {
        showError('Could not determine your county. Please contact support.');
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
        showSuccess(`Feedback submitted successfully! Tracking ID: ${result.data.tracking_id}`);
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
        showError(`Failed to submit feedback: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showError('Error submitting feedback');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 safe-area-padding prevent-horizontal-scroll">
        <Header />
        <div className="py-6 sm:py-8 pt-20 sm:pt-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 mobile-text-adjust">Parliamentary Bills</h1>
              <p className="text-lg sm:text-xl text-gray-600">Loading bills...</p>
            </div>
            <LoadingSkeleton />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 safe-area-padding prevent-horizontal-scroll">
      <Header />
      <div className="py-6 sm:py-8 pt-20 sm:pt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 mobile-text-adjust">Parliamentary Bills</h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600">Engage with current parliamentary bills and legislation</p>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ focusRingColor: '#0D3C43' }}
              />
              {searchTerm !== debouncedSearchTerm && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2" style={{ borderColor: '#0D3C43' }}></div>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ focusRingColor: '#0D3C43' }}
            >
              <option value="">All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value} title={status.description}>
                  {status.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Filter by sponsor..."
              value={sponsorFilter}
              onChange={(e) => setSponsorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ focusRingColor: '#0D3C43' }}
            />

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ focusRingColor: '#0D3C43' }}
            >
              <option value="-created_at">Newest First</option>
              <option value="created_at">Oldest First</option>
              <option value="title">Title A-Z</option>
              <option value="-title">Title Z-A</option>
              <option value="participation_deadline">Deadline (Earliest)</option>
              <option value="-participation_deadline">Deadline (Latest)</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-medium"
              style={{ backgroundColor: '#0D3C43' }}
            >
              Clear Filters
            </button>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            {pagination ? (
              <>
                Showing {bills.length} of {pagination.total_bills} bills
                {pagination.total_pages > 1 && (
                  <span className="ml-2">
                    (Page {pagination.current_page} of {pagination.total_pages})
                  </span>
                )}
              </>
            ) : (
              `Showing ${bills.length} bills`
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 justify-center">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200 w-full max-w-sm"
            >
              {/* Bill Title */}
              <div className="px-4 pt-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2">{bill.title}</h3>
              </div>

              {/* Bill Status */}
              <div className="px-4 mb-3">
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${getBillStatusColor(bill.status)}`}
                  style={getBillStatusStyle(bill.status)}
                >
                  {bill.status_display}
                </span>
              </div>

              {/* Description */}
              <div className="px-4 mb-4">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {bill.description.length > 150
                    ? `${bill.description.substring(0, 150)}...`
                    : bill.description
                  }
                </p>
              </div>

              {/* Sponsor */}
              <div className="px-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Users size={16} className="text-gray-500" />
                  <span className="font-medium">Sponsor:</span>
                  <span>{bill.sponsor}</span>
                </div>
              </div>

              {/* View Details Link */}
              <div className="px-4 pb-2">
                <button
                  onClick={() => navigate(`/bill/${bill.id}`)}
                  className="font-medium transition-colors hover:underline flex items-center gap-1 mb-2"
                  style={{ color: '#0D3C43' }}
                >
                  View Details →
                </button>
              {/* Actions */}
              <div className="px-4 pb-4">
                {/* Submit Feedback Button */}
                {isAuthenticated && (
                  <button
                    onClick={() => toggleFeedbackForm(bill.id)}
                    className="w-full px-4 py-2 text-white rounded-md font-medium transition-colors hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#14B8A6' }}
                  >
                    <MessageSquare size={16} />
                    Submit Feedback
                    {expandedFeedback === bill.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                )}

                {/* Login prompt for non-authenticated users */}
                {!isAuthenticated && (
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full px-4 py-2 text-white rounded-md font-medium transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#14B8A6' }}
                  >
                    Login to Engage
                  </button>
                )}
              </div>
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

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex justify-center items-center mt-8 gap-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={!pagination.has_previous}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0D3C43' }}
            >
              Previous
            </button>

            <span className="text-gray-600">
              Page {pagination.current_page} of {pagination.total_pages}
            </span>

            <button
              onClick={() => setCurrentPage(Math.min(pagination.total_pages, currentPage + 1))}
              disabled={!pagination.has_next}
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#0D3C43' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
};

export default BillsList;