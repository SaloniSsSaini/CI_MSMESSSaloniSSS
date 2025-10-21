import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { CarbonScoreCard } from '../CarbonScoreCard';

describe('CarbonScoreCard', () => {
  const defaultProps = {
    score: 75,
    scoreColor: '#4CAF50',
    scoreLabel: 'Good',
    lastAssessment: '2024-01-15',
  };

  it('renders correctly with default props', () => {
    render(<CarbonScoreCard {...defaultProps} />);
    
    expect(screen.getByText('Carbon Score')).toBeTruthy();
    expect(screen.getByText('75')).toBeTruthy();
    expect(screen.getByText('Good')).toBeTruthy();
    expect(screen.getByText('Last assessed: Jan 15, 2024')).toBeTruthy();
  });

  it('displays correct score color', () => {
    const { getByText } = render(<CarbonScoreCard {...defaultProps} />);
    const scoreElement = getByText('75');
    expect(scoreElement.props.style).toContainEqual(
      expect.objectContaining({ color: '#4CAF50' })
    );
  });

  it('shows correct message for excellent score', () => {
    render(
      <CarbonScoreCard
        {...defaultProps}
        score={85}
        scoreLabel="Excellent"
      />
    );
    
    expect(screen.getByText('Excellent! Keep up the great work.')).toBeTruthy();
  });

  it('shows correct message for good score', () => {
    render(
      <CarbonScoreCard
        {...defaultProps}
        score={70}
        scoreLabel="Good"
      />
    );
    
    expect(screen.getByText('Good progress. Room for improvement.')).toBeTruthy();
  });

  it('shows correct message for average score', () => {
    render(
      <CarbonScoreCard
        {...defaultProps}
        score={50}
        scoreLabel="Average"
      />
    );
    
    expect(screen.getByText('Average performance. Focus on key areas.')).toBeTruthy();
  });

  it('shows correct message for poor score', () => {
    render(
      <CarbonScoreCard
        {...defaultProps}
        score={25}
        scoreLabel="Poor"
      />
    );
    
    expect(screen.getByText('Below average. Immediate action needed.')).toBeTruthy();
  });

  it('shows correct message for critical score', () => {
    render(
      <CarbonScoreCard
        {...defaultProps}
        score={10}
        scoreLabel="Critical"
      />
    );
    
    expect(screen.getByText('Critical. Urgent improvements required.')).toBeTruthy();
  });

  it('handles missing lastAssessment date', () => {
    render(
      <CarbonScoreCard
        {...defaultProps}
        lastAssessment={undefined}
      />
    );
    
    expect(screen.getByText('Last assessed: Never')).toBeTruthy();
  });

  it('formats date correctly', () => {
    render(
      <CarbonScoreCard
        {...defaultProps}
        lastAssessment="2024-12-25"
      />
    );
    
    expect(screen.getByText('Last assessed: Dec 25, 2024')).toBeTruthy();
  });
});