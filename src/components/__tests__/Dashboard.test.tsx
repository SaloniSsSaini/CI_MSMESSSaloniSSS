import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Dashboard from '../Dashboard';

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
    
    expect(screen.getByText('No MSME registration found. Please complete the registration first.')).toBeInTheDocument();
    expect(screen.getByText('Register Now')).toBeInTheDocument();
  });

  test('displays MSME data when available', () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing',
      udyogAadharNumber: 'AB12CD3456',
      gstNumber: '12ABCDE1234F1Z5',
      annualTurnover: 1000000,
      numberOfEmployees: 50,
      manufacturingUnits: 2
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText('Welcome back, Test Company!')).toBeInTheDocument();
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('MICRO')).toBeInTheDocument();
    expect(screen.getByText('manufacturing')).toBeInTheDocument();
    expect(screen.getByText('AB12CD3456')).toBeInTheDocument();
    expect(screen.getByText('12ABCDE1234F1Z5')).toBeInTheDocument();
  });

  test('displays business metrics correctly', () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing',
      udyogAadharNumber: 'AB12CD3456',
      gstNumber: '12ABCDE1234F1Z5',
      annualTurnover: 1000000,
      numberOfEmployees: 50,
      manufacturingUnits: 2
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText('₹1,000,000')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('shows carbon score calculation loading state', () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing',
      udyogAadharNumber: 'AB12CD3456',
      gstNumber: '12ABCDE1234F1Z5',
      annualTurnover: 1000000,
      numberOfEmployees: 50,
      manufacturingUnits: 2
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText('Calculating your carbon footprint...')).toBeInTheDocument();
  });

  test('displays quick action cards', () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing',
      udyogAadharNumber: 'AB12CD3456',
      gstNumber: '12ABCDE1234F1Z5',
      annualTurnover: 1000000,
      numberOfEmployees: 50,
      manufacturingUnits: 2
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Dashboard />);
    
    expect(screen.getByText('Carbon Assessment')).toBeInTheDocument();
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Manufacturing Units')).toBeInTheDocument();
    expect(screen.getByText('Progress Tracking')).toBeInTheDocument();
  });

  test('navigates to carbon footprint page when Start Assessment is clicked', () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing',
      udyogAadharNumber: 'AB12CD3456',
      gstNumber: '12ABCDE1234F1Z5',
      annualTurnover: 1000000,
      numberOfEmployees: 50,
      manufacturingUnits: 2
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Dashboard />);
    
    const startAssessmentButton = screen.getByText('Start Assessment');
    fireEvent.click(startAssessmentButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/carbon-footprint');
  });

  test('navigates to recommendations page when View Recommendations is clicked', () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing',
      udyogAadharNumber: 'AB12CD3456',
      gstNumber: '12ABCDE1234F1Z5',
      annualTurnover: 1000000,
      numberOfEmployees: 50,
      manufacturingUnits: 2
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Dashboard />);
    
    const viewRecommendationsButton = screen.getByText('View Recommendations');
    fireEvent.click(viewRecommendationsButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/recommendations');
  });
});