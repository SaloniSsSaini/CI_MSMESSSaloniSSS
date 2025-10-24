import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CarbonSavings from '../CarbonSavings';

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

describe('CarbonSavings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('shows registration prompt when no MSME data exists', () => {
    renderWithProviders(<CarbonSavings />);
    
    expect(screen.getByText('Please complete MSME registration first to access carbon savings tracking.')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    expect(screen.getByText('Loading carbon savings data...')).toBeInTheDocument();
  });

  test('displays carbon savings data after loading', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Carbon Savings Dashboard')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Total Carbon Savings')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('Savings Progress')).toBeInTheDocument();
  });

  test('displays savings metrics', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Carbon Savings Dashboard')).toBeInTheDocument();
    });
    
    // Check for savings amounts (they should be displayed as numbers)
    expect(screen.getByText(/kg CO₂/)).toBeInTheDocument();
    expect(screen.getByText(/₹/)).toBeInTheDocument();
  });

  test('displays achievements section', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Achievements')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Energy Efficiency')).toBeInTheDocument();
    expect(screen.getByText('Waste Reduction')).toBeInTheDocument();
  });

  test('displays recommendations section', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Top Recommendations')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Switch to LED Lighting')).toBeInTheDocument();
    expect(screen.getByText('Install Solar Panels')).toBeInTheDocument();
  });

  test('displays savings history chart', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Savings History')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Monthly Carbon Savings')).toBeInTheDocument();
  });

  test('displays category breakdown', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Savings by Category')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
    expect(screen.getByText('Waste')).toBeInTheDocument();
  });

  test('displays progress indicators', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Savings Progress')).toBeInTheDocument();
    });
    
    // Check for progress bars
    const progressBars = document.querySelectorAll('.MuiLinearProgress-root');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  test('displays savings targets', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Savings Targets')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Annual Target')).toBeInTheDocument();
    expect(screen.getByText('Monthly Target')).toBeInTheDocument();
  });

  test('displays environmental impact metrics', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Environmental Impact')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Trees Planted Equivalent')).toBeInTheDocument();
    expect(screen.getByText('Cars Off Road Equivalent')).toBeInTheDocument();
  });

  test('displays cost savings information', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Cost Savings')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Total Savings')).toBeInTheDocument();
    expect(screen.getByText('Monthly Savings')).toBeInTheDocument();
  });

  test('displays comparison with industry average', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Industry Comparison')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Your Performance')).toBeInTheDocument();
    expect(screen.getByText('Industry Average')).toBeInTheDocument();
  });

  test('displays next steps section', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Next Steps')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Continue implementing recommendations')).toBeInTheDocument();
    expect(screen.getByText('Track progress regularly')).toBeInTheDocument();
  });

  test('displays refresh button', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Carbon Savings Dashboard')).toBeInTheDocument();
    });
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    expect(refreshButton).toBeInTheDocument();
  });

  test('handles refresh button click', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Carbon Savings Dashboard')).toBeInTheDocument();
    });
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i });
    fireEvent.click(refreshButton);
    
    // Should show loading state after refresh
    expect(screen.getByText('Loading carbon savings data...')).toBeInTheDocument();
  });

  test('displays error state when data loading fails', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    // Mock console.error to avoid error logs in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    renderWithProviders(<CarbonSavings />);
    
    // Wait for error state to appear
    await waitFor(() => {
      expect(screen.getByText('Failed to load carbon savings data')).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });

  test('displays empty state when no savings data available', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Carbon Savings Dashboard')).toBeInTheDocument();
    });
    
    // Should show message about starting carbon assessment
    expect(screen.getByText('Start your carbon assessment to begin tracking savings')).toBeInTheDocument();
  });

  test('displays savings trends', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Savings Trends')).toBeInTheDocument();
    });
    
    expect(screen.getByText('6 Month Trend')).toBeInTheDocument();
    expect(screen.getByText('Year over Year')).toBeInTheDocument();
  });

  test('displays sustainability score', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<CarbonSavings />);
    
    await waitFor(() => {
      expect(screen.getByText('Sustainability Score')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Current Score')).toBeInTheDocument();
    expect(screen.getByText('Target Score')).toBeInTheDocument();
  });
});
