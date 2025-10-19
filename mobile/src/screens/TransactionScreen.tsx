import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Searchbar,
  Chip,
  FAB,
  List,
  Divider,
  Menu,
  IconButton,
} from 'react-native-paper';
import { theme, colors } from '../theme/theme';
import { apiService } from '../services/apiService';

const TransactionScreen = ({ navigation }: any) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);

  const categories = [
    'all',
    'energy',
    'water',
    'waste_management',
    'transportation',
    'raw_materials',
    'equipment',
    'maintenance',
    'other',
  ];

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchQuery, selectedCategory]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTransactions({ limit: 100 });
      if (response.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(transaction => transaction.category === selectedCategory);
    }

    setFilteredTransactions(filtered);
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'sms':
        return 'message-text';
      case 'email':
        return 'email';
      case 'manual':
        return 'pencil';
      case 'api':
        return 'api';
      default:
        return 'receipt';
    }
  };

  return (
    <View style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search transactions..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="filter"
              onPress={() => setMenuVisible(true)}
              style={styles.filterButton}
            />
          }
        >
          {categories.map((category) => (
            <Menu.Item
              key={category}
              onPress={() => {
                setSelectedCategory(category);
                setMenuVisible(false);
              }}
              title={category.replace('_', ' ').toUpperCase()}
              leadingIcon={selectedCategory === category ? 'check' : undefined}
            />
          ))}
        </Menu>
      </View>

      {/* Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipContainer}
        contentContainerStyle={styles.chipContent}
      >
        {categories.map((category) => (
          <Chip
            key={category}
            selected={selectedCategory === category}
            onPress={() => setSelectedCategory(category)}
            style={[
              styles.chip,
              selectedCategory === category && {
                backgroundColor: theme.colors.primary,
              },
            ]}
            textStyle={{
              color: selectedCategory === category ? '#fff' : theme.colors.onSurface,
            }}
          >
            {category.replace('_', ' ').toUpperCase()}
          </Chip>
        ))}
      </ScrollView>

      {/* Transactions List */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading transactions...</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Start by analyzing SMS or email messages'}
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {filteredTransactions.map((transaction, index) => (
              <TouchableOpacity
                key={transaction._id || index}
                onPress={() => {
                  // TODO: Navigate to transaction details
                }}
              >
                <Card style={styles.transactionCard}>
                  <Card.Content>
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
                      
                      <Chip
                        mode="outlined"
                        compact
                        style={styles.sourceChip}
                        icon={getSourceIcon(transaction.source)}
                      >
                        {transaction.source.toUpperCase()}
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
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: Implement add transaction functionality
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  filterButton: {
    margin: 0,
  },
  chipContainer: {
    marginBottom: theme.spacing.sm,
  },
  chipContent: {
    paddingHorizontal: theme.spacing.md,
  },
  chip: {
    marginRight: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
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
    padding: theme.spacing.md,
  },
  transactionCard: {
    marginBottom: theme.spacing.sm,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  transactionInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
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
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  categoryChip: {
    height: 24,
  },
  sourceChip: {
    height: 24,
  },
  greenChip: {
    height: 24,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default TransactionScreen;