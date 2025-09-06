/**
 * Dashboard Header Component
 * Header with navigation, user profile, and notifications for citizens dashboard
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  MessageSquare,
  Clock,
  CheckCircle,
  Search,
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import {
  handleEnterKeyPress,
  getAccessibleButtonProps,
  announceToScreenReader
} from '../../utils/accessibility';

interface DashboardHeaderProps {
  onMobileMenuToggle?: () => void;
  onViewChange?: (view: string) => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMobileMenuToggle, onViewChange }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  // Refs for accessibility
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  // Real-time updates
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isPolling
  } = useRealTimeUpdates({
    pollingInterval: 30000, // 30 seconds
    enabled: true
  });

  const handleLogout = async () => {
    try {
      announceToScreenReader('Signing out...', 'polite');
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      announceToScreenReader('Sign out failed, redirecting to home page', 'assertive');
      navigate('/', { replace: true });
    }
  };

  // Handle keyboard navigation for dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProfileDropdownOpen(false);
        setIsNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Announce notification updates
  useEffect(() => {
    if (unreadCount > 0) {
      announceToScreenReader(`You have ${unreadCount} new notification${unreadCount > 1 ? 's' : ''}`, 'polite');
    }
  }, [unreadCount]);

  return (
    <header className="shadow-sm border-b border-gray-200 relative z-50" style={{ backgroundColor: '#E2FCF7' }} role="banner">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Mobile menu button, Logo and Page Title */}
          <div className="flex items-center min-w-0 flex-1">
            <button
              onClick={onMobileMenuToggle}
              className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 mr-3 flex-shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3 min-w-0">
              <div className="flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="CivicAI Logo"
                  className="h-8 w-auto"
                  onError={(e) => {
                    // Fallback if logo.png doesn't exist
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: '#0D3C43' }}>
                  <span className="text-white font-bold text-sm">C</span>
                </div>
              </div>
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Citizens Dashboard</h1>
            </div>
          </div>

          {/* Search Bar - Optional */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search feedback, track by ID..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Notifications */}
            <div className="relative">
              <button
                ref={notificationButtonRef}
                onClick={() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen)}
                onKeyDown={handleEnterKeyPress(() => setIsNotificationDropdownOpen(!isNotificationDropdownOpen))}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
                aria-expanded={isNotificationDropdownOpen}
                aria-haspopup="true"
                {...getAccessibleButtonProps(undefined, isNotificationDropdownOpen, 'notifications-dropdown')}
              >
                <Bell
                  className={`h-5 w-5 ${isPolling ? 'animate-pulse' : ''}`}
                  aria-hidden="true"
                />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    <span aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotificationDropdownOpen && (
                <div
                  id="notifications-dropdown"
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 max-h-96 overflow-y-auto"
                  role="menu"
                  aria-labelledby="notifications-button"
                  aria-orientation="vertical"
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3
                      className="text-sm font-medium text-gray-900"
                      id="notifications-heading"
                    >
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        onKeyDown={handleEnterKeyPress(markAllAsRead)}
                        className="text-xs text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                        aria-label="Mark all notifications as read"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                      <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No notifications yet</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.slice(0, 10).map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => {
                            markAsRead(notification.id);
                            navigate(`/feedback/${notification.feedbackId}`);
                            setIsNotificationDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                            !notification.read ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {notification.type === 'status_change' && (
                                <Clock className="h-4 w-4 text-blue-500" />
                              )}
                              {notification.type === 'resolution' && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                              {notification.type === 'new_response' && (
                                <MessageSquare className="h-4 w-4 text-purple-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="h-8 w-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden sm:block text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.county_name}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{user?.county_name} County</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      if (onViewChange) {
                        onViewChange('profile');
                      }
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <User className="h-4 w-4 mr-3" />
                    View Profile
                  </button>
                  
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      // TODO: Navigate to settings
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </button>
                  
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>


          </div>
        </div>


      </div>

      {/* Click outside to close dropdowns */}
      {(isProfileDropdownOpen || isNotificationDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileDropdownOpen(false);
            setIsNotificationDropdownOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default DashboardHeader;
