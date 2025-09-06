/**
 * Login Form Tests
 * Tests for login form validation, API integration, and role-based routing
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the API service
jest.mock('../services/api', () => ({
  apiService: {
    login: jest.fn(),
    isAuthenticated: jest.fn(() => false),
  },
}));

// Mock the auth context
const mockLogin = jest.fn();
const mockAuthContext = {
  user: null,
  appConfig: null,
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
  logout: jest.fn(),
  refreshUserProfile: jest.fn(),
  hasRole: jest.fn(),
  canAccessEndpoint: jest.fn(),
  getAccessibleCounties: jest.fn(() => []),
};

jest.mock('../contexts/AuthContext', () => ({
  ...jest.requireActual('../contexts/AuthContext'),
  useAuth: () => mockAuthContext,
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form with all required fields', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    expect(screen.getByLabelText(/national id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('validates national ID format', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const nationalIdInput = screen.getByLabelText(/national id/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Test empty national ID
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/national id is required/i)).toBeInTheDocument();
    });

    // Test invalid length
    fireEvent.change(nationalIdInput, { target: { value: '123' } });
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/national id must be exactly 8 digits/i)).toBeInTheDocument();
    });

    // Test non-numeric characters (should be filtered out)
    fireEvent.change(nationalIdInput, { target: { value: '12ab34cd' } });
    expect(nationalIdInput).toHaveValue('1234');
  });

  test('validates password field', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Test empty password
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  test('toggles password visibility', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const passwordInput = screen.getByLabelText(/password/i);
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Click to hide password again
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('submits form with valid data', async () => {
    const mockOnSuccess = jest.fn();
    mockLogin.mockResolvedValueOnce(undefined);

    render(
      <TestWrapper>
        <LoginForm onSuccess={mockOnSuccess} />
      </TestWrapper>
    );

    const nationalIdInput = screen.getByLabelText(/national id/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill in valid data
    fireEvent.change(nationalIdInput, { target: { value: '12345678' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('12345678', 'password123');
    });
  });

  test('handles login error', async () => {
    const mockOnError = jest.fn();
    const errorMessage = 'Invalid credentials';
    mockLogin.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <TestWrapper>
        <LoginForm onError={mockOnError} />
      </TestWrapper>
    );

    const nationalIdInput = screen.getByLabelText(/national id/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Fill in data
    fireEvent.change(nationalIdInput, { target: { value: '12345678' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });

    // Submit form
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(mockOnError).toHaveBeenCalledWith(errorMessage);
    });
  });

  test('shows loading state during submission', async () => {
    // Mock loading state
    mockAuthContext.isLoading = true;

    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('limits national ID input to 8 digits', () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const nationalIdInput = screen.getByLabelText(/national id/i);

    // Try to enter more than 8 digits
    fireEvent.change(nationalIdInput, { target: { value: '123456789012' } });

    // Should be limited to 8 digits
    expect(nationalIdInput).toHaveValue('12345678');
  });

  test('clears errors when user starts typing', async () => {
    render(
      <TestWrapper>
        <LoginForm />
      </TestWrapper>
    );

    const nationalIdInput = screen.getByLabelText(/national id/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Trigger validation error
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(screen.getByText(/national id is required/i)).toBeInTheDocument();
    });

    // Start typing - error should clear
    fireEvent.change(nationalIdInput, { target: { value: '1' } });
    expect(screen.queryByText(/national id is required/i)).not.toBeInTheDocument();
  });
});
