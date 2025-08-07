const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Auth methods
  async sendOTP(email: string) {
    return this.request('/auth/send-otp/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOTP(email: string, otp: string) {
    return this.request('/auth/verify-otp/', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async validateToken(token: string) {
    return this.request('/auth/validate/', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Feedback methods
  async submitFeedback(formData: FormData) {
    return this.request('/feedback/', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  }

  async getFeedback(id: string) {
    return this.request(`/feedback/${id}/`);
  }

  async getFeedbackList(params: Record<string, any> = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/feedback/?${queryString}`);
  }

  async updateFeedbackStatus(id: string, status: string, response?: string) {
    return this.request(`/feedback/${id}/update-status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status, response }),
    });
  }

  // Analytics methods
  async getAnalytics(timeframe: string = 'month') {
    return this.request(`/analytics/?timeframe=${timeframe}`);
  }

  async getTransparencyData() {
    return this.request('/transparency/');
  }
}

// Create API client instance
const apiClient = new APIClient(API_BASE_URL);

// Export specific API modules
export const authAPI = {
  sendOTP: (email: string) => apiClient.sendOTP(email),
  verifyOTP: (email: string, otp: string) => apiClient.verifyOTP(email, otp),
  validateToken: (token: string) => apiClient.validateToken(token),
};

export const feedbackAPI = {
  submit: (formData: FormData) => apiClient.submitFeedback(formData),
  get: (id: string) => apiClient.getFeedback(id),
  list: (params?: Record<string, any>) => apiClient.getFeedbackList(params),
  updateStatus: (id: string, status: string, response?: string) =>
    apiClient.updateFeedbackStatus(id, status, response),
};

export const analyticsAPI = {
  getAnalytics: (timeframe?: string) => apiClient.getAnalytics(timeframe),
  getTransparencyData: () => apiClient.getTransparencyData(),
};

export default apiClient;