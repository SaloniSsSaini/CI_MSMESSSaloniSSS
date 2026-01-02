import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
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
  ProgressBar,
  IconButton,
} from 'react-native-paper';
import { theme, colors } from '../theme/theme';
import { apiService } from '../services/apiService';
import PrivacyFocusedSMSReader from '../services/PrivacyFocusedSMSReader';

const SMSAnalysisScreen = ({ navigation: _navigation }: any) => {
  const [smsData, setSmsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualSms, setManualSms] = useState('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [esgMetrics, setEsgMetrics] = useState<any>(null);
  const [_privacyStatus, setPrivacyStatus] = useState<any>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataRetentionStatus, setDataRetentionStatus] = useState<any>(null);

  useEffect(() => {
    initializeSMSAnalysis();
    // initializeSMSAnalysis intentionally runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeSMSAnalysis = async () => {
    await checkConsentStatus();
    await loadSMSData();
    await loadAnalytics();
    await loadESGMetrics();
    await checkDataRetentionStatus();
  };

  const checkConsentStatus = async () => {
    try {
      const consentData = await PrivacyFocusedSMSReader.getConsentStatus();
      setConsentGiven(consentData?.consent || false);
      setPrivacyStatus(consentData);
    } catch (error) {
      console.error('Error checking consent status:', error);
    }
  };

  const loadSMSData = async () => {
    try {
      setIsLoading(true);
      
      if (consentGiven) {
        // Read SMS using privacy-focused reader
        const smsMessages = await PrivacyFocusedSMSReader.readSMSMessages({
          limit: 50,
          filterKeywords: ['bank', 'payment', 'transaction', 'purchase', 'sale', 'invoice', 'receipt', 'electricity', 'fuel', 'water']
        });
        setSmsData(smsMessages);
      } else {
        // Fallback to API service
        const response = await apiService.getSMSTransactions({ limit: 50 });
        if (response.success) {
          setSmsData(response.data.transactions);
        }
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

  const loadESGMetrics = async () => {
    try {
      const response = await apiService.getESGMetrics();
      if (response.success) {
        setEsgMetrics(response.data);
      }
    } catch (error) {
      console.error('Error loading ESG metrics:', error);
    }
  };

  const checkDataRetentionStatus = async () => {
    try {
      const status = await PrivacyFocusedSMSReader.getDataRetentionStatus();
      setDataRetentionStatus(status);
    } catch (error) {
      console.error('Error checking data retention status:', error);
    }
  };

  const requestSMSPermission = async () => {
    try {
      const permissionGranted = await PrivacyFocusedSMSReader.requestPermissions();
      if (permissionGranted) {
        const consentGranted = await PrivacyFocusedSMSReader.requestConsent();
        if (consentGranted) {
          setConsentGiven(true);
          await loadSMSData();
          await loadESGMetrics();
        }
      }
      return permissionGranted;
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      return false;
    }
  };

  const revokeConsent = async () => {
    Alert.alert(
      'Revoke Consent',
      'Are you sure you want to revoke SMS processing consent? This will delete all stored SMS data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            await PrivacyFocusedSMSReader.revokeConsent();
            setConsentGiven(false);
            setSmsData([]);
            setEsgMetrics(null);
            setDataRetentionStatus(null);
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeSMSAnalysis();
    setRefreshing(false);
  };

  const processManualSMS = async () => {
    if (!manualSms.trim()) {
      Alert.alert('Error', 'Please enter SMS content');
      return;
    }

    setIsProcessing(true);
    try {
      // Process using privacy-focused reader
      const mockSMS = {
        id: `manual_${Date.now()}`,
        body: manualSms,
        sender: 'Manual Entry',
        timestamp: new Date().toISOString()
      };

      const processedMessages = await PrivacyFocusedSMSReader.processSMSMessages([mockSMS]);
      
      if (processedMessages.length > 0) {
        Alert.alert('Success', 'SMS processed successfully');
        setManualSms('');
        await loadSMSData();
        await loadAnalytics();
        await loadESGMetrics();
      } else {
        Alert.alert('Error', 'Failed to process SMS');
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

  const getESGColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    if (score >= 40) return colors.error;
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
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Privacy Status */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.privacyHeader}>
              <Title style={styles.cardTitle}>Privacy & Consent</Title>
              <IconButton
                icon={consentGiven ? "shield-check" : "shield-alert"}
                iconColor={consentGiven ? colors.success : colors.warning}
                size={24}
              />
            </View>
            <View style={styles.privacyStatus}>
              <Chip
                icon={consentGiven ? "check-circle" : "alert-circle"}
                mode="outlined"
                style={[
                  styles.consentChip,
                  { borderColor: consentGiven ? colors.success : colors.warning }
                ]}
                textStyle={{ color: consentGiven ? colors.success : colors.warning }}
              >
                {consentGiven ? "Consent Given" : "Consent Required"}
              </Chip>
              {dataRetentionStatus && (
                <Text style={styles.retentionText}>
                  Data expires in {dataRetentionStatus.daysRemaining} days
                </Text>
              )}
            </View>
            <View style={styles.privacyActions}>
              {!consentGiven ? (
                <Button
                  mode="contained"
                  onPress={requestSMSPermission}
                  style={styles.consentButton}
                >
                  Grant SMS Access
                </Button>
              ) : (
                <Button
                  mode="outlined"
                  onPress={revokeConsent}
                  style={styles.revokeButton}
                  textColor={colors.error}
                >
                  Revoke Consent
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* ESG Metrics Overview */}
        {esgMetrics && (
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>ESG Sustainability Metrics</Title>
              <View style={styles.esgGrid}>
                <View style={styles.esgItem}>
                  <Text style={styles.esgScore}>{esgMetrics.overall?.score || 0}</Text>
                  <Text style={styles.esgLabel}>Overall Score</Text>
                  <Chip
                    mode="outlined"
                    compact
                    style={[
                      styles.esgChip,
                      { borderColor: getESGColor(esgMetrics.overall?.score || 0) }
                    ]}
                    textStyle={{ color: getESGColor(esgMetrics.overall?.score || 0) }}
                  >
                    {esgMetrics.overall?.grade || 'N/A'}
                  </Chip>
                </View>
                <View style={styles.esgItem}>
                  <Text style={styles.esgScore}>{esgMetrics.environmental?.score || 0}</Text>
                  <Text style={styles.esgLabel}>Environmental</Text>
                  <ProgressBar
                    progress={(esgMetrics.environmental?.score || 0) / 100}
                    color={getESGColor(esgMetrics.environmental?.score || 0)}
                    style={styles.progressBar}
                  />
                </View>
                <View style={styles.esgItem}>
                  <Text style={styles.esgScore}>{esgMetrics.social?.score || 0}</Text>
                  <Text style={styles.esgLabel}>Social</Text>
                  <ProgressBar
                    progress={(esgMetrics.social?.score || 0) / 100}
                    color={getESGColor(esgMetrics.social?.score || 0)}
                    style={styles.progressBar}
                  />
                </View>
                <View style={styles.esgItem}>
                  <Text style={styles.esgScore}>{esgMetrics.governance?.score || 0}</Text>
                  <Text style={styles.esgLabel}>Governance</Text>
                  <ProgressBar
                    progress={(esgMetrics.governance?.score || 0) / 100}
                    color={getESGColor(esgMetrics.governance?.score || 0)}
                    style={styles.progressBar}
                  />
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

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