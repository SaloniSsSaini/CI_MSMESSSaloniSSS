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

  test('renders with custom message', () => {
    renderWithProviders(<LoadingSpinner message="Please wait..." />);
    
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  test('renders with custom size', () => {
    renderWithProviders(<LoadingSpinner size={60} />);
    
    const spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).toHaveStyle('width: 60px');
    expect(spinner).toHaveStyle('height: 60px');
  });

  test('renders in full screen mode', () => {
    renderWithProviders(<LoadingSpinner fullScreen={true} />);
    
    const container = document.querySelector('.MuiBox-root');
    expect(container).toHaveStyle('position: fixed');
    expect(container).toHaveStyle('top: 0');
    expect(container).toHaveStyle('left: 0');
    expect(container).toHaveStyle('right: 0');
    expect(container).toHaveStyle('bottom: 0');
    expect(container).toHaveStyle('z-index: 9999');
  });

  test('renders in normal mode by default', () => {
    renderWithProviders(<LoadingSpinner />);
    
    const container = document.querySelector('.MuiBox-root');
    expect(container).not.toHaveStyle('position: fixed');
  });

  test('renders circular progress with correct styling', () => {
    renderWithProviders(<LoadingSpinner />);
    
    const spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).toHaveStyle('color: rgb(25, 118, 210)'); // primary.main color
  });

  test('renders with fade animation', () => {
    renderWithProviders(<LoadingSpinner />);
    
    const fadeElement = document.querySelector('.MuiFade-root');
    expect(fadeElement).toBeInTheDocument();
  });

  test('renders message with correct styling', () => {
    renderWithProviders(<LoadingSpinner message="Custom loading message" />);
    
    const message = screen.getByText('Custom loading message');
    expect(message).toHaveStyle('font-weight: 500');
    expect(message).toHaveStyle('text-align: center');
  });

  test('renders with all custom props', () => {
    renderWithProviders(
      <LoadingSpinner 
        message="Processing data..." 
        size={80} 
        fullScreen={true} 
      />
    );
    
    expect(screen.getByText('Processing data...')).toBeInTheDocument();
    
    const spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).toHaveStyle('width: 80px');
    expect(spinner).toHaveStyle('height: 80px');
    
    const container = document.querySelector('.MuiBox-root');
    expect(container).toHaveStyle('position: fixed');
  });

  test('renders spinner with correct thickness', () => {
    renderWithProviders(<LoadingSpinner />);
    
    const spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).toHaveStyle('stroke-width: 4');
  });

  test('renders with correct gap between spinner and message', () => {
    renderWithProviders(<LoadingSpinner />);
    
    const container = document.querySelector('.MuiBox-root');
    expect(container).toHaveStyle('gap: 16px');
  });

  test('renders with correct padding', () => {
    renderWithProviders(<LoadingSpinner />);
    
    const container = document.querySelector('.MuiBox-root');
    expect(container).toHaveStyle('padding: 32px');
  });

  test('renders background in full screen mode', () => {
    renderWithProviders(<LoadingSpinner fullScreen={true} />);
    
    const container = document.querySelector('.MuiBox-root');
    expect(container).toHaveStyle('background-color: rgba(255, 255, 255, 0.9)');
  });

  test('renders without background in normal mode', () => {
    renderWithProviders(<LoadingSpinner />);
    
    const container = document.querySelector('.MuiBox-root');
    expect(container).not.toHaveStyle('background-color: rgba(255, 255, 255, 0.9)');
  });

  test('renders with correct flex direction', () => {
    renderWithProviders(<LoadingSpinner />);
    
    const container = document.querySelector('.MuiBox-root');
    expect(container).toHaveStyle('flex-direction: column');
  });

  test('renders with correct alignment', () => {
    renderWithProviders(<LoadingSpinner />);
    
    const container = document.querySelector('.MuiBox-root');
    expect(container).toHaveStyle('align-items: center');
    expect(container).toHaveStyle('justify-content: center');
  });

  test('renders spinner with round line cap', () => {
    renderWithProviders(<LoadingSpinner />);
    
    const spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).toHaveStyle('stroke-linecap: round');
  });

  test('renders with correct text color', () => {
    renderWithProviders(<LoadingSpinner message="Loading..." />);
    
    const message = screen.getByText('Loading...');
    expect(message).toHaveStyle('color: rgba(0, 0, 0, 0.6)'); // text.secondary color
  });

  test('handles empty message gracefully', () => {
    renderWithProviders(<LoadingSpinner message="" />);
    
    const container = document.querySelector('.MuiBox-root');
    expect(container).toBeInTheDocument();
    expect(document.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
  });

  test('renders with very small size', () => {
    renderWithProviders(<LoadingSpinner size={10} />);
    
    const spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).toHaveStyle('width: 10px');
    expect(spinner).toHaveStyle('height: 10px');
  });

  test('renders with very large size', () => {
    renderWithProviders(<LoadingSpinner size={200} />);
    
    const spinner = document.querySelector('.MuiCircularProgress-root');
    expect(spinner).toHaveStyle('width: 200px');
    expect(spinner).toHaveStyle('height: 200px');
  });

  test('renders with long message', () => {
    const longMessage = 'This is a very long loading message that should wrap properly and not break the layout';
    renderWithProviders(<LoadingSpinner message={longMessage} />);
    
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  test('renders with special characters in message', () => {
    const specialMessage = 'Loading... 50% ✓ Processing data 🔄';
    renderWithProviders(<LoadingSpinner message={specialMessage} />);
    
    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });
});
