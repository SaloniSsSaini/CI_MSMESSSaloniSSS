import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RegistrationProvider } from '../../context/RegistrationContext';
import ApiService from '../../services/api';
import MSMERegistration from '../MSMERegistration';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    register: jest.fn(),
    updateMSMEProfile: jest.fn(),
  },
}));

const mockApiService = ApiService as unknown as {
  login: jest.Mock;
  register: jest.Mock;
  updateMSMEProfile: jest.Mock;
};

const theme = createTheme();

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <BrowserRouter>
      <RegistrationProvider>
        <ThemeProvider theme={theme}>{ui}</ThemeProvider>
      </RegistrationProvider>
    </BrowserRouter>
  );

const openSelectAndChoose = (field: string, optionText: RegExp | string) => {
  const trigger = document.getElementById(`mui-component-select-${field}`);
  if (!trigger) {
    throw new Error(`Select trigger for ${field} not found`);
  }

  fireEvent.mouseDown(trigger);
  fireEvent.click(screen.getByRole('option', { name: optionText }));
};

describe('MSMERegistration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockApiService.register.mockResolvedValue({ success: true, data: { token: 'mock-token' } });
    mockApiService.updateMSMEProfile.mockResolvedValue({ success: true });
  });

  test('renders the registration form', () => {
    renderWithProviders(<MSMERegistration />);

    expect(screen.getByText('MSME Registration')).toBeInTheDocument();
    expect(screen.getByText('Company Information')).toBeInTheDocument();
  });

  test('advances to the next step when company information is provided', async () => {
    renderWithProviders(<MSMERegistration />);

    fireEvent.change(screen.getByLabelText('Company Name'), { target: { value: 'Test Company' } });

    openSelectAndChoose('companyType', /Micro Enterprise/i);
    openSelectAndChoose('industry', /Manufacturing/i);
    openSelectAndChoose('businessDomain', /Manufacturing/i);

    fireEvent.change(screen.getByLabelText('Establishment Year'), { target: { value: '2020' } });

    fireEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByLabelText('UDYAM Registration Number')).toBeInTheDocument();
    });
  });
});
