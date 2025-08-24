import React, { useState, useEffect } from 'react';

interface DashboardStats {
  total_users: number;
  total_counties: number;
  total_feedback: number;
  pending_feedback: number;
  total_projects: number;
  active_projects: number;
}

interface Feedback {
  id: string;
  title: string;
  category: string;
  status: string;
  county: string;
  created_at: string;
  has_response: boolean;
  user_name: string;
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

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/admin/dashboard/', { headers });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Fetch recent feedback
      const feedbackResponse = await fetch('/api/admin/feedback/', { headers });
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setRecentFeedback(feedbackData.data.slice(0, 4)); // Show only 4 recent items
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.active_projects || 0}</p>
            </div>
            <div className="text-3xl">🏗️</div>
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
                    <p className="text-sm text-gray-600">{feedback.category} • {feedback.county} • {feedback.user_name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feedback.status)}`}>
                      {feedback.status.replace('_', ' ')}
                    </span>
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
              <div className="text-2xl mb-2">🏗️</div>
              <h4 className="font-medium text-gray-900">Manage Projects</h4>
              <p className="text-sm text-gray-600">Create and update project status</p>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-2">👥</div>
              <h4 className="font-medium text-gray-900">Manage Users</h4>
              <p className="text-sm text-gray-600">View and manage user accounts</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;