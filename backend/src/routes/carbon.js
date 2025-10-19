const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CarbonAssessment = require('../models/CarbonAssessment');
const Transaction = require('../models/Transaction');
const carbonCalculationService = require('../services/carbonCalculationService');
const logger = require('../utils/logger');

// @route   POST /api/carbon/assess
// @desc    Perform carbon footprint assessment
// @access  Private
router.post('/assess', auth, async (req, res) => {
  try {
    const { 
      assessmentType = 'automatic',
      startDate,
      endDate,
      period = 'monthly'
    } = req.body;
    
    const msmeId = req.user.msmeId;

    // Determine date range
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      };
    } else {
      // Default to last month
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      
      dateRange = {
        startDate: lastMonth,
        endDate: endOfLastMonth
      };
    }

    // Get transactions for the period
    const transactions = await Transaction.find({
      msmeId,
      date: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate
      }
    });

    // Get MSME data
    const MSME = require('../models/MSME');
    const msmeData = await MSME.findById(msmeId);

    if (!msmeData) {
      return res.status(404).json({
        success: false,
        message: 'MSME data not found'
      });
    }

    // Calculate carbon footprint
    const assessment = carbonCalculationService.calculateMSMECarbonFootprint(msmeData, transactions);

    // Create carbon assessment record
    const carbonAssessment = new CarbonAssessment({
      msmeId,
      assessmentType,
      period: dateRange,
      totalCO2Emissions: assessment.totalCO2Emissions,
      breakdown: assessment.breakdown,
      carbonScore: assessment.carbonScore,
      recommendations: assessment.recommendations,
      status: 'completed'
    });

    await carbonAssessment.save();

    // Update MSME carbon score
    msmeData.carbonScore = assessment.carbonScore;
    msmeData.lastCarbonAssessment = new Date();
    await msmeData.save();

    logger.info(`Carbon assessment completed for MSME ${msmeId}`, {
      assessmentId: carbonAssessment._id,
      totalCO2Emissions: assessment.totalCO2Emissions,
      carbonScore: assessment.carbonScore
    });

    res.json({
      success: true,
      message: 'Carbon assessment completed successfully',
      data: {
        assessment: carbonAssessment,
        summary: {
          totalCO2Emissions: assessment.totalCO2Emissions,
          carbonScore: assessment.carbonScore,
          recommendationsCount: assessment.recommendations.length
        }
      }
    });

  } catch (error) {
    logger.error('Carbon assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/carbon/assessments
// @desc    Get carbon assessments for MSME
// @access  Private
router.get('/assessments', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const msmeId = req.user.msmeId;

    const query = { msmeId };
    if (status) query.status = status;

    const assessments = await CarbonAssessment.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('msmeId', 'companyName');

    const total = await CarbonAssessment.countDocuments(query);

    res.json({
      success: true,
      data: {
        assessments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    logger.error('Get carbon assessments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/carbon/assessments/:id
// @desc    Get single carbon assessment
// @access  Private
router.get('/assessments/:id', auth, async (req, res) => {
  try {
    const assessment = await CarbonAssessment.findOne({
      _id: req.params.id,
      msmeId: req.user.msmeId
    }).populate('msmeId', 'companyName');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Carbon assessment not found'
      });
    }

    res.json({
      success: true,
      data: assessment
    });

  } catch (error) {
    logger.error('Get carbon assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/carbon/dashboard
// @desc    Get carbon dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const msmeId = req.user.msmeId;

    // Get latest assessment
    const latestAssessment = await CarbonAssessment.findOne({ msmeId })
      .sort({ createdAt: -1 });

    // Get monthly trends
    const monthlyAssessments = await CarbonAssessment.find({ msmeId })
      .sort({ 'period.startDate': 1 })
      .limit(12);

    // Get transaction data for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentMonthTransactions = await Transaction.find({
      msmeId,
      date: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    // Calculate current month emissions
    const currentMonthEmissions = currentMonthTransactions.reduce(
      (sum, t) => sum + t.carbonFootprint.co2Emissions, 0
    );

    // Get category breakdown for current month
    const categoryBreakdown = {};
    currentMonthTransactions.forEach(transaction => {
      const category = transaction.category;
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          count: 0,
          co2Emissions: 0,
          amount: 0
        };
      }
      categoryBreakdown[category].count++;
      categoryBreakdown[category].co2Emissions += transaction.carbonFootprint.co2Emissions;
      categoryBreakdown[category].amount += transaction.amount;
    });

    // Get top recommendations
    const topRecommendations = latestAssessment ? 
      latestAssessment.recommendations
        .sort((a, b) => b.potentialCO2Reduction - a.potentialCO2Reduction)
        .slice(0, 5) : [];

    const dashboard = {
      currentScore: latestAssessment?.carbonScore || 0,
      currentMonthEmissions: currentMonthEmissions,
      totalAssessments: await CarbonAssessment.countDocuments({ msmeId }),
      monthlyTrend: monthlyAssessments.map(a => ({
        month: a.period.startDate.toISOString().substring(0, 7),
        co2Emissions: a.totalCO2Emissions,
        carbonScore: a.carbonScore
      })),
      categoryBreakdown,
      topRecommendations,
      lastAssessmentDate: latestAssessment?.createdAt,
      nextAssessmentDue: latestAssessment ? 
        new Date(latestAssessment.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000) : null
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    logger.error('Get carbon dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   PUT /api/carbon/recommendations/:id/implement
// @desc    Mark recommendation as implemented
// @access  Private
router.put('/recommendations/:id/implement', auth, async (req, res) => {
  try {
    const { assessmentId, recommendationIndex } = req.body;
    const msmeId = req.user.msmeId;

    const assessment = await CarbonAssessment.findOne({
      _id: assessmentId,
      msmeId
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Carbon assessment not found'
      });
    }

    if (recommendationIndex >= 0 && recommendationIndex < assessment.recommendations.length) {
      assessment.recommendations[recommendationIndex].isImplemented = true;
      await assessment.save();

      logger.info(`Recommendation implemented: ${assessmentId}`, {
        msmeId,
        recommendationIndex
      });

      res.json({
        success: true,
        message: 'Recommendation marked as implemented',
        data: assessment.recommendations[recommendationIndex]
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid recommendation index'
      });
    }

  } catch (error) {
    logger.error('Implement recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;