import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
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
  IconButton,
} from 'react-native-paper';
import { theme, colors } from '../theme/theme';
import { apiService } from '../services/apiService';

const EmailAnalysisScreen = ({ navigation: _navigation }: any) => {
  const [emailData, setEmailData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualEmail, setManualEmail] = useState({
    subject: '',
    body: '',
    from: '',
    to: '',
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [showManualForm, setShowManualForm] = useState(false);

  useEffect(() => {
    loadEmailData();
    loadAnalytics();
  }, []);

  const loadEmailData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getEmailTransactions({ limit: 50 });
      if (response.success) {
        setEmailData(response.data.transactions);
      }
    } catch (error) {
      console.error('Error loading email data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await apiService.getEmailAnalytics();
      if (response.success) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const processManualEmail = async () => {
    if (!manualEmail.subject.trim() || !manualEmail.body.trim()) {
      Alert.alert('Error', 'Please enter email subject and body');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiService.processEmail({
        subject: manualEmail.subject,
        body: manualEmail.body,
        from: manualEmail.from || 'manual@example.com',
        to: manualEmail.to || 'user@example.com',
        date: new Date().toISOString(),
        messageId: `manual_${Date.now()}`,
      });

      if (response.success) {
        Alert.alert('Success', 'Email processed successfully');
        setManualEmail({ subject: '', body: '', from: '', to: '' });
        setShowManualForm(false);
        loadEmailData();
        loadAnalytics();
      } else {
        Alert.alert('Error', response.message || 'Failed to process email');
      }
    } catch (error) {
      console.error('Error processing email:', error);
      Alert.alert('Error', 'Failed to process email');
    } finally {
      setIsProcessing(false);
    }
  };

  const connectEmailAccount = async () => {
    Alert.alert(
      'Connect Email Account',
      'This feature will allow automatic email processing. Please provide your email credentials.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: () => {
            // TODO: Implement email account connection
            Alert.alert('Info', 'Email connection feature coming soon!');
          },
        },
      ]
    );
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
        <Text style={styles.loadingText}>Loading email data...</Text>
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
              <Title style={styles.cardTitle}>Email Analytics</Title>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>
                    {analytics.totalTransactions}
                  </Text>
                  <Text style={styles.analyticsLabel}>Total Emails</Text>
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
                    {analytics.confidenceScore.toFixed(1)}%
                  </Text>
                  <Text style={styles.analyticsLabel}>Avg Confidence</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Manual Email Entry */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Title style={styles.cardTitle}>Process Email Manually</Title>
              <IconButton
                icon={showManualForm ? 'chevron-up' : 'chevron-down'}
                onPress={() => setShowManualForm(!showManualForm)}
              />
            </View>
            
            {showManualForm && (
              <View style={styles.formContainer}>
                <TextInput
                  label="Email Subject"
                  value={manualEmail.subject}
                  onChangeText={(value) => setManualEmail(prev => ({ ...prev, subject: value }))}
                  mode="outlined"
                  style={styles.textInput}
                  placeholder="Enter email subject..."
                />
                
                <TextInput
                  label="Email Body"
                  value={manualEmail.body}
                  onChangeText={(value) => setManualEmail(prev => ({ ...prev, body: value }))}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.textInput}
                  placeholder="Paste email content here..."
                />
                
                <TextInput
                  label="From Email (Optional)"
                  value={manualEmail.from}
                  onChangeText={(value) => setManualEmail(prev => ({ ...prev, from: value }))}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                  placeholder="sender@example.com"
                />
                
                <TextInput
                  label="To Email (Optional)"
                  value={manualEmail.to}
                  onChangeText={(value) => setManualEmail(prev => ({ ...prev, to: value }))}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.textInput}
                  placeholder="recipient@example.com"
                />
                
                <Button
                  mode="contained"
                  onPress={processManualEmail}
                  style={styles.processButton}
                  disabled={isProcessing || !manualEmail.subject.trim() || !manualEmail.body.trim()}
                  loading={isProcessing}
                >
                  Process Email
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Email Account Connection */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Email Account</Title>
            <Text style={styles.cardDescription}>
              Connect your email account for automatic transaction processing
            </Text>
            <Button
              mode="outlined"
              onPress={connectEmailAccount}
              style={styles.connectButton}
              // icon="email"
            >
              Connect Email Account
            </Button>
          </Card.Content>
        </Card>

        {/* Email Transactions List */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Recent Email Transactions</Title>
            {emailData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No email transactions found</Text>
                <Text style={styles.emptySubtext}>
                  Process email messages to see transactions here
                </Text>
              </View>
            ) : (
              <View style={styles.transactionsList}>
                {emailData.map((transaction, index) => (
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
                    {index < emailData.length - 1 && <Divider />}
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
        onPress={() => setShowManualForm(true)}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
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
  formContainer: {
    marginTop: theme.spacing.md,
  },
  textInput: {
    marginBottom: theme.spacing.md,
  },
  processButton: {
    marginTop: theme.spacing.sm,
  },
  connectButton: {
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

export default EmailAnalysisScreen;