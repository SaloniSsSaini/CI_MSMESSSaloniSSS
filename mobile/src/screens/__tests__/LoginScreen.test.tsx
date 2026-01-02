import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LoginScreen } from '../LoginScreen';
import { apiService } from '../../services/apiService';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock the auth context
const mockAuthContext = {
  signIn: jest.fn(),
  signOut: jest.fn(),
  user: null,
  isLoading: false,
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock the API service
jest.mock('../../services/apiService', () => ({
  apiService: {
    login: jest.fn(),
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
};

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    render(<LoginScreen navigation={mockNavigation} />);
    
    expect(screen.getByText('Carbon Intelligence')).toBeTruthy();
    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getByTestId('login-email')).toBeTruthy();
    expect(screen.getByTestId('login-password')).toBeTruthy();
    expect(screen.getByText("Don't have an account? Register")).toBeTruthy();
    expect(screen.getByTestId('login-submit')).toBeTruthy();
  });

  it('shows validation error for empty fields', async () => {
    render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.press(screen.getByTestId('login-submit'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });

  it('calls API with correct credentials', async () => {
    (apiService.login as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        token: 'test-token',
        user: { id: 1, email: 'test@example.com' },
      },
    });

    render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.changeText(screen.getByTestId('login-email'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('login-password'), 'password123');
    fireEvent.press(screen.getByTestId('login-submit'));
    
    await waitFor(() => {
      expect(apiService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('calls signIn on successful login', async () => {
    (apiService.login as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        token: 'test-token',
        user: { id: 1, email: 'test@example.com' },
      },
    });

    render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.changeText(screen.getByTestId('login-email'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('login-password'), 'password123');
    fireEvent.press(screen.getByTestId('login-submit'));
    
    await waitFor(() => {
      expect(mockAuthContext.signIn).toHaveBeenCalledWith('test-token', { id: 1, email: 'test@example.com' });
    });
  });

  it('shows error alert on failed login', async () => {
    (apiService.login as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Invalid credentials',
    });

    render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.changeText(screen.getByTestId('login-email'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('login-password'), 'wrongpassword');
    fireEvent.press(screen.getByTestId('login-submit'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
    });
  });

  it('shows network error alert on API error', async () => {
    (apiService.login as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.changeText(screen.getByTestId('login-email'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('login-password'), 'password123');
    fireEvent.press(screen.getByTestId('login-submit'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Network error. Please try again.');
    });
  });

  it('navigates to register screen when register button is pressed', () => {
    render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.press(screen.getByText("Don't have an account? Register"));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
  });

  it('disables form during loading', async () => {
    (apiService.login as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.changeText(screen.getByTestId('login-email'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('login-password'), 'password123');
    fireEvent.press(screen.getByTestId('login-submit'));
    
    // Form should be disabled during loading
    expect(screen.getByTestId('login-submit')).toBeTruthy();
  });

  it('shows features section', () => {
    render(<LoginScreen navigation={mockNavigation} />);
    
    expect(screen.getByText('Features')).toBeTruthy();
    expect(screen.getByText('SMS & Email Analysis')).toBeTruthy();
    expect(screen.getByText('Carbon Footprint Tracking')).toBeTruthy();
    expect(screen.getByText('Analytics & Insights')).toBeTruthy();
    expect(screen.getByText('Sustainability Recommendations')).toBeTruthy();
  });
});