const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const smsService = require('../services/smsService');
const carbonCalculationService = require('../services/carbonCalculationService');
const spamDetectionService = require('../services/spamDetectionService');
const duplicateDetectionService = require('../services/duplicateDetectionService');
const Transaction = require('../models/Transaction');
const MSME = require('../models/MSME');
const logger = require('../utils/logger');
const { MSMENotificationService } = require('../services/msmeNotificationService');
const orchestrationManagerEventService = require('../services/orchestrationManagerEventService');

const notificationService = new MSMENotificationService();

// @route   POST /api/sms/process
// @desc    Process SMS message and extract transaction data
// @access  Private
router.post('/process', [
  auth,
  body('body').notEmpty().withMessage('SMS body is required'),
  body('sender').notEmpty().withMessage('Sender is required'),
  body('timestamp').isISO8601().withMessage('Valid timestamp is required'),
  body('messageId').notEmpty().withMessage('Message ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { body, sender, timestamp, messageId } = req.body;
    const msmeId = req.user.msmeId;

    const msmeProfile = msmeId ? await MSME.findById(msmeId).lean() : null;

    // Process SMS
    const result = await smsService.processSMS({
      body,
      sender,
      timestamp,
      messageId
    }, msmeProfile);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'SMS processing failed',
        error: result.error
      });
    }

    // Detect spam
    const spamDetection = spamDetectionService.detectSpam(result.transaction, {
      sender,
      subject: `SMS from ${sender}`,
      body
    });

    // Detect duplicates
    const duplicateDetection = await duplicateDetectionService.detectDuplicate(result.transaction, msmeId);

    // Skip processing if spam or duplicate
    if (spamDetection.isSpam || duplicateDetection.isDuplicate) {
      logger.info(`SMS skipped - Spam: ${spamDetection.isSpam}, Duplicate: ${duplicateDetection.isDuplicate}`, {
        messageId,
        msmeId,
        spamReasons: spamDetection.reasons,
        duplicateReasons: duplicateDetection.reasons
      });

      return res.json({
        success: true,
        message: 'SMS processed but skipped due to spam/duplicate detection',
        data: {
          skipped: true,
          spam: spamDetection.isSpam,
          duplicate: duplicateDetection.isDuplicate,
          spamReasons: spamDetection.reasons,
          duplicateReasons: duplicateDetection.reasons
        }
      });
    }

    // Calculate carbon footprint
    const carbonData = carbonCalculationService.calculateTransactionCarbonFootprint(result.transaction);
    result.transaction.carbonFootprint = carbonData;

    // Save transaction to database
    const transaction = new Transaction({
      msmeId,
      ...result.transaction,
      isProcessed: true,
      processedAt: new Date(),
      // Spam detection results
      isSpam: spamDetection.isSpam,
      spamScore: spamDetection.score,
      spamReasons: spamDetection.reasons,
      spamConfidence: spamDetection.confidence,
      // Duplicate detection results
      isDuplicate: duplicateDetection.isDuplicate,
      duplicateType: duplicateDetection.duplicateType,
      similarityScore: duplicateDetection.similarityScore,
      matchedTransactionId: duplicateDetection.matchedTransaction?._id,
      duplicateReasons: duplicateDetection.reasons
    });

    await transaction.save();

    logger.info(`SMS processed successfully for MSME ${msmeId}`, {
      messageId,
      transactionType: result.transaction.transactionType,
      amount: result.transaction.amount,
      co2Emissions: carbonData.co2Emissions
    });

    try {
      orchestrationManagerEventService.emitEvent('transactions.sms_processed', {
        msmeId,
        transaction: transaction.toObject(),
        source: 'sms',
        messageId
      }, 'sms');
    } catch (eventError) {
      logger.warn('Failed to emit orchestration event for SMS transaction', {
        error: eventError.message,
        msmeId,
        messageId
      });
    }

    res.json({
      success: true,
      message: 'SMS processed successfully',
      data: {
        transaction: transaction,
        confidence: result.confidence
      }
    });

  } catch (error) {
    logger.error('SMS processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/sms/transactions
// @desc    Get SMS transactions for MSME
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, startDate, endDate } = req.query;
    const msmeId = req.user.msmeId;

    const query = { 
      msmeId, 
      source: 'sms',
      isSpam: { $ne: true },
      isDuplicate: { $ne: true }
    };
    
    if (category) {
      query.category = category;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('msmeId', 'companyName');

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    logger.error('Get SMS transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/sms/analytics
// @desc    Get SMS transaction analytics
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const msmeId = req.user.msmeId;

    const query = { 
      msmeId, 
      source: 'sms',
      isSpam: { $ne: true },
      isDuplicate: { $ne: true }
    };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query);

    // Calculate analytics
    const analytics = {
      totalTransactions: transactions.length,
      totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
      totalCO2Emissions: transactions.reduce((sum, t) => sum + t.carbonFootprint.co2Emissions, 0),
      averageAmount: transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0,
      averageCO2Emissions: transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.carbonFootprint.co2Emissions, 0) / transactions.length : 0,
      categoryBreakdown: {},
      transactionTypeBreakdown: {},
      monthlyTrend: {},
      topVendors: {},
      sustainabilityScore: 0
    };

    // Category breakdown
    transactions.forEach(transaction => {
      const category = transaction.category;
      if (!analytics.categoryBreakdown[category]) {
        analytics.categoryBreakdown[category] = {
          count: 0,
          amount: 0,
          co2Emissions: 0
        };
      }
      analytics.categoryBreakdown[category].count++;
      analytics.categoryBreakdown[category].amount += transaction.amount;
      analytics.categoryBreakdown[category].co2Emissions += transaction.carbonFootprint.co2Emissions;
    });

    // Transaction type breakdown
    transactions.forEach(transaction => {
      const type = transaction.transactionType;
      if (!analytics.transactionTypeBreakdown[type]) {
        analytics.transactionTypeBreakdown[type] = {
          count: 0,
          amount: 0,
          co2Emissions: 0
        };
      }
      analytics.transactionTypeBreakdown[type].count++;
      analytics.transactionTypeBreakdown[type].amount += transaction.amount;
      analytics.transactionTypeBreakdown[type].co2Emissions += transaction.carbonFootprint.co2Emissions;
    });

    // Monthly trend
    transactions.forEach(transaction => {
      const month = transaction.date.toISOString().substring(0, 7);
      if (!analytics.monthlyTrend[month]) {
        analytics.monthlyTrend[month] = {
          count: 0,
          amount: 0,
          co2Emissions: 0
        };
      }
      analytics.monthlyTrend[month].count++;
      analytics.monthlyTrend[month].amount += transaction.amount;
      analytics.monthlyTrend[month].co2Emissions += transaction.carbonFootprint.co2Emissions;
    });

    // Top vendors
    transactions.forEach(transaction => {
      const vendor = transaction.vendor.name;
      if (!analytics.topVendors[vendor]) {
        analytics.topVendors[vendor] = {
          count: 0,
          amount: 0,
          co2Emissions: 0
        };
      }
      analytics.topVendors[vendor].count++;
      analytics.topVendors[vendor].amount += transaction.amount;
      analytics.topVendors[vendor].co2Emissions += transaction.carbonFootprint.co2Emissions;
    });

    // Calculate sustainability score
    const greenTransactions = transactions.filter(t => t.sustainability.isGreen);
    analytics.sustainabilityScore = transactions.length > 0 ? 
      (greenTransactions.length / transactions.length) * 100 : 0;

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Get SMS analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/sms/bulk-process
// @desc    Process multiple SMS messages
// @access  Private
router.post('/bulk-process', [
  auth,
  body('messages').isArray().withMessage('Messages array is required'),
  body('messages.*.body').notEmpty().withMessage('SMS body is required'),
  body('messages.*.sender').notEmpty().withMessage('Sender is required'),
  body('messages.*.timestamp').isISO8601().withMessage('Valid timestamp is required'),
  body('messages.*.messageId').notEmpty().withMessage('Message ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { messages } = req.body;
    const msmeId = req.user.msmeId;
    const results = [];

    const msmeProfile = msmeId ? await MSME.findById(msmeId).lean() : null;

    for (const message of messages) {
      try {
        // Process SMS
        const result = await smsService.processSMS(message, msmeProfile);
        
        if (result.success) {
          // Detect spam
          const spamDetection = spamDetectionService.detectSpam(result.transaction, {
            sender: message.sender,
            subject: `SMS from ${message.sender}`,
            body: message.body
          });

          // Detect duplicates
          const duplicateDetection = await duplicateDetectionService.detectDuplicate(result.transaction, msmeId);

          // Skip processing if spam or duplicate
          if (spamDetection.isSpam || duplicateDetection.isDuplicate) {
            results.push({
              messageId: message.messageId,
              success: true,
              skipped: true,
              spam: spamDetection.isSpam,
              duplicate: duplicateDetection.isDuplicate,
              spamReasons: spamDetection.reasons,
              duplicateReasons: duplicateDetection.reasons
            });
            continue;
          }

          // Calculate carbon footprint
          const carbonData = carbonCalculationService.calculateTransactionCarbonFootprint(result.transaction);
          result.transaction.carbonFootprint = carbonData;

          // Save transaction
          const transaction = new Transaction({
            msmeId,
            ...result.transaction,
            isProcessed: true,
            processedAt: new Date(),
            // Spam detection results
            isSpam: spamDetection.isSpam,
            spamScore: spamDetection.score,
            spamReasons: spamDetection.reasons,
            spamConfidence: spamDetection.confidence,
            // Duplicate detection results
            isDuplicate: duplicateDetection.isDuplicate,
            duplicateType: duplicateDetection.duplicateType,
            similarityScore: duplicateDetection.similarityScore,
            matchedTransactionId: duplicateDetection.matchedTransaction?._id,
            duplicateReasons: duplicateDetection.reasons
          });

          await transaction.save();
          
          results.push({
            messageId: message.messageId,
            success: true,
            transaction: transaction
          });
        } else {
          results.push({
            messageId: message.messageId,
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        results.push({
          messageId: message.messageId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info(`Bulk SMS processing completed for MSME ${msmeId}`, {
      total: messages.length,
      success: successCount,
      failure: failureCount
    });

    res.json({
      success: true,
      message: `Processed ${messages.length} messages: ${successCount} successful, ${failureCount} failed`,
      data: {
        results,
        summary: {
          total: messages.length,
          successful: successCount,
          failed: failureCount
        }
      }
    });

  } catch (error) {
    logger.error('Bulk SMS processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/sms/notify
// @desc    Send SMS notification to MSME via MSG91
// @access  Private
router.post('/notify', [
  auth,
  body('type').isString().withMessage('Notification type is required'),
  body('data').optional().isObject().withMessage('Data must be an object'),
  body('msmeId').optional().isMongoId().withMessage('Valid MSME id is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { type, data = {}, msmeId: targetMsmeId } = req.body;
    const supportedTypes = notificationService.getSupportedTypes();

    if (!supportedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported notification type. Allowed types: ${supportedTypes.join(', ')}`
      });
    }

    let msmeId = req.user.msmeId;

    if (req.user.role !== 'msme' && targetMsmeId) {
      msmeId = targetMsmeId;
    }

    if (!msmeId) {
      return res.status(400).json({
        success: false,
        message: 'MSME id is required to send notifications'
      });
    }

    const result = await notificationService.sendNotification(type, msmeId, data);

    res.json({
      success: true,
      message: 'SMS notification sent successfully',
      data: result
    });
  } catch (error) {
    logger.error('SMS notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send SMS notification',
      error: error.message
    });
  }
});

module.exports = router;