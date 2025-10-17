import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Recommendations from '../Recommendations';
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

describe('Recommendations', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('shows registration prompt when no MSME data exists', () => {
    renderWithProviders(<Recommendations />);
    
    expect(screen.getByText('Please complete MSME registration first to access personalized recommendations.')).toBeInTheDocument();
  });

  test('shows loading state initially', () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Recommendations />);
    
    expect(screen.getByText('Generating personalized recommendations...')).toBeInTheDocument();
  });

  test('displays recommendations after loading', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Recommendations />);
    
    await waitFor(() => {
      expect(screen.getByText('Sustainable Manufacturing Recommendations')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Personalized recommendations to help Test Company reduce carbon footprint and improve sustainability.')).toBeInTheDocument();
  });

  test('displays category filter chips', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Recommendations />);
    
    await waitFor(() => {
      expect(screen.getByText('Filter by Category')).toBeInTheDocument();
    });
    
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('Waste')).toBeInTheDocument();
    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.getByText('Transportation')).toBeInTheDocument();
    expect(screen.getByText('Manufacturing')).toBeInTheDocument();
    expect(screen.getByText('Supply Chain')).toBeInTheDocument();
    expect(screen.getByText('Culture')).toBeInTheDocument();
  });

  test('filters recommendations by category', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Recommendations />);
    
    await waitFor(() => {
      expect(screen.getByText('Sustainable Manufacturing Recommendations')).toBeInTheDocument();
    });
    
    // Click on Energy category
    fireEvent.click(screen.getByText('Energy'));
    
    // Should show only energy-related recommendations
    expect(screen.getByText('Switch to Renewable Energy Sources')).toBeInTheDocument();
    expect(screen.getByText('Upgrade to Energy-Efficient Equipment')).toBeInTheDocument();
  });

  test('displays recommendation details in accordion', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Recommendations />);
    
    await waitFor(() => {
      expect(screen.getByText('Sustainable Manufacturing Recommendations')).toBeInTheDocument();
    });
    
    // Expand first recommendation
    const firstAccordion = screen.getAllByRole('button', { name: /expand/i })[0];
    fireEvent.click(firstAccordion);
    
    await waitFor(() => {
      expect(screen.getByText('Benefits')).toBeInTheDocument();
      expect(screen.getByText('Implementation Steps')).toBeInTheDocument();
      expect(screen.getByText('Impact Metrics')).toBeInTheDocument();
    });
  });

  test('displays recommendation priority and cost chips', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Recommendations />);
    
    await waitFor(() => {
      expect(screen.getByText('Sustainable Manufacturing Recommendations')).toBeInTheDocument();
    });
    
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
    expect(screen.getByText('LOW')).toBeInTheDocument();
    expect(screen.getByText('HIGH COST')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM COST')).toBeInTheDocument();
    expect(screen.getByText('LOW COST')).toBeInTheDocument();
  });

  test('displays implementation summary', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Recommendations />);
    
    await waitFor(() => {
      expect(screen.getByText('Implementation Summary')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Total Annual Savings')).toBeInTheDocument();
    expect(screen.getByText('CO₂ Reduction Potential')).toBeInTheDocument();
  });

  test('displays annual savings and CO2 reduction metrics', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Recommendations />);
    
    await waitFor(() => {
      expect(screen.getByText('Sustainable Manufacturing Recommendations')).toBeInTheDocument();
    });
    
    // Check for savings amounts
    expect(screen.getByText(/₹\d+,?\d*,?\d*/)).toBeInTheDocument();
    
    // Check for CO2 reduction amounts
    expect(screen.getByText(/\d+ kg/)).toBeInTheDocument();
  });

  test('displays implement button for each recommendation', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Recommendations />);
    
    await waitFor(() => {
      expect(screen.getByText('Sustainable Manufacturing Recommendations')).toBeInTheDocument();
    });
    
    // Expand first recommendation
    const firstAccordion = screen.getAllByRole('button', { name: /expand/i })[0];
    fireEvent.click(firstAccordion);
    
    await waitFor(() => {
      expect(screen.getByText('Implement This')).toBeInTheDocument();
    });
  });

  test('displays rating for environmental impact', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Recommendations />);
    
    await waitFor(() => {
      expect(screen.getByText('Sustainable Manufacturing Recommendations')).toBeInTheDocument();
    });
    
    // Expand first recommendation
    const firstAccordion = screen.getAllByRole('button', { name: /expand/i })[0];
    fireEvent.click(firstAccordion);
    
    await waitFor(() => {
      expect(screen.getByText('Environmental Impact')).toBeInTheDocument();
    });
    
    // Check for rating stars
    const ratingElements = screen.getAllByRole('radio');
    expect(ratingElements.length).toBeGreaterThan(0);
  });

  test('displays payback period information', async () => {
    const mockMSMEData = {
      companyName: 'Test Company',
      companyType: 'micro',
      industry: 'manufacturing'
    };
    
    localStorage.setItem('msmeRegistration', JSON.stringify(mockMSMEData));
    
    renderWithProviders(<Recommendations />);
    
    await waitFor(() => {
      expect(screen.getByText('Sustainable Manufacturing Recommendations')).toBeInTheDocument();
    });
    
    // Expand first recommendation
    const firstAccordion = screen.getAllByRole('button', { name: /expand/i })[0];
    fireEvent.click(firstAccordion);
    
    await waitFor(() => {
      expect(screen.getByText('Payback Period')).toBeInTheDocument();
    });
    
    expect(screen.getByText(/months/)).toBeInTheDocument();
  });
});