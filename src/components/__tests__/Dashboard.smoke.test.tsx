import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard from '../Dashboard';

const theme = createTheme();

const validUdyamNumber = 'UDYAM-KR-03-0593459';

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('shows registration prompt when no MSME data exists', () => {
    renderWithProviders(<Dashboard />);

    expect(
      screen.getByText('No MSME registration found. Please complete the registration first.')
    ).toBeInTheDocument();
    expect(screen.getByText('Register Now')).toBeInTheDocument();
  });

  test('renders overview and quick actions when MSME data is available', () => {
    localStorage.setItem(
      'msmeRegistration',
      JSON.stringify({
        companyName: 'Test Company',
        companyType: 'micro',
        industry: 'manufacturing',
        udyamRegistrationNumber: validUdyamNumber,
        gstNumber: '12ABCDE1234F1Z5',
        annualTurnover: 1000000,
        numberOfEmployees: 50,
        manufacturingUnits: 2,
      })
    );

    renderWithProviders(<Dashboard />);

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    expect(screen.getByText(validUdyamNumber)).toBeInTheDocument();
    expect(screen.getByText('Carbon Assessment')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Start Assessment'));
    expect(mockNavigate).toHaveBeenCalledWith('/carbon-footprint');
  });

  test('navigates to recommendations from quick actions', () => {
    localStorage.setItem(
      'msmeRegistration',
      JSON.stringify({
        companyName: 'Test Company',
        companyType: 'micro',
        industry: 'manufacturing',
        udyamRegistrationNumber: validUdyamNumber,
        gstNumber: '12ABCDE1234F1Z5',
        annualTurnover: 1000000,
        numberOfEmployees: 50,
        manufacturingUnits: 2,
      })
    );

    renderWithProviders(<Dashboard />);

    fireEvent.click(screen.getByText('View Recommendations'));
    expect(mockNavigate).toHaveBeenCalledWith('/recommendations');
  });
});