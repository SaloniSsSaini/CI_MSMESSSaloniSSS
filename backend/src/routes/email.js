const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');
const carbonCalculationService = require('../services/carbonCalculationService');
const spamDetectionService = require('../services/spamDetectionService');
const duplicateDetectionService = require('../services/duplicateDetectionService');
const emailIngestionAgent = require('../services/emailIngestionAgent');
const Transaction = require('../models/Transaction');
const MSME = require('../models/MSME');
const Bank = require('../models/Bank');
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

    // Detect spam
    const spamDetection = spamDetectionService.detectSpam(result.transaction, {
      sender: from,
      subject,
      body
    });

    // Detect duplicates
    const duplicateDetection = await duplicateDetectionService.detectDuplicate(result.transaction, msmeId);

    // Skip processing if spam or duplicate
    if (spamDetection.isSpam || duplicateDetection.isDuplicate) {
      logger.info(`Email skipped - Spam: ${spamDetection.isSpam}, Duplicate: ${duplicateDetection.isDuplicate}`, {
        messageId,
        msmeId,
        spamReasons: spamDetection.reasons,
        duplicateReasons: duplicateDetection.reasons
      });

      return res.json({
        success: true,
        message: 'Email processed but skipped due to spam/duplicate detection',
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

    const query = { 
      msmeId, 
      source: 'email',
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

    const query = { 
      msmeId, 
      source: 'email',
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
          // Detect spam
          const spamDetection = spamDetectionService.detectSpam(result.transaction, {
            sender: email.from,
            subject: email.subject,
            body: email.body
          });

          // Detect duplicates
          const duplicateDetection = await duplicateDetectionService.detectDuplicate(result.transaction, msmeId);

          // Skip processing if spam or duplicate
          if (spamDetection.isSpam || duplicateDetection.isDuplicate) {
            results.push({
              messageId: email.messageId,
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

// @route   POST /api/email/ingest-assess
// @desc    Connect to MSME mailbox, ingest emails, and generate AI carbon assessment
// @access  Private
router.post('/ingest-assess', [
  auth,
  body('email').isEmail().withMessage('Valid email address is required'),
  body('appPassword').notEmpty().withMessage('Application-specific password is required'),
  body('imapServer').optional().isString(),
  body('imapPort').optional().isInt({ min: 1 }),
  body('secure').optional().isBoolean(),
  body('limit').optional().isInt({ min: 1, max: 100 }),
  body('sinceDays').optional().isInt({ min: 1, max: 365 })
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

    const {
      email: mailboxEmail,
      appPassword,
      imapServer,
      imapPort,
      secure = true,
      limit = 25,
      sinceDays = 30
    } = req.body;

    // Resolve MSME profile from authenticated user
    let msme = null;
    if (req.user.msmeId) {
      msme = await MSME.findById(req.user.msmeId);
    }
    if (!msme && req.user.userId) {
      msme = await MSME.findOne({ userId: req.user.userId });
    }

    if (!msme) {
      return res.status(404).json({
        success: false,
        message: 'MSME profile not found for the authenticated user'
      });
    }

    // Step 1: Fetch emails using IMAP agent
    const ingestionResult = await emailIngestionAgent.fetchEmails({
      email: mailboxEmail,
      password: appPassword,
      imapServer,
      imapPort,
      secure,
      limit,
      sinceDays
    });

    if (!ingestionResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Unable to read emails from the provided mailbox',
        error: ingestionResult.error
      });
    }

    if (ingestionResult.emails.length === 0) {
      return res.json({
        success: true,
        message: 'No relevant emails found in the selected timeframe.',
        data: {
          ingestedEmails: 0,
          processedTransactions: 0,
          skippedEmails: [],
          failures: [],
          carbonAssessment: null,
          incentives: [],
          greenLoanOffers: []
        }
      });
    }

    const processedTransactions = [];
    const assessmentTransactions = [];
    const skippedEmails = [];
    const failures = [];

    for (const email of ingestionResult.emails) {
      try {
        const processed = await emailService.processEmail({
          subject: email.subject,
          body: email.body,
          from: email.from,
          to: Array.isArray(email.to) && email.to.length > 0 ? email.to[0] : mailboxEmail,
          date: email.date,
          messageId: email.id
        });

        if (!processed.success) {
          failures.push({
            messageId: email.id,
            subject: email.subject,
            error: processed.error || 'Processing failed'
          });
          continue;
        }

        const transactionData = {
          ...processed.transaction,
          industry: msme.industry,
          businessDomain: msme.businessDomain
        };

        const spamDetection = spamDetectionService.detectSpam(transactionData, {
          sender: email.from,
          subject: email.subject,
          body: email.textBody || email.body
        });

        const duplicateDetection = await duplicateDetectionService.detectDuplicate(transactionData, msme._id);

        if (spamDetection.isSpam || duplicateDetection.isDuplicate) {
          skippedEmails.push({
            messageId: email.id,
            subject: email.subject,
            spam: spamDetection.isSpam,
            duplicate: duplicateDetection.isDuplicate,
            spamReasons: spamDetection.reasons,
            duplicateReasons: duplicateDetection.reasons
          });
          continue;
        }

        const carbonData = carbonCalculationService.calculateTransactionCarbonFootprint(transactionData);
        transactionData.carbonFootprint = carbonData;

        const transactionDocument = new Transaction({
          msmeId: msme._id,
          ...transactionData,
          isProcessed: true,
          processedAt: new Date(),
          metadata: {
            ...transactionData.metadata,
            ingestionSource: 'ai_email_agent',
            mailbox: mailboxEmail,
            confidence: transactionData.metadata?.confidence || 0
          },
          isSpam: false,
          spamScore: spamDetection.score,
          spamReasons: spamDetection.reasons,
          spamConfidence: spamDetection.confidence,
          isDuplicate: false,
          duplicateType: duplicateDetection.duplicateType,
          similarityScore: duplicateDetection.similarityScore,
          matchedTransactionId: duplicateDetection.matchedTransaction?._id,
          duplicateReasons: duplicateDetection.reasons
        });

        await transactionDocument.save();

        processedTransactions.push({
          messageId: email.id,
          subject: email.subject,
          transactionType: transactionData.transactionType,
          amount: transactionData.amount,
          category: transactionData.category,
          co2Emissions: carbonData.co2Emissions,
          confidence: transactionData.metadata?.confidence || 0,
          processedAt: transactionDocument.processedAt
        });

        assessmentTransactions.push(transactionDocument.toObject());
      } catch (processingError) {
        logger.error('Email ingestion processing error', {
          error: processingError.message,
          messageId: email.id
        });

        failures.push({
          messageId: email.id,
          subject: email.subject,
          error: processingError.message
        });
      }
    }

    let carbonAssessment = null;
    if (assessmentTransactions.length > 0) {
      carbonAssessment = carbonCalculationService.calculateMSMECarbonFootprint(
        msme,
        assessmentTransactions.map((transaction) => ({
          ...transaction,
          industry: msme.industry,
          businessDomain: msme.businessDomain
        }))
      );
    }

    const incentives = generateAIIncentives(msme, carbonAssessment, processedTransactions.length);
    const greenLoanOffers = await generateGreenLoanOffers(msme, carbonAssessment);

    res.json({
      success: true,
      message: 'Email ingestion and AI assessment completed successfully',
      data: {
        ingestedEmails: ingestionResult.emails.length,
        processedTransactions: processedTransactions.length,
        skippedEmails,
        failures,
        transactions: processedTransactions,
        carbonAssessment,
        incentives,
        greenLoanOffers,
        metadata: ingestionResult.metadata
      }
    });
  } catch (error) {
    logger.error('Email AI ingestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to complete AI-driven email assessment',
      error: error.message
    });
  }
});

const generateAIIncentives = (msme, carbonAssessment, processedCount) => {
  const incentives = [];
  const carbonScore = carbonAssessment?.carbonScore ?? null;
  const totalEmissions = carbonAssessment?.totalCO2Emissions ?? 0;
  const recommendationCount = carbonAssessment?.recommendations?.length || 0;

  incentives.push({
    id: 'ai-email-ingestion',
    title: 'AI Email Agent Bonus',
    description: `Automated carbon extraction completed for ${processedCount} messages in your mailbox.`,
    rewardPoints: 50 + processedCount * 10,
    category: 'automation',
    badge: 'AI-Powered'
  });

  if (carbonScore !== null) {
    incentives.push({
      id: 'carbon-score-recognition',
      title: 'Carbon Intelligence Score',
      description: `Your current carbon score is ${carbonScore}. Keep improving to unlock premium sustainability rewards.`,
      rewardPoints: Math.max(0, 100 - carbonScore) * 2,
      category: 'performance',
      badge: carbonScore >= 80 ? 'Platinum' : carbonScore >= 60 ? 'Gold' : 'Silver'
    });
  }

  if (totalEmissions > 0) {
    incentives.push({
      id: 'emissions-reduction-opportunity',
      title: 'Carbon Reduction Opportunity',
      description: `Identified ${totalEmissions.toFixed(2)} kg CO₂e emissions this period. Implement recommendations to unlock carbon reduction rebates.`,
      rewardPoints: Math.round(totalEmissions / 5),
      category: 'sustainability',
      badge: 'Action Needed'
    });
  }

  if (recommendationCount > 0) {
    incentives.push({
      id: 'recommendation-tracker',
      title: 'Recommendation Tracker',
      description: `AI agents suggested ${recommendationCount} targeted improvements. Implement at least one for instant climate credits.`,
      rewardPoints: 25 * recommendationCount,
      category: 'engagement',
      badge: 'Next Steps'
    });
  }

  return incentives;
};

const calculateCarbonScoreDiscount = (bank, carbonScore) => {
  if (!carbonScore || !bank.greenLoanPolicy?.carbonScoreDiscounts) {
    return 0;
  }

  for (const discount of bank.greenLoanPolicy.carbonScoreDiscounts) {
    if (!discount.scoreRange) continue;
    const { min = 0, max = 100 } = discount.scoreRange;
    if (carbonScore >= min && carbonScore <= max) {
      return discount.discountPercentage || 0;
    }
  }

  return 0;
};

const generateGreenLoanOffers = async (msme, carbonAssessment) => {
  const carbonScore = carbonAssessment?.carbonScore ?? 0;
  const banks = await Bank.find({ isActive: true }).limit(5).lean();

  return banks.map((bank) => {
    const policy = bank.greenLoanPolicy || {};
    const eligible = carbonScore >= (policy.minCarbonScore || 0);
    const discount = calculateCarbonScoreDiscount(bank, carbonScore);
    const baseRate = policy.interestRateRange?.min ?? 10;
    const maxRate = policy.interestRateRange?.max ?? baseRate + 2;
    const indicativeRate = eligible
      ? Math.max(baseRate - discount, baseRate * 0.5)
      : Math.min(maxRate, baseRate + 1.5);

    return {
      bankId: bank._id,
      bankName: bank.bankName,
      eligible,
      minCarbonScore: policy.minCarbonScore || 0,
      carbonScore,
      discountPercentage: discount,
      indicativeInterestRate: Number(indicativeRate.toFixed(2)),
      maxLoanAmount: policy.maxLoanAmount || null,
      message: eligible
        ? `Eligible for up to ${discount}% interest discount based on your carbon score.`
        : `Improve your carbon score by ${Math.max(0, (policy.minCarbonScore || 0) - carbonScore)} points to unlock discounted green capital.`
    };
  });
};

module.exports = router;