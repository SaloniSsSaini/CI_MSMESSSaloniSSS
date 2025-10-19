import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button, Chip } from 'react-native-paper';
import { theme, colors } from '../theme/theme';

interface Transaction {
  _id: string;
  transactionType: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  date: string;
  carbonFootprint: {
    co2Emissions: number;
  };
  sustainability: {
    isGreen: boolean;
  };
}

interface RecentTransactionsCardProps {
  transactions: Transaction[];
  onViewAll: () => void;
}

export const RecentTransactionsCard: React.FC<RecentTransactionsCardProps> = ({
  transactions,
  onViewAll,
}) => {
  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getCategoryColor = (category: string) => {
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'shopping';
      case 'sale':
        return 'trending-up';
      case 'expense':
        return 'credit-card';
      case 'utility':
        return 'flash';
      case 'transport':
        return 'truck';
      default:
        return 'receipt';
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Transactions</Text>
          <Button
            mode="text"
            onPress={onViewAll}
            compact
            textColor={theme.colors.primary}
          >
            View All
          </Button>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent transactions</Text>
            <Text style={styles.emptySubtext}>
              Start by analyzing SMS or email messages
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.slice(0, 5).map((transaction) => (
              <TouchableOpacity
                key={transaction._id}
                style={styles.transactionItem}
              >
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription} numberOfLines={1}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>
                  <View style={styles.transactionAmount}>
                    <Text style={styles.amount}>
                      {formatAmount(transaction.amount, transaction.currency)}
                    </Text>
                    <Text style={styles.co2Emissions}>
                      {transaction.carbonFootprint.co2Emissions.toFixed(1)} kg CO₂
                    </Text>
                  </View>
                </View>
                
                <View style={styles.transactionFooter}>
                  <Chip
                    mode="outlined"
                    compact
                    style={[
                      styles.categoryChip,
                      { borderColor: getCategoryColor(transaction.category) }
                    ]}
                    textStyle={{ color: getCategoryColor(transaction.category) }}
                  >
                    {transaction.category.replace('_', ' ').toUpperCase()}
                  </Chip>
                  
                  {transaction.sustainability.isGreen && (
                    <Chip
                      mode="outlined"
                      compact
                      style={[styles.greenChip, { borderColor: colors.success }]}
                      textStyle={{ color: colors.success }}
                    >
                      GREEN
                    </Chip>
                  )}
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
  transactionsList: {
    gap: theme.spacing.sm,
  },
  transactionItem: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  transactionInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  co2Emissions: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
  },
  transactionFooter: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  categoryChip: {
    height: 24,
  },
  greenChip: {
    height: 24,
  },
});