import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Bill, ChatHistory } from '../../types';
import CustomAlert from '../CustomAlert';
import { useAlert } from '../../hooks/useAlert';
import ChatTab from '../ChatTab';

interface BillDetailsViewProps {
  billId: string;
  onBack: () => void;
}

const BillDetailsView: React.FC<BillDetailsViewProps> = ({ billId, onBack }) => {
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'original' | 'summary' | 'feedback' | 'chat'>('original');
  const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
  const [feedbackData, setFeedbackData] = useState({
    content: '',
    is_anonymous: false
  });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const { alert, showSuccess, showError, showWarning, hideAlert } = useAlert();

  useEffect(() => {
    fetchBill();
    fetchUserProfile();
  }, [billId]);

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

  const fetchBill = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const headers: HeadersInit = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://127.0.0.1:8000/api/public/bills/${billId}/`, {
        headers
      });
      if (response.ok) {
        const data = await response.json();
        setBill(data.bill || null);
      }
    } catch (error) {
      console.error('Error fetching bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async () => {
    if (!feedbackData.content.trim()) {
      showWarning('Input Required', 'Please enter your feedback.');
      return;
    }
    
    if (!userProfile) {
      showError('Authentication Error', 'User profile not loaded. Please refresh the page.');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const token = localStorage.getItem('access_token');
      
      const countyResponse = await fetch('http://127.0.0.1:8000/api/locations/counties/');
      const countiesData = await countyResponse.json();
      
      const counties = Array.isArray(countiesData) ? countiesData : countiesData.results || [];
      const userCounty = counties.find((county: any) => county.name === userProfile.county_name);
      
      if (!userCounty) {
        showError('County Error', 'Could not determine your county. Please contact support.');
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
            title: `Feedback on Bill: ${bill?.title}`,
            content: feedbackData.content,
            county_id: userCounty.id,
            related_bill_id: billId
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
            title: `Feedback on Bill: ${bill?.title}`,
            content: feedbackData.content,
            county_id: userCounty.id,
            related_bill_id: billId
          })
        });
      }

      if (response.ok) {
        const result = await response.json();
        const trackingId = result.data?.tracking_id || result.tracking_id;
        showSuccess('Success', `${feedbackData.is_anonymous ? 'Anonymous ' : ''}Feedback submitted successfully! Tracking ID: ${trackingId}`);
        setFeedbackData({
          content: '',
          is_anonymous: false
        });
      } else {
        const errorData = await response.json();
        console.error('Feedback submission error:', errorData);
        showError('Submission Failed', `Failed to submit feedback: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showError('Error', 'Error submitting feedback: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSubmittingFeedback(false);
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
      withdrawn: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Bill Not Found</h2>
          <p className="text-gray-600 mb-4">The requested bill could not be found.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Bills
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex items-center gap-2 sm:gap-4 mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1 sm:gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm sm:text-base"
          >
            <ArrowLeft size={16} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Back to Bills</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
        <div className="flex justify-between items-start mb-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight flex-1">{bill.title}</h1>
          {bill.status && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ml-4 flex-shrink-0 ${getStatusColor(bill.status)}`}>
              {bill.status_display || bill.status.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
          <span>Sponsor: {bill.sponsor}</span>
          {bill.participation_deadline && (
            <span>Deadline: {new Date(bill.participation_deadline).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex px-4 sm:px-6 overflow-x-auto">
            {[
              { id: 'original' as const, name: 'Description', shortName: 'Details', description: 'Full bill details' },
              { id: 'summary' as const, name: 'AI Summary', shortName: 'Summary', description: 'Key points & overview' },
              { id: 'chat' as const, name: 'AI Chat', shortName: 'Chat', description: 'Ask questions about this bill' },
              { id: 'feedback' as const, name: 'Submit Feedback', shortName: 'Feedback', description: 'Share your views' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.shortName}</span>
                  <span className="text-xs text-gray-400 mt-1 hidden sm:block">{tab.description}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {activeTab === 'original' && (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Bill Description</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">{bill.description}</p>
                {bill.document_url && (
                  <div className="mt-4 sm:mt-6">
                    <h4 className="text-base sm:text-lg font-semibold mb-2">Bill Document</h4>
                    <a 
                      href={`http://127.0.0.1:8000${bill.document_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
                    >
                      📄 <span className="ml-2">Download Bill Document</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">AI-Generated Summary</h3>
              {(bill.summary || bill.summary_markdown || bill.summary_html) ? (
                <div className="prose max-w-none">
                  <div className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                    {bill.summary_html ? (
                      <div dangerouslySetInnerHTML={{ __html: bill.summary_html }} />
                    ) : (
                      bill.summary_markdown || bill.summary
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-gray-500 text-sm sm:text-base">AI summary not available for this bill.</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-2">Summary is generated when a document is uploaded.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'feedback' && (
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Submit Your Feedback</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Views on This Bill</label>
                  <textarea
                    placeholder="Share your thoughts, concerns, or suggestions about this bill..."
                    value={feedbackData.content}
                    onChange={(e) => setFeedbackData({...feedbackData, content: e.target.value})}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                

                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="anonymous-feedback"
                    checked={feedbackData.is_anonymous}
                    onChange={(e) => setFeedbackData({...feedbackData, is_anonymous: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="anonymous-feedback" className="text-sm text-gray-700">
                    Submit anonymously (your identity will be hidden)
                  </label>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={submitFeedback}
                    disabled={!feedbackData.content.trim() || isSubmittingFeedback}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm sm:text-base px-4 py-2 rounded-md font-medium transition-colors"
                  >
                    {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                  </button>
                  <button
                    onClick={() => setFeedbackData({
                      content: '',
                      is_anonymous: false
                    })}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm sm:text-base rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Clear Form
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <ChatTab 
              billId={billId} 
              initialHistory={chatHistory} 
              onHistoryUpdate={setChatHistory}
            />
          )}
        </div>
      </div>
      
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

export default BillDetailsView;