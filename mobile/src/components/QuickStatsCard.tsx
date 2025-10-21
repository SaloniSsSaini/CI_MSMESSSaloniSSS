import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Icon } from 'react-native-paper';
import { theme } from '../theme/theme';
import * as Animatable from 'react-native-animatable';

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
    <Animatable.View 
      animation="fadeInUp" 
      duration={600} 
      delay={Math.random() * 200}
      style={{ flex: 1, marginHorizontal: 4 }}
    >
      <Card style={styles.card} elevation={4}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <Animatable.View animation="bounceIn" duration={800} delay={200}>
              <Icon source={icon} size={24} color={color} />
            </Animatable.View>
            <Text style={styles.title}>{title}</Text>
          </View>
          
          <Animatable.View 
            animation="zoomIn" 
            duration={800} 
            delay={400}
            style={styles.valueContainer}
          >
            <Text style={[styles.value, { color }]}>
              {formatValue(value)}
            </Text>
            <Text style={styles.unit}>{unit}</Text>
          </Animatable.View>
        </Card.Content>
      </Card>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  card: {
    elevation: 4,
    borderRadius: theme.roundness,
    backgroundColor: theme.colors.surface,
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