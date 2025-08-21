import React from 'react';

const AdminOverview: React.FC = () => {
  const stats = [
    { title: 'Total Feedback', value: '1,247', change: '+12%', icon: '💬' },
    { title: 'Active Users', value: '8,432', change: '+5%', icon: '👥' },
    { title: 'Resolved Issues', value: '892', change: '+18%', icon: '✅' },
    { title: 'Response Time', value: '2.3 hrs', change: '-15%', icon: '⏱️' },
  ];

  const recentFeedback = [
    { id: 1, title: 'Road maintenance needed', category: 'Infrastructure', status: 'pending', priority: 'high' },
    { id: 2, title: 'Water supply issues', category: 'Utilities', status: 'in-progress', priority: 'medium' },
    { id: 3, title: 'Healthcare facility request', category: 'Healthcare', status: 'resolved', priority: 'high' },
    { id: 4, title: 'Education funding inquiry', category: 'Education', status: 'pending', priority: 'low' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600">{stat.change} from last month</p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Feedback */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Feedback</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentFeedback.map((feedback) => (
              <div key={feedback.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{feedback.title}</h4>
                  <p className="text-sm text-gray-600">{feedback.category}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(feedback.priority)}`}>
                    {feedback.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(feedback.status)}`}>
                    {feedback.status}
                  </span>
                </div>
              </div>
            ))}
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
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-medium text-gray-900">Generate Report</h4>
              <p className="text-sm text-gray-600">Create analytics and performance reports</p>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-2xl mb-2">👥</div>
              <h4 className="font-medium text-gray-900">Manage Users</h4>
              <p className="text-sm text-gray-600">Add or modify user accounts</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;