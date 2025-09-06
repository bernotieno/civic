/**
 * Citizens Dashboard Component
 * Main dashboard for citizen users with comprehensive feedback management
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { CitizenDashboardData, DashboardView } from '../../types';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import DashboardHeader from './DashboardHeader';
import DashboardSidebar from './DashboardSidebar';
import WelcomeSection from './WelcomeSection';
import RecentFeedbackStatus from './RecentFeedbackStatus';
import QuickActionsPanel from './QuickActionsPanel';
// Import feedback components
import FeedbackForm from '../feedback/FeedbackForm';
import FeedbackSuccess from '../feedback/FeedbackSuccess';
import FeedbackError from '../feedback/FeedbackError';
import FeedbackTracker from '../feedback/FeedbackTracker';
import FeedbackHistory from '../feedback/FeedbackHistory';
import Bills from './Bills';
import BillDetailsView from './BillDetailsView';
import UserProfile from './UserProfile';



interface SubmissionData {
  feedback_id: string;
  tracking_id: string;
  status: string;
  submitted_at: string;
  location_path: string;
}

const CitizensDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Dashboard view state
  const [currentView, setCurrentView] = useState<DashboardView>('home');
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorType, setErrorType] = useState<'validation' | 'rate_limit' | 'auth' | 'network' | 'server' | 'permission'>('server');

  const [dashboardData, setDashboardData] = useState<CitizenDashboardData>({
    stats: {
      totalFeedback: 0,
      pendingResponses: 0,
      resolvedIssues: 0,
      averageResponseTime: 0,
    },
    recentFeedback: [],
    loading: true,
  });

  // Handle URL parameters for view navigation
  useEffect(() => {
    const viewParam = searchParams.get('view');
    const billIdParam = searchParams.get('billId');
    if (viewParam && ['home', 'submit-feedback', 'my-feedback', 'track-feedback', 'bills-projects', 'bill-details'].includes(viewParam)) {
      setCurrentView(viewParam as DashboardView);
      if (viewParam === 'bill-details' && billIdParam) {
        setSelectedBillId(billIdParam);
      }
    }
  }, [searchParams]);

  // Real-time updates for dashboard refresh
  const { lastUpdate } = useRealTimeUpdates({
    pollingInterval: 60000, // 1 minute for dashboard data
    enabled: true
  });

  // Feedback handling functions
  const handleSubmissionSuccess = (trackingId: string, data: SubmissionData) => {
    setSubmissionData(data);
    setCurrentView('feedback-success');
    // Refresh dashboard data to show updated stats
    fetchDashboardData();
  };

  const handleSubmissionError = (error: string) => {
    setErrorMessage(error);

    // Determine error type based on error message
    if (error.toLowerCase().includes('validation') || error.toLowerCase().includes('required')) {
      setErrorType('validation');
    } else if (error.toLowerCase().includes('rate limit') || error.toLowerCase().includes('exceeded')) {
      setErrorType('rate_limit');
    } else if (error.toLowerCase().includes('authentication') || error.toLowerCase().includes('login')) {
      setErrorType('auth');
    } else if (error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')) {
      setErrorType('network');
    } else if (error.toLowerCase().includes('permission') || error.toLowerCase().includes('access')) {
      setErrorType('permission');
    } else {
      setErrorType('server');
    }

    setCurrentView('feedback-error');
  };

  const handleViewChange = (view: DashboardView, billId?: string) => {
    setCurrentView(view);
    if (view === 'bill-details' && billId) {
      setSelectedBillId(billId);
      setSearchParams({ view, billId });
    } else {
      setSearchParams({ view });
      setSelectedBillId(null);
    }
    // Clear any previous error/success state when changing views
    if (view !== 'feedback-success') setSubmissionData(null);
    if (view !== 'feedback-error') setErrorMessage('');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSearchParams({});
    setSubmissionData(null);
    setErrorMessage('');
    setSelectedBillId(null);
  };

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
            status: 'in_review',
            tracking_id: 'FB-2024-001',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z',
            category: 'infrastructure',
            category_display: 'Infrastructure',
            priority: 'high',
            priority_display: 'High',
            status_display: 'In Review',
            response_count: 0,
            view_count: 5,
            location_path: 'Nairobi > Central > CBD',
            can_edit: true,
            can_delete: false,
            is_anonymous: false,
          },
          {
            id: '2',
            title: 'Water shortage in Kibera area',
            status: 'pending',
            tracking_id: 'FB-2024-002',
            created_at: '2024-01-14T14:20:00Z',
            updated_at: '2024-01-14T14:20:00Z',
            category: 'water_sanitation',
            category_display: 'Water & Sanitation',
            priority: 'urgent',
            priority_display: 'Urgent',
            status_display: 'Pending',
            response_count: 0,
            view_count: 3,
            location_path: 'Nairobi > Kibra > Kibera',
            can_edit: true,
            can_delete: true,
            is_anonymous: true,
          },
          {
            id: '3',
            title: 'Healthcare facility needs equipment',
            status: 'resolved',
            tracking_id: 'FB-2024-003',
            created_at: '2024-01-10T09:15:00Z',
            updated_at: '2024-01-12T16:45:00Z',
            category: 'healthcare',
            category_display: 'Healthcare',
            priority: 'medium',
            priority_display: 'Medium',
            status_display: 'Resolved',
            response_count: 2,
            last_response_at: '2024-01-12T16:45:00Z',
            view_count: 12,
            location_path: 'Nairobi > Westlands > Parklands',
            can_edit: false,
            can_delete: false,
            is_anonymous: false,
          },
        ],
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center safe-area-padding">
        <div className="text-center space-mobile">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 prevent-horizontal-scroll safe-area-padding">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-30">
        <DashboardHeader
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onViewChange={handleViewChange}
        />
      </div>

      <div className="flex pt-14 sm:pt-16">
        {/* Fixed Left Sidebar */}
        <DashboardSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={() => setIsMobileMenuOpen(false)}
          currentView={currentView}
          onViewChange={handleViewChange}
          onCollapseChange={setIsSidebarCollapsed}
        />

        {/* Main Content */}
        <div className={`flex-1 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        } safe-area-padding`}>
          <div className="p-4 sm:p-6 container-mobile">
            {/* Render different views based on currentView */}
            {currentView === 'home' && (
              <div className="space-y-6">
                <WelcomeSection user={user} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <RecentFeedbackStatus recentFeedback={dashboardData.recentFeedback} />
                  <QuickActionsPanel onViewChange={handleViewChange} />
                </div>
              </div>
            )}

            {currentView === 'submit-feedback' && (
              <FeedbackForm
                user={user}
                onSuccess={handleSubmissionSuccess}
                onError={handleSubmissionError}
                onCancel={handleBackToHome}
                allowAnonymous={true}
              />
            )}

            {currentView === 'my-feedback' && (
              <FeedbackHistory onBack={handleBackToHome} />
            )}

            {currentView === 'track-feedback' && (
              <FeedbackTracker onBack={handleBackToHome} />
            )}

            {currentView === 'bills-projects' && (
              <Bills 
                onFeedbackClick={(billId) => {
                  // Navigate to feedback form with pre-selected bill
                  handleViewChange('submit-feedback');
                  // TODO: Pass billId to feedback form
                }}
                onBillExplore={(billId) => {
                  handleViewChange('bill-details', billId);
                }}
              />
            )}

            {currentView === 'bill-details' && selectedBillId && (
              <BillDetailsView 
                billId={selectedBillId}
                onBack={() => handleViewChange('bills-projects')}
              />
            )}



            {currentView === 'profile' && (
              <UserProfile onBack={handleBackToHome} />
            )}

            {currentView === 'feedback-success' && submissionData && (
              <FeedbackSuccess
                submissionData={submissionData}
                onBackToDashboard={handleBackToHome}
                onSubmitAnother={() => handleViewChange('submit-feedback')}
              />
            )}

            {currentView === 'feedback-error' && (
              <FeedbackError
                error={errorMessage}
                errorType={errorType}
                onRetry={() => handleViewChange('submit-feedback')}
                onBackToDashboard={handleBackToHome}
              />
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default CitizensDashboard;