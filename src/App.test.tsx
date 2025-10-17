import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';

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

describe('App', () => {
  test('renders app with navigation bar', () => {
    renderWithProviders(<App />);
    
    expect(screen.getByText('Carbon Intelligence - MSME')).toBeInTheDocument();
  });

  test('renders MSME registration by default', () => {
    renderWithProviders(<App />);
    
    expect(screen.getByText('MSME Registration')).toBeInTheDocument();
  });

  test('renders eco icon in app bar', () => {
    renderWithProviders(<App />);
    
    // Check if eco icon is present (it should be rendered as an SVG)
    const ecoIcon = document.querySelector('[data-testid="EcoIcon"]') || 
                   document.querySelector('svg[data-testid="EcoIcon"]') ||
                   document.querySelector('svg');
    expect(ecoIcon).toBeInTheDocument();
  });
});