import React, { useState, useEffect } from 'react';
import CustomAlert from '../CustomAlert';
import { useAlert } from '../../hooks/useAlert';

interface Feedback {
  id: string;
  title: string;
  content: string;  // Fixed: use 'content' instead of 'description'
  category: string;
  category_display: string;
  priority: string;
  priority_display: string;
  status: string;
  status_display: string;
  tracking_id: string;
  county: string;
  county_code: string;
  location_path: string;
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
  response_count: number;
  last_response_at?: string;
  view_count: number;
  sentiment_score?: number;
  user_name: string;
  user_email?: string;
  submitted_via: string;
  can_edit: boolean;
  can_delete: boolean;
  edit_count: number;
  edited_at?: string;
}

const AdminFeedbackManagement: React.FC = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [viewingFeedback, setViewingFeedback] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responding, setResponding] = useState(false);
  const { alert, showSuccess, showError, hideAlert } = useAlert();

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔍 Fetching admin feedback...');
      
      const response = await fetch('http://127.0.0.1:8000/api/admin/feedback/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📈 Feedback data received:', data);
        setFeedback(data.data || []);
      } else {
        console.error('❌ Failed to fetch feedback:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error details:', errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (feedbackId: string) => {
    if (!responseText.trim()) return;

    setResponding(true);
    try {
      const token = localStorage.getItem('access_token');
      console.log('💬 Sending response to feedback:', feedbackId);
      
      const response = await fetch(`http://127.0.0.1:8000/api/admin/feedback/${feedbackId}/respond/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response_text: responseText }),
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Response sent successfully:', data);
        setResponseText('');
        setSelectedFeedback(null);
        fetchFeedback(); // Refresh the list
        showSuccess('Success', 'Response sent successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Failed to send response:', errorData);
        showError('Error', `Failed to send response: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error sending response:', error);
      showError('Error', 'Error sending response');
    } finally {
      setResponding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'responded': return 'bg-green-100 text-green-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      infrastructure: 'bg-blue-100 text-blue-800',
      healthcare: 'bg-red-100 text-red-800',
      education: 'bg-purple-100 text-purple-800',
      water_sanitation: 'bg-cyan-100 text-cyan-800',
      security: 'bg-orange-100 text-orange-800',
      environment: 'bg-green-100 text-green-800',
      governance: 'bg-indigo-100 text-indigo-800',
      economic: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading feedback data...</p>
        </div>
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Feedback Management</h2>
          <button
            onClick={fetchFeedback}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Found</h3>
            <p className="text-gray-600 mb-4">
              There are currently no feedback submissions to display.
            </p>
            <button
              onClick={fetchFeedback}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Feedback Management</h2>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Total: {feedback.length} | 
            Responded: {feedback.filter(f => f.response_count > 0).length}
          </div>
          <button
            onClick={fetchFeedback}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feedback
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  County
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedback.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {item.content}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        ID: {item.tracking_id} • {item.user_name} • {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                      {item.category_display || (item.category ? item.category.replace('_', ' ') : 'Other')}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.county}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setViewingFeedback(item)}
                      className="text-gray-600 hover:text-gray-900 mr-3"
                    >
                      View
                    </button>
                    {item.response_count === 0 && (
                      <button
                        onClick={() => setSelectedFeedback(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Respond
                      </button>
                    )}
                    {item.response_count > 0 && (
                      <span className="text-green-600">
                        Responded ({item.response_count})
                      </span>
                    )}
                    {item.status === 'resolved' && (
                      <span className="text-green-700 font-medium">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {feedback.map((item) => (
          <div key={item.id} className="bg-white shadow-sm rounded-lg border border-gray-200 p-4">
            <div className="mb-3">
              <h3 className="text-sm font-medium text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500 mb-2">{item.content}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(item.category)}`}>
                {item.category_display || (item.category ? item.category.replace('_', ' ') : 'Other')}
              </span>
            </div>
            
            <div className="text-xs text-gray-500 mb-3">
              <div>ID: {item.tracking_id}</div>
              <div>County: {item.county} • User: {item.user_name}</div>
              <div>Date: {new Date(item.created_at).toLocaleDateString()}</div>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                onClick={() => setViewingFeedback(item)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded"
              >
                View Full
              </button>
              <div>
                {item.response_count === 0 && (
                  <button
                    onClick={() => setSelectedFeedback(item)}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-900 border border-blue-300 rounded"
                  >
                    Respond
                  </button>
                )}
                {item.response_count > 0 && (
                  <span className="text-sm text-green-600">
                    Responded ({item.response_count})
                  </span>
                )}

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Feedback Modal */}
      {viewingFeedback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-full max-w-3xl shadow-lg rounded-md bg-white m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Feedback Details</h3>
              <button
                onClick={() => setViewingFeedback(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-sm text-gray-900">{viewingFeedback.title}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingFeedback.content}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(viewingFeedback.category)}`}>
                    {viewingFeedback.category_display || (viewingFeedback.category ? viewingFeedback.category.replace('_', ' ') : 'Other')}
                  </span>
                </div>

              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tracking ID</label>
                  <p className="mt-1 text-gray-900">{viewingFeedback.tracking_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">County</label>
                  <p className="mt-1 text-gray-900">{viewingFeedback.county}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Submitted By</label>
                  <p className="mt-1 text-gray-900">{viewingFeedback.user_name}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Submission Date</label>
                <p className="mt-1 text-sm text-gray-900">{new Date(viewingFeedback.created_at).toLocaleString()}</p>
              </div>
              
              {viewingFeedback.response_count > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Response Status</label>
                  <p className="mt-1 text-sm text-green-600">
                    {viewingFeedback.response_count} response(s) sent
                    {viewingFeedback.last_response_at && (
                      <span className="text-gray-500"> • Last: {new Date(viewingFeedback.last_response_at).toLocaleString()}</span>
                    )}
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              {viewingFeedback.response_count === 0 && (
                <button
                  onClick={() => {
                    setSelectedFeedback(viewingFeedback);
                    setViewingFeedback(null);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-3"
                >
                  Respond to This Feedback
                </button>
              )}
              <button
                onClick={() => setViewingFeedback(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-md bg-white m-4">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Respond to Feedback
              </h3>
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">{selectedFeedback.title}</h4>
                <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{selectedFeedback.content}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-500">
                  <span>ID: {selectedFeedback.tracking_id}</span>
                  <span>County: {selectedFeedback.county}</span>
                  <span>User: {selectedFeedback.user_name}</span>
                </div>
              </div>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Enter your response..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
                <button
                  onClick={() => {
                    setSelectedFeedback(null);
                    setResponseText('');
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRespond(selectedFeedback.id)}
                  disabled={responding || !responseText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {responding ? 'Sending...' : 'Send Response'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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

export default AdminFeedbackManagement;