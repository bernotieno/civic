// AuthService.ts
export interface User {
  id: string;
  email: string;
  username: string;
  token: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  username: string;
}

class AuthService {
  // Simulate API call delay
  private simulateApiCall = (ms: number): Promise<void> => 
    new Promise(resolve => setTimeout(resolve, ms));

  // Register function
  register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const { email, password, username } = credentials;

      // Validate inputs
      if (!email || !password || !username) {
        throw new Error('All fields are required');
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Simulate API call
      await this.simulateApiCall(1500);
      
      
      const response = await fetch(`http/register`, { // API endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
      

      // Simulate successful response
      return {
        success: true,
        message: 'Registration successful!',
        user: {
          id: Math.random().toString(36).substr(2, 9),
          email,
          username,
          token: 'simulated-jwt-token-' + Date.now()
        }
      };

    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  // Login function
  login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const { email, password } = credentials;

      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      // Simulate API call
      await this.simulateApiCall(1200);
      
      // Actual API call would look like:
      /*
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      return data;
      */

      // Simulate successful login
      if (password.length < 6) {
        throw new Error('Invalid credentials');
      }

      return {
        success: true,
        message: 'Login successful!',
        user: {
          id: Math.random().toString(36).substr(2, 9),
          email,
          username: email.split('@')[0],
          token: 'simulated-jwt-token-' + Date.now()
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  logout = async (): Promise<{ success: boolean; message: string }> => {
    try {
      // Clear stored tokens
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Check if user is logged in
  checkAuthStatus = async (): Promise<boolean> => {
    try {
      // Check if token exists
      return false;
    } catch (error) {
      console.error('Auth status check error:', error);
      return false;
    }
  };
}

export default new AuthService();