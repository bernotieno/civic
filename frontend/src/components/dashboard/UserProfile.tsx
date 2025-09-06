/**
 * User Profile Component
 * Comprehensive profile management for citizens dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Key,
  Bell,
  Download,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface UserProfileProps {
  onBack?: () => void;
}

interface ProfileData {
  id: number;
  name: string;
  email: string;
  county_name: string;
  role: string;
  role_display: string;
  admin_level?: string;
  level_display?: string;
  date_joined: string;
  accessible_counties: Array<{
    id: number;
    name: string;
    code: string;
  }>;
}

interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  feedback_updates: boolean;
  government_responses: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'data'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [editData, setEditData] = useState({ name: '', phone: '' });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [notifications, setNotifications] = useState<NotificationSettings>({
    email_notifications: true,
    sms_notifications: false,
    feedback_updates: true,
    government_responses: true
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUserProfile();
      if (response.success && response.user) {
        setProfileData(response.user);
        setEditData({
          name: response.user.name || '',
          phone: '' // Phone is not currently in the API response
        });
      }
    } catch (err) {
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.updateUserProfile(editData);
      if (response.success) {
        setSuccess('Profile updated successfully');
        setIsEditing(false);
        loadProfileData();
      } else {
        setError(response.message || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const response = await apiService.changePassword(passwordData);
      if (response.success) {
        setSuccess('Password changed successfully');
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        setError(response.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      const response = await apiService.exportUserData();
      if (response.success) {
        // Create download link
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `civicai-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccess('Data exported successfully');
      }
    } catch (err) {
      setError('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Privacy', icon: Download }
  ];

  if (loading && !profileData) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mobile-text-adjust">Profile Settings</h2>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">Manage your account and preferences</p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="self-start sm:self-auto px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-xs sm:text-sm touch-target"
            >
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors touch-target ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 lg:p-6">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-xs sm:text-sm break-words">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-xs sm:text-sm break-words">{error}</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && profileData && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto sm:mx-0">
                <span className="text-white text-lg sm:text-2xl font-bold">
                  {profileData.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mobile-text-adjust">{profileData.name}</h3>
                <p className="text-gray-600 text-sm sm:text-base break-words">{profileData.email}</p>
                <p className="text-xs sm:text-sm text-gray-500">{profileData.county_name} County</p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="self-start sm:self-auto flex items-center px-3 py-2 text-green-600 hover:text-green-700 border border-green-200 rounded-md hover:bg-green-50 transition-colors text-xs sm:text-sm touch-target"
              >
                {isEditing ? <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> : <Edit3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
                {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-base"
                    style={{ fontSize: '16px' }} // Prevents zoom on iOS
                  />
                ) : (
                  <p className="text-gray-900 text-sm sm:text-base break-words">{profileData.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-base"
                    placeholder="Enter phone number"
                    style={{ fontSize: '16px' }} // Prevents zoom on iOS
                  />
                ) : (
                  <p className="text-gray-900 text-sm sm:text-base break-words">{profileData.phone || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 text-sm sm:text-base break-words">{profileData.email}</p>
                <p className="text-xs text-gray-500 mt-1">Contact support to change email</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">County</label>
                <p className="text-gray-900 text-sm sm:text-base">{profileData.county_name}</p>
                <p className="text-xs text-gray-500 mt-1">Contact support to change county</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-gray-900 font-mono text-xs sm:text-sm break-all">{profileData.id}</p>
                <p className="text-xs text-gray-500 mt-1">Your unique account identifier</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <p className="text-gray-900 text-sm sm:text-base">{profileData.role_display}</p>
                {profileData.level_display && (
                  <p className="text-xs text-gray-500 mt-1">Level: {profileData.level_display}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end">
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex items-center px-4 py-2.5 sm:py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors text-sm sm:text-base font-medium touch-target min-h-[44px]"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Account Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Account Role</p>
                    <p className="text-sm text-blue-700">{profileData.role_display}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-900">Member Since</p>
                    <p className="text-sm text-green-700">
                      {new Date(profileData.date_joined).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
              {profileData.accessible_counties && profileData.accessible_counties.length > 0 && (
                <div className="p-4 bg-purple-50 rounded-lg sm:col-span-2">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-purple-600 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">Accessible Counties</p>
                      <p className="text-sm text-purple-700">
                        {profileData.accessible_counties.map(county => county.name).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleChangePassword}
                  disabled={loading || !passwordData.current_password || !passwordData.new_password}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <Key className="h-4 w-4 mr-1" />
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
            <div className="space-y-4">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-sm text-gray-500">
                      {key === 'email_notifications' && 'Receive updates via email'}
                      {key === 'sms_notifications' && 'Receive updates via SMS'}
                      {key === 'feedback_updates' && 'Get notified about feedback status changes'}
                      {key === 'government_responses' && 'Get notified when government responds'}
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, [key]: !value })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data & Privacy Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Export Your Data</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Download a copy of all your data including feedback submissions and account information.
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      disabled={loading}
                      className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </button>
                  </div>
                </div>

                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-red-900 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Delete Account
                      </h4>
                      <p className="text-sm text-red-700 mt-1">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          // Handle account deletion
                        }
                      }}
                      className="flex items-center px-3 py-2 text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;