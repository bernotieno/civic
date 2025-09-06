import React, { useState, useEffect } from 'react';

interface DashboardStats {
  total_users: number;
  total_counties: number;
  total_feedback: number;
  pending_feedback: number;
  in_review_feedback: number;
  responded_feedback: number;
  resolved_feedback: number;
  total_projects: number;
  active_projects: number;
  total_bills: number;
  active_bills: number;
}

interface Feedback {
  id: string;
  title: string;
  content: string;
  category: string;
  category_display: string;
  status: string;
  status_display: string;
  tracking_id: string;
  county: string;
  created_at: string;
  response_count: number;
  user_name: string;
  is_anonymous: boolean;
}

const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      console.log('📈 Fetching admin dashboard data...');

      // Fetch dashboard stats
      const statsResponse = await fetch('http://127.0.0.1:8000/api/admin/dashboard/', { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('📈 Stats data:', statsData);
        setStats(statsData.data);
      } else {
        console.error('❌ Failed to fetch stats:', statsResponse.status, await statsResponse.text());
      }

      // Fetch recent feedback
      const feedbackResponse = await fetch('http://127.0.0.1:8000/api/admin/feedback/', { headers });
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        console.log('📝 Feedback data:', feedbackData);
        setRecentFeedback(feedbackData.data?.slice(0, 4) || []); // Show only 4 recent items
      } else {
        console.error('❌ Failed to fetch feedback:', feedbackResponse.status, await feedbackResponse.text());
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_review': return 'text-white';
      case 'responded': return 'bg-teal-100 text-teal-800';
      case 'resolved': return 'bg-teal-100 text-teal-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'in_review') {
      return { backgroundColor: '#0D3C43' };
    }
    return {};
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: '#0D3C43' }}></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_users || 0}</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_feedback || 0}</p>
            </div>
            <div className="text-3xl">💬</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Feedback</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pending_feedback || 0}</p>
              <p className="text-xs text-gray-500">In Review: {stats?.in_review_feedback || 0}</p>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_projects || 0}</p>
            </div>
            <div className="text-3xl">🏗️</div>
          </div>
        </div>
      </div>

      {/* Bills Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bills</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_bills || 0}</p>
            </div>
            <div className="text-3xl">📜</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Bills</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.active_bills || 0}</p>
            </div>
            <div className="text-3xl">⚖️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Counties</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_counties || 47}</p>
            </div>
            <div className="text-3xl">🏛️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.total_feedback > 0 ? Math.round(((stats?.responded_feedback + stats?.resolved_feedback) / stats?.total_feedback) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500">Resolved: {stats?.resolved_feedback || 0}</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Feedback</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentFeedback.length > 0 ? (
              recentFeedback.map((feedback) => (
                <div key={feedback.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{feedback.title}</h4>
                    <p className="text-sm text-gray-600">
                      {feedback.category_display || feedback.category} • {feedback.user_name || 'Anonymous'} • {feedback.county || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {feedback.tracking_id} • {new Date(feedback.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feedback.status)}`}>
                      {feedback.status_display || feedback.status.replace('_', ' ')}
                    </span>
                    {feedback.response_count > 0 && (
                      <span className="text-xs text-green-600">
                        {feedback.response_count} response{feedback.response_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No feedback available</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-2">📝</div>
              <h4 className="font-medium text-gray-900">Review Feedback</h4>
              <p className="text-sm text-gray-600">Review and respond to citizen feedback</p>
            </button>

            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-2">📜</div>
              <h4 className="font-medium text-gray-900">Manage Bills</h4>
              <p className="text-sm text-gray-600">Create and track parliamentary bills</p>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-medium text-gray-900">View Analytics</h4>
              <p className="text-sm text-gray-600">National engagement analytics</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;