import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ErrorScreen } from '../ErrorScreen';

describe('ErrorScreen', () => {
  const mockOnRetry = jest.fn();
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default title and message', () => {
    render(<ErrorScreen />);
    
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeTruthy();
  });

  it('renders with custom title and message', () => {
    render(
      <ErrorScreen
        title="Custom Error"
        message="Custom error message"
      />
    );
    
    expect(screen.getByText('Custom Error')).toBeTruthy();
    expect(screen.getByText('Custom error message')).toBeTruthy();
  });

  it('shows retry button when onRetry is provided', () => {
    render(<ErrorScreen onRetry={mockOnRetry} />);
    
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('shows dismiss button when onDismiss is provided', () => {
    render(<ErrorScreen onDismiss={mockOnDismiss} />);
    
    expect(screen.getByText('Dismiss')).toBeTruthy();
  });

  it('calls onRetry when retry button is pressed', () => {
    render(<ErrorScreen onRetry={mockOnRetry} />);
    
    fireEvent.press(screen.getByText('Try Again'));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is pressed', () => {
    render(<ErrorScreen onDismiss={mockOnDismiss} />);
    
    fireEvent.press(screen.getByText('Dismiss'));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows both buttons when both callbacks are provided', () => {
    render(
      <ErrorScreen
        onRetry={mockOnRetry}
        onDismiss={mockOnDismiss}
      />
    );
    
    expect(screen.getByText('Try Again')).toBeTruthy();
    expect(screen.getByText('Dismiss')).toBeTruthy();
  });

  it('renders with card by default', () => {
    render(<ErrorScreen />);
    
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('renders without card when showCard is false', () => {
    render(<ErrorScreen showCard={false} />);
    
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });
});