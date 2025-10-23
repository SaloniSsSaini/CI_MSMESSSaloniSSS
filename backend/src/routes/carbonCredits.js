const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const carbonCreditsService = require('../services/carbonCreditsService');
const logger = require('../utils/logger');

// @route   POST /api/carbon-credits/aggregate
// @desc    Aggregate carbon savings and allocate credits to MSMEs
// @access  Private (Admin only)
router.post('/aggregate', auth, async (req, res) => {
  try {
    // Check if user is admin (you might want to add admin role check)
    const { period = 'monthly' } = req.body;

    const result = await carbonCreditsService.aggregateAndAllocateCredits(period);

    res.json({
      success: result.success,
      message: result.message || 'Carbon credits aggregated and allocated successfully',
      data: result.data
    });

  } catch (error) {
    logger.error('Carbon credits aggregation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/carbon-credits/msme/:msmeId
// @desc    Get carbon credits for a specific MSME
// @access  Private
router.get('/msme/:msmeId', auth, async (req, res) => {
  try {
    const { msmeId } = req.params;
    
    // Check if user has access to this MSME
    if (req.user.msmeId && req.user.msmeId.toString() !== msmeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this MSME data'
      });
    }

    const msmeCredits = await carbonCreditsService.getMSMECredits(msmeId);

    res.json({
      success: true,
      data: msmeCredits
    });

  } catch (error) {
    logger.error('Get MSME carbon credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/carbon-credits/my-credits
// @desc    Get current user's MSME carbon credits
// @access  Private
router.get('/my-credits', auth, async (req, res) => {
  try {
    const msmeId = req.user.msmeId;
    
    if (!msmeId) {
      return res.status(404).json({
        success: false,
        message: 'MSME profile not found'
      });
    }

    const msmeCredits = await carbonCreditsService.getMSMECredits(msmeId);

    res.json({
      success: true,
      data: msmeCredits
    });

  } catch (error) {
    logger.error('Get my carbon credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/carbon-credits/use
// @desc    Use carbon credits for a specific purpose
// @access  Private
router.post('/use', auth, async (req, res) => {
  try {
    const { amount, purpose, referenceId } = req.body;
    const msmeId = req.user.msmeId;

    if (!msmeId) {
      return res.status(404).json({
        success: false,
        message: 'MSME profile not found'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const msmeCredits = await carbonCreditsService.useCredits(
      msmeId,
      amount,
      purpose || 'General usage',
      referenceId
    );

    res.json({
      success: true,
      message: 'Credits used successfully',
      data: {
        usedAmount: amount,
        remainingCredits: msmeCredits.availableCredits,
        totalUsed: msmeCredits.usedCredits
      }
    });

  } catch (error) {
    logger.error('Use carbon credits error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// @route   POST /api/carbon-credits/retire
// @desc    Retire carbon credits (permanent removal)
// @access  Private
router.post('/retire', auth, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const msmeId = req.user.msmeId;

    if (!msmeId) {
      return res.status(404).json({
        success: false,
        message: 'MSME profile not found'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const msmeCredits = await carbonCreditsService.retireCredits(
      msmeId,
      amount,
      reason || 'Voluntary retirement'
    );

    res.json({
      success: true,
      message: 'Credits retired successfully',
      data: {
        retiredAmount: amount,
        remainingCredits: msmeCredits.availableCredits,
        totalRetired: msmeCredits.retiredCredits
      }
    });

  } catch (error) {
    logger.error('Retire carbon credits error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// @route   GET /api/carbon-credits/market
// @desc    Get carbon credits market data
// @access  Private
router.get('/market', auth, async (req, res) => {
  try {
    const marketData = await carbonCreditsService.getMarketData();

    res.json({
      success: true,
      data: marketData
    });

  } catch (error) {
    logger.error('Get carbon credits market data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/carbon-credits/leaderboard
// @desc    Get MSME leaderboard based on carbon credits
// @access  Private
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { limit = 10, period = 'all' } = req.query;

    const leaderboard = await carbonCreditsService.getMSMELeaderboard(
      parseInt(limit),
      period
    );

    res.json({
      success: true,
      data: {
        leaderboard,
        period,
        totalParticipants: leaderboard.length
      }
    });

  } catch (error) {
    logger.error('Get carbon credits leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/carbon-credits/pool
// @desc    Get carbon credits pool information
// @access  Private
router.get('/pool', auth, async (req, res) => {
  try {
    const { CarbonCredits } = require('../models/CarbonCredits');
    const pool = await CarbonCredits.findOne({ poolId: 'indian_carbon_market_pool' });

    if (!pool) {
      return res.status(404).json({
        success: false,
        message: 'Carbon credits pool not found'
      });
    }

    res.json({
      success: true,
      data: pool
    });

  } catch (error) {
    logger.error('Get carbon credits pool error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/carbon-credits/verify-pool
// @desc    Verify carbon credits pool (Admin only)
// @access  Private (Admin only)
router.post('/verify-pool', auth, async (req, res) => {
  try {
    const { notes } = req.body;
    const verifiedBy = req.user.userId;

    const pool = await carbonCreditsService.verifyPool(verifiedBy, notes);

    res.json({
      success: true,
      message: 'Carbon credits pool verified successfully',
      data: pool
    });

  } catch (error) {
    logger.error('Verify carbon credits pool error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// @route   GET /api/carbon-credits/transactions
// @desc    Get carbon credit transactions
// @access  Private
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status } = req.query;
    const msmeId = req.user.msmeId;

    const { CarbonCreditTransaction } = require('../models/CarbonCredits');
    
    const query = {
      $or: [
        { fromMSME: msmeId },
        { toMSME: msmeId }
      ]
    };

    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await CarbonCreditTransaction.find(query)
      .populate('fromMSME', 'companyName')
      .populate('toMSME', 'companyName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await CarbonCreditTransaction.countDocuments(query);

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
    logger.error('Get carbon credit transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/carbon-credits/transfer
// @desc    Transfer carbon credits between MSMEs
// @access  Private
router.post('/transfer', auth, async (req, res) => {
  try {
    const { toMSMEId, amount, description } = req.body;
    const fromMSMEId = req.user.msmeId;

    if (!fromMSMEId) {
      return res.status(404).json({
        success: false,
        message: 'MSME profile not found'
      });
    }

    if (!toMSMEId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid recipient and amount are required'
      });
    }

    if (fromMSMEId === toMSMEId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot transfer credits to yourself'
      });
    }

    // Get sender's credits
    const fromCredits = await carbonCreditsService.getMSMECredits(fromMSMEId);
    
    if (fromCredits.availableCredits < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits available'
      });
    }

    // Use credits from sender
    await carbonCreditsService.useCredits(
      fromMSMEId,
      amount,
      `Transfer to ${toMSMEId}`,
      `TRANSFER_${Date.now()}`
    );

    // Allocate credits to recipient
    await carbonCreditsService.allocateCreditsToMSME(
      toMSMEId,
      amount,
      0, // No CO2 reduction for transfers
      'transfer',
      null
    );

    // Create transaction record
    const { CarbonCreditTransaction } = require('../models/CarbonCredits');
    const transaction = new CarbonCreditTransaction({
      transactionId: `TRANSFER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromMSME: fromMSMEId,
      toMSME: toMSMEId,
      type: 'transfer',
      creditsAmount: amount,
      pricePerCredit: 0, // Free transfer
      totalValue: 0,
      marketType: 'bilateral',
      status: 'completed',
      description: description || 'Credit transfer',
      poolId: 'indian_carbon_market_pool'
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Credits transferred successfully',
      data: {
        transactionId: transaction.transactionId,
        amount,
        fromMSME: fromMSMEId,
        toMSME: toMSMEId
      }
    });

  } catch (error) {
    logger.error('Transfer carbon credits error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

module.exports = router;