class DuplicateDetectionService {
  constructor() {
    // Time window for duplicate detection (10 seconds)
    this.duplicateWindowMs = 10 * 1000;
    
    // Similarity thresholds
    this.thresholds = {
      exactMatch: 1.0,        // 100% similarity
      nearMatch: 0.85,        // 85% similarity
      fuzzyMatch: 0.70        // 70% similarity
    };
    
    // Cache for recent transactions to avoid database queries
    this.recentTransactionsCache = new Map();
    
    // Clean up cache every 5 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Detect if a transaction is a duplicate within the time window
   * @param {Object} transaction - New transaction to check
   * @param {string} msmeId - MSME ID
   * @returns {Object} - Duplicate detection result
   */
  async detectDuplicate(transaction, msmeId) {
    const detection = {
      isDuplicate: false,
      duplicateType: null,
      similarityScore: 0,
      matchedTransaction: null,
      reasons: []
    };

    try {
      // Get recent transactions from cache or database
      const recentTransactions = await this.getRecentTransactions(msmeId, transaction.date);
      
      // Check for duplicates
      for (const recentTx of recentTransactions) {
        const similarity = this.calculateSimilarity(transaction, recentTx);
        
        if (similarity >= this.thresholds.exactMatch) {
          detection.isDuplicate = true;
          detection.duplicateType = 'exact';
          detection.similarityScore = similarity;
          detection.matchedTransaction = recentTx;
          detection.reasons.push('Exact match found');
          break;
        } else if (similarity >= this.thresholds.nearMatch) {
          detection.isDuplicate = true;
          detection.duplicateType = 'near';
          detection.similarityScore = similarity;
          detection.matchedTransaction = recentTx;
          detection.reasons.push('Near match found');
          break;
        } else if (similarity >= this.thresholds.fuzzyMatch) {
          detection.isDuplicate = true;
          detection.duplicateType = 'fuzzy';
          detection.similarityScore = similarity;
          detection.matchedTransaction = recentTx;
          detection.reasons.push('Fuzzy match found');
          break;
        }
      }

      // Cache the transaction for future duplicate detection
      this.cacheTransaction(msmeId, transaction);

    } catch (error) {
      console.error('Duplicate detection error:', error);
      // If there's an error, don't mark as duplicate to avoid false positives
    }

    return detection;
  }

  /**
   * Get recent transactions within the duplicate detection window
   * @param {string} msmeId - MSME ID
   * @param {Date} transactionDate - Transaction date
   * @returns {Array} - Recent transactions
   */
  async getRecentTransactions(msmeId, transactionDate) {
    const cacheKey = `${msmeId}_${transactionDate.toISOString().split('T')[0]}`;
    
    // Check cache first
    if (this.recentTransactionsCache.has(cacheKey)) {
      const cached = this.recentTransactionsCache.get(cacheKey);
      const now = new Date();
      const windowStart = new Date(transactionDate.getTime() - this.duplicateWindowMs);
      const windowEnd = new Date(transactionDate.getTime() + this.duplicateWindowMs);
      
      return cached.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= windowStart && txDate <= windowEnd;
      });
    }

    // Query database for recent transactions
    const Transaction = require('../models/Transaction');
    const windowStart = new Date(transactionDate.getTime() - this.duplicateWindowMs);
    const windowEnd = new Date(transactionDate.getTime() + this.duplicateWindowMs);

    const recentTransactions = await Transaction.find({
      msmeId,
      date: {
        $gte: windowStart,
        $lte: windowEnd
      },
      isDuplicate: { $ne: true } // Exclude already marked duplicates
    }).sort({ date: -1 });

    // Cache the results
    this.recentTransactionsCache.set(cacheKey, recentTransactions);

