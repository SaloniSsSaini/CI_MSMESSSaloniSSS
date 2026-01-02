import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  FAB,
  Chip,
  ProgressBar,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { theme, colors } from '../theme/theme';
import { apiService } from '../services/apiService';
import { CarbonScoreCard } from '../components/CarbonScoreCard';
import { QuickStatsCard } from '../components/QuickStatsCard';
import { RecentTransactionsCard } from '../components/RecentTransactionsCard';
import { RecommendationsCard } from '../components/RecommendationsCard';
import { LoadingScreen } from '../components/LoadingScreen';
import { ErrorScreen } from '../components/ErrorScreen';
import * as Animatable from 'react-native-animatable';

export const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.getDashboard();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.message || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

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
    return <LoadingScreen message="Loading your dashboard..." />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Unable to load dashboard"
        message={error}
        onRetry={loadDashboardData}
      />
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
        {/* Welcome Section */}
        <Animatable.View animation="fadeInDown" duration={800}>
          <Card style={styles.welcomeCard} elevation={6}>
            <Card.Content>
              <Title style={styles.welcomeTitle}>
                Welcome back, {user?.msme?.companyName || 'User'}!
              </Title>
              <Paragraph style={styles.welcomeSubtitle}>
                Track your carbon footprint and sustainable manufacturing progress
              </Paragraph>
            </Card.Content>
          </Card>
        </Animatable.View>

        {/* Carbon Score Card */}
        {dashboardData?.currentScore !== undefined && (
          <CarbonScoreCard
            score={dashboardData.currentScore}
            scoreColor={getCarbonScoreColor(dashboardData.currentScore)}
            scoreLabel={getCarbonScoreLabel(dashboardData.currentScore)}
            lastAssessment={dashboardData.lastAssessmentDate}
          />
        )}

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <QuickStatsCard
            title="This Month"
            value={dashboardData?.currentMonthEmissions || 0}
            unit="kg CO₂"
            color={colors.chart1}
            icon="leaf"
          />
          <QuickStatsCard
            title="Total Transactions"
            value={dashboardData?.totalTransactions || 0}
            unit="transactions"
            color={colors.chart2}
            icon="receipt"
          />
        </View>

        {/* Category Breakdown */}
        {dashboardData?.categoryBreakdown && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Emission Categories</Title>
              <View style={styles.categoryContainer}>
                {Object.entries(dashboardData.categoryBreakdown).map(([category, data]: [string, any]) => (
                  <View key={category} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryName}>
                        {category.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.categoryValue}>
                        {data.co2Emissions.toFixed(1)} kg CO₂
                      </Text>
                    </View>
                    <ProgressBar
                      progress={data.co2Emissions / (dashboardData.currentMonthEmissions || 1)}
                      color={colors[category as keyof typeof colors] || colors.other}
                      style={styles.progressBar}
                    />
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Recent Transactions */}
        <RecentTransactionsCard
          transactions={dashboardData?.recentTransactions || []}
          onViewAll={() => navigation.navigate('Transactions')}
        />

        {/* Top Recommendations */}
        {dashboardData?.topRecommendations && dashboardData.topRecommendations.length > 0 && (
          <RecommendationsCard
            recommendations={dashboardData.topRecommendations}
            onViewAll={() => navigation.navigate('CarbonFootprint')}
          />
        )}

        {/* Quick Actions */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            <View style={styles.quickActions}>
              <Chip
                icon="message-text"
                onPress={() => navigation.navigate('SMSAnalysis')}
                style={styles.actionChip}
              >
                Analyze SMS
              </Chip>
              <Chip
                icon="email"
                onPress={() => navigation.navigate('EmailAnalysis')}
                style={styles.actionChip}
              >
                Analyze Email
              </Chip>
              <Chip
                icon="chart-line"
                onPress={() => navigation.navigate('Analytics')}
                style={styles.actionChip}
              >
                View Analytics
              </Chip>
              <Chip
                icon="trophy"
                onPress={() => navigation.navigate('Incentives')}
                style={styles.actionChip}
              >
                Incentives
              </Chip>
              <Chip
                icon="leaf-circle"
                onPress={() => navigation.navigate('CarbonTrading')}
                style={styles.actionChip}
              >
                Carbon Trading
              </Chip>
              <Chip
                icon="file-document"
                onPress={() => navigation.navigate('Reporting')}
                style={styles.actionChip}
              >
                Reports
              </Chip>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Transactions')}
        testID="fab-button"
        accessibilityLabel="Add transaction"
      />
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
  welcomeCard: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
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
  categoryContainer: {
    marginTop: theme.spacing.sm,
  },
  categoryItem: {
    marginBottom: theme.spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    flex: 1,
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionChip: {
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default DashboardScreen;