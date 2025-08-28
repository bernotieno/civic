/**
 * Role-based Routing Utilities
 * Handles navigation logic based on user roles and admin levels
 */

import { AuthUser } from '../types';

/**
 * Dashboard route mappings based on user role and level
 */
export const DASHBOARD_ROUTES = {
  citizen: '/dashboard',
  parliament_admin: '/admin-dashboard',
} as const;

/**
 * Get the appropriate dashboard route for a user
 */
export const getDashboardRoute = (user: AuthUser): string => {
  if (!user) {
    return '/';
  }

  switch (user.role) {
    case 'citizen':
      return DASHBOARD_ROUTES.citizen;
      
    case 'parliament_admin':
      return DASHBOARD_ROUTES.parliament_admin;
      
    default:
      // Default to citizen dashboard for unknown roles
      return DASHBOARD_ROUTES.citizen;
  }
};

/**
 * Check if a user can access a specific route
 */
export const canAccessRoute = (user: AuthUser | null, route: string): boolean => {
  if (!user) {
    // Public routes that don't require authentication
    const publicRoutes = ['/', '/register', '/login'];
    return publicRoutes.includes(route);
  }

  // Users can always access their designated dashboard
  const userDashboard = getDashboardRoute(user);
  if (route === userDashboard) {
    return true;
  }

  // Role-specific route access logic
  switch (user.role) {
    case 'citizen':
      // Citizens can access citizen dashboard and public routes
      return [
        '/',
        '/dashboard',
        '/feedback',
        '/track-feedback',
      ].includes(route);
      
    case 'parliament_admin':
      // Parliament admins can access admin features
      if (user.admin_level === 'super_admin') {
        // Super admins can access everything
        return true;
      } else {
        // Regular parliament admins
        return [
          '/',
          '/admin-dashboard',
          '/reports',
          '/analytics',
        ].includes(route);
      }
      
    default:
      // Unknown roles get citizen-level access
      return [
        '/',
        '/dashboard',
      ].includes(route);
  }
};

/**
 * Get user-friendly role display name
 */
export const getRoleDisplayName = (user: AuthUser): string => {
  if (user.role_display) {
    return user.role_display;
  }

  // Fallback to constructing display name
  switch (user.role) {
    case 'citizen':
      return 'Citizen';
    case 'parliament_admin':
      if (user.admin_level === 'super_admin') {
        return 'Super Administrator';
      } else {
        return 'Parliament Administrator';
      }
    default:
      return 'User';
  }
};

/**
 * Get navigation items based on user role
 */
export const getNavigationItems = (user: AuthUser | null) => {
  if (!user) {
    return [
      { name: 'Home', href: '/' },
      { name: 'Anonymous Feedback', href: '/anonymous-feedback' },
      { name: 'Track Feedback', href: '#track' },
      { name: 'About', href: '#about' },
    ];
  }

  const baseItems = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: getDashboardRoute(user) },
  ];

  switch (user.role) {
    case 'citizen':
      return [
        ...baseItems,
        { name: 'Submit Feedback', href: '/feedback' },
        { name: 'My Feedback', href: '/my-feedback' },
        { name: 'Track Status', href: '/track' },
      ];
      
    case 'parliament_admin':
      if (user.admin_level === 'super_admin') {
        return [
          ...baseItems,
          { name: 'System Admin', href: '/admin-dashboard' },
          { name: 'User Management', href: '/admin/users' },
          { name: 'System Reports', href: '/admin/reports' },
          { name: 'Audit Logs', href: '/admin/audit' },
        ];
      } else {
        return [
          ...baseItems,
          { name: 'Bills Management', href: '/admin-dashboard/bills' },
          { name: 'Feedback Management', href: '/admin-dashboard/feedback' },
          { name: 'Analytics', href: '/admin-dashboard/analytics' },
        ];
      }
      
    default:
      return baseItems;
  }
};

/**
 * Get dashboard title based on user role
 */
export const getDashboardTitle = (user: AuthUser): string => {
  switch (user.role) {
    case 'citizen':
      return `Welcome, ${user.name}`;
      
    case 'parliament_admin':
      if (user.admin_level === 'super_admin') {
        return 'System Administration Dashboard';
      } else {
        return 'Parliament Administration Dashboard';
      }
      
    default:
      return 'Dashboard';
  }
};
