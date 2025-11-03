import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MSMERegistration from '../MSMERegistration';
import { act } from '@testing-library/react';

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

describe('MSMERegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders registration form with stepper', () => {
    renderWithProviders(<MSMERegistration />);
    
    expect(screen.getByText('MSME Registration')).toBeInTheDocument();
    expect(screen.getByText('Company Information')).toBeInTheDocument();
    expect(screen.getByText('MSME Registration Details')).toBeInTheDocument();
    expect(screen.getByText('Contact & Address')).toBeInTheDocument();
    expect(screen.getByText('Business Details')).toBeInTheDocument();
    expect(screen.getByText('Environmental Compliance')).toBeInTheDocument();
    expect(screen.getByText('Review & Submit')).toBeInTheDocument();
  });

  test('validates company information step', async () => {
    renderWithProviders(<MSMERegistration />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
      expect(screen.getByText('Company type is required')).toBeInTheDocument();
      expect(screen.getByText('Industry is required')).toBeInTheDocument();
      expect(screen.getByText('Establishment year is required')).toBeInTheDocument();
    });
  });

  test('validates MSME registration details step', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Fill company information
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('MSME Registration Details')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('UDYAM Registration Number is required')).toBeInTheDocument();
      expect(screen.getByText('GST Number is required')).toBeInTheDocument();
      expect(screen.getByText('PAN Number is required')).toBeInTheDocument();
    });
  });

  test('validates contact and address step', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Fill previous steps
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('UDYAM Registration Number'), { target: { value: validUdyamNumber } });
    fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: '12ABCDE1234F1Z5' } });
    fireEvent.change(screen.getByLabelText('PAN Number'), { target: { value: 'ABCDE1234F' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Contact & Address Information')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      expect(screen.getByText('Address is required')).toBeInTheDocument();
      expect(screen.getByText('City is required')).toBeInTheDocument();
      expect(screen.getByText('State is required')).toBeInTheDocument();
      expect(screen.getByText('Pincode is required')).toBeInTheDocument();
    });
  });

  test('validates business details step', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Fill previous steps
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    fireEvent.click(screen.getByText('Next'));
    
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
    
    await waitFor(() => {
      expect(screen.getByText('Business Details')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Annual turnover is required')).toBeInTheDocument();
      expect(screen.getByText('Number of employees is required')).toBeInTheDocument();
      expect(screen.getByText('Number of manufacturing units is required')).toBeInTheDocument();
      expect(screen.getByText('Primary products/services is required')).toBeInTheDocument();
    });
  });

  test('validates environmental compliance step', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Fill previous steps
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    fireEvent.click(screen.getByText('Next'));
    
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
    
    fireEvent.change(screen.getByLabelText('Annual Turnover (?)'), { target: { value: '1000000' } });
    fireEvent.change(screen.getByLabelText('Number of Employees'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Number of Manufacturing Units'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Primary Products/Services'), { target: { value: 'Test Products' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Environmental Compliance')).toBeInTheDocument();
    });
    
    // Environmental compliance checkboxes are optional, so we can proceed
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Review & Submit')).toBeInTheDocument();
    });
  });

  test('validates terms and conditions step', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Fill all previous steps
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    fireEvent.click(screen.getByText('Next'));
    
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
    
    fireEvent.change(screen.getByLabelText('Annual Turnover (?)'), { target: { value: '1000000' } });
    fireEvent.change(screen.getByLabelText('Number of Employees'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Number of Manufacturing Units'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Primary Products/Services'), { target: { value: 'Test Products' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Review & Submit')).toBeInTheDocument();
    });
    
    // Try to submit without checking terms
    fireEvent.click(screen.getByText('Submit Registration'));
    
    await waitFor(() => {
      expect(screen.getByText('You must agree to the terms and conditions')).toBeInTheDocument();
      expect(screen.getByText('You must agree to the data processing terms')).toBeInTheDocument();
    });
  });

  test('submits form successfully with valid data', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Fill all form fields
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    fireEvent.click(screen.getByText('Next'));
    
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
    
    fireEvent.change(screen.getByLabelText('Annual Turnover (?)'), { target: { value: '1000000' } });
    fireEvent.change(screen.getByLabelText('Number of Employees'), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText('Number of Manufacturing Units'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Primary Products/Services'), { target: { value: 'Test Products' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.click(screen.getByText('Next'));
    
    // Check terms and conditions
    fireEvent.click(screen.getByLabelText('I agree to the Terms and Conditions'));
    fireEvent.click(screen.getByLabelText('I agree to the data processing and privacy policy'));
    
    // Submit form
    fireEvent.click(screen.getByText('Submit Registration'));
    
    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });
    
    // Wait for submission to complete
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    }, { timeout: 3000 });
  });

  test('navigates back and forward between steps', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Fill first step
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('MSME Registration Details')).toBeInTheDocument();
    });
    
    // Go back
    fireEvent.click(screen.getByText('Back'));
    
    await waitFor(() => {
      expect(screen.getByText('Company Information')).toBeInTheDocument();
    });
    
    // Go forward again
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('MSME Registration Details')).toBeInTheDocument();
    });
  });

  test('disables back button on first step', () => {
    renderWithProviders(<MSMERegistration />);
    
    const backButton = screen.getByText('Back');
    expect(backButton).toBeDisabled();
  });

  test('shows submit button on last step', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Navigate to last step
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Next'));
    }
    
    await waitFor(() => {
      expect(screen.getByText('Submit Registration')).toBeInTheDocument();
    });
  });

  test('validates email format', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Navigate to contact step
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('UDYAM Registration Number'), { target: { value: validUdyamNumber } });
    fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: '12ABCDE1234F1Z5' } });
    fireEvent.change(screen.getByLabelText('PAN Number'), { target: { value: 'ABCDE1234F' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Enter invalid email
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
    });
  });

  test('validates phone number format', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Navigate to contact step
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('UDYAM Registration Number'), { target: { value: validUdyamNumber } });
    fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: '12ABCDE1234F1Z5' } });
    fireEvent.change(screen.getByLabelText('PAN Number'), { target: { value: 'ABCDE1234F' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Enter invalid phone number
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid phone number format')).toBeInTheDocument();
    });
  });

  test('validates pincode format', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Navigate to contact step
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    fireEvent.click(screen.getByText('Next'));
    
    fireEvent.change(screen.getByLabelText('UDYAM Registration Number'), { target: { value: validUdyamNumber } });
    fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: '12ABCDE1234F1Z5' } });
    fireEvent.change(screen.getByLabelText('PAN Number'), { target: { value: 'ABCDE1234F' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Enter invalid pincode
    fireEvent.change(screen.getByLabelText('Pincode'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid pincode format')).toBeInTheDocument();
    });
  });

  test('validates establishment year range', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Enter invalid year
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2030' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Year cannot be in the future')).toBeInTheDocument();
    });
  });

  test('validates UDYAM Registration Number format', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Fill company information
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Enter invalid UDYAM Registration Number
    fireEvent.change(screen.getByLabelText('UDYAM Registration Number'), { target: { value: 'INVALID' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid UDYAM Registration Number format')).toBeInTheDocument();
    });
  });

  test('validates GST Number format', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Fill company information
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Enter invalid GST Number
    fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: 'INVALID' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid GST Number format')).toBeInTheDocument();
    });
  });

  test('validates PAN Number format', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Fill company information
    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });
    fireEvent.mouseDown(screen.getByLabelText('Company Type'));
    fireEvent.click(screen.getByText('Micro Enterprise'));
    fireEvent.mouseDown(screen.getByLabelText('Industry'));
    fireEvent.click(screen.getByText('Manufacturing'));
    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });
    fireEvent.click(screen.getByText('Next'));
    
    // Enter invalid PAN Number
    fireEvent.change(screen.getByLabelText('PAN Number'), { target: { value: 'INVALID' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid PAN Number format')).toBeInTheDocument();
    });
  });
});
