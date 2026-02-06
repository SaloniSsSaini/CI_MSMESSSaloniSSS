import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import SmsAndroid from 'react-native-get-sms-android';
import {
  createSpamDetector,
  classifyExpense,
  getExpenseCategoryInfo,
  ExpenseCategory as ExpenseCategoryEnum,
  // Industry classification for MSME/B2B transactions
  classifyIndustry,
  getIndustryInfo,
} from '../pipeline';

type SmsMessage = {
  _id: number | string;
  address?: string;
  body?: string;
  date?: number;
  read?: 0 | 1;
};

type ExpenseCategory =
  | 'energy' | 'food' | 'transport' | 'shopping' | 'bills'
  | 'finance' | 'healthcare' | 'entertainment' | 'education'
  | 'transfer' | 'other';

type ExpenseSubcategory = string;

interface UPIDetails {
  isUPI: boolean;
  transactionType: 'debit' | 'credit' | null;
  upiRef: string | null;
  upiId: string | null;
  merchantName: string | null;
  paymentApp: string | null;
}

type ClassifiedMessage = SmsMessage & {
  isSpam: boolean;
  confidence: number;
  reasonCodes: string[];
  // Expense category fields
  category: ExpenseCategory;
  subcategory: ExpenseSubcategory;
  amount: { value: number; currency: string } | null;
  merchant: string | null;
  upiDetails: UPIDetails | null;
  transactionType: 'debit' | 'credit' | null;
  // Industry classification fields (for MSME/B2B transactions)
  industry: string | null;
  industryLabel: string | null;
  industryIcon: string | null;
  industryColor: string | null;
  industryConfidence: number;
};

type PermissionState = 'unknown' | 'granted' | 'denied';
type TabType = 'notSpam' | 'spam';
type CategoryFilter = 'all' | ExpenseCategory;

// Expense category configuration with new granular categories
const EXPENSE_CATEGORIES: Array<{
  key: CategoryFilter;
  label: string;
  icon: string;
  color: string;
}> = [
    { key: 'all', label: 'All', icon: '📋', color: '#4F7CFF' },
    { key: 'food', label: 'Food', icon: '🍽️', color: '#FF6B6B' },
    { key: 'transport', label: 'Transport', icon: '🚗', color: '#45B7D1' },
    { key: 'shopping', label: 'Shopping', icon: '🛍️', color: '#9B59B6' },
    { key: 'bills', label: 'Bills', icon: '📱', color: '#3498DB' },
    { key: 'energy', label: 'Energy', icon: '⚡', color: '#4ECDC4' },
    { key: 'finance', label: 'Finance', icon: '💰', color: '#27AE60' },
    { key: 'healthcare', label: 'Health', icon: '🏥', color: '#E74C3C' },
    { key: 'entertainment', label: 'Fun', icon: '🎬', color: '#E91E63' },
    { key: 'education', label: 'Edu', icon: '📚', color: '#FF9800' },
    { key: 'transfer', label: 'Transfer', icon: '↔️', color: '#607D8B' },
    { key: 'other', label: 'Other', icon: '📄', color: '#95A5A6' },
  ];

// Helper to get category display info using the new ExpenseClassifier
const getCategoryDisplay = (category: ExpenseCategory, subcategory?: string): { icon: string; label: string; color: string } => {
  const info = getExpenseCategoryInfo(category, subcategory);
  return {
    icon: info.icon,
    label: info.label,
    color: info.color,
  };
};

// Initialize spam detector
const spamDetector = createSpamDetector();

function formatSmsDate(dateMs?: number): string {
  if (!dateMs) {
    return '';
  }
  return new Date(dateMs).toLocaleString();
}

