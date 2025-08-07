import React, { useState } from 'react';
import { BarChart3, TrendingUp, MapPin, Calendar } from 'lucide-react';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const TransparencyPortal: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');

  const stats = {
    totalSubmissions: 15247,
    resolvedIssues: 12891,
    averageResponseTime: '18 hours',
    satisfactionRate: 92,
    topCategories: [
      { name: 'Infrastructure', count: 3421, percentage: 22.4 },
      { name: 'Transportation', count: 2893, percentage: 19.0 },
      { name: 'Utilities', count: 2156, percentage: 14.1 },
      { name: 'Environment', count: 1847, percentage: 12.1 },
      { name: 'Public Safety', count: 1632, percentage: 10.7 }
    ],
    monthlyTrends: [
      { month: 'Jan', submissions: 1247, resolved: 1156 },
      { month: 'Feb', submissions: 1389, resolved: 1298 },
      { month: 'Mar', submissions: 1456, resolved: 1367 },
      { month: 'Apr', submissions: 1523, resolved: 1445 },
      { month: 'May', submissions: 1398, resolved: 1325 },
      { month: 'Jun', submissions: 1467, resolved: 1389 }
    ]
  };

  const regionalData = [
    { state: 'California', submissions: 2456, resolved: 2234, rate: 91 },
    { state: 'Texas', submissions: 2123, resolved: 1945, rate: 92 },
    { state: 'Florida', submissions: 1876, resolved: 1698, rate: 91 },
    { state: 'New York', submissions: 1654, resolved: 1521, rate: 92 },
    { state: 'Illinois', submissions: 1432, resolved: 1305, rate: 91 }
  ];

  return (
    <div className="min-h-screen py-12 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Transparency Portal
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Open data about government responsiveness to citizen feedback. 
            Track our performance and see how your community's voice makes a difference.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card hover className="text-center">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {stats.totalSubmissions.toLocaleString()}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-2">
              Total Feedback Submitted
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12% this month
            </div>
          </Card>

          <Card hover className="text-center">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {stats.resolvedIssues.toLocaleString()}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-2">
              Issues Resolved
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              {Math.round((stats.resolvedIssues / stats.totalSubmissions) * 100)}% resolution rate
            </div>
          </Card>

          <Card hover className="text-center">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {stats.averageResponseTime}
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-2">
              Average Response Time
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Improved 23%
            </div>
          </Card>

          <Card hover className="text-center">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
              {stats.satisfactionRate}%
            </div>
            <div className="text-gray-600 dark:text-gray-400 mb-2">
              Citizen Satisfaction
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              +5% vs last quarter
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Top Categories */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Top Feedback Categories
              </h2>
              <div className="flex space-x-1">
                {['week', 'month', 'quarter'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedTimeframe(period)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedTimeframe === period
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {stats.topCategories.map((category, index) => (
                <div key={category.name} className="flex items-center">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {category.count.toLocaleString()} ({category.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-blue-600' :
                          index === 1 ? 'bg-green-600' :
                          index === 2 ? 'bg-yellow-600' :
                          index === 3 ? 'bg-purple-600' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Regional Performance */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Regional Performance
              </h2>
              <Button variant="outline" size="sm">
                View Map
              </Button>
            </div>

            <div className="space-y-3">
              {regionalData.map((region) => (
                <div
                  key={region.state}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {region.state}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {region.rate}% resolved
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {region.submissions.toLocaleString()} submissions • {region.resolved.toLocaleString()} resolved
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Monthly Trends Chart */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Monthly Trends
            </h2>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Submissions</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
                <span className="text-gray-600 dark:text-gray-400">Resolved</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between space-x-2">
            {stats.monthlyTrends.map((data) => {
              const maxValue = Math.max(...stats.monthlyTrends.map(d => d.submissions));
              const submissionHeight = (data.submissions / maxValue) * 200;
              const resolvedHeight = (data.resolved / maxValue) * 200;

              return (
                <div key={data.month} className="flex-1 flex flex-col items-center">
                  <div className="flex items-end space-x-1 mb-2">
                    <div
                      className="bg-blue-600 rounded-t"
                      style={{ height: `${submissionHeight}px`, width: '20px' }}
                    ></div>
                    <div
                      className="bg-green-600 rounded-t"
                      style={{ height: `${resolvedHeight}px`, width: '20px' }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {data.month}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Your Voice Drives Change
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Every piece of feedback helps us improve government services. 
              Join thousands of citizens who are making a difference in their communities.
            </p>
            <Button size="lg" className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              Submit Your Feedback
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TransparencyPortal;