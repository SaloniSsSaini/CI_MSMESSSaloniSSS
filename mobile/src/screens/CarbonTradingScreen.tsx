import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  ActivityIndicator,
  ProgressBar,
  Chip,
  List,
  Divider,
  TextInput,
  SegmentedButtons,
  Surface,
  IconButton,
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { theme, colors } from '../theme/theme';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');

interface CarbonOffset {
  id: string;
  name: string;
  description: string;
  type: 'renewable_energy' | 'reforestation' | 'carbon_capture' | 'energy_efficiency';
  pricePerTon: number;
  availableCredits: number;
  verifiedBy: string;
  location: string;
  co2Reduction: number;
  rating: number;
  imageUrl?: string;
}

interface TradingPortfolio {
  totalCredits: number;
  availableCredits: number;
  usedCredits: number;
  totalInvestment: number;
  averagePrice: number;
  lastPurchase: string;
}

const CarbonTradingScreen = ({ navigation }: any) => {
  const [currentEmissions, setCurrentEmissions] = useState(0);
  const [carbonScore, setCarbonScore] = useState(0);
  const [portfolio, setPortfolio] = useState<TradingPortfolio | null>(null);
  const [offsetOptions, setOffsetOptions] = useState<CarbonOffset[]>([]);
  const [selectedOffset, setSelectedOffset] = useState<CarbonOffset | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('offset');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTradingData();
  }, []);

  const loadTradingData = async () => {
    try {
      setIsLoading(true);
      
      // Load current carbon data
      const carbonResponse = await apiService.getCarbonAssessments({ limit: 1 });
      if (carbonResponse.success && carbonResponse.data.assessments.length > 0) {
        const assessment = carbonResponse.data.assessments[0];
        setCurrentEmissions(assessment.totalCO2Emissions);
        setCarbonScore(assessment.carbonScore);
      }

      // Load trading portfolio
      const portfolioResponse = await apiService.getCarbonTradingPortfolio();
      if (portfolioResponse.success) {
        setPortfolio(portfolioResponse.data);
      }

      // Load offset options
      const offsetsResponse = await apiService.getCarbonOffsetOptions();
      if (offsetsResponse.success) {
        setOffsetOptions(offsetsResponse.data);
      }

    } catch (error) {
      console.error('Error loading trading data:', error);
      Alert.alert('Error', 'Failed to load trading data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTradingData();
    setRefreshing(false);
  };

  const handlePurchaseOffset = async () => {
    if (!selectedOffset || !purchaseAmount) {
      Alert.alert('Error', 'Please select an offset option and enter amount');
      return;
    }

    const amount = parseFloat(purchaseAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (amount > selectedOffset.availableCredits) {
      Alert.alert('Error', 'Insufficient credits available');
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiService.purchaseCarbonOffset({
        offsetId: selectedOffset.id,
        amount: amount,
        pricePerTon: selectedOffset.pricePerTon,
      });

      if (response.success) {
        Alert.alert('Success', 'Carbon offset purchased successfully!');
        setPurchaseAmount('');
        setSelectedOffset(null);
        await loadTradingData();
      } else {
        Alert.alert('Error', response.message || 'Failed to purchase offset');
      }
    } catch (error) {
      console.error('Error purchasing offset:', error);
      Alert.alert('Error', 'Failed to purchase carbon offset');
    } finally {
      setIsLoading(false);
    }
  };

  const getOffsetTypeIcon = (type: string) => {
    switch (type) {
      case 'renewable_energy': return 'solar-panel';
      case 'reforestation': return 'tree';
      case 'carbon_capture': return 'factory';
      case 'energy_efficiency': return 'lightbulb';
      default: return 'leaf';
    }
  };

  const getOffsetTypeColor = (type: string) => {
    switch (type) {
      case 'renewable_energy': return colors.chart1;
      case 'reforestation': return colors.chart2;
      case 'carbon_capture': return colors.chart3;
      case 'energy_efficiency': return colors.chart4;
      default: return colors.other;
    }
  };

  const filteredOffsets = offsetOptions.filter(offset =>
    offset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offset.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCarbonScoreColor = (score: number) => {
    if (score >= 80) return colors.excellent;
    if (score >= 60) return colors.good;
    if (score >= 40) return colors.average;
    if (score >= 20) return colors.poor;
    return colors.critical;
  };

  const getCarbonScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Average';
    if (score >= 20) return 'Poor';
    return 'Critical';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading carbon trading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.headerTitle}>Carbon Trading</Title>
            <Text style={styles.headerSubtitle}>
              Offset your emissions and trade carbon credits
            </Text>
          </Card.Content>
        </Card>

        {/* Current Status */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Current Status</Title>
            <View style={styles.statusContainer}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Current Emissions</Text>
                <Text style={styles.statusValue}>
                  {currentEmissions.toFixed(2)} kg CO₂
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Carbon Score</Text>
                <View style={styles.scoreContainer}>
                  <Text style={[
                    styles.scoreValue,
                    { color: getCarbonScoreColor(carbonScore) }
                  ]}>
                    {carbonScore}
                  </Text>
                  <Text style={styles.scoreLabel}>
                    {getCarbonScoreLabel(carbonScore)}
                  </Text>
                </View>
              </View>
            </View>
            <ProgressBar
              progress={carbonScore / 100}
              color={getCarbonScoreColor(carbonScore)}
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>

        {/* Portfolio Summary */}
        {portfolio && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Trading Portfolio</Title>
              <View style={styles.portfolioGrid}>
                <View style={styles.portfolioItem}>
                  <Text style={styles.portfolioLabel}>Total Credits</Text>
                  <Text style={styles.portfolioValue}>
                    {portfolio.totalCredits.toFixed(2)} tons
                  </Text>
                </View>
                <View style={styles.portfolioItem}>
                  <Text style={styles.portfolioLabel}>Available</Text>
                  <Text style={styles.portfolioValue}>
                    {portfolio.availableCredits.toFixed(2)} tons
                  </Text>
                </View>
                <View style={styles.portfolioItem}>
                  <Text style={styles.portfolioLabel}>Used</Text>
                  <Text style={styles.portfolioValue}>
                    {portfolio.usedCredits.toFixed(2)} tons
                  </Text>
                </View>
                <View style={styles.portfolioItem}>
                  <Text style={styles.portfolioLabel}>Investment</Text>
                  <Text style={styles.portfolioValue}>
                    ₹{portfolio.totalInvestment.toLocaleString()}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Tab Navigation */}
        <Card style={styles.card}>
          <Card.Content>
            <SegmentedButtons
              value={activeTab}
              onValueChange={setActiveTab}
              buttons={[
                { value: 'offset', label: 'Offset Options' },
                { value: 'portfolio', label: 'My Portfolio' },
                { value: 'market', label: 'Market Trends' },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Offset Options Tab */}
        {activeTab === 'offset' && (
          <>
            {/* Search */}
            <Card style={styles.card}>
              <Card.Content>
                <TextInput
                  label="Search offset options"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  left={<TextInput.Icon icon="magnify" />}
                  style={styles.searchInput}
                />
              </Card.Content>
            </Card>

            {/* Offset Options List */}
            {filteredOffsets.map((offset) => (
              <Card
                key={offset.id}
                style={[
                  styles.offsetCard,
                  selectedOffset?.id === offset.id && styles.selectedOffsetCard
                ]}
                onPress={() => setSelectedOffset(offset)}
              >
                <Card.Content>
                  <View style={styles.offsetHeader}>
                    <View style={styles.offsetInfo}>
                      <Text style={styles.offsetName}>{offset.name}</Text>
                      <Text style={styles.offsetType}>
                        {offset.type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <Chip
                      icon={getOffsetTypeIcon(offset.type)}
                      style={[
                        styles.typeChip,
                        { backgroundColor: getOffsetTypeColor(offset.type) + '20' }
                      ]}
                      textStyle={{ color: getOffsetTypeColor(offset.type) }}
                    >
                      {offset.type.replace('_', ' ')}
                    </Chip>
                  </View>

                  <Text style={styles.offsetDescription}>
                    {offset.description}
                  </Text>

                  <View style={styles.offsetDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Price per ton</Text>
                      <Text style={styles.detailValue}>
                        ₹{offset.pricePerTon.toLocaleString()}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Available</Text>
                      <Text style={styles.detailValue}>
                        {offset.availableCredits.toFixed(2)} tons
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Location</Text>
                      <Text style={styles.detailValue}>{offset.location}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailLabel}>Rating</Text>
                      <Text style={styles.detailValue}>
                        {offset.rating.toFixed(1)} ⭐
                      </Text>
                    </View>
                  </View>

                  <View style={styles.offsetFooter}>
                    <Text style={styles.verifiedBy}>
                      Verified by: {offset.verifiedBy}
                    </Text>
                    <Text style={styles.co2Reduction}>
                      CO₂ Reduction: {offset.co2Reduction.toFixed(2)} tons/year
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            ))}

            {/* Purchase Section */}
            {selectedOffset && (
              <Card style={styles.purchaseCard}>
                <Card.Content>
                  <Title style={styles.cardTitle}>Purchase Carbon Offset</Title>
                  <Text style={styles.selectedOffsetName}>
                    {selectedOffset.name}
                  </Text>
                  
                  <View style={styles.purchaseForm}>
                    <TextInput
                      label="Amount (tons)"
                      value={purchaseAmount}
                      onChangeText={setPurchaseAmount}
                      keyboardType="numeric"
                      style={styles.amountInput}
                    />
                    
                    <View style={styles.purchaseSummary}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Price per ton:</Text>
                        <Text style={styles.summaryValue}>
                          ₹{selectedOffset.pricePerTon.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Total cost:</Text>
                        <Text style={styles.summaryValue}>
                          ₹{selectedOffset.pricePerTon * (parseFloat(purchaseAmount) || 0).toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    <Button
                      mode="contained"
                      onPress={handlePurchaseOffset}
                      style={styles.purchaseButton}
                      loading={isLoading}
                      disabled={!purchaseAmount || parseFloat(purchaseAmount) <= 0}
                    >
                      Purchase Offset
                    </Button>
                  </View>
                </Card.Content>
              </Card>
            )}
          </>
        )}

        {/* Portfolio Tab */}
        {activeTab === 'portfolio' && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Portfolio Details</Title>
              <Text style={styles.comingSoonText}>
                Detailed portfolio view coming soon...
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Market Trends Tab */}
        {activeTab === 'market' && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Market Trends</Title>
              <Text style={styles.comingSoonText}>
                Market trends and analytics coming soon...
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  headerCard: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onPrimary,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.onPrimary,
    opacity: 0.9,
  },
  card: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: theme.spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: theme.spacing.sm,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  portfolioItem: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  portfolioLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  portfolioValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  segmentedButtons: {
    marginBottom: theme.spacing.sm,
  },
  searchInput: {
    marginBottom: theme.spacing.sm,
  },
  offsetCard: {
    margin: theme.spacing.md,
    marginTop: 0,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  selectedOffsetCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  offsetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  offsetInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  offsetName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.xs,
  },
  offsetType: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  typeChip: {
    height: 28,
  },
  offsetDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  offsetDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    width: '48%',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  offsetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
  },
  verifiedBy: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  co2Reduction: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  purchaseCard: {
    margin: theme.spacing.md,
    marginTop: 0,
    backgroundColor: theme.colors.primaryContainer,
  },
  selectedOffsetName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onPrimaryContainer,
    marginBottom: theme.spacing.md,
  },
  purchaseForm: {
    marginTop: theme.spacing.sm,
  },
  amountInput: {
    marginBottom: theme.spacing.md,
  },
  purchaseSummary: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  purchaseButton: {
    marginTop: theme.spacing.sm,
  },
  comingSoonText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: theme.spacing.lg,
  },
});

export default CarbonTradingScreen;