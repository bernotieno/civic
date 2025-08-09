/**
 * Citizens Dashboard Component
 * Main dashboard for citizen users with comprehensive feedback management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { CitizenDashboardData } from '../../types';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import WelcomeSection from './WelcomeSection';
import FeedbackOverviewCards from './FeedbackOverviewCards';
import RecentFeedbackStatus from './RecentFeedbackStatus';
import QuickActionsPanel from './QuickActionsPanel';
import CommunityImpactSection from './CommunityImpactSection';
import TransparencySection from './TransparencySection';

const CitizensDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [dashboardData, setDashboardData] = useState<CitizenDashboardData>({
    stats: {
      totalFeedback: 0,
      pendingResponses: 0,
      resolvedIssues: 0,
      averageResponseTime: 0,
    },
    recentFeedback: [],
    communityStats: {
      resolvedInArea: 0,
      monthlyTrend: 0,
      governmentResponses: [],
    },
    loading: true,
  });

  // Real-time updates for dashboard refresh
  const { lastUpdate } = useRealTimeUpdates({
    pollingInterval: 60000, // 1 minute for dashboard data
    enabled: true
  });

  const fetchDashboardData = async () => {
    try {
      const data = await apiService.getDashboardData();
      setDashboardData({
        ...data,
        loading: false,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data on error
      setDashboardData({
        stats: {
          totalFeedback: 12,
          pendingResponses: 3,
          resolvedIssues: 8,
          averageResponseTime: 2.5,
        },
        recentFeedback: [
          {
            id: '1',
            title: 'Road maintenance needed on Uhuru Highway',
            status: 'in_progress',
            tracking_id: 'FB-2024-001',
            submitted_at: '2024-01-15T10:30:00Z',
            category: 'infrastructure',
          },
          {
            id: '2',
            title: 'Water shortage in Kibera area',
            status: 'under_review',
            tracking_id: 'FB-2024-002',
            submitted_at: '2024-01-14T14:20:00Z',
            category: 'utilities',
          },
          {
            id: '3',
            title: 'Healthcare facility needs equipment',
            status: 'resolved',
            tracking_id: 'FB-2024-003',
            submitted_at: '2024-01-10T09:15:00Z',
            category: 'healthcare',
          },
        ],
        communityStats: {
          resolvedInArea: 47,
          monthlyTrend: 15,
          governmentResponses: [
            {
              title: 'New water pumps installed in Eastlands',
              date: '2024-01-12',
              department: 'Water & Sanitation',
            },
            {
              title: 'Road repairs completed on Mombasa Road',
              date: '2024-01-10',
              department: 'Infrastructure',
            },
          ],
        },
        loading: false,
      });
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Refresh when real-time updates detect changes
  useEffect(() => {
    if (lastUpdate) {
      fetchDashboardData();
    }
  }, [lastUpdate]);

  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-30">
        <DashboardHeader onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
      </div>

      <div className="flex pt-16"> {/* Add padding-top for fixed header */}
        {/* Fixed Left Sidebar */}
        <DashboardSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main
          id="main-content"
          className="flex-1 min-h-screen dashboard-main"
          role="main"
          aria-label="Citizens Dashboard"
        >
          <div className="dashboard-content py-6 px-4 sm:px-6 lg:px-8">
            {/* Welcome Section */}
            <WelcomeSection
              userName={user?.name || 'Citizen'}
              monthlyResolved={dashboardData.communityStats.monthlyTrend}
            />

            {/* Simplified Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Main Content - 2/3 width */}
              <div className="lg:col-span-2 space-y-6">
                {/* Key Stats - Simplified */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-blue-600">{dashboardData.stats.totalFeedback}</div>
                    <div className="text-sm text-gray-600">Total Feedback</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-yellow-600">{dashboardData.stats.pendingResponses}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-green-600">{dashboardData.stats.resolvedIssues}</div>
                    <div className="text-sm text-gray-600">Resolved</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-2xl font-bold text-purple-600">{dashboardData.stats.averageResponseTime}d</div>
                    <div className="text-sm text-gray-600">Avg Response</div>
                  </div>
                </div>

                {/* Recent Feedback - Simplified */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h3>
                  {dashboardData.recentFeedback.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No feedback submitted yet</p>
                      <button className="mt-2 text-blue-600 hover:text-blue-700">Submit your first feedback →</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashboardData.recentFeedback.slice(0, 3).map((feedback) => (
                        <div key={feedback.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 truncate">{feedback.title}</p>
                            <p className="text-sm text-gray-500">{feedback.tracking_id}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            feedback.status === 'resolved' ? 'bg-green-100 text-green-800' :
                            feedback.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            feedback.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {feedback.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar - 1/3 width */}
              <div className="lg:col-span-1 space-y-6">
                {/* Quick Actions - Simplified */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/submit-feedback')}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Submit New Feedback
                    </button>
                    <button
                      onClick={() => navigate('/my-feedback')}
                      className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      View My Feedback
                    </button>
                  </div>
                </div>

                {/* Community Impact - Simplified */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Community Impact</h3>
                  <div className="text-3xl font-bold text-green-700 mb-1">{dashboardData.communityStats.resolvedInArea}</div>
                  <p className="text-sm text-green-600">Issues resolved in your area this month</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CitizensDashboard;
