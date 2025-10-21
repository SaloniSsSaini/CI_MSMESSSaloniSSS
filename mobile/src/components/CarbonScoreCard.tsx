import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ProgressBar } from 'react-native-paper';
import { theme, colors } from '../theme/theme';
import * as Animatable from 'react-native-animatable';

interface CarbonScoreCardProps {
  score: number;
  scoreColor: string;
  scoreLabel: string;
  lastAssessment?: string;
}

export const CarbonScoreCard: React.FC<CarbonScoreCardProps> = ({
  score,
  scoreColor,
  scoreLabel,
  lastAssessment,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Animatable.View animation="fadeInUp" duration={800} delay={200}>
      <Card style={styles.card} elevation={6}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.title}>Carbon Score</Text>
            <Text style={styles.lastAssessment}>
              Last assessed: {formatDate(lastAssessment)}
            </Text>
          </View>
          
          <Animatable.View 
            animation="zoomIn" 
            duration={1000} 
            delay={400}
            style={styles.scoreContainer}
          >
            <Text style={[styles.score, { color: scoreColor }]}>
              {score}
            </Text>
            <Text style={styles.scoreLabel}>{scoreLabel}</Text>
          </Animatable.View>
          
          <Animatable.View animation="slideInRight" duration={800} delay={600}>
            <ProgressBar
              progress={score / 100}
              color={scoreColor}
              style={styles.progressBar}
            />
          </Animatable.View>
          
          <Animatable.View 
            animation="fadeIn" 
            duration={800} 
            delay={800}
            style={styles.footer}
          >
            <Text style={styles.footerText}>
              {score >= 80
                ? 'Excellent! Keep up the great work.'
                : score >= 60
                ? 'Good progress. Room for improvement.'
                : score >= 40
                ? 'Average performance. Focus on key areas.'
                : score >= 20
                ? 'Below average. Immediate action needed.'
                : 'Critical. Urgent improvements required.'}
            </Text>
          </Animatable.View>
        </Card.Content>
      </Card>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: theme.spacing.md,
    marginTop: 0,
    elevation: 6,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  lastAssessment: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 56,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
    marginBottom: theme.spacing.md,
  },
  footer: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
});