import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from '../../App';

const theme = createTheme();

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

  test('prompts for registration when no MSME data is stored', () => {
    renderWithProviders(<App />);

    expect(screen.getByText('MSME Registration')).toBeInTheDocument();
  });

  test('renders dashboard when MSME data exists', () => {
    localStorage.setItem(
      'msmeRegistration',
      JSON.stringify({
        companyName: 'Test Company',
        companyType: 'micro',
        industry: 'manufacturing',
        udyamRegistrationNumber: 'UDYAM-KR-03-0593459',
        gstNumber: '12ABCDE1234F1Z5',
        annualTurnover: 1000000,
        numberOfEmployees: 50,
        manufacturingUnits: 2,
      })
    );
    localStorage.setItem('token', 'mock-token');

    renderWithProviders(<App />, { initialEntries: ['/dashboard'] });

    expect(screen.getAllByText(/Carbon Intelligence/).length).toBeGreaterThan(0);
  });
});
