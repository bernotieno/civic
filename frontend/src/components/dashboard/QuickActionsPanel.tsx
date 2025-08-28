/**
 * Quick Actions Panel Component
 * Sidebar panel with primary actions for citizens
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Search, 
  UserX, 
  AlertTriangle,
  ArrowRight,
  Zap
} from 'lucide-react';

interface QuickActionsPanelProps {
  onViewChange?: (view: string) => void;
}

const QuickActionsPanel: React.FC<QuickActionsPanelProps> = ({ onViewChange }) => {
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState('');

  const handleTrackFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      if (onViewChange) {
        onViewChange('track-feedback');
      } else {
        navigate(`/track/${trackingId.trim().toUpperCase()}`);
      }
    }
  };

  const quickActions = [
    {
      title: 'Engage with Parliament',
      description: 'Share your views on parliamentary bills',
      icon: MessageSquare,
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
      action: () => onViewChange ? onViewChange('submit-feedback') : navigate('/submit-feedback'),
      isPrimary: true
    },
    {
      title: 'Anonymous Participation',
      description: 'Participate in public consultation anonymously',
      icon: UserX,
      color: 'bg-gray-100 hover:bg-gray-200 border border-gray-300',
      textColor: 'text-gray-700',
      action: () => navigate('/anonymous-feedback'),
      isPrimary: false
    },
    {
      title: 'Urgent National Issue',
      description: 'Report urgent national matters to Parliament',
      icon: AlertTriangle,
      color: 'bg-red-100 hover:bg-red-200 border border-red-300',
      textColor: 'text-red-700',
      action: () => navigate('/emergency-report'),
      isPrimary: false
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Zap className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </div>

      {/* Primary Actions */}
      <div className="space-y-3 mb-6">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`w-full ${action.color} ${action.textColor} p-4 rounded-lg transition-all duration-200 group text-left`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <action.icon className="h-5 w-5 mr-3" />
                <div>
                  <p className="font-medium">{action.title}</p>
                  <p className={`text-sm ${action.isPrimary ? 'text-blue-100' : 'text-gray-500'} mt-1`}>
                    {action.description}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      {/* Track Feedback Section */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Track Participation Status</h4>
        <form onSubmit={handleTrackFeedback} className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter tracking ID (e.g., FB-2024-001)"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!trackingId.trim()}
            className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors text-sm font-medium"
          >
            Track Status
          </button>
        </form>
        
        <p className="text-xs text-gray-500 mt-2">
          Enter your tracking ID to check the status of your parliamentary engagement
        </p>
      </div>

      {/* Help Section */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Need Help?</h4>
        <div className="space-y-2">
          <button className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors">
            📋 How to engage with Parliament
          </button>
          <button className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors">
            🔍 Understanding bill processes
          </button>
          <button className="w-full text-left text-sm text-gray-600 hover:text-gray-900 py-2 px-3 rounded-md hover:bg-gray-50 transition-colors">
            📞 Contact support
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-blue-600">2.5</p>
            <p className="text-xs text-blue-600">Avg Response Days</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-green-600">87%</p>
            <p className="text-xs text-green-600">Resolution Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPanel;
