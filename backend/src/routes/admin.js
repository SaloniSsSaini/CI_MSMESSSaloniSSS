const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const spamDetectionService = require('../services/spamDetectionService');
const duplicateDetectionService = require('../services/duplicateDetectionService');
const logger = require('../utils/logger');

// @route   GET /api/admin/spam-transactions
// @desc    Get spam transactions for MSME
// @access  Private
router.get('/spam-transactions', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate,
      source,
      category
    } = req.query;
    
    const msmeId = req.user.msmeId;
    const query = { 
      msmeId,
      isSpam: true
    };
    
    // Apply filters
    if (source) query.source = source;
    if (category) query.category = category;
    
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
    logger.error('Get spam transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/duplicate-transactions
// @desc    Get duplicate transactions for MSME
// @access  Private
router.get('/duplicate-transactions', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      startDate, 
      endDate,
      source,
      category,
      duplicateType
    } = req.query;
    
    const msmeId = req.user.msmeId;
    const query = { 
      msmeId,
      isDuplicate: true
    };
    
    // Apply filters
    if (source) query.source = source;
    if (category) query.category = category;
    if (duplicateType) query.duplicateType = duplicateType;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('msmeId', 'companyName')
      .populate('matchedTransactionId', 'description amount date');

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
    logger.error('Get duplicate transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   PUT /api/admin/transactions/:id/restore
// @desc    Restore a spam or duplicate transaction
// @access  Private
router.put('/transactions/:id/restore', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      msmeId: req.user.msmeId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Restore transaction
    transaction.isSpam = false;
    transaction.isDuplicate = false;
    transaction.spamScore = 0;
    transaction.spamReasons = [];
    transaction.spamConfidence = 0;
    transaction.duplicateType = null;
    transaction.similarityScore = 0;
    transaction.matchedTransactionId = null;
    transaction.duplicateReasons = [];

    await transaction.save();

    logger.info(`Transaction restored: ${req.params.id}`, {
      msmeId: req.user.msmeId,
      wasSpam: true,
      wasDuplicate: true
    });

    res.json({
      success: true,
      message: 'Transaction restored successfully',
      data: transaction
    });

  } catch (error) {
    logger.error('Restore transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/transactions/:id/confirm-spam
// @desc    Confirm a transaction as spam and delete it
// @access  Private
router.delete('/transactions/:id/confirm-spam', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      msmeId: req.user.msmeId,
      isSpam: true
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Spam transaction not found'
      });
    }

    logger.info(`Spam transaction confirmed and deleted: ${req.params.id}`, {
      msmeId: req.user.msmeId
    });

    res.json({
      success: true,
      message: 'Spam transaction confirmed and deleted successfully'
    });

  } catch (error) {
    logger.error('Confirm spam transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/admin/transactions/:id/confirm-duplicate
// @desc    Confirm a transaction as duplicate and delete it
// @access  Private
router.delete('/transactions/:id/confirm-duplicate', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      msmeId: req.user.msmeId,
      isDuplicate: true
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Duplicate transaction not found'
      });
    }

    logger.info(`Duplicate transaction confirmed and deleted: ${req.params.id}`, {
      msmeId: req.user.msmeId
    });

    res.json({
      success: true,
      message: 'Duplicate transaction confirmed and deleted successfully'
    });

  } catch (error) {
    logger.error('Confirm duplicate transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/spam-statistics
// @desc    Get spam detection statistics
// @access  Private
router.get('/spam-statistics', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const msmeId = req.user.msmeId;

    const statistics = await spamDetectionService.getSpamStatistics(msmeId, startDate, endDate);

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Get spam statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/admin/duplicate-statistics
// @desc    Get duplicate detection statistics
// @access  Private
router.get('/duplicate-statistics', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const msmeId = req.user.msmeId;

    const statistics = await duplicateDetectionService.getDuplicateStatistics(msmeId, startDate, endDate);

    res.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    logger.error('Get duplicate statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/transactions/:id/mark-spam
// @desc    Manually mark a transaction as spam
// @access  Private
router.post('/transactions/:id/mark-spam', [
  auth,
  body('reasons').isArray().withMessage('Reasons array is required')
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

    const { reasons } = req.body;
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      msmeId: req.user.msmeId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Mark as spam
    transaction.isSpam = true;
    transaction.spamReasons = reasons;
    transaction.spamScore = 10; // Manual marking gets high score
    transaction.spamConfidence = 1.0;

    await transaction.save();

    logger.info(`Transaction manually marked as spam: ${req.params.id}`, {
      msmeId: req.user.msmeId,
      reasons
    });

    res.json({
      success: true,
      message: 'Transaction marked as spam successfully',
      data: transaction
    });

  } catch (error) {
    logger.error('Mark transaction as spam error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/admin/transactions/:id/mark-duplicate
// @desc    Manually mark a transaction as duplicate
// @access  Private
router.post('/transactions/:id/mark-duplicate', [
  auth,
  body('matchedTransactionId').notEmpty().withMessage('Matched transaction ID is required'),
  body('reasons').isArray().withMessage('Reasons array is required')
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

    const { matchedTransactionId, reasons } = req.body;
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      msmeId: req.user.msmeId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify matched transaction exists
    const matchedTransaction = await Transaction.findOne({
      _id: matchedTransactionId,
      msmeId: req.user.msmeId
    });

    if (!matchedTransaction) {
      return res.status(404).json({
        success: false,
        message: 'Matched transaction not found'
      });
    }

    // Mark as duplicate
    transaction.isDuplicate = true;
    transaction.duplicateType = 'manual';
    transaction.similarityScore = 1.0;
    transaction.matchedTransactionId = matchedTransactionId;
    transaction.duplicateReasons = reasons;

    await transaction.save();

    logger.info(`Transaction manually marked as duplicate: ${req.params.id}`, {
      msmeId: req.user.msmeId,
      matchedTransactionId,
      reasons
    });

    res.json({
      success: true,
      message: 'Transaction marked as duplicate successfully',
      data: transaction
    });

  } catch (error) {
    logger.error('Mark transaction as duplicate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;