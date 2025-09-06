/**
 * Dashboard Sidebar Component
 * Left navigation sidebar for the citizens dashboard
 */

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Bell
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
      name: 'My Feedback',
      view: 'my-feedback' as DashboardView,
      icon: FileText,
      current: currentView === 'my-feedback'
    },
    {
      name: 'Parliamentary Bills',
      view: 'bills-projects' as DashboardView,
      icon: FileText,
      current: currentView === 'bills-projects' || currentView === 'bill-details'
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
      <div className={`fixed top-14 sm:top-16 bottom-0 left-0 z-40 flex flex-col transition-all duration-300 sidebar-mobile safe-area-padding ${
        isCollapsed ? 'lg:w-16 w-64' : 'w-64'
      } ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`} style={{ backgroundColor: '#0D3C43' }}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-4 border-b border-gray-600">
          <div className={`flex items-center min-w-0 ${isCollapsed ? 'lg:hidden' : ''}`}>
            <img
              src="/logo.png"
              alt="CivicAI Logo"
              className="h-6 sm:h-8 w-auto flex-shrink-0"
              onError={(e) => {
                // Fallback if logo.png doesn't exist
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden h-6 sm:h-8 w-6 sm:w-8 rounded-lg items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E2FCF7' }}>
              <span className="font-bold text-xs sm:text-sm" style={{ color: '#0D3C43' }}>C</span>
            </div>
            <span className="ml-2 sm:ml-3 text-base sm:text-lg font-semibold text-white truncate">CivicAI</span>
          </div>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block p-1.5 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-target"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>

        {/* User Info */}
        <div className={`p-3 sm:p-4 border-b border-gray-600 ${isCollapsed ? 'lg:hidden' : ''}`}>
          <div className="flex items-center">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#E2FCF7' }}>
              <span className="font-medium text-xs sm:text-sm" style={{ color: '#0D3C43' }}>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="ml-2 sm:ml-3 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-300 truncate">{user?.county_name} County</p>
            </div>
            {unreadCount > 0 && (
              <div className="ml-2 flex-shrink-0">
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <Bell className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                  {unreadCount}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 sm:py-4">
          {/* Main Navigation */}
          <div className="px-2 sm:px-3 mb-4 sm:mb-6">
            <h3 className={`px-2 sm:px-3 text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 sm:mb-3 ${isCollapsed ? 'lg:hidden' : ''}`}>
              National Assembly
            </h3>
            <ul className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => handleNavigation(item)}
                      className={`group flex items-center w-full px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium rounded-md transition-colors touch-target ${
                        item.current
                          ? 'text-white border-r-2'
                          : 'text-gray-300 hover:text-white hover:bg-gray-700'
                      }`}
                      style={{
                        backgroundColor: item.current ? '#E2FCF7' : undefined,
                        borderColor: item.current ? '#E2FCF7' : undefined,
                        color: item.current ? '#0D3C43' : undefined,
                      }}
                      aria-current={item.current ? 'page' : undefined}
                    >
                      <Icon className={`flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5`}
                        style={{
                          color: item.current ? '#0D3C43' : undefined
                        }}
                      />
                      <span className={`ml-2 sm:ml-3 truncate ${isCollapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
                      {item.badge && (
                        <span className={`ml-auto inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 ${isCollapsed ? 'lg:hidden' : ''}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>


        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-gray-600 p-2 sm:p-3">
          <ul className="space-y-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <button
                    onClick={() => handleNavigation(item)}
                    className="group flex items-center w-full px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-300 rounded-md hover:text-white hover:bg-gray-700 transition-colors touch-target"
                  >
                    <Icon className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-gray-200" />
                    <span className={`ml-2 sm:ml-3 truncate ${isCollapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
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
