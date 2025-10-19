const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');
const carbonCalculationService = require('../services/carbonCalculationService');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

// @route   POST /api/email/process
// @desc    Process email and extract transaction data
// @access  Private
router.post('/process', [
  auth,
  body('subject').notEmpty().withMessage('Email subject is required'),
  body('body').notEmpty().withMessage('Email body is required'),
  body('from').isEmail().withMessage('Valid from email is required'),
  body('to').isEmail().withMessage('Valid to email is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
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

    const { subject, body, from, to, date, messageId } = req.body;
    const msmeId = req.user.msmeId;

    // Process email
    const result = await emailService.processEmail({
      subject,
      body,
      from,
      to,
      date,
      messageId
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Email processing failed',
        error: result.error
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
      processedAt: new Date()
    });

    await transaction.save();

    logger.info(`Email processed successfully for MSME ${msmeId}`, {
      messageId,
      transactionType: result.transaction.transactionType,
      amount: result.transaction.amount,
      co2Emissions: carbonData.co2Emissions
    });

    res.json({
      success: true,
      message: 'Email processed successfully',
      data: {
        transaction: transaction,
        confidence: result.confidence
      }
    });

  } catch (error) {
    logger.error('Email processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/email/transactions
// @desc    Get email transactions for MSME
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, startDate, endDate } = req.query;
    const msmeId = req.user.msmeId;

    const query = { msmeId, source: 'email' };
    
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
    logger.error('Get email transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/email/analytics
// @desc    Get email transaction analytics
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const msmeId = req.user.msmeId;

    const query = { msmeId, source: 'email' };
    
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
      sustainabilityScore: 0,
      confidenceScore: 0
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

    // Calculate average confidence score
    const totalConfidence = transactions.reduce((sum, t) => sum + t.metadata.confidence, 0);
    analytics.confidenceScore = transactions.length > 0 ? totalConfidence / transactions.length : 0;

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Get email analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/email/bulk-process
// @desc    Process multiple emails
// @access  Private
router.post('/bulk-process', [
  auth,
  body('emails').isArray().withMessage('Emails array is required'),
  body('emails.*.subject').notEmpty().withMessage('Email subject is required'),
  body('emails.*.body').notEmpty().withMessage('Email body is required'),
  body('emails.*.from').isEmail().withMessage('Valid from email is required'),
  body('emails.*.to').isEmail().withMessage('Valid to email is required'),
  body('emails.*.date').isISO8601().withMessage('Valid date is required'),
  body('emails.*.messageId').notEmpty().withMessage('Message ID is required')
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

    const { emails } = req.body;
    const msmeId = req.user.msmeId;
    const results = [];

    for (const email of emails) {
      try {
        // Process email
        const result = await emailService.processEmail(email);
        
        if (result.success) {
          // Calculate carbon footprint
          const carbonData = carbonCalculationService.calculateTransactionCarbonFootprint(result.transaction);
          result.transaction.carbonFootprint = carbonData;

          // Save transaction
          const transaction = new Transaction({
            msmeId,
            ...result.transaction,
            isProcessed: true,
            processedAt: new Date()
          });

          await transaction.save();
          
          results.push({
            messageId: email.messageId,
            success: true,
            transaction: transaction
          });
        } else {
          results.push({
            messageId: email.messageId,
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        results.push({
          messageId: email.messageId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    logger.info(`Bulk email processing completed for MSME ${msmeId}`, {
      total: emails.length,
      success: successCount,
      failure: failureCount
    });

    res.json({
      success: true,
      message: `Processed ${emails.length} emails: ${successCount} successful, ${failureCount} failed`,
      data: {
        results,
        summary: {
          total: emails.length,
          successful: successCount,
          failed: failureCount
        }
      }
    });

  } catch (error) {
    logger.error('Bulk email processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/email/connect
// @desc    Connect email account for automatic processing
// @access  Private
router.post('/connect', [
  auth,
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('imapServer').notEmpty().withMessage('IMAP server is required'),
  body('imapPort').isInt().withMessage('IMAP port must be a number')
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

    const { email, password, imapServer, imapPort } = req.body;
    const msmeId = req.user.msmeId;

    // TODO: Implement email account connection
    // This would typically involve:
    // 1. Testing IMAP connection
    // 2. Storing encrypted credentials
    // 3. Setting up periodic email fetching

    logger.info(`Email account connection requested for MSME ${msmeId}`, {
      email,
      imapServer
    });

    res.json({
      success: true,
      message: 'Email account connection initiated',
      data: {
        email,
        status: 'pending_verification'
      }
    });

  } catch (error) {
    logger.error('Email connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;