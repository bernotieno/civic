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
  communityStats: CommunityStats;
}

const CommunityImpactSection: React.FC<CommunityImpactSectionProps> = ({ communityStats }) => {
  // Add null check for communityStats
  if (!communityStats) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Ensure all required properties exist with defaults
  const safeStats = {
    resolvedInArea: communityStats.resolvedInArea || 0,
    monthlyTrend: communityStats.monthlyTrend || 0,
    governmentResponses: communityStats.governmentResponses || []
  };
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Users className="h-4 w-4 text-green-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Community Impact</h2>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all →
        </button>
      </div>

      {/* Impact Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Issues Resolved in Area */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 border border-green-200">
          <div className="text-center">
            <p className="text-xl font-bold text-green-700">{safeStats.resolvedInArea}</p>
            <p className="text-xs text-green-600">Resolved</p>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
          <div className="text-center">
            <p className="text-xl font-bold text-blue-700">+{safeStats.monthlyTrend}%</p>
            <p className="text-xs text-blue-600">Growth</p>
          </div>
        </div>

        {/* Community Engagement */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
          <div className="text-center">
            <p className="text-xl font-bold text-purple-700">1.2K</p>
            <p className="text-xs text-purple-600">Citizens</p>
          </div>
        </div>
      </div>

      {/* Recent Government Responses */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
          <Award className="h-4 w-4 text-yellow-500 mr-2" />
          Recent Actions
        </h3>
        
        <div className="space-y-2">
          {safeStats.governmentResponses.slice(0, 2).map((response, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-3 w-3 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {response.title}
                </p>
                <p className="text-xs text-gray-500">{response.department}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityImpactSection;
