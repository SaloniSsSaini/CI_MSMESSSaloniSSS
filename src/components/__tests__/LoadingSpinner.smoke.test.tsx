import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LoadingSpinner from '../LoadingSpinner';

const theme = createTheme();

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('LoadingSpinner', () => {
  test('renders with default props', () => {
    renderWithProviders(<LoadingSpinner />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });

  test('supports custom message and full screen mode', () => {
    renderWithProviders(<LoadingSpinner message="Please wait" fullScreen />);

    expect(screen.getByText('Please wait')).toBeInTheDocument();
    expect(document.querySelector('.MuiBox-root')).toHaveStyle('position: fixed');
  });
});
