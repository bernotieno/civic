/**
 * Transparency Section Component
 * Links to transparency portal, response metrics, and user impact
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Clock, 
  Target, 
  ExternalLink,
  BarChart3,
  Award,
  TrendingUp,
  Users
} from 'lucide-react';

const TransparencySection: React.FC = () => {
  const navigate = useNavigate();

  const transparencyMetrics = [
    {
      label: 'Avg Response Time',
      value: '2.5 days',
      change: '-15%',
      changeType: 'improvement' as const,
      icon: Clock
    },
    {
      label: 'Resolution Rate',
      value: '87%',
      change: '+12%',
      changeType: 'improvement' as const,
      icon: Target
    },
    {
      label: 'Transparency Score',
      value: '94/100',
      change: '+3',
      changeType: 'improvement' as const,
      icon: Eye
    }
  ];

  const userImpactStats = [
    {
      title: 'Your Feedback Impact',
      description: 'Issues you helped identify that led to government action',
      count: 5,
      icon: Award,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Community Influence',
      description: 'Citizens who supported your feedback submissions',
      count: 23,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Transparency Portal Link */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Eye className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Transparency</h3>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/transparency-portal')}
            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 text-left hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Public Transparency Portal</h4>
                <p className="text-sm text-gray-600">
                  View all public feedback, government responses, and performance metrics
                </p>
              </div>
              <ExternalLink className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button
            onClick={() => navigate('/government-performance')}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-100 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Government Performance</h4>
                <p className="text-sm text-gray-600">
                  Detailed analytics on response times and resolution rates
                </p>
              </div>
              <BarChart3 className="h-5 w-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* Government Response Metrics */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Metrics</h3>
        
        <div className="space-y-4">
          {transparencyMetrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Icon className="h-4 w-4 text-gray-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{metric.label}</p>
                    <p className="text-xs text-gray-600">County average</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{metric.value}</p>
                  <p className={`text-xs ${
                    metric.changeType === 'improvement' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.change}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
            <p className="text-sm text-green-700">
              <strong>Improving:</strong> Government response times are 15% faster than last quarter
            </p>
          </div>
        </div>
      </div>

      {/* Your Impact Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Impact</h3>
        
        <div className="space-y-4">
          {userImpactStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className={`${stat.bgColor} rounded-lg p-4 border border-gray-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Icon className={`h-5 w-5 ${stat.color} mr-3`} />
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">{stat.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <h4 className="font-medium text-gray-900 mb-2">Recent Impact</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-700">Your road maintenance report led to repairs on Uhuru Highway</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-700">Water shortage feedback resulted in new pump installation</span>
            </div>
          </div>
          <button className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium">
            View all your impact stories →
          </button>
        </div>
      </div>

      {/* Accountability Features */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Accountability Tools</h3>
        
        <div className="space-y-3">
          <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">📊 Department Performance Rankings</span>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </div>
          </button>
          
          <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">📈 Budget Allocation Tracking</span>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </div>
          </button>
          
          <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">🗳️ Official Response Quality Ratings</span>
              <ExternalLink className="h-4 w-4 text-gray-400" />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransparencySection;
