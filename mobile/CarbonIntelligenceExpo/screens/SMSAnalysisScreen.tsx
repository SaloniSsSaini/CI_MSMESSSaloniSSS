import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Button,
  TextInput,
  ActivityIndicator,
  FAB,
  Chip,
  List,
  Divider,
} from 'react-native-paper';
import { theme, colors } from '../theme/theme';
import { apiService } from '../services/apiService';

const SMSAnalysisScreen = ({ navigation }: any) => {
  const [smsData, setSmsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualSms, setManualSms] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadSMSData();
    loadAnalytics();
  }, []);

  const loadSMSData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getSMSTransactions({ limit: 50 });
      if (response.success) {
        setSmsData(response.data.transactions);
      }
    } catch (error) {
      console.error('Error loading SMS data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await apiService.getSMSAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const requestSMSPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          {
            title: 'SMS Permission',
            message: 'This app needs access to SMS to analyze transactions.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const processManualSMS = async () => {
    if (!manualSms.trim()) {
      Alert.alert('Error', 'Please enter SMS content');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiService.processSMS({
        body: manualSms,
        sender: 'Manual Entry',
        timestamp: new Date().toISOString(),
        messageId: `manual_${Date.now()}`,
      });

      if (response.success) {
        Alert.alert('Success', 'SMS processed successfully');
        setManualSms('');
        loadSMSData();
        loadAnalytics();
      } else {
        Alert.alert('Error', response.message || 'Failed to process SMS');
      }
    } catch (error) {
      console.error('Error processing SMS:', error);
      Alert.alert('Error', 'Failed to process SMS');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryColor = (category: string) => {
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return colors.success;
    if (confidence >= 0.6) return colors.warning;
    return colors.error;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading SMS data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Analytics Overview */}
        {analytics && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>SMS Analytics</Title>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>
                    {analytics.totalTransactions}
                  </Text>
                  <Text style={styles.analyticsLabel}>Total SMS</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>
                    {analytics.totalAmount.toLocaleString()}
                  </Text>
                  <Text style={styles.analyticsLabel}>Total Amount</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>
                    {analytics.totalCO2Emissions.toFixed(1)}
                  </Text>
                  <Text style={styles.analyticsLabel}>CO₂ (kg)</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>
                    {analytics.sustainabilityScore.toFixed(1)}%
                  </Text>
                  <Text style={styles.analyticsLabel}>Green Score</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Manual SMS Entry */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Process SMS Manually</Title>
            <TextInput
              label="SMS Content"
              value={manualSms}
              onChangeText={setManualSms}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.textInput}
              placeholder="Paste SMS content here..."
            />
            <Button
              mode="contained"
              onPress={processManualSMS}
              style={styles.processButton}
              disabled={isProcessing || !manualSms.trim()}
              loading={isProcessing}
            >
              Process SMS
            </Button>
          </Card.Content>
        </Card>

        {/* SMS Transactions List */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Recent SMS Transactions</Title>
            {smsData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No SMS transactions found</Text>
                <Text style={styles.emptySubtext}>
                  Process SMS messages to see transactions here
                </Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {smsData.map((transaction, index) => (
                  <View key={transaction._id || index}>
                    <List.Item
                      title={transaction.description}
                      description={`${formatAmount(transaction.amount, transaction.currency)} • ${formatDate(transaction.date)}`}
                      left={() => (
                        <View style={styles.transactionLeft}>
                          <Text style={styles.transactionType}>
                            {transaction.transactionType.toUpperCase()}
                          </Text>
                          <Chip
                            mode="outlined"
                            compact
                            style={[
                              styles.categoryChip,
                              { borderColor: getCategoryColor(transaction.category) }
                            ]}
                            textStyle={{ color: getCategoryColor(transaction.category) }}
                          >
                            {transaction.category.replace('_', ' ')}
                          </Chip>
                        </View>
                      )}
                      right={() => (
                        <View style={styles.transactionRight}>
                          <Text style={styles.co2Emissions}>
                            {transaction.carbonFootprint.co2Emissions.toFixed(1)} kg CO₂
                          </Text>
                          <View style={styles.confidenceContainer}>
                            <Text style={styles.confidenceLabel}>Confidence:</Text>
                            <Text
                              style={[
                                styles.confidenceValue,
                                { color: getConfidenceColor(transaction.metadata.confidence) }
                              ]}
                            >
                              {(transaction.metadata.confidence * 100).toFixed(0)}%
                            </Text>
                          </View>
                        </View>
                      )}
                    />
                    {index < smsData.length - 1 && <Divider />}
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // TODO: Implement SMS reading functionality
          Alert.alert('Info', 'SMS reading feature coming soon!');
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
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  analyticsLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 4,
  },
  textInput: {
    marginBottom: theme.spacing.md,
  },
  processButton: {
    marginTop: theme.spacing.sm,
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
    marginTop: theme.spacing.sm,
  },
  transactionLeft: {
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  transactionType: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  categoryChip: {
    height: 20,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  co2Emissions: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    marginRight: 4,
  },
  confidenceValue: {
    fontSize: 10,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default SMSAnalysisScreen;