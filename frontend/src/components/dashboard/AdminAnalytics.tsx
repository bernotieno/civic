import React from 'react';

const AdminAnalytics: React.FC = () => {
  const analyticsData = {
    totalFeedback: 1247,
    resolvedFeedback: 892,
    avgResponseTime: '2.3 hours',
    satisfactionRate: '87%',
  };

  const categoryData = [
    { category: 'Infrastructure', count: 342, percentage: 27 },
    { category: 'Healthcare', count: 298, percentage: 24 },
    { category: 'Education', count: 234, percentage: 19 },
    { category: 'Utilities', count: 198, percentage: 16 },
    { category: 'Environment', count: 175, percentage: 14 },
  ];

  const monthlyTrends = [
    { month: 'Jan', feedback: 98, resolved: 87 },
    { month: 'Feb', feedback: 112, resolved: 95 },
    { month: 'Mar', feedback: 134, resolved: 118 },
    { month: 'Apr', feedback: 156, resolved: 142 },
    { month: 'May', feedback: 189, resolved: 167 },
    { month: 'Jun', feedback: 203, resolved: 178 },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Analytics & Reports</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold" style={{ color: '#0D3C43' }}>{analyticsData.totalFeedback}</div>
          <div className="text-sm text-gray-600">Total Feedback</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-teal-600">{analyticsData.resolvedFeedback}</div>
          <div className="text-sm text-gray-600">Resolved Issues</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-teal-700">{analyticsData.avgResponseTime}</div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold" style={{ color: '#0D3C43' }}>{analyticsData.satisfactionRate}</div>
          <div className="text-sm text-gray-600">Satisfaction Rate</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Feedback by Category</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-900">{item.category}</div>
                  <div className="text-sm text-gray-600">({item.count} issues)</div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 w-8">{item.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Monthly Trends</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {monthlyTrends.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="font-medium text-gray-900">{month.month}</div>
                <div className="flex space-x-6">
                  <div className="text-sm">
                    <span className="text-gray-600">Received: </span>
                    <span className="font-medium text-blue-600">{month.feedback}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Resolved: </span>
                    <span className="font-medium text-green-600">{month.resolved}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Rate: </span>
                    <span className="font-medium text-purple-600">
                      {Math.round((month.resolved / month.feedback) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Export Reports</h3>
        </div>
        <div className="p-6">
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Export PDF Report
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              Export Excel Data
            </button>
            <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              Schedule Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;