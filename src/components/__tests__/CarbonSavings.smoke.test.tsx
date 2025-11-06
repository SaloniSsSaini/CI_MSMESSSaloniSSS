import { render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RegistrationProvider } from '../../context/RegistrationContext';
import CarbonSavings from '../CarbonSavings';

const theme = createTheme();

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <BrowserRouter>
      <RegistrationProvider>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </RegistrationProvider>
    </BrowserRouter>
  );

const storeMsmeData = () => {
  localStorage.setItem(
    'msmeRegistration',
    JSON.stringify({ companyName: 'Test Company', companyType: 'micro', industry: 'manufacturing' })
  );
};

const flush = () => {
  act(() => {
    jest.advanceTimersByTime(1500);
  });
};

describe('CarbonSavings', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  test('shows loading indicator initially', () => {
    renderWithProviders(<CarbonSavings />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders dashboard after data is loaded', () => {
    storeMsmeData();
    renderWithProviders(<CarbonSavings />);

    flush();

    expect(screen.getByText('Carbon Savings Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Key Metrics')).toBeInTheDocument();
  });
});
