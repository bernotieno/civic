// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'citizen' | 'parliament_admin';
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
  location: Location;
  status: 'submitted' | 'reviewing' | 'in_progress' | 'resolved' | 'closed';
  sentiment?: 'positive' | 'negative' | 'neutral';
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackForm {
  title: string;
  description: string;
  location: Location;
}

// Anonymous Session Types
export interface AnonymousSession {
  session_id: string;
  expires_in: number;
  max_submissions: number;
  created_at?: string;
  expires_at?: string;
}

export interface AnonymousSessionResponse {
  success: boolean;
  message: string;
  session_id: string;
  expires_in: number;
  max_submissions: number;
  errors?: Record<string, string[]>;
}

export interface AnonymousSessionStatus {
  success: boolean;
  session_id: string;
  can_submit: boolean;
  message: string;
  submissions_used: number;
  submissions_limit: number;
  expires_at: string;
}

export interface AnonymousSessionRequest {
  county_id: number;
}

export interface AnonymousFeedbackData {
  session_id: string;
  title: string;
  content: string;
  county_id: number;
  sub_county_id?: number;
  ward_id?: number;
  village_id?: number;
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
  numericValue: number;
  trend?: 'up' | 'down' | 'stable';
}

// Navigation Types
export interface NavItem {
  name: string;
  href: string;
}

// Dashboard View Types
export type DashboardView = 'home' | 'submit-feedback' | 'my-feedback' | 'bills-projects' | 'bill-details' | 'community-impact' | 'profile' | 'feedback-success' | 'feedback-error';

// Bill Types
export interface Bill {
  id: string;
  bill_number?: string;
  title: string;
  description: string;
  summary?: string;
  summary_html?: string;
  summary_markdown?: string;
  sponsor: string;
  committee?: string;
  status: string;
  status_display?: string;
  introduced_date?: string;
  first_reading_date?: string;
  committee_deadline?: string;
  public_participation_open?: boolean;
  participation_deadline?: string;
  document?: string;
  document_url?: string;
  image?: string;
  created_at: string;
}

// Project Types
export interface Project {
  id: string;
  title: string;
  description: string;
  summary?: string;
  sponsor: string;
  participation_deadline?: string;
  document?: string;
  created_at: string;
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
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: string;
  role_display: string;
  admin_level?: string;
  level_display?: string;
  county_name: string;
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
  created_at: string;
  updated_at: string;

  view_count: number;
  location_path: string;
  can_edit: boolean;
  can_delete: boolean;
  edit_restriction_reason?: string;
  delete_restriction_reason?: string;
  is_anonymous: boolean;
  status?: string;
  tracking_id?: string;
  content?: string;
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

// =============================================================================
// ENHANCED FEEDBACK SYSTEM TYPES
// =============================================================================



// Feedback Form Data for Submission
export interface FeedbackSubmissionData {
  title: string;
  content: string;
  county_id: number;
  sub_county_id?: number;
  ward_id?: number;
  village_id?: number;
  related_bill_id?: string;
  is_anonymous?: boolean;
}

// Feedback Form Validation Errors
export interface FeedbackFormErrors {
  title?: string;
  content?: string;
  county_id?: string;
  related_bill_id?: string;
  general?: string;
}

// Feedback Submission Response
export interface FeedbackSubmissionResponse {
  success: boolean;
  message: string;
  data?: {
    feedback_id: string;
    tracking_id: string;
    status: string;
    submitted_at: string;
    location_path: string;
  };
  errors?: FeedbackFormErrors;
}

// Feedback tracking removed for scalability

// Rate Limit Information
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_time: string;
  exceeded: boolean;
}

// Rate Limit Error Response
export interface RateLimitError {
  success: false;
  message: string;
  rate_limit: RateLimitInfo;
}

// Location Selection State for Cascading Dropdowns
export interface LocationSelectionState {
  county: LocationHierarchy | null;
  subCounty: LocationHierarchy | null;
  ward: LocationHierarchy | null;
  village: LocationHierarchy | null;

  // Available options for each level
  counties: LocationHierarchy[];
  subCounties: LocationHierarchy[];
  wards: LocationHierarchy[];
  villages: LocationHierarchy[];

  // Loading states
  loadingSubCounties: boolean;
  loadingWards: boolean;
  loadingVillages: boolean;
}



// User Feedback List Response
export interface UserFeedbackListResponse {
  success: boolean;
  data: {
    results: FeedbackItem[];
    count: number;
    next?: string;
    previous?: string;
  };
}

// Enhanced Feedback Item with Full Details
export interface DetailedFeedbackItem extends FeedbackItem {
  content: string;
  location_path: string;
  response_count: number;
  last_response_at?: string;
  view_count: number;
  can_edit: boolean;
  can_delete: boolean;
  edit_restriction_reason?: string;
  delete_restriction_reason?: string;
  is_anonymous: boolean;
}

// Bill Details Types
export interface BillSummary {
  id: string;
  summary: string;
  key_points: string[];
}

export interface ChatMessage {
  id: string;
  question: string;
  response: string;
  timestamp: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
}