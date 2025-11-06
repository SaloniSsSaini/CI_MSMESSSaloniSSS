import { render, screen } from '@testing-library/react';
import { act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RegistrationProvider } from '../../context/RegistrationContext';
import Recommendations from '../Recommendations';

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
    jest.advanceTimersByTime(1600);
  });
};

describe('Recommendations', () => {
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

  test('prompts registration when MSME data is missing', () => {
    renderWithProviders(<Recommendations />);

    expect(
      screen.getByText('Please complete MSME registration first to access personalized recommendations.')
    ).toBeInTheDocument();
  });

  test('renders recommendations when MSME data exists', () => {
    storeMsmeData();
    renderWithProviders(<Recommendations />);

    flush();

    expect(screen.getByText('Sustainable Manufacturing Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Filter by Category')).toBeInTheDocument();
  });
});
