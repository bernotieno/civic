/**
 * Authentication Context Provider
 * Manages authentication state, user data, and app configuration across the application
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, AppConfig, AuthTokens } from '../types';
import { apiService } from '../services/api';

// Authentication Context Interface
interface AuthContextType {
  // State
  user: AuthUser | null;
  appConfig: AppConfig | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (nationalId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  
  // Utility functions
  hasRole: (role: string) => boolean;
  canAccessEndpoint: (endpoint: string) => boolean;
  getAccessibleCounties: () => Array<{ id: number; name: string; code: string }>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props Interface
interface AuthProviderProps {
  children: ReactNode;
}

// Authentication Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user && apiService.isAuthenticated();

  // Initialize authentication state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Initialize authentication state
   * Check for existing tokens and load user profile
   */
  const initializeAuth = async () => {
    try {
      if (apiService.isAuthenticated()) {
        await refreshUserProfile();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      // Clear invalid tokens
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login user with national ID and password
   */
  const login = async (nationalId: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await apiService.login(nationalId, password);
      
      if (response.success && response.user && response.tokens) {
        setUser(response.user);
        if (response.app_config) {
          setAppConfig(response.app_config);
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user and clear all authentication data
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAppConfig(null);
      setIsLoading(false);
    }
  };

  /**
   * Refresh user profile data
   */
  const refreshUserProfile = async (): Promise<void> => {
    try {
      const response = await apiService.getUserProfile();
      if (response.success && response.user) {
        setUser(response.user);
        if (response.app_config) {
          setAppConfig(response.app_config);
        }
      }
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      throw error;
    }
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  /**
   * Check if user can access a specific endpoint
   */
  const canAccessEndpoint = (endpoint: string): boolean => {
    return appConfig?.available_endpoints.includes(endpoint) || false;
  };

  /**
   * Get list of counties user can access
   */
  const getAccessibleCounties = () => {
    return user?.accessible_counties || [];
  };

  // Context value
  const contextValue: AuthContextType = {
    // State
    user,
    appConfig,
    isAuthenticated,
    isLoading,
    
    // Actions
    login,
    logout,
    refreshUserProfile,
    
    // Utility functions
    hasRole,
    canAccessEndpoint,
    getAccessibleCounties,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 * Throws error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Higher-order component for protected routes
 * Redirects to login if user is not authenticated
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // In a real app, you'd redirect to login page
      // For now, we'll show a message
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

export default AuthContext;
