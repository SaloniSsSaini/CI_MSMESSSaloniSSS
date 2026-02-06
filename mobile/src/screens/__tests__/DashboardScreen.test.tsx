import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { DashboardScreen } from '../DashboardScreen';
import { apiService } from '../../services/apiService';

// Mock the auth context
const mockAuthContext = {
  user: {
    msme: {
      companyName: 'Test Company',
    },
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
  isLoading: false,
};

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock the API service
jest.mock('../../services/apiService', () => ({
  apiService: {
    getDashboard: jest.fn(),
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading screen initially', () => {
    (apiService.getDashboard as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DashboardScreen navigation={mockNavigation} />);
    
    expect(screen.getByText('Loading your dashboard...')).toBeTruthy();
  });

  it('renders dashboard data when loaded successfully', async () => {
    const mockDashboardData = {
      currentScore: 75,
      lastAssessmentDate: '2024-01-15',
      currentMonthEmissions: 1000,
      totalTransactions: 25,
      categoryBreakdown: {
        energy: { co2Emissions: 400 },
        water: { co2Emissions: 300 },
        waste: { co2Emissions: 200 },
        transportation: { co2Emissions: 100 },
      },
      recentTransactions: [],
      topRecommendations: [],
    };

    (apiService.getDashboard as jest.Mock).mockResolvedValue({
      success: true,
      data: mockDashboardData,
    });

    render(<DashboardScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText('Welcome back, Test Company!')).toBeTruthy();
    });

    expect(screen.getByText('Carbon Score')).toBeTruthy();
    expect(screen.getByText('75')).toBeTruthy();
    expect(screen.getByText('This Month')).toBeTruthy();
    // QuickStatsCard abbreviates thousands (e.g. 1000 -> 1.0K)
    expect(screen.getByText('1.0K')).toBeTruthy();
  });

  it('renders error screen when API fails', async () => {
    (apiService.getDashboard as jest.Mock).mockResolvedValue({
      success: false,
      message: 'API Error',
    });

    render(<DashboardScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load dashboard')).toBeTruthy();
      expect(screen.getByText('API Error')).toBeTruthy();
    });
  });

  it('handles network error', async () => {
    (apiService.getDashboard as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(<DashboardScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText('Unable to load dashboard')).toBeTruthy();
      expect(screen.getByText('Network error. Please check your connection and try again.')).toBeTruthy();
    });
  });

  it('calls retry when retry button is pressed', async () => {
    (apiService.getDashboard as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        success: true,
        data: { currentScore: 75 },
      });

    render(<DashboardScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('Try Again'));

    await waitFor(() => {
      expect(screen.getByText('Welcome back, Test Company!')).toBeTruthy();
    });
  });

  it('navigates to transactions when FAB is pressed', async () => {
    const mockDashboardData = {
      currentScore: 75,
      lastAssessmentDate: '2024-01-15',
      currentMonthEmissions: 1000,
      totalTransactions: 25,
      categoryBreakdown: {},
      recentTransactions: [],
      topRecommendations: [],
    };

    (apiService.getDashboard as jest.Mock).mockResolvedValue({
      success: true,
      data: mockDashboardData,
    });

    render(<DashboardScreen navigation={mockNavigation} />);

    await waitFor(() => {
      expect(screen.getByText('Welcome back, Test Company!')).toBeTruthy();
    });

    // Find and press the FAB (this might need adjustment based on actual implementation)
    const fab = screen.getByTestId('fab-button') || screen.getByLabelText('Add transaction');
    if (fab) {
      fireEvent.press(fab);
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Transactions');
    }
  });
});