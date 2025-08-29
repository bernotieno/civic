import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, ExternalLink, Filter, Search, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Bill } from '../../types';

interface BillsProps {
  onFeedbackClick?: (billId?: string) => void;
  onBillExplore?: (billId: string) => void;
}

const Bills: React.FC<BillsProps> = ({ onFeedbackClick, onBillExplore }) => {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    fetchBills();
  }, []);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const billsResponse = await fetch('http://127.0.0.1:8000/api/public/bills/');
      
      if (billsResponse.ok) {
        const billsData = await billsResponse.json();
        setBills(billsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
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
                         bill.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const toggleFeedbackForm = (id: string) => {
    if (expandedFeedback === id) {
      setExpandedFeedback(null);
    } else {
      setExpandedFeedback(id);
      setFeedbackData({
        content: '',
        category: 'legislation',
        priority: 'medium',
        is_anonymous: false
      });
    }
  };

  const submitFeedback = async (id: string) => {
    if (!userProfile) {
      alert('User profile not loaded. Please refresh the page.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      const countyResponse = await fetch('http://127.0.0.1:8000/api/locations/counties/');
      const countiesData = await countyResponse.json();
      
      const counties = Array.isArray(countiesData) ? countiesData : countiesData.results || [];
      const userCounty = counties.find((county: any) => county.name === userProfile.county_name);
      
      if (!userCounty) {
        alert('Could not determine your county. Please contact support.');
        return;
      }

      let response;
      
      if (feedbackData.is_anonymous) {
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
        
        response = await fetch('http://127.0.0.1:8000/api/feedback/anonymous/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session_id: sessionData.session_id,
            title: `Feedback on Bill: ${bills.find(b => b.id === id)?.title}`,
            content: feedbackData.content,
            category: feedbackData.category,
            priority: feedbackData.priority,
            county_id: userCounty.id,
            related_bill_id: id
          })
        });
      } else {
        response = await fetch('http://127.0.0.1:8000/api/feedback/submit/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: `Feedback on Bill: ${bills.find(b => b.id === id)?.title}`,
            content: feedbackData.content,
            category: feedbackData.category,
            priority: feedbackData.priority,
            county_id: userCounty.id,
            related_bill_id: id
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
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Parliamentary Bills</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

        </div>
      </div>

      <div className="p-6">
        <div className="space-y-6">
          {filteredBills.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No bills found matching your criteria.</p>
            </div>
          ) : (
            filteredBills.map((bill) => (
              <div key={bill.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{bill.title}</h3>
                  <p className="text-gray-700 mb-3">{bill.description}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Sponsor: <span className="font-medium">{bill.sponsor}</span></p>
                  </div>
                  <div>
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Open for Public Participation
                    </span>
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
                        setSelectedBill(bill);
                        setShowDetailsModal(true);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                    >
                      <ExternalLink className="inline-block w-4 h-4 mr-1" />
                      View Details
                    </button>
                    <button 
                      onClick={() => onBillExplore?.(bill.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Explore Bill
                    </button>
                  </div>
                </div>
                
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
            ))
          )}
        </div>
      </div>

      {showDetailsModal && selectedBill && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Bill Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">{selectedBill.title}</h4>
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
                  <label className="block text-sm font-medium text-gray-700">Participation Deadline</label>
                  <p className="text-sm text-gray-900">{selectedBill.participation_deadline ? formatDate(selectedBill.participation_deadline) : 'No deadline'}</p>
                </div>
              </div>
            </div>
            
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

export default Bills;