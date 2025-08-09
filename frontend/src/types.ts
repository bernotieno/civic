// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'citizen' | 'government_official';
  location?: Location;
}

// Location Types
export interface Location {
  county: string;
  area: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Feedback Types
export interface FeedbackCategory {
  id: string;
  name: string;
  icon: string;
  subcategories: string[];
  description: string;
}

export interface Feedback {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  location: Location;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'submitted' | 'reviewing' | 'in_progress' | 'resolved' | 'closed';
  sentiment?: 'positive' | 'negative' | 'neutral';
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackForm {
  category: string;
  subcategory: string;
  title: string;
  description: string;
  location: Location;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments: File[];
  isAnonymous: boolean;
  contactMethod: 'email' | 'phone' | 'whatsapp';
}

// Dashboard Types
export interface DashboardData {
  totalFeedback: number;
  pendingFeedback: number;
  resolvedFeedback: number;
  averageResponseTime: number;
  responseRate: number;
  citizenSatisfaction: number;
}

// Statistics Types
export interface Statistic {
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'stable';
}

// Navigation Types
export interface NavItem {
  name: string;
  href: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

// Feature Types
export interface Feature {
  number: string;
  title: string;
  description: string;
  icon?: string;
}

// Registration and Authentication Types
export interface County {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  location_data: {
    id: number;
    name: string;
    type: string;
    level: number;
    code: string;
    full_path: string;
  };
}

export interface LocationHierarchy {
  id: number;
  name: string;
  type: 'county' | 'sub_county' | 'ward' | 'village';
  level: number;
  code: string;
  full_path: string;
  children: LocationHierarchy[];
}

export interface RegistrationData {
  national_id: string;
  name: string;
  email: string;
  password: string;
  county_id: number;
  sub_county_id?: number;
  ward_id?: number;
  village_id?: number;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  role_display: string;
  official_level?: string;
  level_display?: string;
  county_name: string;
  tenant_name: string;
  accessible_counties: Array<{
    id: number;
    name: string;
    code: string;
  }>;
  date_joined: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// App Configuration Interface
export interface AppConfig {
  available_endpoints: string[];
  dashboard_widgets?: string[];
  navigation_items?: string[];
  data_scope: string;
  max_submissions_per_session?: number;
}

// Login Response Interface
export interface LoginResponse {
  success: boolean;
  message: string;
  user: AuthUser;
  app_config: AppConfig;
  tokens: AuthTokens;
  errors?: Record<string, string[]>;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  tokens?: AuthTokens;
  errors?: Record<string, string[]>;
}

export interface LocationResponse {
  success: boolean;
  locations: LocationHierarchy[];
  message?: string;
}

export interface FormErrors {
  national_id?: string;
  name?: string;
  email?: string;
  password?: string;
  county_id?: string;
  general?: string;
}

// Login Form Data Interface
export interface LoginFormData {
  national_id: string;
  password: string;
}

// Login Form Errors Interface
export interface LoginFormErrors {
  national_id?: string;
  password?: string;
  general?: string;
}

// Enhanced Dashboard Types for Citizens Dashboard
export interface FeedbackItem {
  id: string;
  title: string;
  status: 'submitted' | 'under_review' | 'in_progress' | 'resolved';
  tracking_id: string;
  submitted_at: string;
  category: string;
}

export interface FeedbackStats {
  totalFeedback: number;
  pendingResponses: number;
  resolvedIssues: number;
  averageResponseTime: number;
}

export interface CommunityStats {
  resolvedInArea: number;
  monthlyTrend: number;
  governmentResponses: Array<{
    title: string;
    date: string;
    department: string;
  }>;
}

export interface CitizenDashboardData {
  stats: FeedbackStats;
  recentFeedback: FeedbackItem[];
  communityStats: CommunityStats;
  loading?: boolean;
}