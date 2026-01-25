const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const MSME = require('../models/MSME');
const carbonCreditsService = require('../services/carbonCreditsService');
const logger = require('../utils/logger');
const orchestrationManagerEventService = require('../services/orchestrationManagerEventService');

// @route   GET /api/msme/profile
// @desc    Get MSME profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const msme = await MSME.findOne({ userId: req.user.userId });

    if (!msme) {
      return res.status(404).json({
        success: false,
        message: 'MSME profile not found'
      });
    }

    res.json({
      success: true,
      data: msme
    });

  } catch (error) {
    logger.error('Get MSME profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   PUT /api/msme/profile
// @desc    Update MSME profile
// @access  Private
router.put('/profile', [
  auth,
  body('companyName').optional().notEmpty().withMessage('Company name cannot be empty'),
  body('companyType').optional().isIn(['micro', 'small', 'medium']).withMessage('Invalid company type'),
  body('industry').optional().notEmpty().withMessage('Industry cannot be empty'),
  body('businessDomain').optional().isIn(['manufacturing', 'trading', 'services', 'export_import', 'retail', 'wholesale', 'e_commerce', 'consulting', 'logistics', 'agriculture', 'handicrafts', 'food_processing', 'textiles', 'electronics', 'automotive', 'construction', 'healthcare', 'education', 'tourism', 'other']).withMessage('Invalid business domain'),
  body('udyamRegistrationNumber').optional().matches(/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/).withMessage('Invalid UDYAM Registration Number format'),
  body('contact.email').optional().isEmail().withMessage('Valid email is required'),
  body('contact.phone').optional().notEmpty().withMessage('Phone cannot be empty')
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

    const msme = await MSME.findOne({ userId: req.user.userId });

    if (!msme) {
      return res.status(404).json({
        success: false,
        message: 'MSME profile not found'
      });
    }

    // Update fields
    const allowedFields = [
      'companyName', 'companyType', 'industry', 'businessDomain', 'establishmentYear',
      'udyamRegistrationNumber',
      'contact', 'business', 'environmentalCompliance'
    ];

    allowedFields.forEach(field => {
      if (req.body[field]) {
        if (typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
          msme[field] = { ...msme[field], ...req.body[field] };
        } else {
          msme[field] = req.body[field];
        }
      }
    });

    await msme.save();

    logger.info(`MSME profile updated: ${msme._id}`, {
      userId: req.user.userId,
      updatedFields: Object.keys(req.body)
    });

    try {
      orchestrationManagerEventService.emitEvent('msme.profile_updated', {
        msmeId: msme._id?.toString(),
        updates: req.body,
        businessDomain: msme.businessDomain,
        industry: msme.industry
      }, 'msme_profile');
    } catch (eventError) {
      logger.warn('Failed to emit orchestration event for MSME profile update', {
        error: eventError.message,
        msmeId: msme._id?.toString()
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: msme
    });

  } catch (error) {
    logger.error('Update MSME profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/msme/register
// @desc    Register MSME
// @access  Private
router.post('/register', [
  auth,
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('companyType').isIn(['micro', 'small', 'medium']).withMessage('Valid company type is required'),
  body('industry').notEmpty().withMessage('Industry is required'),
  body('businessDomain').isIn(['manufacturing', 'trading', 'services', 'export_import', 'retail', 'wholesale', 'e_commerce', 'consulting', 'logistics', 'agriculture', 'handicrafts', 'food_processing', 'textiles', 'electronics', 'automotive', 'construction', 'healthcare', 'education', 'tourism', 'other']).withMessage('Valid business domain is required'),
  body('udyamRegistrationNumber').matches(/^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/).withMessage('Invalid UDYAM Registration Number format'),
  body('gstNumber').matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GST Number format'),
  body('panNumber').matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Invalid PAN Number format'),
  body('contact.email').isEmail().withMessage('Valid email is required'),
  body('contact.phone').notEmpty().withMessage('Phone is required'),
  body('business.annualTurnover').isNumeric().withMessage('Annual turnover must be a number'),
  body('business.numberOfEmployees').isInt().withMessage('Number of employees must be an integer'),
  body('business.manufacturingUnits').isInt().withMessage('Number of manufacturing units must be an integer')
], async (req, res) => {
  try {
    console.log("129 msme.js")
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if MSME already exists
    const existingMSME = await MSME.findOne({ userId: req.user.userId });
    if (existingMSME) {
      return res.status(400).json({
        success: false,
        message: 'MSME profile already exists'
      });
    }

    // Support legacy clients sending udyogAadharNumber
    if (!req.body.udyamRegistrationNumber && req.body.udyogAadharNumber) {
      req.body.udyamRegistrationNumber = req.body.udyogAadharNumber;
      delete req.body.udyogAadharNumber;
    }

    // Create MSME profile
    const msme = new MSME({
      userId: req.user.userId,
      ...req.body,
      isVerified: false
    });

    await msme.save();

    logger.info(`MSME registered: ${msme._id}`, {
      userId: req.user.userId,
      companyName: msme.companyName,
      companyType: msme.companyType
    });

    try {
      orchestrationManagerEventService.emitEvent('msme.registered', {
        msmeId: msme._id?.toString(),
        businessDomain: msme.businessDomain,
        industry: msme.industry
      }, 'msme_register');
    } catch (eventError) {
      logger.warn('Failed to emit orchestration event for MSME registration', {
        error: eventError.message,
        msmeId: msme._id?.toString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'MSME registered successfully',
      data: msme
    });

  } catch (error) {
    logger.error('MSME registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/msme/stats
// @desc    Get MSME statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const msmeId = req.user.msmeId;
    
    if (!msmeId) {
      return res.status(404).json({
        success: false,
        message: 'MSME profile not found'
      });
    }

    const Transaction = require('../models/Transaction');
    const CarbonAssessment = require('../models/CarbonAssessment');

    // Get transaction stats
    const totalTransactions = await Transaction.countDocuments({ msmeId });
    const totalAmount = await Transaction.aggregate([
      { $match: { msmeId: msmeId } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Get carbon assessment stats
    const latestAssessment = await CarbonAssessment.findOne({ msmeId })
      .sort({ createdAt: -1 });

    const totalAssessments = await CarbonAssessment.countDocuments({ msmeId });

    // Get monthly transaction trend
    const monthlyTransactions = await Transaction.aggregate([
      { $match: { msmeId: msmeId } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalCO2: { $sum: '$carbonFootprint.co2Emissions' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Get carbon savings data
    const carbonCalculationService = require('../services/carbonCalculationService');
    const previousAssessment = await CarbonAssessment.findOne({ msmeId })
      .sort({ createdAt: -1 })
      .skip(1);

    let carbonSavings = null;
    if (latestAssessment) {
      const MSME = require('../models/MSME');
      const msmeData = await MSME.findById(msmeId);
      if (msmeData) {
        carbonSavings = carbonCalculationService.calculateCarbonSavings(
          msmeData,
          latestAssessment,
          previousAssessment
        );
      }
    }

    // Get carbon credits data
    let carbonCredits = null;
    try {
      carbonCredits = await carbonCreditsService.getMSMECredits(msmeId);
    } catch (error) {
      logger.warn(`Error getting carbon credits for MSME ${msmeId}:`, error);
    }

    const stats = {
      transactions: {
        total: totalTransactions,
        totalAmount: totalAmount[0]?.total || 0,
        monthlyTrend: monthlyTransactions
      },
      carbon: {
        currentScore: latestAssessment?.carbonScore || 0,
        totalAssessments,
        lastAssessment: latestAssessment?.createdAt,
        totalCO2Emissions: latestAssessment?.totalCO2Emissions || 0,
        savings: carbonSavings ? {
          totalSavings: carbonSavings.totalSavings,
          periodSavings: carbonSavings.periodSavings,
          savingsPercentage: carbonSavings.savingsPercentage,
          implementedRecommendations: carbonSavings.implementedRecommendations,
          potentialSavings: carbonSavings.potentialSavings,
          achievements: carbonSavings.achievements.length,
          performance: carbonSavings.benchmarkComparison.performance
        } : null
      },
      profile: {
        isVerified: latestAssessment?.msmeId ? true : false,
        registrationDate: latestAssessment?.createdAt
      },
      carbonCredits: carbonCredits ? {
        allocatedCredits: carbonCredits.allocatedCredits,
        availableCredits: carbonCredits.availableCredits,
        usedCredits: carbonCredits.usedCredits,
        retiredCredits: carbonCredits.retiredCredits,
        totalCO2Reduced: carbonCredits.totalCO2Reduced,
        performanceScore: carbonCredits.performanceMetrics.participationScore,
        lastAllocation: carbonCredits.allocationHistory.length > 0 ? 
          carbonCredits.allocationHistory[carbonCredits.allocationHistory.length - 1].date : null
      } : null
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Get MSME stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/msme/carbon-credits
// @desc    Get detailed carbon credits information for MSME
// @access  Private
router.get('/carbon-credits', auth, async (req, res) => {
  try {
    const msmeId = req.user.msmeId;
    
    if (!msmeId) {
      return res.status(404).json({
        success: false,
        message: 'MSME profile not found'
      });
    }

    const carbonCredits = await carbonCreditsService.getMSMECredits(msmeId);
    
    // Get recent allocation history
    const recentAllocations = carbonCredits.allocationHistory
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Get recent transactions
    const recentTransactions = carbonCredits.transactions
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    // Calculate performance metrics
    const performanceMetrics = {
      carbonEfficiency: carbonCredits.performanceMetrics.carbonEfficiency,
      participationScore: carbonCredits.performanceMetrics.participationScore,
      totalContributions: carbonCredits.allocationHistory.length,
      averageContribution: carbonCredits.allocationHistory.length > 0 ?
        carbonCredits.allocationHistory.reduce((sum, h) => sum + h.creditsAllocated, 0) / carbonCredits.allocationHistory.length : 0,
      lastUpdated: carbonCredits.performanceMetrics.lastUpdated
    };

    res.json({
      success: true,
      data: {
        credits: {
          allocated: carbonCredits.allocatedCredits,
          available: carbonCredits.availableCredits,
          used: carbonCredits.usedCredits,
          retired: carbonCredits.retiredCredits,
          totalCO2Reduced: carbonCredits.totalCO2Reduced
        },
        performance: performanceMetrics,
        recentAllocations,
        recentTransactions,
        poolId: carbonCredits.poolId,
        lastContribution: carbonCredits.lastContributionDate
      }
    });

  } catch (error) {
    logger.error('Get MSME carbon credits details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/msme/carbon-credits/leaderboard
// @desc    Get carbon credits leaderboard for MSMEs
// @access  Private
router.get('/carbon-credits/leaderboard', auth, async (req, res) => {
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
    logger.error('Get MSME carbon credits leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;