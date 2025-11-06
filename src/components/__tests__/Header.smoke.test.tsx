import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Header from '../Header';

const theme = createTheme();

jest.mock('../../context/RegistrationContext', () => ({
  useRegistration: () => ({
    isRegistered: true,
    hasCompletedRegistration: true,
    registrationData: null,
    completeRegistration: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    resetRegistration: jest.fn(),
  }),
}));

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

  test('renders brand name and navigation links', () => {
    renderWithProviders(<Header />);

    expect(screen.getByText('Carbon Intelligence')).toBeInTheDocument();
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Carbon Assessment').length).toBeGreaterThan(0);
  });

  test('navigates when primary navigation items are clicked', () => {
    renderWithProviders(<Header />);

    fireEvent.click(screen.getAllByText('Carbon Assessment')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/carbon-footprint');

    fireEvent.click(screen.getAllByText('Recommendations')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/recommendations');
  });

  test('opens user menu and triggers navigation actions', () => {
    renderWithProviders(<Header />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByText('Dashboard')[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
