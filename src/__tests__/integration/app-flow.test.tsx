import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from '../../App';

const theme = createTheme();

const validUdyamNumber = 'UDYAM-KR-03-0593459';

const renderWithProviders = (
  component: React.ReactElement,
  options: { initialEntries?: string[] } = {}
) => {
  return render(
    <MemoryRouter initialEntries={options.initialEntries}>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Complete MSME Registration Flow', () => {
    test('completes full MSME registration process', async () => {
      renderWithProviders(<App />);
      
      // Should start with MSME registration
      expect(screen.getByText('MSME Registration')).toBeInTheDocument();
      
      // Fill company information
      fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
      fireEvent.mouseDown(screen.getByLabelText('Company Type'));
      fireEvent.click(screen.getByText('Micro Enterprise'));
      fireEvent.mouseDown(screen.getByLabelText('Industry'));
      fireEvent.click(screen.getByText('Manufacturing'));
      fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
      fireEvent.click(screen.getByText('Next'));
      
      // Fill MSME registration details
      await waitFor(() => {
        expect(screen.getByText('MSME Registration Details')).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByLabelText('UDYAM Registration Number'), { target: { value: validUdyamNumber } });
      fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: '12ABCDE1234F1Z5' } });
      fireEvent.change(screen.getByLabelText('PAN Number'), { target: { value: 'ABCDE1234F' } });
      fireEvent.click(screen.getByText('Next'));
      
      // Fill contact and address
      await waitFor(() => {
        expect(screen.getByText('Contact & Address Information')).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '9876543210' } });
      fireEvent.change(screen.getByLabelText('Address'), { target: { value: '123 Test Street' } });
      fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Mumbai' } });
      fireEvent.change(screen.getByLabelText('State'), { target: { value: 'Maharashtra' } });
      fireEvent.change(screen.getByLabelText('Pincode'), { target: { value: '400001' } });
      fireEvent.click(screen.getByText('Next'));
      
      // Fill business details
      await waitFor(() => {
        expect(screen.getByText('Business Details')).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByLabelText('Annual Turnover (₹)'), { target: { value: '1000000' } });
      fireEvent.change(screen.getByLabelText('Number of Employees'), { target: { value: '50' } });
      fireEvent.change(screen.getByLabelText('Number of Manufacturing Units'), { target: { value: '2' } });
      fireEvent.change(screen.getByLabelText('Primary Products/Services'), { target: { value: 'Test Products' } });
      fireEvent.click(screen.getByText('Next'));
      
      // Environmental compliance (optional)
      await waitFor(() => {
        expect(screen.getByText('Environmental Compliance')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Next'));
      
      // Review and submit
      await waitFor(() => {
        expect(screen.getByText('Review & Submit')).toBeInTheDocument();
      });
      
      // Check terms and conditions
      fireEvent.click(screen.getByLabelText('I agree to the Terms and Conditions'));
      fireEvent.click(screen.getByLabelText('I agree to the data processing and privacy policy'));
      
      // Submit registration
      fireEvent.click(screen.getByText('Submit Registration'));
      
      await waitFor(() => {
        expect(screen.getByText("You're all set!")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Go to Dashboard'));

      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test Company!')).toBeInTheDocument();
      });
    });

    test('validates all form fields during registration', async () => {
      renderWithProviders(<App />);
      
      // Try to submit without filling any fields
      fireEvent.click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
        expect(screen.getByText('Company type is required')).toBeInTheDocument();
        expect(screen.getByText('Industry is required')).toBeInTheDocument();
        expect(screen.getByText('Establishment year is required')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Flow', () => {
    test('navigates between all main sections', async () => {
      // Set up MSME data for navigation
      const mockMSMEData = {
        companyName: 'Test Company',
        companyType: 'micro',
        industry: 'manufacturing',
        udyamRegistrationNumber: validUdyamNumber,
        gstNumber: '12ABCDE1234F1Z5',
        annualTurnover: 1000000,
        numberOfEmployees: 50,
        manufacturingUnits: 2
      };
      
      localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
      
      renderWithProviders(<App />);
      
      // Navigate to dashboard
      fireEvent.click(screen.getByText('Dashboard'));
      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test Company!')).toBeInTheDocument();
      });
      
      // Navigate to carbon footprint
      fireEvent.click(screen.getByText('Carbon Assessment'));
      await waitFor(() => {
        expect(screen.getByText('Carbon Footprint Assessment')).toBeInTheDocument();
      });
      
      // Navigate to carbon savings
      fireEvent.click(screen.getByText('Carbon Savings'));
      await waitFor(() => {
        expect(screen.getByText('Carbon Savings Dashboard')).toBeInTheDocument();
      });
      
      // Navigate to recommendations
      fireEvent.click(screen.getByText('Recommendations'));
      await waitFor(() => {
        expect(screen.getByText('Sustainable Manufacturing Recommendations')).toBeInTheDocument();
      });
    });
  });

  describe('Carbon Assessment Flow', () => {
    test('completes carbon footprint assessment', async () => {
      const mockMSMEData = {
        companyName: 'Test Company',
        companyType: 'micro',
        industry: 'manufacturing'
      };
      
      localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
      
      renderWithProviders(<App />);
      
      // Navigate to carbon footprint
      fireEvent.click(screen.getByText('Carbon Assessment'));
      
      await waitFor(() => {
        expect(screen.getByText('Carbon Footprint Assessment')).toBeInTheDocument();
      });
      
      // Fill energy consumption
      fireEvent.change(screen.getByLabelText('Monthly Electricity Consumption (kWh)'), { target: { value: '1000' } });
      fireEvent.mouseDown(screen.getByLabelText('Electricity Source'));
      fireEvent.click(screen.getByText('Grid (Coal-based)'));
      fireEvent.change(screen.getByLabelText('Monthly Fuel Consumption (Liters)'), { target: { value: '500' } });
      fireEvent.mouseDown(screen.getByLabelText('Fuel Type'));
      fireEvent.click(screen.getByText('Diesel'));
      fireEvent.click(screen.getByText('Next'));
      
      // Fill water and waste
      await waitFor(() => {
        expect(screen.getByText('Water Usage & Waste Management')).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByLabelText('Monthly Water Consumption (Liters)'), { target: { value: '10000' } });
      fireEvent.change(screen.getByLabelText('Monthly Solid Waste Generated (kg)'), { target: { value: '100' } });
      fireEvent.change(screen.getByLabelText('Waste Recycling Rate (%)'), { target: { value: '50' } });
      fireEvent.change(screen.getByLabelText('Monthly Hazardous Waste Generated (kg)'), { target: { value: '10' } });
      fireEvent.click(screen.getByText('Next'));
      
      // Fill transportation
      await waitFor(() => {
        expect(screen.getByText('Transportation')).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByLabelText('Number of Vehicles'), { target: { value: '2' } });
      fireEvent.change(screen.getByLabelText('Average Monthly Distance per Vehicle (km)'), { target: { value: '1000' } });
      fireEvent.change(screen.getByLabelText('Fuel Efficiency (km/liter)'), { target: { value: '10' } });
      fireEvent.click(screen.getByText('Next'));
      
      // Fill raw materials
      await waitFor(() => {
        expect(screen.getByText('Raw Materials')).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByLabelText('Monthly Raw Material Consumption (kg)'), { target: { value: '1000' } });
      fireEvent.mouseDown(screen.getByLabelText('Primary Material Type'));
      fireEvent.click(screen.getByText('Steel'));
      fireEvent.change(screen.getByLabelText('Average Supplier Distance (km)'), { target: { value: '100' } });
      fireEvent.click(screen.getByText('Next'));
      
      // Fill manufacturing process
      await waitFor(() => {
        expect(screen.getByText('Manufacturing Process')).toBeInTheDocument();
      });
      
      fireEvent.change(screen.getByLabelText('Monthly Production Volume (units)'), { target: { value: '1000' } });
      fireEvent.change(screen.getByLabelText('Process Efficiency (%)'), { target: { value: '80' } });
      fireEvent.change(screen.getByLabelText('Average Equipment Age (years)'), { target: { value: '5' } });
      fireEvent.click(screen.getByText('Next'));
      
      // Fill environmental controls
      await waitFor(() => {
        expect(screen.getByText('Environmental Controls')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByLabelText('Air Pollution Control Systems'));
      fireEvent.click(screen.getByLabelText('Water Pollution Control Systems'));
      fireEvent.click(screen.getByLabelText('Noise Control Measures'));
      fireEvent.click(screen.getByLabelText('Energy Efficient Equipment'));
      
      // Calculate carbon footprint
      fireEvent.click(screen.getByText('Calculate'));
      
      await waitFor(() => {
        expect(screen.getByText('Calculating your carbon footprint...')).toBeInTheDocument();
      });
      
      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Carbon Footprint Results')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Error Handling', () => {
    test('handles navigation errors gracefully', async () => {
      renderWithProviders(<App />, { initialEntries: ['/carbon-footprint'] });

      await waitFor(() => {
        expect(screen.getByText('MSME Registration')).toBeInTheDocument();
      });

      expect(screen.getByText('Complete registration to unlock all platform features.')).toBeInTheDocument();
    });

    test('handles form validation errors', async () => {
      renderWithProviders(<App />);
      
      // Fill invalid data
      fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: '' } });
      fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2030' } });
      fireEvent.click(screen.getByText('Next'));
      
      await waitFor(() => {
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
        expect(screen.getByText('Year cannot be in the future')).toBeInTheDocument();
      });
    });
  });

  describe('Data Persistence', () => {
    test('persists MSME registration data', async () => {
      renderWithProviders(<App />);
      
      // Complete registration
      fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
      fireEvent.mouseDown(screen.getByLabelText('Company Type'));
      fireEvent.click(screen.getByText('Micro Enterprise'));
      fireEvent.mouseDown(screen.getByLabelText('Industry'));
      fireEvent.click(screen.getByText('Manufacturing'));
      fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
      fireEvent.click(screen.getByText('Next'));
      
      // Fill remaining steps quickly
      fireEvent.change(screen.getByLabelText('UDYAM Registration Number'), { target: { value: validUdyamNumber } });
      fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: '12ABCDE1234F1Z5' } });
      fireEvent.change(screen.getByLabelText('PAN Number'), { target: { value: 'ABCDE1234F' } });
      fireEvent.click(screen.getByText('Next'));
      
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '9876543210' } });
      fireEvent.change(screen.getByLabelText('Address'), { target: { value: '123 Test Street' } });
      fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Mumbai' } });
      fireEvent.change(screen.getByLabelText('State'), { target: { value: 'Maharashtra' } });
      fireEvent.change(screen.getByLabelText('Pincode'), { target: { value: '400001' } });
      fireEvent.click(screen.getByText('Next'));
      
      fireEvent.change(screen.getByLabelText('Annual Turnover (₹)'), { target: { value: '1000000' } });
      fireEvent.change(screen.getByLabelText('Number of Employees'), { target: { value: '50' } });
      fireEvent.change(screen.getByLabelText('Number of Manufacturing Units'), { target: { value: '2' } });
      fireEvent.change(screen.getByLabelText('Primary Products/Services'), { target: { value: 'Test Products' } });
      fireEvent.click(screen.getByText('Next'));
      
      fireEvent.click(screen.getByText('Next'));
      
      fireEvent.click(screen.getByLabelText('I agree to the Terms and Conditions'));
      fireEvent.click(screen.getByLabelText('I agree to the data processing and privacy policy'));
      fireEvent.click(screen.getByText('Submit Registration'));
      
      // Check that data is persisted
      const savedData = localStorage.getItem('msmeRegistration');
      expect(savedData).toBeTruthy();
      
      const parsedData = JSON.parse(savedData!);
      expect(parsedData.companyName).toBe('Test Company');
      expect(parsedData.companyType).toBe('micro');
      expect(parsedData.industry).toBe('manufacturing');
    });
  });

  describe('Responsive Design', () => {
    test('renders correctly on different screen sizes', () => {
      renderWithProviders(<App />);
      
      // Test mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      window.dispatchEvent(new Event('resize'));
      
      expect(screen.getByText('MSME Registration')).toBeInTheDocument();
      
      // Test desktop view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      
      window.dispatchEvent(new Event('resize'));
      
      expect(screen.getByText('MSME Registration')).toBeInTheDocument();
    });
  });
});
