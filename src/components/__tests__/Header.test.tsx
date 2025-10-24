import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Header from '../Header';

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Mock useNavigate and useLocation
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/dashboard' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders header with logo and brand name', () => {
    renderWithProviders(<Header />);
    
    expect(screen.getByText('Carbon Intelligence')).toBeInTheDocument();
    expect(screen.getByText('MSME Platform')).toBeInTheDocument();
  });

  test('renders eco icon', () => {
    renderWithProviders(<Header />);
    
    const ecoIcon = document.querySelector('[data-testid="EcoIcon"]') || 
                   document.querySelector('svg[data-testid="EcoIcon"]') ||
                   document.querySelector('svg');
    expect(ecoIcon).toBeInTheDocument();
  });

  test('renders all navigation items', () => {
    renderWithProviders(<Header />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Carbon Assessment')).toBeInTheDocument();
    expect(screen.getByText('Carbon Savings')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Incentives')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('Green Loans')).toBeInTheDocument();
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Data Privacy')).toBeInTheDocument();
  });

  test('navigates to dashboard when logo is clicked', () => {
    renderWithProviders(<Header />);
    
    const logo = screen.getByText('Carbon Intelligence').closest('div');
    fireEvent.click(logo!);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  test('navigates to correct page when navigation item is clicked', () => {
    renderWithProviders(<Header />);
    
    fireEvent.click(screen.getByText('Carbon Assessment'));
    expect(mockNavigate).toHaveBeenCalledWith('/carbon-footprint');
    
    fireEvent.click(screen.getByText('Recommendations'));
    expect(mockNavigate).toHaveBeenCalledWith('/recommendations');
  });

  test('opens user menu when avatar is clicked', () => {
    renderWithProviders(<Header />);
    
    const avatar = screen.getByRole('button');
    fireEvent.click(avatar);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('closes user menu when clicking outside', () => {
    renderWithProviders(<Header />);
    
    const avatar = screen.getByRole('button');
    fireEvent.click(avatar);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Click outside the menu
    fireEvent.click(document.body);
    
    // Menu should be closed (items not visible)
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  test('navigates to correct page from user menu', () => {
    renderWithProviders(<Header />);
    
    const avatar = screen.getByRole('button');
    fireEvent.click(avatar);
    
    fireEvent.click(screen.getByText('Settings'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  test('highlights active navigation item', () => {
    // Mock location to be on carbon-footprint page
    jest.mocked(useLocation).mockReturnValue({ pathname: '/carbon-footprint' } as any);
    
    renderWithProviders(<Header />);
    
    const carbonAssessmentItem = screen.getByText('Carbon Assessment').closest('div');
    expect(carbonAssessmentItem).toHaveStyle('background-color: rgba(255, 255, 255, 0.2)');
  });

  test('shows user avatar', () => {
    renderWithProviders(<Header />);
    
    const avatar = screen.getByRole('button');
    expect(avatar).toBeInTheDocument();
  });

  test('handles menu close when navigation item is clicked', () => {
    renderWithProviders(<Header />);
    
    const avatar = screen.getByRole('button');
    fireEvent.click(avatar);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Dashboard'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    // Menu should be closed after navigation
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });

  test('renders navigation items with correct icons', () => {
    renderWithProviders(<Header />);
    
    // Check that icons are rendered (they should be SVG elements)
    const iconElements = document.querySelectorAll('svg');
    expect(iconElements.length).toBeGreaterThan(0);
  });

  test('applies correct styling to active navigation item', () => {
    // Mock location to be on dashboard page
    jest.mocked(useLocation).mockReturnValue({ pathname: '/dashboard' } as any);
    
    renderWithProviders(<Header />);
    
    const dashboardItem = screen.getByText('Dashboard').closest('div');
    expect(dashboardItem).toHaveStyle('background-color: rgba(255, 255, 255, 0.2)');
  });

  test('applies hover styling to navigation items', () => {
    renderWithProviders(<Header />);
    
    const recommendationsItem = screen.getByText('Recommendations').closest('div');
    expect(recommendationsItem).toHaveStyle('transition: all 0.2s ease');
  });

  test('renders header with correct background gradient', () => {
    renderWithProviders(<Header />);
    
    const appBar = document.querySelector('.MuiAppBar-root');
    expect(appBar).toHaveStyle('background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)');
  });

  test('handles multiple rapid clicks on navigation items', () => {
    renderWithProviders(<Header />);
    
    const carbonAssessment = screen.getByText('Carbon Assessment');
    
    // Click multiple times rapidly
    fireEvent.click(carbonAssessment);
    fireEvent.click(carbonAssessment);
    fireEvent.click(carbonAssessment);
    
    // Should only navigate once per click
    expect(mockNavigate).toHaveBeenCalledTimes(3);
  });

  test('renders user menu with correct styling', () => {
    renderWithProviders(<Header />);
    
    const avatar = screen.getByRole('button');
    fireEvent.click(avatar);
    
    const menu = document.querySelector('.MuiMenu-root');
    expect(menu).toBeInTheDocument();
  });
});
