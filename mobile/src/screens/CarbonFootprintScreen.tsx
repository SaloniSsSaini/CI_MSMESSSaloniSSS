import React, { useState, useEffect } from 'react';
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
  Button,
  ActivityIndicator,
  ProgressBar,
  Chip,
  List,
  Divider,
} from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { theme, colors } from '../theme/theme';
import { apiService } from '../services/apiService';

const { width } = Dimensions.get('window');

const CarbonFootprintScreen = ({ navigation }: any) => {
  const [assessment, setAssessment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadLatestAssessment();
  }, []);

  const loadLatestAssessment = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCarbonAssessments({ limit: 1 });
      if (response.success && response.data.assessments.length > 0) {
        setAssessment(response.data.assessments[0]);
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLatestAssessment();
    setRefreshing(false);
  };

  const performNewAssessment = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.performCarbonAssessment();
      if (response.success) {
        setAssessment(response.data.assessment);
        Alert.alert('Success', 'New carbon assessment completed');
      } else {
        Alert.alert('Error', response.message || 'Failed to perform assessment');
      }
    } catch (error) {
      console.error('Error performing assessment:', error);
      Alert.alert('Error', 'Failed to perform assessment');
    } finally {
      setIsLoading(false);
    }
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

  const getChartData = () => {
    if (!assessment?.breakdown) return [];

    const data = [
      {
        name: 'Energy',
        population: assessment.breakdown.energy?.total || 0,
        color: colors.energy,
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 12,
      },
      {
        name: 'Water',
        population: assessment.breakdown.water?.co2Emissions || 0,
        color: colors.water,
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 12,
      },
      {
        name: 'Waste',
        population: assessment.breakdown.waste?.total || 0,
        color: colors.waste,
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 12,
      },
      {
        name: 'Transport',
        population: assessment.breakdown.transportation?.co2Emissions || 0,
        color: colors.transportation,
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 12,
      },
      {
        name: 'Materials',
        population: assessment.breakdown.materials?.co2Emissions || 0,
        color: colors.materials,
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 12,
      },
      {
        name: 'Manufacturing',
        population: assessment.breakdown.manufacturing?.co2Emissions || 0,
        color: colors.equipment,
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 12,
      },
    ];

    return data.filter(item => item.population > 0);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading carbon footprint data...</Text>
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
        {!assessment ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Carbon Assessment Found</Text>
            <Text style={styles.emptyText}>
              Perform your first carbon footprint assessment to get started
            </Text>
            <Button
              mode="contained"
              onPress={performNewAssessment}
              style={styles.assessButton}
              loading={isLoading}
            >
              Start Assessment
            </Button>
          </View>
        ) : (
          <>
            {/* Carbon Score Card */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Carbon Score</Title>
                <View style={styles.scoreContainer}>
                  <Text style={[
                    styles.score,
                    { color: getCarbonScoreColor(assessment.carbonScore) }
                  ]}>
                    {assessment.carbonScore}
                  </Text>
                  <Text style={styles.scoreLabel}>
                    {getCarbonScoreLabel(assessment.carbonScore)}
                  </Text>
                </View>
                <ProgressBar
                  progress={assessment.carbonScore / 100}
                  color={getCarbonScoreColor(assessment.carbonScore)}
                  style={styles.progressBar}
                />
                <Text style={styles.scoreDescription}>
                  Based on your manufacturing processes and environmental compliance
                </Text>
              </Card.Content>
            </Card>

            {/* Total Emissions */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Total CO₂ Emissions</Title>
                <Text style={styles.emissionsValue}>
                  {assessment.totalCO2Emissions.toFixed(2)} kg CO₂
                </Text>
                <Text style={styles.emissionsPeriod}>
                  for the assessment period
                </Text>
              </Card.Content>
            </Card>

            {/* Breakdown Chart */}
            {getChartData().length > 0 && (
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.cardTitle}>Emission Breakdown</Title>
                  <View style={styles.chartContainer}>
                    <PieChart
                      data={getChartData()}
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
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* ESG Scope Breakdown */}
            {assessment.esgScopes && (
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.cardTitle}>ESG Scope Breakdown</Title>
                  <View style={styles.scopeContainer}>
                    <View style={styles.scopeItem}>
                      <View style={styles.scopeHeader}>
                        <Text style={[styles.scopeTitle, { color: colors.error }]}>Scope 1</Text>
                        <Text style={styles.scopeValue}>
                          {assessment.esgScopes.scope1?.total?.toFixed(1) || '0.0'} kg CO₂
                        </Text>
                      </View>
                      <Text style={styles.scopeDescription}>
                        Direct emissions from owned or controlled sources
                      </Text>
                      <ProgressBar
                        progress={assessment.totalCO2Emissions > 0 
                          ? (assessment.esgScopes.scope1?.total || 0) / assessment.totalCO2Emissions 
                          : 0}
                        color={colors.error}
                        style={styles.scopeProgress}
                      />
                    </View>

                    <View style={styles.scopeItem}>
                      <View style={styles.scopeHeader}>
                        <Text style={[styles.scopeTitle, { color: colors.warning }]}>Scope 2</Text>
                        <Text style={styles.scopeValue}>
                          {assessment.esgScopes.scope2?.total?.toFixed(1) || '0.0'} kg CO₂
                        </Text>
                      </View>
                      <Text style={styles.scopeDescription}>
                        Indirect emissions from purchased energy
                      </Text>
                      <ProgressBar
                        progress={assessment.totalCO2Emissions > 0 
                          ? (assessment.esgScopes.scope2?.total || 0) / assessment.totalCO2Emissions 
                          : 0}
                        color={colors.warning}
                        style={styles.scopeProgress}
                      />
                    </View>

                    <View style={styles.scopeItem}>
                      <View style={styles.scopeHeader}>
                        <Text style={[styles.scopeTitle, { color: colors.info }]}>Scope 3</Text>
                        <Text style={styles.scopeValue}>
                          {assessment.esgScopes.scope3?.total?.toFixed(1) || '0.0'} kg CO₂
                        </Text>
                      </View>
                      <Text style={styles.scopeDescription}>
                        All other indirect emissions in the value chain
                      </Text>
                      <ProgressBar
                        progress={assessment.totalCO2Emissions > 0 
                          ? (assessment.esgScopes.scope3?.total || 0) / assessment.totalCO2Emissions 
                          : 0}
                        color={colors.info}
                        style={styles.scopeProgress}
                      />
                    </View>
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Category Breakdown */}
            <Card style={styles.card}>
              <Card.Content>
                <Title style={styles.cardTitle}>Category Breakdown</Title>
                <View style={styles.categoryList}>
                  {Object.entries(assessment.breakdown).map(([category, data]: [string, any]) => {
                    if (!data || (typeof data === 'object' && !data.co2Emissions && !data.total)) return null;
                    
                    const emissions = data.co2Emissions || data.total || 0;
                    const percentage = assessment.totalCO2Emissions > 0 
                      ? (emissions / assessment.totalCO2Emissions) * 100 
                      : 0;

                    return (
                      <View key={category} style={styles.categoryItem}>
                        <View style={styles.categoryHeader}>
                          <Text style={styles.categoryName}>
                            {category.replace('_', ' ').toUpperCase()}
                          </Text>
                          <Text style={styles.categoryValue}>
                            {emissions.toFixed(1)} kg CO₂
                          </Text>
                        </View>
                        <View style={styles.categoryFooter}>
                          <ProgressBar
                            progress={percentage / 100}
                            color={colors[category as keyof typeof colors] || colors.other}
                            style={styles.categoryProgress}
                          />
                          <Text style={styles.categoryPercentage}>
                            {percentage.toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </Card.Content>
            </Card>

            {/* Recommendations */}
            {assessment.recommendations && assessment.recommendations.length > 0 && (
              <Card style={styles.card}>
                <Card.Content>
                  <Title style={styles.cardTitle}>Recommendations</Title>
                  <View style={styles.recommendationsList}>
                    {assessment.recommendations.slice(0, 5).map((recommendation: any, index: number) => (
                      <View key={index} style={styles.recommendationItem}>
                        <View style={styles.recommendationHeader}>
                          <Text style={styles.recommendationTitle}>
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
                        <Text style={styles.recommendationDescription}>
                          {recommendation.description}
                        </Text>
                        <View style={styles.recommendationMetrics}>
                          <Text style={styles.metric}>
                            CO₂ Reduction: {recommendation.potentialCO2Reduction.toFixed(1)} kg
                          </Text>
                          <Text style={styles.metric}>
                            Cost: ₹{recommendation.implementationCost.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                mode="contained"
                onPress={performNewAssessment}
                style={styles.actionButton}
                loading={isLoading}
              >
                New Assessment
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  // TODO: Navigate to detailed analysis
                }}
                style={styles.actionButton}
              >
                Detailed Analysis
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 24,
  },
  assessButton: {
    paddingHorizontal: theme.spacing.xl,
  },
  card: {
    margin: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
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
  scoreDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  emissionsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  emissionsPeriod: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  categoryList: {
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
  categoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryProgress: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    minWidth: 40,
    textAlign: 'right',
  },
  recommendationsList: {
    marginTop: theme.spacing.sm,
  },
  recommendationItem: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness,
    marginBottom: theme.spacing.sm,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
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
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  scopeContainer: {
    marginTop: theme.spacing.sm,
  },
  scopeItem: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness,
  },
  scopeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  scopeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  scopeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  scopeDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.sm,
  },
  scopeProgress: {
    height: 6,
    borderRadius: 3,
  },
});

export default CarbonFootprintScreen;