async function requestReadSmsPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    {
      title: 'Read SMS permission',
      message:
        'This app needs access to your SMS inbox so it can display messages on screen.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

const SmsReadingScreen = (): JSX.Element => {
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ClassifiedMessage[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('notSpam');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const loadInbox = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setError('SMS inbox access is Android-only.');
      return;
    }

    setError(null);
    setIsLoading(true);

    const filter = {
      box: 'inbox',
      indexFrom: 0,
      maxCount: 100,
    };

    await new Promise<void>(resolve => {
      SmsAndroid.list(
        JSON.stringify(filter),
        (fail: string) => {
          setError(String(fail));
          setIsLoading(false);
          resolve();
        },
        (_count: number, smsList: string) => {
          try {
            const parsed = JSON.parse(smsList) as SmsMessage[];

            // Classify each message using spam detector, expense classifier, and industry classifier
            const classified: ClassifiedMessage[] = parsed.map(msg => {
              const spamResult = spamDetector.predict(msg.body || '', msg.address);

              // Only classify expense and industry for non-spam (transactional) messages
              let category: ExpenseCategory = 'other';
              let subcategory: ExpenseSubcategory = 'general';
              let amount: { value: number; currency: string } | null = null;
              let merchant: string | null = null;
              let upiDetails: UPIDetails | null = null;
              let transactionType: 'debit' | 'credit' | null = null;

              // Industry classification for MSME/B2B
              let industry: string | null = null;
              let industryLabel: string | null = null;
              let industryIcon: string | null = null;
              let industryColor: string | null = null;
              let industryConfidence: number = 0;

              if (!spamResult.isSpam) {
                // Expense classification
                const expenseResult = classifyExpense(msg.body || '', msg.address);
                category = expenseResult.category as ExpenseCategory;
                subcategory = expenseResult.subcategory;
                amount = expenseResult.amount;
                merchant = expenseResult.merchant;
                upiDetails = expenseResult.upiDetails;
                transactionType = expenseResult.transactionType;

                // Industry classification for B2B/MSME transactions
                const industryResult = classifyIndustry(msg.body || '', msg.address);
                if (industryResult.confidence > 0.4) {
                  industry = industryResult.sector;
                  industryLabel = industryResult.sectorLabel;
                  industryConfidence = industryResult.confidence;

                  const industryInfo = getIndustryInfo(industryResult.sector);
                  industryIcon = industryInfo.icon;
                  industryColor = industryInfo.color;
                }
              }

              return {
                ...msg,
                isSpam: spamResult.isSpam,
                confidence: spamResult.confidence,
                reasonCodes: spamResult.reasonCodes || [],
                category,
                subcategory,
                amount,
                merchant,
                upiDetails,
                transactionType,
                industry,
                industryLabel,
                industryIcon,
                industryColor,
                industryConfidence,
              };
            });

            setMessages(classified);
          } catch (e) {
            setError(`Failed to parse SMS list: ${String(e)}`);
          } finally {
            setIsLoading(false);
            resolve();
          }
        },
      );
    });
  }, []);

  const onRequestPermissionAndLoad = useCallback(async () => {
    setError(null);
    const ok = await requestReadSmsPermission();
    setPermission(ok ? 'granted' : 'denied');

    if (ok) {
      await loadInbox();
    }
  }, [loadInbox]);

  useEffect(() => {
    if (process.env.JEST_WORKER_ID) return;
    if (Platform.OS !== 'android') return;

    onRequestPermissionAndLoad().catch(e => setError(String(e)));
  }, [onRequestPermissionAndLoad]);

  // Filter messages based on active tab and category filter
  const filteredMessages = useMemo(() => {
    let filtered = messages.filter(msg =>
      activeTab === 'spam' ? msg.isSpam : !msg.isSpam
    );

    // Apply category filter only for non-spam tab
    if (activeTab === 'notSpam' && categoryFilter !== 'all') {
      filtered = filtered.filter(msg => msg.category === categoryFilter);
    }

    return filtered;
  }, [messages, activeTab, categoryFilter]);

  // Count spam and not-spam messages
  const spamCount = useMemo(() => messages.filter(m => m.isSpam).length, [messages]);
  const notSpamCount = useMemo(() => messages.filter(m => !m.isSpam).length, [messages]);

  // Get non-spam messages for category stats
  const nonSpamMessages = useMemo(() => messages.filter(m => !m.isSpam), [messages]);

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats: Record<ExpenseCategory, { count: number; total: number }> = {
      energy: { count: 0, total: 0 },
      food: { count: 0, total: 0 },
      transport: { count: 0, total: 0 },
      shopping: { count: 0, total: 0 },
      bills: { count: 0, total: 0 },
      finance: { count: 0, total: 0 },
      healthcare: { count: 0, total: 0 },
      entertainment: { count: 0, total: 0 },
      education: { count: 0, total: 0 },
      transfer: { count: 0, total: 0 },
      other: { count: 0, total: 0 },
    };

    nonSpamMessages.forEach(msg => {
      if (stats[msg.category]) {
        stats[msg.category].count += 1;
        if (msg.amount) {
          stats[msg.category].total += msg.amount.value;
        }
      }
    });

    return stats;
  }, [nonSpamMessages]);

  // Get count for a specific category filter
  const getCategoryCount = (cat: CategoryFilter): number => {
    if (cat === 'all') return nonSpamMessages.length;
    return categoryStats[cat].count;
  };

  const headerSubtitle = useMemo(() => {
    if (Platform.OS !== 'android') return 'Android-only feature';
    if (permission === 'unknown') return 'Requesting READ_SMS…';
    if (permission === 'denied') return 'Permission denied';
    if (isLoading) return 'Loading inbox…';
    return `${filteredMessages.length} messages`;
  }, [isLoading, filteredMessages.length, permission]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>SMS Inbox</Text>
          <Text style={styles.subtitle}>{headerSubtitle}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={onRequestPermissionAndLoad}
          style={({ pressed }) => [
            styles.button,
            pressed ? styles.buttonPressed : null,
          ]}>
          <Text style={styles.buttonText}>
            {permission === 'granted' ? 'Refresh' : 'Enable'}
          </Text>
        </Pressable>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'notSpam' && styles.activeTab]}
          onPress={() => setActiveTab('notSpam')}>
          <Text style={[styles.tabText, activeTab === 'notSpam' && styles.activeTabText]}>
            Transactions ({notSpamCount})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'spam' && styles.activeTab]}
          onPress={() => setActiveTab('spam')}>
          <Text style={[styles.tabText, activeTab === 'spam' && styles.activeTabText]}>
            Spam ({spamCount})
          </Text>
        </Pressable>
      </View>

      {/* Category Filter Chips - Only show for Transactions tab */}
      {activeTab === 'notSpam' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilterContainer}
          contentContainerStyle={styles.categoryFilterContent}>
          {EXPENSE_CATEGORIES.map(cat => {
            const isActive = categoryFilter === cat.key;
            const count = getCategoryCount(cat.key);
            return (
              <Pressable
                key={cat.key}
                style={[
                  styles.categoryChip,
                  isActive && { backgroundColor: cat.color },
                ]}
                onPress={() => setCategoryFilter(cat.key)}>
                <Text style={styles.categoryChipIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryChipText,
                    isActive && styles.categoryChipTextActive,
                  ]}>
                  {cat.label}
                </Text>
                <View
                  style={[
                    styles.categoryChipBadge,
                    isActive && styles.categoryChipBadgeActive,
                  ]}>
                  <Text
                    style={[
                      styles.categoryChipBadgeText,
                      isActive && styles.categoryChipBadgeTextActive,
                    ]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={filteredMessages}
        keyExtractor={item => String(item._id)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          activeTab === 'notSpam' && nonSpamMessages.length > 0 ? (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Expense Summary</Text>
              <View style={styles.statsGrid}>
                {EXPENSE_CATEGORIES.filter(c => c.key !== 'all').map(cat => {
                  const stats = categoryStats[cat.key as ExpenseCategory];
                  if (stats.count === 0) return null;
                  return (
                    <View key={cat.key} style={styles.statsItem}>
                      <View style={styles.statsItemHeader}>
                        <Text style={styles.statsItemIcon}>{cat.icon}</Text>
                        <Text style={[styles.statsItemLabel, { color: cat.color }]}>
                          {cat.label}
                        </Text>
                      </View>
                      <Text style={styles.statsItemCount}>{stats.count} msgs</Text>
                      {stats.total > 0 && (
                        <Text style={styles.statsItemTotal}>
                          ₹{stats.total.toLocaleString()}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
              <View style={styles.statsDivider} />
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const categoryDisplay = getCategoryDisplay(item.category, item.subcategory);
          return (
            <View style={[styles.row, item.isSpam && styles.spamRow]}>
              <View style={styles.rowHeader}>
                <Text numberOfLines={1} style={styles.address}>
                  {item.address ?? 'Unknown sender'}
                </Text>
                <Text style={styles.date}>
                  {formatSmsDate(item.date)}
                </Text>
              </View>

              {/* Category and Amount Row - Only for non-spam */}
              {!item.isSpam && (
                <View style={styles.categoryAmountRow}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: `${categoryDisplay.color}25` },
                    ]}>
                    <Text style={styles.categoryBadgeIcon}>{categoryDisplay.icon}</Text>
                    <Text style={[styles.categoryBadgeText, { color: categoryDisplay.color }]}>
                      {categoryDisplay.label}
                    </Text>
                  </View>
                  {item.merchant && (
                    <View style={styles.merchantBadge}>
                      <Text style={styles.merchantText}>{item.merchant}</Text>
                    </View>
                  )}
                  {item.amount && (
                    <View style={[
                      styles.amountBadge,
                      item.transactionType === 'credit' && styles.creditBadge,
                    ]}>
                      <Text style={[
                        styles.amountText,
                        item.transactionType === 'credit' && styles.creditText,
                      ]}>
                        {item.transactionType === 'credit' ? '+' : ''}
                        {item.amount.currency === 'INR' ? '₹' : item.amount.currency}{' '}
                        {item.amount.value.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* UPI indicator */}
              {!item.isSpam && item.upiDetails?.isUPI && (
                <View style={styles.upiIndicator}>
                  <Text style={styles.upiText}>UPI</Text>
                  {item.upiDetails.paymentApp && (
                    <Text style={styles.paymentAppText}>
                      via {item.upiDetails.paymentApp}
                    </Text>
                  )}
                </View>
              )}

              {/* Industry Badge - for B2B/MSME transactions */}
              {!item.isSpam && item.industry && item.industryConfidence > 0.5 && (
                <View style={[
                  styles.industryBadge,
                  { backgroundColor: `${item.industryColor || '#607D8B'}20` },
                ]}>
                  <Text style={styles.industryIcon}>{item.industryIcon || '🏢'}</Text>
                  <Text style={[
                    styles.industryText,
                    { color: item.industryColor || '#607D8B' }
                  ]}>
                    {item.industryLabel || item.industry}
                  </Text>
                </View>
              )}

              <Text numberOfLines={3} style={styles.body}>
                {item.body ?? ''}
              </Text>

              {item.reasonCodes.length > 0 && (
                <View style={styles.tagsContainer}>
                  {item.reasonCodes.slice(0, 3).map((code, idx) => (
                    <View key={idx} style={[styles.tag, item.isSpam ? styles.spamTag : styles.importantTag]}>
                      <Text style={styles.tagText}>{code.replace(/_/g, ' ')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {permission === 'granted'
              ? activeTab === 'spam'
                ? 'No spam messages found.'
                : categoryFilter !== 'all'
                  ? `No ${categoryFilter} transactions found.`
                  : 'No transactions found.'
              : 'Grant permission to load your inbox.'}
          </Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0B1020',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#4F7CFF',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#4F7CFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  // Category Filter Styles
  categoryFilterContainer: {
    maxHeight: 50,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 6,
  },
  categoryChipIcon: {
    fontSize: 14,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  categoryChipBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  categoryChipBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  categoryChipBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  categoryChipBadgeTextActive: {
    color: '#FFFFFF',
  },
  // Stats Card Styles
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsItem: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 12,
    minWidth: 90,
    flex: 1,
  },
  statsItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statsItemIcon: {
    fontSize: 16,
  },
  statsItemLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statsItemCount: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  statsItemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  statsDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: 16,
  },
  // Category and Amount Row Styles
  categoryAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  categoryBadgeIcon: {
    fontSize: 12,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  amountBadge: {
    backgroundColor: 'rgba(46,204,113,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  amountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2ECC71',
  },
  creditBadge: {
    backgroundColor: 'rgba(52,152,219,0.15)',
  },
  creditText: {
    color: '#3498DB',
  },
  merchantBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  merchantText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'capitalize',
  },
  upiIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  upiText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9B59B6',
    backgroundColor: 'rgba(155,89,182,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paymentAppText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'capitalize',
  },
  error: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    color: '#FF6B6B',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 10,
  },
  spamRow: {
    backgroundColor: 'rgba(255,100,100,0.08)',
    borderColor: 'rgba(255,100,100,0.15)',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 6,
  },
  address: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  date: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  body: {
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.82)',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  spamTag: {
    backgroundColor: 'rgba(255,100,100,0.2)',
  },
  importantTag: {
    backgroundColor: 'rgba(79,124,255,0.2)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'capitalize',
  },
  empty: {
    paddingVertical: 30,
    color: 'rgba(255,255,255,0.6)',
  },
  // Industry badge styles for MSME/B2B classification
  industryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  industryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  industryText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default SmsReadingScreen;
