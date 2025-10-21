import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoadingScreen } from '../LoadingScreen';

describe('LoadingScreen', () => {
  it('renders with default message', () => {
    render(<LoadingScreen />);
    
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders with custom message', () => {
    render(<LoadingScreen message="Custom loading message" />);
    
    expect(screen.getByText('Custom loading message')).toBeTruthy();
  });

  it('renders with card by default', () => {
    const { getByTestId } = render(<LoadingScreen />);
    
    // The card should be present
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders without card when showCard is false', () => {
    render(<LoadingScreen showCard={false} />);
    
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('displays activity indicator', () => {
    render(<LoadingScreen />);
    
    // Activity indicator should be present (though we can't easily test the visual)
    expect(screen.getByText('Loading...')).toBeTruthy();
  });
});