import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { QuickStatsCard } from '../QuickStatsCard';

describe('QuickStatsCard', () => {
  const defaultProps = {
    title: 'Test Stat',
    value: 1234.56,
    unit: 'kg CO₂',
    color: '#4CAF50',
    icon: 'leaf',
  };

  it('renders correctly with default props', () => {
    render(<QuickStatsCard {...defaultProps} />);
    
    expect(screen.getByText('Test Stat')).toBeTruthy();
    expect(screen.getByText('1.2K')).toBeTruthy();
    expect(screen.getByText('kg CO₂')).toBeTruthy();
  });

  it('formats large numbers correctly', () => {
    render(
      <QuickStatsCard
        {...defaultProps}
        value={1500000}
      />
    );
    
    expect(screen.getByText('1.5M')).toBeTruthy();
  });

  it('formats thousands correctly', () => {
    render(
      <QuickStatsCard
        {...defaultProps}
        value={2500}
      />
    );
    
    expect(screen.getByText('2.5K')).toBeTruthy();
  });

  it('formats small numbers correctly', () => {
    render(
      <QuickStatsCard
        {...defaultProps}
        value={42.7}
      />
    );
    
    expect(screen.getByText('42.7')).toBeTruthy();
  });

  it('displays correct color for value', () => {
    const { getByText } = render(<QuickStatsCard {...defaultProps} />);
    const valueElement = getByText('1.2K');
    const flattenedStyle = StyleSheet.flatten(valueElement.props.style);
    expect(flattenedStyle.color).toBe('#4CAF50');
  });

  it('handles zero value', () => {
    render(
      <QuickStatsCard
        {...defaultProps}
        value={0}
      />
    );
    
    expect(screen.getByText('0.0')).toBeTruthy();
  });

  it('handles negative values', () => {
    render(
      <QuickStatsCard
        {...defaultProps}
        value={-100}
      />
    );
    
    expect(screen.getByText('-100.0')).toBeTruthy();
  });
});