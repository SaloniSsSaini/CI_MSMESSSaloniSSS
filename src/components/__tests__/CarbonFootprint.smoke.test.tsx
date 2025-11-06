import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CarbonFootprint from '../CarbonFootprint';

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

describe('CarbonFootprint', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('shows registration prompt when no MSME data exists', () => {
    renderWithProviders(<CarbonFootprint />);

    expect(
      screen.getByText('Please complete MSME registration first to access carbon footprint assessment.')
    ).toBeInTheDocument();
  });

  test('renders carbon footprint assessment form when MSME data exists', () => {
    localStorage.setItem(
      'msmeRegistration',
      JSON.stringify({ companyName: 'Test Company', companyType: 'micro', industry: 'manufacturing' })
    );

    renderWithProviders(<CarbonFootprint />);

    expect(screen.getByText('Carbon Footprint Assessment')).toBeInTheDocument();
    expect(screen.getAllByText('Energy Consumption').length).toBeGreaterThan(0);
  });
});