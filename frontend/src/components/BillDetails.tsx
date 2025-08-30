import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

interface Bill {
  id: string;
  title: string;
  description: string;
  summary?: string;
  summary_html?: string;
  summary_markdown?: string;
  sponsor: string;
  participation_deadline?: string;
  document?: string;
  document_url?: string;
  created_at: string;
}

const BillDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    title: '',
    content: '',
    category: 'legislation',
    priority: 'medium',
    is_anonymous: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    fetchBill();
    checkAuthentication();
  }, [id]);

  const fetchBill = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/public/bills/${id}/`);
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

  const checkAuthentication = () => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackData.title.trim() || !feedbackData.content.trim()) return;
    
    setIsSubmitting(true);
    try {
      if (feedbackData.is_anonymous) {
        // Create anonymous session first
        const sessionResponse = await fetch('http://127.0.0.1:8000/api/auth/anonymous/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ county_id: 1 }) // Default county for bills
        });
        
        if (!sessionResponse.ok) throw new Error('Failed to create anonymous session');
        const sessionData = await sessionResponse.json();
        
        // Submit anonymous feedback
        const response = await fetch('http://127.0.0.1:8000/api/feedback/anonymous/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionData.session_id,
            title: feedbackData.title,
            content: feedbackData.content,
            category: feedbackData.category,
            priority: feedbackData.priority,
            county_id: 1,
            related_bill_id: bill?.id
          })
        });
      } else {
        // Submit authenticated feedback
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://127.0.0.1:8000/api/feedback/submit/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: feedbackData.title,
            content: feedbackData.content,
            category: feedbackData.category,
            priority: feedbackData.priority,
            county_id: 1,
            related_bill_id: bill?.id
          })
        });
      }
      
      if (response.ok) {
        setShowSuccess(true);
        setFeedbackData({
          title: '',
          content: '',
          category: 'legislation',
          priority: 'medium',
          is_anonymous: false
        });
        setShowFeedbackForm(false);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
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

  if (!bill) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-64 pt-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bill Not Found</h2>
            <button
              onClick={() => navigate('/bills')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Back to Bills
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
            onClick={() => navigate('/bills')}
            className="mb-6 text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Bills
          </button>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{bill.title}</h1>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Sponsor</h3>
                  <p className="text-lg text-gray-700">{bill.sponsor}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-1">Participation Deadline</h3>
                  <p className="text-lg text-gray-700">
                    {bill.participation_deadline ? new Date(bill.participation_deadline).toLocaleDateString() : 'No deadline set'}
                  </p>
                </div>
              </div>

              {bill.image && (
                <div className="mb-8">
                  <img 
                    src={`http://127.0.0.1:8000${bill.image}`} 
                    alt={bill.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Bill Description</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{bill.description}</p>
                {(bill.summary || bill.summary_markdown || bill.summary_html) && (
                  <>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">AI-Generated Summary</h3>
                    <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {bill.summary_html ? (
                        <div dangerouslySetInnerHTML={{ __html: bill.summary_html }} />
                      ) : (
                        bill.summary_markdown || bill.summary
                      )}
                    </div>
                  </>
                )}
              </div>

              {(bill.document || bill.document_url) && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Bill Document</h2>
                  <a 
                    href={bill.document_url || `http://127.0.0.1:8000${bill.document}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    📄 Download Bill Document
                  </a>
                </div>
              )}

              <div className="border-t pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Share Your Views on This Bill</h2>
                {isAuthenticated ? (
                  <div className="space-y-4">
                    {!showFeedbackForm ? (
                      <div className="text-center">
                        <p className="text-gray-600 mb-4">Share your thoughts about this parliamentary bill</p>
                        <button
                          onClick={() => setShowFeedbackForm(true)}
                          className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium"
                        >
                          Submit Feedback
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={feedbackData.title}
                              onChange={(e) => setFeedbackData({...feedbackData, title: e.target.value})}
                              placeholder="Brief title for your feedback"
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Views</label>
                            <textarea
                              value={feedbackData.content}
                              onChange={(e) => setFeedbackData({...feedbackData, content: e.target.value})}
                              placeholder="Share your detailed views about this bill..."
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                              rows={4}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                              <select
                                value={feedbackData.category}
                                onChange={(e) => setFeedbackData({...feedbackData, category: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                <option value="legislation">Legislation & Bills</option>
                                <option value="budget">Budget & Finance</option>
                                <option value="healthcare">Healthcare Policy</option>
                                <option value="education">Education Policy</option>
                                <option value="governance">Governance & Oversight</option>
                                <option value="other">Other National Issues</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                              <select
                                value={feedbackData.priority}
                                onChange={(e) => setFeedbackData({...feedbackData, priority: e.target.value})}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="anonymous"
                              checked={feedbackData.is_anonymous}
                              onChange={(e) => setFeedbackData({...feedbackData, is_anonymous: e.target.checked})}
                              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                              Submit anonymously (your identity will be hidden)
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between pt-4">
                            <button
                              onClick={() => setShowFeedbackForm(false)}
                              className="text-gray-600 hover:text-gray-800 font-medium"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSubmitFeedback}
                              disabled={!feedbackData.title.trim() || !feedbackData.content.trim() || isSubmitting}
                              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                            >
                              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-600 mb-4">Please log in to share your views on this parliamentary bill.</p>
                    <button
                      onClick={() => navigate('/login')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
                    >
                      Log In to Engage
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showSuccess && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
              <p className="font-medium">Your feedback has been submitted successfully!</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BillDetails;