import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button, Chip, Icon } from 'react-native-paper';
import { theme, colors } from '../theme/theme';

interface Recommendation {
  category: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  potentialCO2Reduction: number;
  implementationCost: number;
  paybackPeriod: number;
  isImplemented: boolean;
}

interface RecommendationsCardProps {
  recommendations: Recommendation[];
  onViewAll: () => void;
}

export const RecommendationsCard: React.FC<RecommendationsCardProps> = ({
  recommendations,
  onViewAll,
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.info;
      default:
        return colors.other;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'alert';
      case 'low':
        return 'information';
      default:
        return 'lightbulb';
    }
  };

  const formatCost = (cost: number) => {
    if (cost >= 100000) {
      return `₹${(cost / 100000).toFixed(1)}L`;
    } else if (cost >= 1000) {
      return `₹${(cost / 1000).toFixed(1)}K`;
    }
    return `₹${cost}`;
  };

  const formatCO2Reduction = (reduction: number) => {
    return `${reduction.toFixed(1)} kg CO₂`;
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>Recommendations</Text>
          <Button
            mode="text"
            onPress={onViewAll}
            compact
            textColor={theme.colors.primary}
          >
            View All
          </Button>
        </View>

        {recommendations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recommendations available</Text>
            <Text style={styles.emptySubtext}>
              Complete a carbon assessment to get personalized recommendations
            </Text>
          </View>
        ) : (
          <View style={styles.recommendationsList}>
            {recommendations.slice(0, 3).map((recommendation, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.recommendationItem,
                  recommendation.isImplemented && styles.implementedItem
                ]}
              >
                <View style={styles.recommendationHeader}>
                  <View style={styles.recommendationTitleContainer}>
                    <Text style={styles.recommendationTitle} numberOfLines={1}>
                      {recommendation.title}
                    </Text>
                    <Chip
                      mode="outlined"
                      compact
                      style={[
                        styles.priorityChip,
                        { borderColor: getPriorityColor(recommendation.priority) }
                      ]}
                      textStyle={{ color: getPriorityColor(recommendation.priority) }}
                    >
                      {recommendation.priority.toUpperCase()}
                    </Chip>
                  </View>
                  {recommendation.isImplemented && (
                    <Icon source="check-circle" size={20} color={colors.success} />
                  )}
                </View>
                
                <Text style={styles.recommendationDescription} numberOfLines={2}>
                  {recommendation.description}
                </Text>
                
                <View style={styles.recommendationMetrics}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>CO₂ Reduction</Text>
                    <Text style={styles.metricValue}>
                      {formatCO2Reduction(recommendation.potentialCO2Reduction)}
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Cost</Text>
                    <Text style={styles.metricValue}>
                      {formatCost(recommendation.implementationCost)}
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Payback</Text>
                    <Text style={styles.metricValue}>
                      {recommendation.paybackPeriod} months
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: theme.spacing.md,
    marginTop: 0,
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
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  recommendationsList: {
    gap: theme.spacing.md,
  },
  recommendationItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  implementedItem: {
    backgroundColor: colors.success + '20',
    borderLeftColor: colors.success,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  recommendationTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  priorityChip: {
    height: 24,
  },
  recommendationDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  recommendationMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});