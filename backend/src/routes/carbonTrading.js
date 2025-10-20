const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CarbonTrading = require('../models/CarbonTrading');
const CarbonOffset = require('../models/CarbonOffset');
const MSME = require('../models/MSME');
const logger = require('../utils/logger');

// @route   GET /api/carbon/trading/portfolio
// @desc    Get MSME carbon trading portfolio
// @access  Private
router.get('/portfolio', auth, async (req, res) => {
  try {
    const msmeId = req.user.msmeId;

    // Get MSME data
    const msme = await MSME.findById(msmeId);
    if (!msme) {
      return res.status(404).json({
        success: false,
        message: 'MSME not found'
      });
    }

    // Get trading portfolio
    const portfolio = await CarbonTrading.findOne({ msmeId });
    
    // If no portfolio exists, create one
    if (!portfolio) {
      const newPortfolio = new CarbonTrading({
        msmeId,
        totalCredits: 0,
        availableCredits: 0,
        usedCredits: 0,
        totalInvestment: 0,
        averagePrice: 0,
        lastPurchase: null,
        transactions: []
      });
      await newPortfolio.save();
      
      return res.json({
        success: true,
        data: {
          totalCredits: 0,
          availableCredits: 0,
          usedCredits: 0,
          totalInvestment: 0,
          averagePrice: 0,
          lastPurchase: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        totalCredits: portfolio.totalCredits,
        availableCredits: portfolio.availableCredits,
        usedCredits: portfolio.usedCredits,
        totalInvestment: portfolio.totalInvestment,
        averagePrice: portfolio.averagePrice,
        lastPurchase: portfolio.lastPurchase
      }
    });

  } catch (error) {
    logger.error('Get carbon trading portfolio error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/carbon/trading/offsets
// @desc    Get available carbon offset options
// @access  Private
router.get('/offsets', auth, async (req, res) => {
  try {
    const { 
      type, 
      minPrice, 
      maxPrice, 
      location, 
      verifiedBy,
      page = 1,
      limit = 20
    } = req.query;

    const query = { isActive: true };
    
    if (type) query.type = type;
    if (minPrice || maxPrice) {
      query.pricePerTon = {};
      if (minPrice) query.pricePerTon.$gte = parseFloat(minPrice);
      if (maxPrice) query.pricePerTon.$lte = parseFloat(maxPrice);
    }
    if (location) query.location = new RegExp(location, 'i');
    if (verifiedBy) query.verifiedBy = new RegExp(verifiedBy, 'i');

    const offsets = await CarbonOffset.find(query)
      .sort({ rating: -1, pricePerTon: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CarbonOffset.countDocuments(query);

    res.json({
      success: true,
      data: offsets,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    logger.error('Get carbon offset options error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/carbon/trading/purchase
// @desc    Purchase carbon offset credits
// @access  Private
router.post('/purchase', auth, async (req, res) => {
  try {
    const { offsetId, amount, pricePerTon } = req.body;
    const msmeId = req.user.msmeId;

    if (!offsetId || !amount || !pricePerTon) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get offset option
    const offset = await CarbonOffset.findById(offsetId);
    if (!offset) {
      return res.status(404).json({
        success: false,
        message: 'Carbon offset option not found'
      });
    }

    if (amount > offset.availableCredits) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits available'
      });
    }

    // Calculate total cost
    const totalCost = amount * pricePerTon;

    // Get or create trading portfolio
    let portfolio = await CarbonTrading.findOne({ msmeId });
    if (!portfolio) {
      portfolio = new CarbonTrading({
        msmeId,
        totalCredits: 0,
        availableCredits: 0,
        usedCredits: 0,
        totalInvestment: 0,
        averagePrice: 0,
        lastPurchase: null,
        transactions: []
      });
    }

    // Update portfolio
    portfolio.totalCredits += amount;
    portfolio.availableCredits += amount;
    portfolio.totalInvestment += totalCost;
    portfolio.averagePrice = portfolio.totalCredits > 0 
      ? portfolio.totalInvestment / portfolio.totalCredits 
      : pricePerTon;
    portfolio.lastPurchase = new Date();

    // Add transaction
    const transaction = {
      type: 'purchase',
      offsetId: offset._id,
      offsetName: offset.name,
      amount: amount,
      pricePerTon: pricePerTon,
      totalCost: totalCost,
      timestamp: new Date(),
      status: 'completed'
    };

    portfolio.transactions.push(transaction);

    // Update offset availability
    offset.availableCredits -= amount;
    if (offset.availableCredits <= 0) {
      offset.isActive = false;
    }

    // Save changes
    await portfolio.save();
    await offset.save();

    logger.info(`Carbon offset purchased: ${amount} tons for ₹${totalCost}`, {
      msmeId,
      offsetId,
      transactionId: transaction._id
    });

    res.json({
      success: true,
      message: 'Carbon offset purchased successfully',
      data: {
        transaction,
        portfolio: {
          totalCredits: portfolio.totalCredits,
          availableCredits: portfolio.availableCredits,
          totalInvestment: portfolio.totalInvestment
        }
      }
    });

  } catch (error) {
    logger.error('Purchase carbon offset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/carbon/trading/offset
// @desc    Use carbon credits to offset emissions
// @access  Private
router.post('/offset', auth, async (req, res) => {
  try {
    const { amount, description } = req.body;
    const msmeId = req.user.msmeId;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    // Get trading portfolio
    const portfolio = await CarbonTrading.findOne({ msmeId });
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'No trading portfolio found'
      });
    }

    if (amount > portfolio.availableCredits) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits available'
      });
    }

    // Update portfolio
    portfolio.availableCredits -= amount;
    portfolio.usedCredits += amount;

    // Add offset transaction
    const transaction = {
      type: 'offset',
      amount: amount,
      description: description || 'Carbon emission offset',
      timestamp: new Date(),
      status: 'completed'
    };

    portfolio.transactions.push(transaction);
    await portfolio.save();

    logger.info(`Carbon offset applied: ${amount} tons`, {
      msmeId,
      transactionId: transaction._id
    });

    res.json({
      success: true,
      message: 'Carbon offset applied successfully',
      data: {
        transaction,
        portfolio: {
          availableCredits: portfolio.availableCredits,
          usedCredits: portfolio.usedCredits
        }
      }
    });

  } catch (error) {
    logger.error('Apply carbon offset error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/carbon/trading/history
// @desc    Get carbon trading history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const msmeId = req.user.msmeId;

    const portfolio = await CarbonTrading.findOne({ msmeId });
    if (!portfolio) {
      return res.json({
        success: true,
        data: {
          transactions: [],
          pagination: { current: 1, pages: 0, total: 0 }
        }
      });
    }

    let transactions = portfolio.transactions;
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    // Sort by timestamp (newest first)
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = transactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        transactions: paginatedTransactions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(transactions.length / limit),
          total: transactions.length
        }
      }
    });

  } catch (error) {
    logger.error('Get carbon trading history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/carbon/trading/market-trends
// @desc    Get carbon market trends and analytics
// @access  Private
router.get('/market-trends', auth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get market data
    const marketData = await CarbonOffset.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          averagePrice: { $avg: '$pricePerTon' },
          totalCredits: { $sum: '$availableCredits' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get price trends
    const priceTrends = await CarbonOffset.aggregate([
      {
        $match: {
          isActive: true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          averagePrice: { $avg: '$pricePerTon' },
          minPrice: { $min: '$pricePerTon' },
          maxPrice: { $max: '$pricePerTon' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Get type distribution
    const typeDistribution = await CarbonOffset.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          averagePrice: { $avg: '$pricePerTon' },
          totalCredits: { $sum: '$availableCredits' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        marketData,
        priceTrends,
        typeDistribution,
        period,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Get carbon market trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;