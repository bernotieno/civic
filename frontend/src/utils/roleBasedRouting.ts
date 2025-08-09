/**
 * Role-based Routing Utilities
 * Handles navigation logic based on user roles and official levels
 */

import { AuthUser } from '../types';

/**
 * Dashboard route mappings based on user role and level
 */
export const DASHBOARD_ROUTES = {
  citizen: '/citizen-dashboard',
  government_official: {
    local: '/gov-dashboard',
    regional: '/gov-dashboard', 
    national: '/gov-dashboard',
    super_admin: '/admin-dashboard',
  },
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
      
    case 'government_official':
      // Check official level for government officials
      switch (user.official_level) {
        case 'local':
          return DASHBOARD_ROUTES.government_official.local;
        case 'regional':
          return DASHBOARD_ROUTES.government_official.regional;
        case 'national':
          return DASHBOARD_ROUTES.government_official.national;
        case 'super_admin':
          return DASHBOARD_ROUTES.government_official.super_admin;
        default:
          // Default to local level if no specific level is set
          return DASHBOARD_ROUTES.government_official.local;
      }
      
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
        '/citizen-dashboard',
        '/feedback',
        '/track-feedback',
      ].includes(route);
      
    case 'government_official':
      switch (user.official_level) {
        case 'super_admin':
          // Super admins can access everything
          return true;
          
        case 'national':
          // National officials can access national and regional dashboards
          return [
            '/',
            '/gov-dashboard',
            '/admin-dashboard', // Limited admin access
            '/reports',
            '/analytics',
          ].includes(route);
          
        case 'regional':
          // Regional officials can access regional dashboards
          return [
            '/',
            '/gov-dashboard',
            '/reports',
            '/analytics',
          ].includes(route);
          
        case 'local':
        default:
          // Local officials can access local dashboards
          return [
            '/',
            '/gov-dashboard',
            '/reports',
          ].includes(route);
      }
      
    default:
      // Unknown roles get citizen-level access
      return [
        '/',
        '/citizen-dashboard',
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
    case 'government_official':
      switch (user.official_level) {
        case 'local':
          return 'Local Government Official';
        case 'regional':
          return 'Regional Government Official';
        case 'national':
          return 'National Government Official';
        case 'super_admin':
          return 'Super Administrator';
        default:
          return 'Government Official';
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
      { name: 'Submit Feedback', href: '#submit' },
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
      
    case 'government_official':
      switch (user.official_level) {
        case 'super_admin':
          return [
            ...baseItems,
            { name: 'System Admin', href: '/admin-dashboard' },
            { name: 'User Management', href: '/admin/users' },
            { name: 'System Reports', href: '/admin/reports' },
            { name: 'Audit Logs', href: '/admin/audit' },
          ];
          
        case 'national':
          return [
            ...baseItems,
            { name: 'National Reports', href: '/reports/national' },
            { name: 'Analytics', href: '/analytics' },
            { name: 'Policy Dashboard', href: '/policy' },
          ];
          
        case 'regional':
          return [
            ...baseItems,
            { name: 'Regional Reports', href: '/reports/regional' },
            { name: 'County Analytics', href: '/analytics/county' },
            { name: 'Coordination', href: '/coordination' },
          ];
          
        case 'local':
        default:
          return [
            ...baseItems,
            { name: 'Feedback Management', href: '/feedback-management' },
            { name: 'County Reports', href: '/reports/county' },
            { name: 'Response Tools', href: '/response-tools' },
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
      
    case 'government_official':
      switch (user.official_level) {
        case 'super_admin':
          return 'System Administration Dashboard';
        case 'national':
          return 'National Government Dashboard';
        case 'regional':
          return `Regional Dashboard - ${user.county_name}`;
        case 'local':
        default:
          return `${user.county_name} County Dashboard`;
      }
      
    default:
      return 'Dashboard';
  }
};
