/**
 * Community Impact Section Component
 * Shows community-wide feedback impact and government responses
 */

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Calendar,
  MapPin,
  ArrowRight,
  Award,
  Activity
} from 'lucide-react';

interface CommunityStats {
  resolvedInArea: number;
  monthlyTrend: number;
  governmentResponses: Array<{
    title: string;
    date: string;
    department: string;
  }>;
}

interface CommunityImpactSectionProps {
  stats: CommunityStats;
}

const CommunityImpactSection: React.FC<CommunityImpactSectionProps> = ({ stats }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-5 w-5 text-green-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Community Impact</h2>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View full report →
        </button>
      </div>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Issues Resolved in Area */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="text-right">
              <p className="text-3xl font-bold text-green-700">{stats.resolvedInArea}</p>
              <p className="text-sm text-green-600">This month</p>
            </div>
          </div>
          <h3 className="font-semibold text-green-800 mb-1">Issues Resolved</h3>
          <p className="text-sm text-green-700">In your area this month</p>
        </div>

        {/* Monthly Trend */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-700">+{stats.monthlyTrend}%</p>
              <p className="text-sm text-blue-600">vs last month</p>
            </div>
          </div>
          <h3 className="font-semibold text-blue-800 mb-1">Resolution Rate</h3>
          <p className="text-sm text-blue-700">Improvement trend</p>
        </div>

        {/* Community Engagement */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <Activity className="h-8 w-8 text-purple-600" />
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-700">1.2K</p>
              <p className="text-sm text-purple-600">Active citizens</p>
            </div>
          </div>
          <h3 className="font-semibold text-purple-800 mb-1">Community Voice</h3>
          <p className="text-sm text-purple-700">Citizens engaged this month</p>
        </div>
      </div>

      {/* Recent Government Responses */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="h-5 w-5 text-yellow-500 mr-2" />
          Recent Government Actions
        </h3>
        
        <div className="space-y-3">
          {stats.governmentResponses.map((response, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {response.title}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(response.date)}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {response.department}
                  </div>
                </div>
              </div>
              <button className="flex-shrink-0 text-blue-600 hover:text-blue-700">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Success Stories Teaser */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Success Stories</h4>
            <p className="text-sm text-gray-600 mb-3">
              See how citizen feedback is creating real change in your community
            </p>
            <div className="flex items-center text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span>3 new success stories this week</span>
            </div>
          </div>
          <button className="bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium border border-gray-200">
            Read Stories
          </button>
        </div>
      </div>

      {/* Community Feedback Trends Chart Placeholder */}
      <div className="mt-6 p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Community Feedback Trends</h4>
          <p className="text-sm text-gray-600 mb-4">
            Interactive chart showing feedback trends and resolution patterns in your area
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            View Interactive Chart
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityImpactSection;
