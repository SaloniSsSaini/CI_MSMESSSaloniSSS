import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon } from 'react-native-paper';
import { theme } from '../theme/theme';

interface QuickStatsCardProps {
  title: string;
  value: number;
  unit: string;
  color: string;
  icon: string;
}

export const QuickStatsCard: React.FC<QuickStatsCardProps> = ({
  title,
  value,
  unit,
  color,
  icon,
}) => {
  const formatValue = (val: number) => {
    if (val >= 1000000) {
      return `${(val / 1000000).toFixed(1)}M`;
    } else if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toFixed(1);
  };

  return (
    <Card style={[styles.card, { flex: 1, marginHorizontal: 4 }]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <Icon source={icon} size={20} color={color} />
          <Text style={styles.title}>{title}</Text>
        </View>
        
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color }]}>
            {formatValue(value)}
          </Text>
          <Text style={styles.unit}>{unit}</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    elevation: 2,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginLeft: theme.spacing.xs,
  },
  valueContainer: {
    alignItems: 'flex-start',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  unit: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
});