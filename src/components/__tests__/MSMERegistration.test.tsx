import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MSMERegistration from '../MSMERegistration';
import { act } from '@testing-library/react';

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

describe('MSMERegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders registration form with all required fields', () => {
    renderWithProviders(<MSMERegistration />);
    
    expect(screen.getByText('MSME Registration')).toBeInTheDocument();
    expect(screen.getByText('Company Information')).toBeInTheDocument();
    expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
    expect(screen.getByText('Company Type')).toBeInTheDocument();
    expect(screen.getByText('Industry')).toBeInTheDocument();
    expect(screen.getByLabelText('Establishment Year')).toBeInTheDocument();
  });

  test('validates required fields on next button click', async () => {
    renderWithProviders(<MSMERegistration />);
    
    const nextButton = screen.getByText('Next');
    
    await act(async () => {
      fireEvent.click(nextButton);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Company name is required')).toBeInTheDocument();
      expect(screen.getByText('Company type is required')).toBeInTheDocument();
      expect(screen.getByText('Industry is required')).toBeInTheDocument();
      expect(screen.getByText('Establishment year is required')).toBeInTheDocument();
    });
  });

  test('validates Udyog Aadhar Number format', async () => {
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
    
    // Test invalid Udyog Aadhar format
    fireEvent.change(screen.getByLabelText('Udyog Aadhar Number'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid Udyog Aadhar Number format')).toBeInTheDocument();
    });
  });

  test('validates GST Number format', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Navigate to MSME details step
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
    
    // Test invalid GST format
    fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid GST Number format')).toBeInTheDocument();
    });
  });

  test('validates PAN Number format', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Navigate to MSME details step
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
    
    // Test invalid PAN format
    fireEvent.change(screen.getByLabelText('PAN Number'), { target: { value: 'invalid' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid PAN Number format')).toBeInTheDocument();
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
    
    // Fill MSME details
    fireEvent.change(screen.getByLabelText('Udyog Aadhar Number'), { target: { value: 'AB12CD3456' } });
    fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: '12ABCDE1234F1Z5' } });
    fireEvent.change(screen.getByLabelText('PAN Number'), { target: { value: 'ABCDE1234F' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Contact & Address Information')).toBeInTheDocument();
    });
    
    // Test invalid email
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
    
    // Fill MSME details
    fireEvent.change(screen.getByLabelText('Udyog Aadhar Number'), { target: { value: 'AB12CD3456' } });
    fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: '12ABCDE1234F1Z5' } });
    fireEvent.change(screen.getByLabelText('PAN Number'), { target: { value: 'ABCDE1234F' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Contact & Address Information')).toBeInTheDocument();
    });
    
    // Test invalid phone
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
    
    // Fill MSME details
    fireEvent.change(screen.getByLabelText('Udyog Aadhar Number'), { target: { value: 'AB12CD3456' } });
    fireEvent.change(screen.getByLabelText('GST Number'), { target: { value: '12ABCDE1234F1Z5' } });
    fireEvent.change(screen.getByLabelText('PAN Number'), { target: { value: 'ABCDE1234F' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Contact & Address Information')).toBeInTheDocument();
    });
    
    // Test invalid pincode
    fireEvent.change(screen.getByLabelText('Pincode'), { target: { value: '123' } });
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid pincode format')).toBeInTheDocument();
    });
  });

  test('validates terms and conditions agreement', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Navigate to final step
    const steps = [
      { companyName: 'Test Company', companyType: 'Micro Enterprise', industry: 'Manufacturing', establishmentYear: '2020' },
      { udyogAadharNumber: 'AB12CD3456', gstNumber: '12ABCDE1234F1Z5', panNumber: 'ABCDE1234F' },
      { email: 'test@example.com', phone: '9876543210', address: 'Test Address', city: 'Test City', state: 'Test State', pincode: '123456', country: 'India' },
      { annualTurnover: '1000000', numberOfEmployees: '50', manufacturingUnits: '2', primaryProducts: 'Test Products' },
      { hasEnvironmentalClearance: true, hasPollutionControlBoard: true, hasWasteManagement: true }
    ];
    
    // Fill all steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      Object.entries(step).forEach(([key, value]) => {
        const field = screen.getByLabelText(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
        if (field.tagName === 'INPUT') {
          fireEvent.change(field, { target: { value } });
        } else if (field.tagName === 'DIV' && field.getAttribute('role') === 'button') {
          fireEvent.mouseDown(field);
          fireEvent.click(screen.getByText(value));
        }
      });
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText(/Review & Submit|Environmental Compliance|Business Details|Contact & Address Information|MSME Registration Details/)).toBeInTheDocument();
      });
    }
    
    // Test terms validation
    fireEvent.click(screen.getByText('Submit Registration'));
    
    await waitFor(() => {
      expect(screen.getByText('You must agree to the terms and conditions')).toBeInTheDocument();
      expect(screen.getByText('You must agree to the data processing terms')).toBeInTheDocument();
    });
  });

  test('submits form successfully with valid data', async () => {
    renderWithProviders(<MSMERegistration />);
    
    // Fill all steps with valid data
    const steps = [
      { companyName: 'Test Company', companyType: 'Micro Enterprise', industry: 'Manufacturing', establishmentYear: '2020' },
      { udyogAadharNumber: 'AB12CD3456', gstNumber: '12ABCDE1234F1Z5', panNumber: 'ABCDE1234F' },
      { email: 'test@example.com', phone: '9876543210', address: 'Test Address', city: 'Test City', state: 'Test State', pincode: '123456', country: 'India' },
      { annualTurnover: '1000000', numberOfEmployees: '50', manufacturingUnits: '2', primaryProducts: 'Test Products' },
      { hasEnvironmentalClearance: true, hasPollutionControlBoard: true, hasWasteManagement: true }
    ];
    
    // Fill all steps
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      Object.entries(step).forEach(([key, value]) => {
        const field = screen.getByLabelText(key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()));
        if (field.tagName === 'INPUT') {
          fireEvent.change(field, { target: { value } });
        } else if (field.tagName === 'DIV' && field.getAttribute('role') === 'button') {
          fireEvent.mouseDown(field);
          fireEvent.click(screen.getByText(value));
        }
      });
      fireEvent.click(screen.getByText('Next'));
      await waitFor(() => {
        expect(screen.getByText(/Review & Submit|Environmental Compliance|Business Details|Contact & Address Information|MSME Registration Details/)).toBeInTheDocument();
      });
    }
    
    // Agree to terms
    fireEvent.click(screen.getByLabelText('I agree to the Terms and Conditions'));
    fireEvent.click(screen.getByLabelText('I agree to the data processing and privacy policy'));
    
    // Submit form
    fireEvent.click(screen.getByText('Submit Registration'));
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('navigates between steps correctly', async () => {
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
  });
});