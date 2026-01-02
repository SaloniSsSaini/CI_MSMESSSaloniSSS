import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  ActivityIndicator,
  SegmentedButtons,
  Chip,
} from 'react-native-paper';
import {
  LineChart,
  BarChart,
  PieChart,
} from 'react-native-chart-kit';
import { theme, colors } from '../theme/theme';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');

const AnalyticsScreen = ({ navigation: _navigation }: any) => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedChart, setSelectedChart] = useState('overview');

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const [overviewResponse, trendsResponse, insightsResponse] = await Promise.all([
        apiService.getAnalyticsOverview({ period: selectedPeriod }),
        apiService.getAnalyticsTrends({ period: selectedPeriod }),
        apiService.getAnalyticsInsights({ period: selectedPeriod }),
      ]);

      if (overviewResponse.success && trendsResponse.success && insightsResponse.success) {
        setAnalyticsData({
          overview: overviewResponse.data,
          trends: trendsResponse.data,
          insights: insightsResponse.data,
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const getChartData = () => {
    if (!analyticsData?.trends?.transactions) return [];

    return analyticsData.trends.transactions.map((item: any) => ({
      x: item._id.month ? `${item._id.year}-${item._id.month.toString().padStart(2, '0')}` : `${item._id.year}`,
      y: item.totalCO2,
    }));
  };

  const getCategoryData = () => {
    if (!analyticsData?.overview?.categoryBreakdown) return [];

    const data = Object.entries(analyticsData.overview.categoryBreakdown).map(([category, data]: [string, any]) => ({
      name: category.replace('_', ' ').toUpperCase(),
      population: data.co2Emissions,
      color: colors[category as keyof typeof colors] || colors.other,
      legendFontColor: theme.colors.onSurface,
      legendFontSize: 12,
    }));

    return data.filter(item => item.population > 0);
  };

  const getBarChartData = () => {
    if (!analyticsData?.overview?.categoryBreakdown) return { labels: [], datasets: [] };

    const categories = Object.keys(analyticsData.overview.categoryBreakdown);
    const labels = categories.map(cat => cat.replace('_', ' ').toUpperCase());
    const data = categories.map(cat => analyticsData.overview.categoryBreakdown[cat].co2Emissions);

    return {
      labels,
      datasets: [
        {
          data,
          color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        },
      ],
    };
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
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
        {/* Period Selection */}
        <View style={styles.periodContainer}>
          <SegmentedButtons
            value={selectedPeriod}
            onValueChange={setSelectedPeriod}
            buttons={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
            style={styles.periodButtons}
          />
        </View>

        {/* Chart Selection */}
        <View style={styles.chartSelection}>
          <Chip
            selected={selectedChart === 'overview'}
            onPress={() => setSelectedChart('overview')}
            style={styles.chartChip}
          >
            Overview
          </Chip>
          <Chip
            selected={selectedChart === 'trends'}
            onPress={() => setSelectedChart('trends')}
            style={styles.chartChip}
          >
            Trends
          </Chip>
          <Chip
            selected={selectedChart === 'categories'}
            onPress={() => setSelectedChart('categories')}
            style={styles.chartChip}
          >
            Categories
          </Chip>
        </View>

        {/* Overview Cards */}
        {analyticsData?.overview && (
          <View style={styles.overviewContainer}>
            <Card style={styles.overviewCard}>
              <Card.Content>
                <Text style={styles.overviewTitle}>Total Transactions</Text>
                <Text style={styles.overviewValue}>
                  {analyticsData.overview.transactions.total}
                </Text>
              </Card.Content>
            </Card>
            <Card style={styles.overviewCard}>
              <Card.Content>
                <Text style={styles.overviewTitle}>Total Amount</Text>
                <Text style={styles.overviewValue}>
                  ₹{analyticsData.overview.transactions.totalAmount.toLocaleString()}
                </Text>
              </Card.Content>
            </Card>
            <Card style={styles.overviewCard}>
              <Card.Content>
                <Text style={styles.overviewTitle}>CO₂ Emissions</Text>
                <Text style={styles.overviewValue}>
                  {analyticsData.overview.transactions.totalCO2Emissions.toFixed(1)} kg
                </Text>
              </Card.Content>
            </Card>
            <Card style={styles.overviewCard}>
              <Card.Content>
                <Text style={styles.overviewTitle}>Sustainability Score</Text>
                <Text style={styles.overviewValue}>
                  {analyticsData.overview.sustainability.sustainabilityScore.toFixed(1)}%
                </Text>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Charts */}
        {selectedChart === 'overview' && analyticsData?.overview && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.chartTitle}>Category Breakdown</Title>
              {getCategoryData().length > 0 && (
                <PieChart
                  data={getCategoryData()}
                  width={width - 80}
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  center={[10, 0]}
                  absolute
                />
              )}
            </Card.Content>
          </Card>
        )}

        {selectedChart === 'trends' && analyticsData?.trends && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.chartTitle}>CO₂ Emissions Trend</Title>
              {getChartData().length > 0 && (
                <LineChart
                  data={{
                    labels: getChartData().map(item => item.x),
                    datasets: [
                      {
                        data: getChartData().map(item => item.y),
                        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                  }}
                  width={width - 60}
                  height={220}
                  chartConfig={{
                    backgroundColor: theme.colors.surface,
                    backgroundGradientFrom: theme.colors.surface,
                    backgroundGradientTo: theme.colors.surface,
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: theme.colors.primary,
                    },
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              )}
            </Card.Content>
          </Card>
        )}

        {selectedChart === 'categories' && analyticsData?.overview && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.chartTitle}>Category Comparison</Title>
              {getBarChartData().labels.length > 0 && (
                <BarChart
                  data={getBarChartData()}
                  width={width - 60}
                  height={220}
                  chartConfig={{
                    backgroundColor: theme.colors.surface,
                    backgroundGradientFrom: theme.colors.surface,
                    backgroundGradientTo: theme.colors.surface,
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              )}
            </Card.Content>
          </Card>
        )}

        {/* Insights */}
        {analyticsData?.insights && (
          <Card style={styles.insightsCard}>
            <Card.Content>
              <Title style={styles.insightsTitle}>Key Insights</Title>
              <View style={styles.insightsList}>
                {analyticsData.insights.sustainabilityInsights?.map((insight: any, index: number) => (
                  <View key={index} style={styles.insightItem}>
                    <Text style={styles.insightText}>{insight.message}</Text>
                  </View>
                ))}
                {analyticsData.insights.costOptimization?.map((insight: any, index: number) => (
                  <View key={`cost-${index}`} style={styles.insightItem}>
                    <Text style={styles.insightText}>{insight.suggestion}</Text>
                  </View>
                ))}
                {analyticsData.insights.carbonReduction?.map((insight: any, index: number) => (
                  <View key={`carbon-${index}`} style={styles.insightItem}>
                    <Text style={styles.insightText}>{insight.suggestion}</Text>
                  </View>
                ))}
              </View>
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
  periodContainer: {
    padding: theme.spacing.md,
  },
  periodButtons: {
    marginBottom: theme.spacing.sm,
  },
  chartSelection: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  chartChip: {
    marginRight: theme.spacing.sm,
  },
  overviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  overviewCard: {
    width: '48%',
    elevation: 2,
  },
  overviewTitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.xs,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  chartCard: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  insightsCard: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  insightsList: {
    gap: theme.spacing.sm,
  },
  insightItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness,
  },
  insightText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
  },
});

export default AnalyticsScreen;