    return recentTransactions;
  }

  /**
   * Calculate similarity between two transactions
   * @param {Object} transaction1 - First transaction
   * @param {Object} transaction2 - Second transaction
   * @returns {number} - Similarity score (0-1)
   */
  calculateSimilarity(transaction1, transaction2) {
    const weights = {
      amount: 0.3,
      description: 0.25,
      vendor: 0.2,
      category: 0.15,
      source: 0.1
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Amount similarity
    if (transaction1.amount && transaction2.amount) {
      const amountSimilarity = this.calculateAmountSimilarity(transaction1.amount, transaction2.amount);
      totalScore += amountSimilarity * weights.amount;
      totalWeight += weights.amount;
    }

    // Description similarity
    if (transaction1.description && transaction2.description) {
      const descriptionSimilarity = this.calculateTextSimilarity(
        transaction1.description, 
        transaction2.description
      );
      totalScore += descriptionSimilarity * weights.description;
      totalWeight += weights.description;
    }

    // Vendor similarity
    if (transaction1.vendor && transaction2.vendor) {
      const vendorSimilarity = this.calculateVendorSimilarity(transaction1.vendor, transaction2.vendor);
      totalScore += vendorSimilarity * weights.vendor;
      totalWeight += weights.vendor;
    }

    // Category similarity
    if (transaction1.category && transaction2.category) {
      const categorySimilarity = transaction1.category === transaction2.category ? 1 : 0;
      totalScore += categorySimilarity * weights.category;
      totalWeight += weights.category;
    }

    // Source similarity
    if (transaction1.source && transaction2.source) {
      const sourceSimilarity = transaction1.source === transaction2.source ? 1 : 0;
      totalScore += sourceSimilarity * weights.source;
      totalWeight += weights.source;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate amount similarity
   * @param {number} amount1 - First amount
   * @param {number} amount2 - Second amount
   * @returns {number} - Similarity score (0-1)
   */
  calculateAmountSimilarity(amount1, amount2) {
    if (amount1 === amount2) return 1;
    
    const diff = Math.abs(amount1 - amount2);
    const avg = (amount1 + amount2) / 2;
    const relativeDiff = diff / avg;
    
    // If amounts are very close (within 1%), consider them similar
    if (relativeDiff <= 0.01) return 0.95;
    
    // If amounts are close (within 5%), consider them somewhat similar
    if (relativeDiff <= 0.05) return 0.8;
    
    // If amounts are reasonably close (within 20%), consider them somewhat similar
    if (relativeDiff <= 0.20) return 0.6;
    
    return 0;
  }

  /**
   * Calculate text similarity using Jaccard similarity
   * @param {string} text1 - First text
   * @param {string} text2 - Second text
   * @returns {number} - Similarity score (0-1)
   */
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    if (text1 === text2) return 1;

    // Normalize text
    const normalize = (text) => text.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const normalized1 = normalize(text1);
    const normalized2 = normalize(text2);

    // Create word sets
    const words1 = new Set(normalized1.split(/\s+/).filter(w => w.length > 0));
    const words2 = new Set(normalized2.split(/\s+/).filter(w => w.length > 0));

    // Calculate Jaccard similarity
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate vendor similarity
   * @param {Object} vendor1 - First vendor
   * @param {Object} vendor2 - Second vendor
   * @returns {number} - Similarity score (0-1)
   */
  calculateVendorSimilarity(vendor1, vendor2) {
    if (!vendor1 || !vendor2) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    // Name similarity
    if (vendor1.name && vendor2.name) {
      const nameSimilarity = this.calculateTextSimilarity(vendor1.name, vendor2.name);
      totalScore += nameSimilarity * 0.6;
      totalWeight += 0.6;
    }

    // Category similarity
    if (vendor1.category && vendor2.category) {
      const categorySimilarity = vendor1.category === vendor2.category ? 1 : 0;
      totalScore += categorySimilarity * 0.4;
      totalWeight += 0.4;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Cache a transaction for future duplicate detection
   * @param {string} msmeId - MSME ID
   * @param {Object} transaction - Transaction to cache
   */
  cacheTransaction(msmeId, transaction) {
    const cacheKey = `${msmeId}_${new Date(transaction.date).toISOString().split('T')[0]}`;
    
    if (!this.recentTransactionsCache.has(cacheKey)) {
      this.recentTransactionsCache.set(cacheKey, []);
    }
    
    const cached = this.recentTransactionsCache.get(cacheKey);
    cached.push(transaction);
    
    // Keep only recent transactions (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filtered = cached.filter(tx => new Date(tx.date) > oneDayAgo);
    this.recentTransactionsCache.set(cacheKey, filtered);
  }

  /**
   * Clean up old cache entries
   */
  cleanupCache() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    for (const [key, transactions] of this.recentTransactionsCache.entries()) {
      const filtered = transactions.filter(tx => new Date(tx.date) > oneDayAgo);
      if (filtered.length === 0) {
        this.recentTransactionsCache.delete(key);
      } else {
        this.recentTransactionsCache.set(key, filtered);
      }
    }
  }

  /**
   * Get duplicate detection statistics for an MSME
   * @param {string} msmeId - MSME ID
   * @param {Date} startDate - Start date for analysis
   * @param {Date} endDate - End date for analysis
   * @returns {Object} - Duplicate statistics
   */
  async getDuplicateStatistics(msmeId, startDate, endDate) {
    const Transaction = require('../models/Transaction');
    
    const query = { 
      msmeId,
      isDuplicate: true
    };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const duplicateTransactions = await Transaction.find(query);
    
    const statistics = {
      totalDuplicateTransactions: duplicateTransactions.length,
      duplicatesByType: {},
      duplicatesBySource: {},
      duplicatesByCategory: {},
      duplicateTrend: {},
      averageSimilarityScore: 0
    };

    let totalSimilarity = 0;

    // Analyze duplicate transactions
    duplicateTransactions.forEach(transaction => {
      // By type
      const type = transaction.duplicateType || 'unknown';
      statistics.duplicatesByType[type] = (statistics.duplicatesByType[type] || 0) + 1;

      // By source
      const source = transaction.source;
      statistics.duplicatesBySource[source] = (statistics.duplicatesBySource[source] || 0) + 1;

      // By category
      const category = transaction.category;
      statistics.duplicatesByCategory[category] = (statistics.duplicatesByCategory[category] || 0) + 1;

      // Trend by month
      const month = transaction.date.toISOString().substring(0, 7);
      statistics.duplicateTrend[month] = (statistics.duplicateTrend[month] || 0) + 1;

      // Similarity score
      if (transaction.similarityScore) {
        totalSimilarity += transaction.similarityScore;
      }
    });

    // Calculate average similarity score
    statistics.averageSimilarityScore = duplicateTransactions.length > 0 ? 
      totalSimilarity / duplicateTransactions.length : 0;

    return statistics;
  }

  /**
   * Mark a transaction as duplicate
   * @param {string} transactionId - Transaction ID
   * @param {Object} duplicateInfo - Duplicate detection information
   * @returns {Object} - Updated transaction
   */
  async markAsDuplicate(transactionId, duplicateInfo) {
    const Transaction = require('../models/Transaction');
    
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    transaction.isDuplicate = true;
    transaction.duplicateType = duplicateInfo.duplicateType;
    transaction.similarityScore = duplicateInfo.similarityScore;
    transaction.matchedTransactionId = duplicateInfo.matchedTransaction?._id;
    transaction.duplicateReasons = duplicateInfo.reasons;

    await transaction.save();
    return transaction;
  }
}

module.exports = new DuplicateDetectionService();