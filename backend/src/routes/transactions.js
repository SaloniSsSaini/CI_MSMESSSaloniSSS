const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const carbonCalculationService = require('../services/carbonCalculationService');
const logger = require('../utils/logger');

// @route   GET /api/transactions
// @desc    Get all transactions for MSME
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      source, 
      startDate, 
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;
    
    const msmeId = req.user.msmeId;
    const query = { msmeId };
    
    // Apply filters
    if (category) query.category = category;
    if (source) query.source = source;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Transaction.find(query)
      .sort(sortOptions)
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
    logger.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/transactions/analytics
// @desc    Get transaction analytics
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    const msmeId = req.user.msmeId;

    const query = { msmeId };
    
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
      sourceBreakdown: {},
      monthlyTrend: {},
      topVendors: {},
      sustainabilityMetrics: {
        greenTransactions: 0,
        sustainabilityScore: 0,
        averageConfidence: 0
      }
    };

    // Process transactions for analytics
    transactions.forEach(transaction => {
      // Category breakdown
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

      // Source breakdown
      const source = transaction.source;
      if (!analytics.sourceBreakdown[source]) {
        analytics.sourceBreakdown[source] = {
          count: 0,
          amount: 0,
          co2Emissions: 0
        };
      }
      analytics.sourceBreakdown[source].count++;
      analytics.sourceBreakdown[source].amount += transaction.amount;
      analytics.sourceBreakdown[source].co2Emissions += transaction.carbonFootprint.co2Emissions;

      // Monthly trend
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

      // Top vendors
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

      // Sustainability metrics
      if (transaction.sustainability.isGreen) {
        analytics.sustainabilityMetrics.greenTransactions++;
      }
    });

    // Calculate sustainability score
    analytics.sustainabilityMetrics.sustainabilityScore = transactions.length > 0 ? 
      (analytics.sustainabilityMetrics.greenTransactions / transactions.length) * 100 : 0;

    // Calculate average confidence
    const totalConfidence = transactions.reduce((sum, t) => sum + t.metadata.confidence, 0);
    analytics.sustainabilityMetrics.averageConfidence = transactions.length > 0 ? 
      totalConfidence / transactions.length : 0;

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Get transaction analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/transactions/:id
// @desc    Get single transaction
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      msmeId: req.user.msmeId
    }).populate('msmeId', 'companyName');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });

  } catch (error) {
    logger.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { category, subcategory, tags, sustainability } = req.body;
    
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

    // Update fields
    if (category) transaction.category = category;
    if (subcategory) transaction.subcategory = subcategory;
    if (tags) transaction.tags = tags;
    if (sustainability) transaction.sustainability = { ...transaction.sustainability, ...sustainability };

    // Recalculate carbon footprint if category changed
    if (category && category !== transaction.category) {
      const carbonData = carbonCalculationService.calculateTransactionCarbonFootprint(transaction);
      transaction.carbonFootprint = carbonData;
    }

    await transaction.save();

    logger.info(`Transaction updated: ${req.params.id}`, {
      msmeId: req.user.msmeId,
      updates: { category, subcategory, tags, sustainability }
    });

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction
    });

  } catch (error) {
    logger.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      msmeId: req.user.msmeId
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    logger.info(`Transaction deleted: ${req.params.id}`, {
      msmeId: req.user.msmeId
    });

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    logger.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;