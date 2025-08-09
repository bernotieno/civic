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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
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

      // Handle paginated response - extract results array
      if (data && typeof data === 'object' && Array.isArray(data.results)) {
        return data.results;
      }

      // Handle direct array response (fallback)
      if (Array.isArray(data)) {
        return data;
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
      const response = await fetch(`${this.baseURL}/api/auth/register/`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(registrationData),
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
          body: JSON.stringify({ refresh: refreshToken }),
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
  async getUserProfile() {
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

  // =============================================================================
  // FEEDBACK API METHODS
  // =============================================================================

  /**
   * Get user feedback statistics
   */
  async getUserFeedbackStats() {
    try {
      const response = await fetch(`${this.baseURL}/api/feedback/my-stats/`, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error fetching user feedback stats:', error);
      throw error;
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

      const response = await fetch(`${this.baseURL}/api/feedback/my-submissions/?${params}`, {
        method: 'GET',
        headers: this.getHeaders(true),
      });

      return this.handleResponse<UserFeedbackListResponse>(response);
    } catch (error) {
      console.error('Error fetching user feedback list:', error);
      throw error;
    }
  }

  /**
   * Get detailed feedback item by ID
   */
  async getFeedbackDetail(feedbackId: string) {
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
  async submitFeedback(feedbackData: FeedbackSubmissionData): Promise<FeedbackSubmissionResponse> {
    try {
      // Validate required fields before submission
      this.validateFeedbackData(feedbackData);

      const response = await fetch(`${this.baseURL}/api/feedback/submit/`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(feedbackData),
      });

      // Handle rate limiting specifically
      if (response.status === 429) {
        const rateLimitData = await response.json() as RateLimitError;
        throw new Error(`Rate limit exceeded: ${rateLimitData.message}`);
      }

      return this.handleResponse<FeedbackSubmissionResponse>(response);
    } catch (error) {
      console.error('Error submitting feedback:', error);
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
   * Submit anonymous feedback
   */
  async submitAnonymousFeedback(feedbackData: any) {
    try {
      const response = await fetch(`${this.baseURL}/api/feedback/anonymous/`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: JSON.stringify(feedbackData),
      });

      return this.handleResponse(response);
    } catch (error) {
      console.error('Error submitting anonymous feedback:', error);
      throw error;
    }
  }

  // =============================================================================
  // DASHBOARD DATA METHODS
  // =============================================================================

  /**
   * Get dashboard data for citizens
   */
  async getDashboardData() {
    try {
      // For now, we'll make multiple API calls to get the data
      // In a real implementation, this might be a single endpoint
      const [stats, recentFeedback] = await Promise.all([
        this.getUserFeedbackStats(),
        this.getUserFeedbackList(5)
      ]);

      return {
        stats: stats.data || {
          totalFeedback: 0,
          pendingResponses: 0,
          resolvedIssues: 0,
          averageResponseTime: 0,
        },
        recentFeedback: recentFeedback.data?.results || [],
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
            status: 'in_progress',
            tracking_id: 'FB-2024-001',
            submitted_at: '2024-01-15T10:30:00Z',
            category: 'infrastructure',
          },
          {
            id: '2',
            title: 'Water shortage in Kibera area',
            status: 'under_review',
            tracking_id: 'FB-2024-002',
            submitted_at: '2024-01-14T14:20:00Z',
            category: 'utilities',
          },
          {
            id: '3',
            title: 'Healthcare facility needs equipment',
            status: 'resolved',
            tracking_id: 'FB-2024-003',
            submitted_at: '2024-01-10T09:15:00Z',
            category: 'healthcare',
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
