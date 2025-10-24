import { PermissionsAndroid, Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

class PrivacyFocusedSMSReader {
  constructor() {
    this.encryptionKey = 'carbon-intelligence-sms-key-2024';
    this.anonymizationRules = {
      phoneNumbers: true,
      personalNames: true,
      accountNumbers: true,
      addresses: true
    };
    this.dataRetentionDays = 30;
    this.consentGiven = false;
  }

  async requestPermissions() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_SMS,
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          PermissionsAndroid.PERMISSIONS.SEND_SMS
        ]);

        const allGranted = Object.values(granted).every(
          permission => permission === PermissionsAndroid.RESULTS.GRANTED
        );

        if (allGranted) {
          return true;
        } else {
          Alert.alert(
            'Permissions Required',
            'SMS permissions are required to analyze transactions for carbon footprint calculation. Please grant permissions to continue.',
            [{ text: 'OK' }]
          );
          return false;
        }
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true; // iOS doesn't require explicit SMS permissions
  }

  async requestConsent() {
    return new Promise((resolve) => {
      Alert.alert(
        'Data Privacy Consent',
        'To provide accurate carbon footprint analysis, we need to analyze your SMS messages for transaction data. We will:\n\n' +
        '• Only process transaction-related SMS\n' +
        '• Anonymize personal information\n' +
        '• Encrypt all data locally\n' +
        '• Delete data after 30 days\n' +
        '• Never share with third parties\n\n' +
        'Do you consent to this data processing?',
        [
          {
            text: 'Decline',
            style: 'cancel',
            onPress: () => {
              this.consentGiven = false;
              resolve(false);
            }
          },
          {
            text: 'Consent',
            onPress: () => {
              this.consentGiven = true;
              this.saveConsentStatus(true);
              resolve(true);
            }
          }
        ]
      );
    });
  }

  async saveConsentStatus(consent) {
    try {
      await AsyncStorage.setItem('sms_consent', JSON.stringify({
        consent,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));
    } catch (error) {
      console.error('Error saving consent status:', error);
    }
  }

  async getConsentStatus() {
    try {
      const consentData = await AsyncStorage.getItem('sms_consent');
      if (consentData) {
        const parsed = JSON.parse(consentData);
        this.consentGiven = parsed.consent;
        return parsed;
      }
    } catch (error) {
      console.error('Error getting consent status:', error);
    }
    return null;
  }

  async readSMSMessages(options = {}) {
    if (!this.consentGiven) {
      const consent = await this.requestConsent();
      if (!consent) {
        throw new Error('SMS reading requires user consent');
      }
    }

    const {
      limit = 100,
      startDate = null,
      endDate = null,
      filterKeywords = ['bank', 'payment', 'transaction', 'purchase', 'sale', 'invoice', 'receipt']
    } = options;

    try {
      // This would integrate with a native SMS reading module
      // For now, we'll simulate the SMS reading process
      const smsMessages = await this.simulateSMSReading({
        limit,
        startDate,
        endDate,
        filterKeywords
      });

      // Process and anonymize SMS messages
      const processedMessages = await this.processSMSMessages(smsMessages);

      // Store processed data locally with encryption
      await this.storeProcessedSMS(processedMessages);

      return processedMessages;
    } catch (error) {
      console.error('Error reading SMS messages:', error);
      throw error;
    }
  }

  async simulateSMSReading(options) {
    // This is a simulation - in a real implementation, you would use
    // a native module to read actual SMS messages
    const mockSMS = [
      {
        id: '1',
        address: '+91-XXXX-XXXX',
        body: 'Your account has been debited with Rs. 1,500.00 for electricity bill payment. Available balance: Rs. 25,000.00',
        date: new Date().toISOString(),
        type: 'inbox'
      },
      {
        id: '2',
        address: 'BANK-ALERT',
        body: 'Payment of Rs. 5,000.00 received from customer ABC Industries. Ref: INV-2024-001',
        date: new Date(Date.now() - 86400000).toISOString(),
        type: 'inbox'
      },
      {
        id: '3',
        address: 'FUEL-STATION',
        body: 'Fuel purchase of Rs. 2,500.00 for 45 liters of diesel. Location: Mumbai',
        date: new Date(Date.now() - 172800000).toISOString(),
        type: 'inbox'
      },
      {
        id: '4',
        address: 'SUPPLIER-ALERT',
        body: 'Raw materials purchased for Rs. 15,000.00. Steel, aluminum, and plastic materials delivered.',
        date: new Date(Date.now() - 259200000).toISOString(),
        type: 'inbox'
      },
      {
        id: '5',
        address: 'WATER-BOARD',
        body: 'Water bill payment of Rs. 800.00 for industrial usage. Consumption: 50,000 liters',
        date: new Date(Date.now() - 345600000).toISOString(),
        type: 'inbox'
      }
    ];

    return mockSMS.slice(0, options.limit);
  }

  async processSMSMessages(smsMessages) {
    const processedMessages = [];

    for (const sms of smsMessages) {
      try {
        // Anonymize sensitive information
        const anonymizedSMS = this.anonymizeSMS(sms);

        // Extract transaction data
        const transactionData = this.extractTransactionData(anonymizedSMS);

        // Analyze sentiment and context
        const sentiment = this.analyzeSentiment(anonymizedSMS.body);

        // Determine carbon footprint relevance
        const carbonRelevance = this.assessCarbonRelevance(anonymizedSMS, transactionData);

        const processedMessage = {
          id: sms.id,
          originalSMS: anonymizedSMS,
          transactionData,
          sentiment,
          carbonRelevance,
          processedAt: new Date().toISOString(),
          dataRetention: new Date(Date.now() + (this.dataRetentionDays * 24 * 60 * 60 * 1000)).toISOString()
        };

        processedMessages.push(processedMessage);
      } catch (error) {
        console.error('Error processing SMS:', error);
        // Continue processing other messages
      }
    }

    return processedMessages;
  }

  anonymizeSMS(sms) {
    let anonymizedBody = sms.body;
    let anonymizedAddress = sms.address;

    // Anonymize phone numbers
    if (this.anonymizationRules.phoneNumbers) {
      anonymizedBody = anonymizedBody.replace(/\+\d{2,3}-\d{4}-\d{4}/g, '+XX-XXXX-XXXX');
      anonymizedAddress = anonymizedAddress.replace(/\+\d{2,3}-\d{4}-\d{4}/g, '+XX-XXXX-XXXX');
    }

    // Anonymize account numbers
    if (this.anonymizationRules.accountNumbers) {
      anonymizedBody = anonymizedBody.replace(/\b\d{10,}\b/g, 'XXXX-XXXX-XXXX');
    }

    // Anonymize personal names (simple pattern matching)
    if (this.anonymizationRules.personalNames) {
      anonymizedBody = anonymizedBody.replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, 'XXXX XXXX');
    }

    // Anonymize addresses
    if (this.anonymizationRules.addresses) {
      anonymizedBody = anonymizedBody.replace(/\b\d+\s+[A-Za-z\s]+(?:Street|Road|Avenue|Lane)\b/g, 'XXXX Street');
    }

    return {
      ...sms,
      body: anonymizedBody,
      address: anonymizedAddress,
      anonymized: true
    };
  }

  extractTransactionData(sms) {
    const transactionData = {
      type: 'unknown',
      amount: null,
      currency: 'INR',
      description: sms.body,
      date: sms.date,
      category: 'other',
      subcategory: 'general',
      confidence: 0
    };

    // Extract amount using regex patterns
    const amountPatterns = [
      /(?:rs\.?|₹|inr)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs\.?|₹|inr)/i,
      /amount[:\s]*(\d+(?:,\d{3})*(?:\.\d{2})?)/i
    ];

    for (const pattern of amountPatterns) {
      const match = sms.body.match(pattern);
      if (match) {
        transactionData.amount = parseFloat(match[1].replace(/,/g, ''));
        transactionData.confidence += 0.3;
        break;
      }
    }

    // Determine transaction type
    const body = sms.body.toLowerCase();
    
    if (body.includes('debit') || body.includes('paid') || body.includes('payment made')) {
      transactionData.type = 'expense';
      transactionData.confidence += 0.2;
    } else if (body.includes('credit') || body.includes('received') || body.includes('payment received')) {
      transactionData.type = 'income';
      transactionData.confidence += 0.2;
    } else if (body.includes('purchase') || body.includes('bought')) {
      transactionData.type = 'purchase';
      transactionData.confidence += 0.2;
    } else if (body.includes('sale') || body.includes('sold')) {
      transactionData.type = 'sale';
      transactionData.confidence += 0.2;
    }

    // Categorize based on content
    if (body.includes('electricity') || body.includes('power') || body.includes('energy')) {
      transactionData.category = 'energy';
      transactionData.subcategory = 'electricity';
      transactionData.confidence += 0.2;
    } else if (body.includes('fuel') || body.includes('diesel') || body.includes('petrol')) {
      transactionData.category = 'transportation';
      transactionData.subcategory = 'fuel';
      transactionData.confidence += 0.2;
    } else if (body.includes('water')) {
      transactionData.category = 'water';
      transactionData.subcategory = 'consumption';
      transactionData.confidence += 0.2;
    } else if (body.includes('steel') || body.includes('aluminum') || body.includes('raw material')) {
      transactionData.category = 'raw_materials';
      transactionData.subcategory = 'metals';
      transactionData.confidence += 0.2;
    } else if (body.includes('waste') || body.includes('recycling')) {
      transactionData.category = 'waste_management';
      transactionData.subcategory = 'disposal';
      transactionData.confidence += 0.2;
    }

    // Normalize confidence score
    transactionData.confidence = Math.min(1, transactionData.confidence);

    return transactionData;
  }

  analyzeSentiment(text) {
    // Simple sentiment analysis based on keywords
    const positiveWords = ['received', 'credit', 'successful', 'completed', 'approved'];
    const negativeWords = ['failed', 'declined', 'error', 'insufficient', 'overdue'];
    
    const lowerText = text.toLowerCase();
    let sentiment = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) sentiment += 1;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) sentiment -= 1;
    });
    
    // Normalize to -1 to 1 range
    return Math.max(-1, Math.min(1, sentiment / 5));
  }

  assessCarbonRelevance(sms, transactionData) {
    let relevance = 0;
    
    // High relevance categories
    const highRelevanceCategories = ['energy', 'transportation', 'raw_materials', 'waste_management'];
    if (highRelevanceCategories.includes(transactionData.category)) {
      relevance += 0.4;
    }
    
    // Medium relevance categories
    const mediumRelevanceCategories = ['water', 'equipment', 'maintenance'];
    if (mediumRelevanceCategories.includes(transactionData.category)) {
      relevance += 0.2;
    }
    
    // Amount-based relevance
    if (transactionData.amount && transactionData.amount > 1000) {
      relevance += 0.2;
    }
    
    // Confidence-based relevance
    relevance += transactionData.confidence * 0.2;
    
    return Math.min(1, relevance);
  }

  async storeProcessedSMS(processedMessages) {
    try {
      // Encrypt the data before storing
      const encryptedData = this.encryptData(processedMessages);
      
      // Store with timestamp for data retention
      const storageData = {
        data: encryptedData,
        storedAt: new Date().toISOString(),
        count: processedMessages.length
      };
      
      await AsyncStorage.setItem('processed_sms_data', JSON.stringify(storageData));
      
      // Also store individual messages for easier access
      for (const message of processedMessages) {
        const messageKey = `sms_${message.id}`;
        const encryptedMessage = this.encryptData(message);
        await AsyncStorage.setItem(messageKey, encryptedMessage);
      }
    } catch (error) {
      console.error('Error storing processed SMS data:', error);
      throw error;
    }
  }

  encryptData(data) {
    try {
      const jsonString = JSON.stringify(data);
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey).toString();
      return encrypted;
    } catch (error) {
      console.error('Error encrypting data:', error);
      throw error;
    }
  }

  async decryptData(encryptedData) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error decrypting data:', error);
      throw error;
    }
  }

  async getProcessedSMSData() {
    try {
      const storageData = await AsyncStorage.getItem('processed_sms_data');
      if (storageData) {
        const parsed = JSON.parse(storageData);
        const decryptedData = await this.decryptData(parsed.data);
        return decryptedData;
      }
    } catch (error) {
      console.error('Error getting processed SMS data:', error);
    }
    return [];
  }

  async cleanupExpiredData() {
    try {
      const storageData = await AsyncStorage.getItem('processed_sms_data');
      if (storageData) {
        const parsed = JSON.parse(storageData);
        const storedAt = new Date(parsed.storedAt);
        const expirationDate = new Date(storedAt.getTime() + (this.dataRetentionDays * 24 * 60 * 60 * 1000));
        
        if (new Date() > expirationDate) {
          // Data has expired, remove it
          await AsyncStorage.removeItem('processed_sms_data');
          
          // Remove individual message files
          const keys = await AsyncStorage.getAllKeys();
          const smsKeys = keys.filter(key => key.startsWith('sms_'));
          await AsyncStorage.multiRemove(smsKeys);
          
          console.log('Expired SMS data cleaned up');
        }
      }
    } catch (error) {
      console.error('Error cleaning up expired data:', error);
    }
  }

  async exportDataForAnalysis() {
    try {
      const processedData = await this.getProcessedSMSData();
      
      // Filter only carbon-relevant data
      const carbonRelevantData = processedData.filter(
        message => message.carbonRelevance > 0.3
      );
      
      // Prepare data for API transmission
      const exportData = {
        messages: carbonRelevantData.map(message => ({
          id: message.id,
          transactionData: message.transactionData,
          sentiment: message.sentiment,
          carbonRelevance: message.carbonRelevance,
          processedAt: message.processedAt
        })),
        metadata: {
          totalMessages: processedData.length,
          carbonRelevantMessages: carbonRelevantData.length,
          exportDate: new Date().toISOString(),
          dataRetentionDays: this.dataRetentionDays
        }
      };
      
      return exportData;
    } catch (error) {
      console.error('Error exporting data for analysis:', error);
      throw error;
    }
  }

  async updateAnonymizationRules(rules) {
    this.anonymizationRules = { ...this.anonymizationRules, ...rules };
    
    try {
      await AsyncStorage.setItem('anonymization_rules', JSON.stringify(this.anonymizationRules));
    } catch (error) {
      console.error('Error updating anonymization rules:', error);
    }
  }

  async getAnonymizationRules() {
    try {
      const rules = await AsyncStorage.getItem('anonymization_rules');
      if (rules) {
        this.anonymizationRules = JSON.parse(rules);
      }
    } catch (error) {
      console.error('Error getting anonymization rules:', error);
    }
    
    return this.anonymizationRules;
  }

  async revokeConsent() {
    this.consentGiven = false;
    
    try {
      // Remove all stored SMS data
      await AsyncStorage.removeItem('processed_sms_data');
      await AsyncStorage.removeItem('sms_consent');
      
      // Remove individual message files
      const keys = await AsyncStorage.getAllKeys();
      const smsKeys = keys.filter(key => key.startsWith('sms_'));
      await AsyncStorage.multiRemove(smsKeys);
      
      console.log('SMS consent revoked and data removed');
    } catch (error) {
      console.error('Error revoking consent:', error);
    }
  }

  async getDataRetentionStatus() {
    try {
      const storageData = await AsyncStorage.getItem('processed_sms_data');
      if (storageData) {
        const parsed = JSON.parse(storageData);
        const storedAt = new Date(parsed.storedAt);
        const expirationDate = new Date(storedAt.getTime() + (this.dataRetentionDays * 24 * 60 * 60 * 1000));
        const daysRemaining = Math.ceil((expirationDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000));
        
        return {
          storedAt: parsed.storedAt,
          expirationDate: expirationDate.toISOString(),
          daysRemaining: Math.max(0, daysRemaining),
          messageCount: parsed.count
        };
      }
    } catch (error) {
      console.error('Error getting data retention status:', error);
    }
    
    return null;
  }
}

export default new PrivacyFocusedSMSReader();