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
  LoginResponse
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
}

// Export singleton instance
export const apiService = new CivicAIApiService();
export default apiService;
