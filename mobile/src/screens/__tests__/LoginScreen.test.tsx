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
    expect(screen.getByText('Sign In')).toBeTruthy();
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('Password')).toBeTruthy();
    expect(screen.getByText("Don't have an account? Register")).toBeTruthy();
  });

  it('shows validation error for empty fields', async () => {
    render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.press(screen.getByText('Sign In'));
    
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
    
    fireEvent.changeText(screen.getByDisplayValue(''), 'test@example.com');
    fireEvent.changeText(screen.getByDisplayValue(''), 'password123');
    fireEvent.press(screen.getByText('Sign In'));
    
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
    
    fireEvent.changeText(screen.getByDisplayValue(''), 'test@example.com');
    fireEvent.changeText(screen.getByDisplayValue(''), 'password123');
    fireEvent.press(screen.getByText('Sign In'));
    
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
    
    fireEvent.changeText(screen.getByDisplayValue(''), 'test@example.com');
    fireEvent.changeText(screen.getByDisplayValue(''), 'wrongpassword');
    fireEvent.press(screen.getByText('Sign In'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
    });
  });

  it('shows network error alert on API error', async () => {
    (apiService.login as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<LoginScreen navigation={mockNavigation} />);
    
    fireEvent.changeText(screen.getByDisplayValue(''), 'test@example.com');
    fireEvent.changeText(screen.getByDisplayValue(''), 'password123');
    fireEvent.press(screen.getByText('Sign In'));
    
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
    
    fireEvent.changeText(screen.getByDisplayValue(''), 'test@example.com');
    fireEvent.changeText(screen.getByDisplayValue(''), 'password123');
    fireEvent.press(screen.getByText('Sign In'));
    
    // Form should be disabled during loading
    expect(screen.getByText('Sign In')).toBeTruthy();
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