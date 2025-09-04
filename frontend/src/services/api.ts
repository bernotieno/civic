/**
 * CivicAI API Service
 * Handles all API calls for user registration and location data
 */

import {
  County,
  LocationHierarchy,
  RegistrationData,
  RegistrationResponse,
  LocationResponse,
  AuthTokens,
  LoginResponse,
  FeedbackSubmissionData,
  FeedbackSubmissionResponse,
  FeedbackTrackingResponse,
  FeedbackCategoriesResponse,
  UserFeedbackListResponse,
  RateLimitError,
  FeedbackCategoryOption,
  AnonymousSession,
  AnonymousSessionResponse,
  AnonymousSessionStatus,
  AnonymousFeedbackData,
  PriorityOption
} from '../types';

class CivicAIApiService {
  private baseURL: string;

  constructor() {
    // Use environment variable or default to localhost for development
    this.baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  }

  /**
   * Get request headers with optional authentication
   */
  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };

    if (includeAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Get access token from localStorage
   */
  private getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Store authentication tokens
   */
  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  }

  /**
   * Clear authentication tokens
   */
  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Handle API response and check for errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      // Handle different types of errors
      if (response.status === 0) {
        throw new Error('Network error: Unable to connect to server. Please check your internet connection.');
      }

      if (response.status === 404) {
        throw new Error('API endpoint not found. The requested resource may not be available yet.');
      }

      if (response.status >= 500) {
        throw new Error('Server error: The server is experiencing issues. Please try again later.');
      }

      try {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.detail || `HTTP error! status: ${response.status}`);
      } catch (jsonError) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    try {
      return await response.json();
    } catch (jsonError) {
      throw new Error('Invalid response format from server');
    }
  }

  /**
   * Validate Kenyan National ID format (8 digits)
   */
  public validateNationalId(nationalId: string): boolean {
    const nationalIdRegex = /^\d{8}$/;
    return nationalIdRegex.test(nationalId);
  }

  /**
   * Get all counties for dropdown selection
   */
  async getCounties(): Promise<County[]> {
    try {
      const response = await fetch(`${this.baseURL}/api/locations/counties/`, {
        method: 'GET',
        headers: this.getHeaders(false),
      });

      const data = await this.handleResponse<any>(response);

      console.log('Counties API response:', data); // Debug log

      // Handle paginated response - extract results array
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        console.log('Found paginated counties:', data.results.length);
        return data.results;
      }

      // Handle direct array response (fallback)
      if (Array.isArray(data)) {
        console.log('Found direct array counties:', data.length);
        return data;
      }

      // Handle success wrapper response
      if (data && data.success && Array.isArray(data.data)) {
        console.log('Found wrapped counties:', data.data.length);
        return data.data;
      }

      console.error('Unexpected counties response format:', data);
      return [];
    } catch (error) {
      console.error('Error fetching counties:', error);
      throw error;
    }
  }

  /**
   * Get location hierarchy for cascading dropdowns
   * @param countyId - County ID to get children from
   * @param type - Location type to retrieve (sub_county, ward, village)
   * @param parentId - Parent location ID (alternative to countyId)
   */
  async getLocationHierarchy(
    type: 'sub_county' | 'ward' | 'village',
    countyId?: number,
    parentId?: number
  ): Promise<LocationHierarchy[]> {
    try {
      const params = new URLSearchParams({ type });
      
      if (countyId) {
        params.append('county_id', countyId.toString());
      }
      if (parentId) {
        params.append('parent_id', parentId.toString());
      }

      const response = await fetch(
        `${this.baseURL}/api/locations/hierarchy/?${params}`,
        {
          method: 'GET',
          headers: this.getHeaders(false),
        }
      );

      const data = await this.handleResponse<LocationResponse>(response);
      return data.locations;
    } catch (error) {
      console.error('Error fetching location hierarchy:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async register(registrationData: RegistrationData): Promise<RegistrationResponse> {
    try {
      // Clean registration data - remove undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(registrationData).filter(([_, value]) => value !== undefined && value !== 0)
      );
      
      const response = await fetch(`${this.baseURL}/api/auth/register/`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(cleanedData),
      });

      const data = await this.handleResponse<RegistrationResponse>(response);
      
      // Store tokens if registration successful
      if (data.success && data.tokens) {
        this.storeTokens(data.tokens);
      }

      return data;
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }

  /**
   * Login user with national ID and password
   */
  async login(nationalId: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/login/`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({
          national_id: nationalId,
          password: password,
        }),
      });

      const data = await this.handleResponse<LoginResponse>(response);

      // Store tokens if login successful
      if (data.success && data.tokens) {
        this.storeTokens(data.tokens);
      }

      return data;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        await fetch(`${this.baseURL}/api/auth/logout/`, {
          method: 'POST',
          headers: this.getHeaders(true),
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Get user profile
   */
  async getUserProfile(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/profile/`, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(profileData: { name: string; phone?: string }): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/profile/`, {
        method: 'PATCH',
        headers: this.getHeaders(true),
        body: JSON.stringify(profileData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: { current_password: string; new_password: string; confirm_password: string }): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/change-password/`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(passwordData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Export user data
   */
  async exportUserData(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/export-data/`, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  // =============================================================================
  // FEEDBACK API METHODS
  // =============================================================================

  /**
   * Get user feedback statistics
   */
  async getUserFeedbackStats(): Promise<{
    success: boolean;
    data?: {
      totalFeedback: number;
      pendingResponses: number;
      resolvedIssues: number;
      averageResponseTime: number;
      today_submissions: number;
      this_week_submissions: number;
      this_month_submissions: number;
    };
  }> {
    try {
      const response = await fetch(`${this.baseURL}/api/feedback/my-stats/`, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching user feedback stats:', error);
      // Return mock data if endpoint doesn't exist yet
      return {
        success: true,
        data: {
          totalFeedback: 0,
          pendingResponses: 0,
          resolvedIssues: 0,
          averageResponseTime: 0,
          today_submissions: 0,
          this_week_submissions: 0,
          this_month_submissions: 0
        }
      };
    }
  }

  /**
   * Get user's feedback submissions with pagination support
   */
  async getUserFeedbackList(limit: number = 10, page: number = 1): Promise<UserFeedbackListResponse> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString()
      });

      console.log('🔍 Attempting to fetch user feedback list:', `${this.baseURL}/api/feedback/my-submissions/?${params}`);
      console.log('🔑 Auth token present:', !!this.getAccessToken());

      const response = await fetch(`${this.baseURL}/api/feedback/my-submissions/?${params}`, {
        method: 'GET',
        headers: this.getHeaders(true),
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'include', // Include credentials for CORS
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      return this.handleResponse<UserFeedbackListResponse>(response);
    } catch (error) {
      console.error('❌ Error fetching user feedback list:', error);
      if (error instanceof Error) {
        console.error('❌ Error type:', error.constructor.name);
        console.error('❌ Error message:', error.message);
      }

      // Only return empty list for network errors, not authentication errors
      if (error instanceof Error && error.message.includes('Network error')) {
        return {
          success: true,
          data: {
            results: [],
            count: 0,
            next: undefined,
            previous: undefined
          }
        };
      }

      // Re-throw authentication and other errors so the component can handle them
      throw error;
    }
  }

  /**
   * Get detailed feedback item by ID
   */
  async getFeedbackDetail(feedbackId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/api/feedback/my-submissions/${feedbackId}/`, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching feedback detail:', error);
      throw error;
    }
  }

  /**
   * Check current user's rate limit status
   */
  async checkRateLimit(): Promise<{ canSubmit: boolean; remaining: number; resetTime?: string }> {
    try {
      // This would typically be a dedicated endpoint, but we can infer from user stats
      const stats = await this.getUserFeedbackStats();

      // Mock rate limit logic - in real implementation this would come from API
      const dailyLimit = 10; // Citizens: 10 submissions/day
      const todaySubmissions = stats.data?.today_submissions || 0;

      return {
        canSubmit: todaySubmissions < dailyLimit,
        remaining: Math.max(0, dailyLimit - todaySubmissions),
        resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Next midnight
      };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      // Default to allowing submission on error
      return {
        canSubmit: true,
        remaining: 10
      };
    }
  }

  /**
   * Get feedback categories with department routing information
   */
  async getFeedbackCategories(): Promise<FeedbackCategoriesResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/feedback/categories/`, {
        method: 'GET',
        headers: this.getHeaders(false),
      });

      const data = await this.handleResponse<FeedbackCategoriesResponse>(response);

      // If API doesn't return categories in expected format, provide defaults
      if (!data.data?.categories) {
        return {
          success: true,
          data: {
            categories: this.getDefaultFeedbackCategories()
          }
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching feedback categories:', error);
      // Return default categories on error
      return {
        success: true,
        data: {
          categories: this.getDefaultFeedbackCategories()
        }
      };
    }
  }

  /**
   * Get default feedback categories with department routing
   */
  private getDefaultFeedbackCategories(): FeedbackCategoryOption[] {
    return [
      {
        value: 'infrastructure',
        label: 'Infrastructure & Roads',
        department: 'Public Works',
        description: 'Road maintenance, bridges, public buildings'
      },
      {
        value: 'healthcare',
        label: 'Healthcare Services',
        department: 'Health',
        description: 'Hospitals, clinics, medical equipment'
      },
      {
        value: 'education',
        label: 'Education & Schools',
        department: 'Education',
        description: 'Schools, teachers, educational resources'
      },
      {
        value: 'water_sanitation',
        label: 'Water & Sanitation',
        department: 'Water',
        description: 'Water supply, sewerage, waste management'
      },
      {
        value: 'security',
        label: 'Security & Safety',
        department: 'Security',
        description: 'Police services, public safety, crime'
      },
      {
        value: 'environment',
        label: 'Environment & Waste',
        department: 'Environment',
        description: 'Pollution, waste collection, environmental protection'
      },
      {
        value: 'governance',
        label: 'Governance & Corruption',
        department: 'Ethics',
        description: 'Government services, corruption, transparency'
      },
      {
        value: 'economic',
        label: 'Economic Development',
        department: 'Development',
        description: 'Business permits, economic opportunities, markets'
      },
      {
        value: 'other',
        label: 'Other Issues',
        department: 'General Administration',
        description: 'Issues not covered by other categories'
      }
    ];
  }

  /**
   * Get priority options with time expectations
   */
  getPriorityOptions(): PriorityOption[] {
    return [
      {
        value: 'low',
        label: 'Low Priority',
        timeframe: '3–7 days',
        description: 'Non-urgent issues that can wait for regular processing'
      },
      {
        value: 'medium',
        label: 'Medium Priority',
        timeframe: '1–3 days',
        description: 'Standard issues requiring timely attention'
      },
      {
        value: 'high',
        label: 'High Priority',
        timeframe: '6–24 hours',
        description: 'Important issues affecting community services'
      },
      {
        value: 'urgent',
        label: 'Urgent',
        timeframe: '2–6 hours',
        description: 'Critical issues requiring immediate government response'
      }
    ];
  }

  /**
   * Track feedback by tracking ID (public endpoint - no auth required)
   */
  async trackFeedback(trackingId: string): Promise<FeedbackTrackingResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/feedback/track/${trackingId}/`, {
        method: 'GET',
        headers: this.getHeaders(false),
      });

      return this.handleResponse<FeedbackTrackingResponse>(response);
    } catch (error) {
      console.error('Error tracking feedback:', error);
      throw error;
    }
  }

  /**
   * Submit authenticated feedback with comprehensive validation and error handling
   */
  async submitFeedback(feedbackData: FeedbackSubmissionData, isAnonymous: boolean = false): Promise<FeedbackSubmissionResponse> {
    try {
      // Validate required fields before submission
      this.validateFeedbackData(feedbackData);

      // Clean the data - remove undefined values and ensure proper types
      const cleanedData = {
        title: feedbackData.title.trim(),
        content: feedbackData.content.trim(),
        category: feedbackData.category,
        priority: feedbackData.priority,
        county_id: feedbackData.county_id,
        is_anonymous: isAnonymous,
        ...(feedbackData.sub_county_id && { sub_county_id: feedbackData.sub_county_id }),
        ...(feedbackData.ward_id && { ward_id: feedbackData.ward_id }),
        ...(feedbackData.village_id && { village_id: feedbackData.village_id })
      };

      console.log('🚀 Submitting feedback data:', cleanedData);
      console.log('🔑 Auth token present:', !!this.getAccessToken());

      const response = await fetch(`${this.baseURL}/api/feedback/submit/`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(cleanedData),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      // Handle rate limiting specifically
      if (response.status === 429) {
        const rateLimitData = await response.json() as RateLimitError;
        throw new Error(`Rate limit exceeded: ${rateLimitData.message}`);
      }

      // Handle 400 errors with detailed logging
      if (response.status === 400) {
        const errorData = await response.json();
        console.error('❌ 400 Bad Request details:', errorData);
        
        // Return the error in the expected format
        return {
          success: false,
          message: errorData.message || 'Validation failed',
          errors: errorData.errors || { general: [errorData.message || 'Bad request'] }
        };
      }

      return this.handleResponse<FeedbackSubmissionResponse>(response);
    } catch (error) {
      console.error('❌ Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Validate feedback data before submission
   */
  private validateFeedbackData(data: FeedbackSubmissionData): void {
    if (!data.title || data.title.length < 10 || data.title.length > 200) {
      throw new Error('Title must be between 10 and 200 characters');
    }

    if (!data.content || data.content.length < 50) {
      throw new Error('Content must be at least 50 characters');
    }

    if (!data.category) {
      throw new Error('Category is required');
    }

    if (!data.county_id) {
      throw new Error('County selection is required');
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (!validPriorities.includes(data.priority)) {
      throw new Error('Invalid priority level');
    }
  }

  /**
   * Submit anonymous feedback with session management
   */
  async submitAnonymousFeedback(feedbackData: AnonymousFeedbackData): Promise<FeedbackSubmissionResponse> {
    try {
      // Validate required fields
      if (!feedbackData.session_id) {
        throw new Error('Anonymous session required');
      }

      // Clean the data
      const cleanedData = {
        session_id: feedbackData.session_id,
        title: feedbackData.title.trim(),
        content: feedbackData.content.trim(),
        category: feedbackData.category,
        priority: feedbackData.priority,
        county_id: feedbackData.county_id,
        ...(feedbackData.sub_county_id && { sub_county_id: feedbackData.sub_county_id }),
        ...(feedbackData.ward_id && { ward_id: feedbackData.ward_id }),
        ...(feedbackData.village_id && { village_id: feedbackData.village_id })
      };

      console.log('🚀 Submitting anonymous feedback:', cleanedData);

      const response = await fetch(`${this.baseURL}/api/feedback/anonymous/`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(cleanedData),
      });

      const result = await this.handleResponse<FeedbackSubmissionResponse>(response);
      
      // Update session usage count on successful submission
      if (result.success) {
        this.updateAnonymousSessionUsage();
      }

      return result;
    } catch (error) {
      console.error('Error submitting anonymous feedback:', error);
      throw error;
    }
  }

  // =============================================================================
  // ANONYMOUS SESSION METHODS
  // =============================================================================

  /**
   * Create an anonymous session for feedback submission
   */
  async createAnonymousSession(countyId: number): Promise<AnonymousSessionResponse> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/anonymous/`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify({ county_id: countyId }),
      });

      const data = await this.handleResponse(response) as AnonymousSessionResponse;

      if (data.success) {
        // Store session info in localStorage for later use
        const sessionInfo = {
          session_id: data.session_id,
          county_id: countyId,
          expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
          max_submissions: data.max_submissions,
          submissions_used: 0
        };
        localStorage.setItem('anonymous_session', JSON.stringify(sessionInfo));
      }

      return data;
    } catch (error) {
      console.error('Error creating anonymous session:', error);
      throw error;
    }
  }

  /**
   * Check the status of an anonymous session
   */
  async checkAnonymousSessionStatus(sessionId: string): Promise<AnonymousSessionStatus> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/anonymous/${sessionId}/status/`, {
        method: 'GET',
        headers: this.getHeaders(false),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error checking anonymous session status:', error);
      throw error;
    }
  }

  /**
   * Get stored anonymous session from localStorage
   */
  getStoredAnonymousSession(): AnonymousSession | null {
    try {
      const stored = localStorage.getItem('anonymous_session');
      if (!stored) return null;

      const session = JSON.parse(stored);

      // Check if session has expired
      if (new Date(session.expires_at) <= new Date()) {
        localStorage.removeItem('anonymous_session');
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting stored anonymous session:', error);
      localStorage.removeItem('anonymous_session');
      return null;
    }
  }

  /**
   * Clear stored anonymous session
   */
  clearAnonymousSession(): void {
    localStorage.removeItem('anonymous_session');
  }

  /**
   * Update stored session submission count
   */
  updateAnonymousSessionUsage(): void {
    try {
      const stored = localStorage.getItem('anonymous_session');
      if (stored) {
        const session = JSON.parse(stored);
        session.submissions_used = (session.submissions_used || 0) + 1;
        localStorage.setItem('anonymous_session', JSON.stringify(session));
      }
    } catch (error) {
      console.error('Error updating anonymous session usage:', error);
    }
  }

  // =============================================================================
  // DASHBOARD DATA METHODS
  // =============================================================================

  /**
   * Get dashboard data for citizens
   */
  async getDashboardData(): Promise<{
    stats: {
      totalFeedback: number;
      pendingResponses: number;
      resolvedIssues: number;
      averageResponseTime: number;
    };
    recentFeedback: any[];
    communityStats: {
      resolvedInArea: number;
      monthlyTrend: number;
      governmentResponses: Array<{
        title: string;
        date: string;
        department: string;
      }>;
    };
  }> {
    try {
      // Make API calls to get real data
      const [statsResponse, feedbackResponse] = await Promise.all([
        fetch(`${this.baseURL}/api/feedback/my-stats/`, {
          method: 'GET',
          headers: this.getHeaders(true),
        }),
        fetch(`${this.baseURL}/api/feedback/my-submissions/?limit=5`, {
          method: 'GET',
          headers: this.getHeaders(true),
        })
      ]);

      let stats = { totalFeedback: 0, pendingResponses: 0, resolvedIssues: 0, averageResponseTime: 0 };
      let recentFeedback = [];

      // Handle stats response
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          stats = {
            totalFeedback: statsData.data.total_submissions || 0,
            pendingResponses: (statsData.data.pending_count || 0) + (statsData.data.in_review_count || 0),
            resolvedIssues: statsData.data.resolved_count || 0,
            averageResponseTime: statsData.data.average_response_days || 0,
          };
        }
      }

      // Handle feedback response
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        if (feedbackData.success && feedbackData.data?.results) {
          recentFeedback = feedbackData.data.results.map((item: any) => ({
            id: item.id,
            title: item.title,
            status: item.status,
            tracking_id: item.tracking_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            category: item.category,
            category_display: item.category_display,
            priority: item.priority,
            priority_display: item.priority_display,
            status_display: item.status_display,
            response_count: item.response_count || 0,
            view_count: item.view_count || 0,
            location_path: item.location_path,
            can_edit: item.can_edit,
            can_delete: item.can_delete,
          }));
        }
      }

      return {
        stats,
        recentFeedback,
        communityStats: {
          resolvedInArea: 47, // Mock data - would come from API
          monthlyTrend: 15,
          governmentResponses: [
            {
              title: 'New water pumps installed in Eastlands',
              date: '2024-01-12',
              department: 'Water & Sanitation',
            },
            {
              title: 'Road repairs completed on Mombasa Road',
              date: '2024-01-10',
              department: 'Infrastructure',
            },
          ],
        },
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Return mock data on error for development
      return {
        stats: {
          totalFeedback: 12,
          pendingResponses: 3,
          resolvedIssues: 8,
          averageResponseTime: 2.5,
        },
        recentFeedback: [
          {
            id: '1',
            title: 'Road maintenance needed on Uhuru Highway',
            status: 'in_review',
            tracking_id: 'FB-2024-001',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z',
            category: 'infrastructure',
            category_display: 'Infrastructure',
            priority: 'high',
            priority_display: 'High',
            status_display: 'In Review',
            response_count: 0,
            view_count: 5,
            location_path: 'Nairobi > Central > CBD',
            can_edit: true,
            can_delete: false,
            is_anonymous: false,
          },
          {
            id: '2',
            title: 'Water shortage in Kibera area',
            status: 'pending',
            tracking_id: 'FB-2024-002',
            created_at: '2024-01-14T14:20:00Z',
            updated_at: '2024-01-14T14:20:00Z',
            category: 'water_sanitation',
            category_display: 'Water & Sanitation',
            priority: 'urgent',
            priority_display: 'Urgent',
            status_display: 'Pending',
            response_count: 0,
            view_count: 3,
            location_path: 'Nairobi > Kibra > Kibera',
            can_edit: true,
            can_delete: true,
            is_anonymous: true,
          },
          {
            id: '3',
            title: 'Healthcare facility needs equipment',
            status: 'resolved',
            tracking_id: 'FB-2024-003',
            created_at: '2024-01-10T09:15:00Z',
            updated_at: '2024-01-12T16:45:00Z',
            category: 'healthcare',
            category_display: 'Healthcare',
            priority: 'medium',
            priority_display: 'Medium',
            status_display: 'Resolved',
            response_count: 2,
            last_response_at: '2024-01-12T16:45:00Z',
            view_count: 12,
            location_path: 'Nairobi > Westlands > Parklands',
            can_edit: false,
            can_delete: false,
            is_anonymous: false,
          },
        ],
        communityStats: {
          resolvedInArea: 47,
          monthlyTrend: 15,
          governmentResponses: [
            {
              title: 'New water pumps installed in Eastlands',
              date: '2024-01-12',
              department: 'Water & Sanitation',
            },
            {
              title: 'Road repairs completed on Mombasa Road',
              date: '2024-01-10',
              department: 'Infrastructure',
            },
          ],
        },
      };
    }
  }
}

// Export singleton instance
export const apiService = new CivicAIApiService();
export default apiService;
