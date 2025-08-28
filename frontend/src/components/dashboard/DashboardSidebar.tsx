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
  Search,
  Construction,
  Users,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bell,
  UserX
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { DashboardView } from '../../types';


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
      current: currentView === 'my-feedback'
    },
    {
      name: 'Track Feedback',
      view: 'track-feedback' as DashboardView,
      icon: Search,
      current: currentView === 'track-feedback'
    },
    {
      name: 'Parliamentary Bills',
      view: 'bills-projects' as DashboardView,
      icon: FileText,
      current: currentView === 'bills-projects'
    },
    {
      name: 'Community Impact',
      view: 'community-impact' as DashboardView,
      icon: Users,
      current: currentView === 'community-impact'
    }
  ];



  const anonymousNavItems = [
    {
      name: 'Anonymous Feedback',
      href: '/anonymous-feedback',
      icon: UserX,
      description: 'Submit without revealing identity'
    }
  ];

  const bottomNavItems = [
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
                National Assembly
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

          {/* Anonymous Section */}
          <div className="px-3 mb-6">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Privacy Options
              </h3>
            )}
            <ul className="space-y-1">
              {anonymousNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => handleNavigation(item)}
                      className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <Icon className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                      {!isCollapsed && (
                        <div className="ml-3 min-w-0 flex-1">
                          <span className="truncate">{item.name}</span>
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
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
