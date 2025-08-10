/**
 * Dashboard Sidebar Component
 * Left navigation sidebar for the citizens dashboard
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home,
  MessageSquare,
  FileText,
  BarChart3,
  Search,
  UserX,
  AlertTriangle,
  Construction,
  Heart,
  GraduationCap,
  Shield,
  Leaf,
  Zap,
  Eye,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bell
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import FeedbackCategoriesGrid from './FeedbackCategoriesGrid';

type DashboardView = 'home' | 'submit-feedback' | 'my-feedback' | 'track-feedback' | 'county-projects';

interface DashboardSidebarProps {
  isMobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
  currentView?: DashboardView;
  onViewChange?: (view: DashboardView) => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  isMobileMenuOpen = false,
  onMobileMenuClose,
  currentView = 'home',
  onViewChange
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Real-time updates for notification count
  const { unreadCount } = useRealTimeUpdates({
    pollingInterval: 30000,
    enabled: true
  });

  const mainNavItems = [
    {
      name: 'Dashboard',
      view: 'home' as DashboardView,
      icon: Home,
      current: currentView === 'home'
    },
    {
      name: 'Submit Feedback',
      view: 'submit-feedback' as DashboardView,
      icon: MessageSquare,
      current: currentView === 'submit-feedback'
    },
    {
      name: 'My Feedback',
      view: 'my-feedback' as DashboardView,
      icon: FileText,
      current: currentView === 'my-feedback',
      badge: '3' // Example pending count
    },
    {
      name: 'Track Feedback',
      view: 'track-feedback' as DashboardView,
      icon: Search,
      current: currentView === 'track-feedback'
    },
    {
      name: 'County Projects',
      view: 'county-projects' as DashboardView,
      icon: Construction,
      current: currentView === 'county-projects'
    },
    {
      name: 'Public Updates',
      href: '/public-updates',
      icon: BarChart3,
      current: location.pathname === '/public-updates'
    }
  ];

  const quickActions = [
    {
      name: 'Anonymous Feedback',
      href: '/anonymous-feedback',
      icon: UserX,
      color: 'text-gray-600'
    },
    {
      name: 'Emergency Report',
      href: '/emergency-report',
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ];

  const categories = [
    { name: 'Infrastructure', icon: Construction, href: '/submit-feedback?category=infrastructure' },
    { name: 'Healthcare', icon: Heart, href: '/submit-feedback?category=healthcare' },
    { name: 'Education', icon: GraduationCap, href: '/submit-feedback?category=education' },
    { name: 'Public Safety', icon: Shield, href: '/submit-feedback?category=safety' },
    { name: 'Environment', icon: Leaf, href: '/submit-feedback?category=environment' },
    { name: 'Utilities', icon: Zap, href: '/submit-feedback?category=utilities' }
  ];

  const bottomNavItems = [
    {
      name: 'Transparency Portal',
      href: '/transparency',
      icon: Eye
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings
    },
    {
      name: 'Help & Support',
      href: '/help',
      icon: HelpCircle
    }
  ];

  const handleNavigation = (item: any) => {
    if (item.view && onViewChange) {
      // Handle dashboard view changes
      onViewChange(item.view);
    } else if (item.href) {
      // Handle external navigation
      navigate(item.href);
    }

    // Close mobile menu after navigation
    if (onMobileMenuClose) {
      onMobileMenuClose();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-gray-600 bg-opacity-75"
          aria-hidden="true"
          onClick={onMobileMenuClose}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed top-16 bottom-0 left-0 z-40 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CA</span>
              </div>
              <span className="ml-3 text-lg font-semibold text-gray-900">CivicAI</span>
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* User Info */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.county_name} County</p>
              </div>
              {unreadCount > 0 && (
                <div className="ml-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <Bell className="h-3 w-3 mr-1" />
                    {unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* Main Navigation */}
          <div className="px-3 mb-6">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Main Menu
              </h3>
            )}
            <ul className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => handleNavigation(item)}
                      className={`group flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        item.current
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      <Icon className={`flex-shrink-0 h-5 w-5 ${
                        item.current ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`} />
                      {!isCollapsed && (
                        <>
                          <span className="ml-3 truncate">{item.name}</span>
                          {item.badge && (
                            <span className="ml-auto inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Quick Actions */}
          <div className="px-3 mb-6">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
            )}
            <ul className="space-y-1">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => navigate(item.href)}
                      className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <Icon className={`flex-shrink-0 h-5 w-5 ${item.color} group-hover:text-gray-500`} />
                      {!isCollapsed && <span className="ml-3 truncate">{item.name}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Top Categories - Only show when expanded */}
          {!isCollapsed && (
            <div className="px-3 mb-6">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Popular Categories
              </h3>
              <div className="space-y-1">
                {categories.slice(0, 4).map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.name}
                      onClick={() => onViewChange && onViewChange('submit-feedback')}
                      className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                      title={`Submit feedback about ${category.name.toLowerCase()}`}
                    >
                      <Icon className={`flex-shrink-0 h-4 w-4 ${category.color} group-hover:text-gray-500 mr-3`} />
                      <span className="truncate">{category.name}</span>
                    </button>
                  );
                })}
                <button
                  onClick={() => onViewChange && onViewChange('submit-feedback')}
                  className="group flex items-center w-full px-3 py-2 text-sm font-medium text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                >
                  <span className="text-xs">View all categories →</span>
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-200 p-3">
          <ul className="space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <button
                    onClick={() => handleNavigation(item.href)}
                    className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    <Icon className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    {!isCollapsed && <span className="ml-3 truncate">{item.name}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;
