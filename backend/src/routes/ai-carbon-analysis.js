const express = require('express');
const router = express.Router();
const AIDataExtractionService = require('../services/aiDataExtractionService');
const AdvancedCarbonCalculationService = require('../services/advancedCarbonCalculationService');
const IntelligentPatternRecognitionService = require('../services/intelligentPatternRecognitionService');
const AICarbonScoringService = require('../services/aiCarbonScoringService');
const realTimeMonitoring = require('../services/realTimeMonitoringInstance');
const MSME = require('../models/MSME');
const CarbonAssessment = require('../models/CarbonAssessment');
const logger = require('../utils/logger');

// Initialize services
const aiDataExtraction = new AIDataExtractionService();
const advancedCarbonCalculation = new AdvancedCarbonCalculationService();
const patternRecognition = new IntelligentPatternRecognitionService();
const carbonScoring = new AICarbonScoringService();

// Middleware for authentication (if needed)
const authenticateToken = (req, res, next) => {
  // Add authentication logic here
  next();
};

// AI Data Extraction Endpoints

// Extract carbon data from SMS
router.post('/extract/sms', authenticateToken, async (req, res) => {
  try {
    const { smsData } = req.body;
    
    if (!smsData || !Array.isArray(smsData)) {
      return res.status(400).json({ error: 'SMS data array is required' });
    }

    const results = await aiDataExtraction.processSMSData(smsData);
    
    res.json({
      success: true,
      data: results,
      message: 'SMS data processed successfully'
    });

  } catch (error) {
    logger.error('Error processing SMS data:', error);
    res.status(500).json({ error: 'Failed to process SMS data' });
  }
});

// Extract carbon data from emails
router.post('/extract/email', authenticateToken, async (req, res) => {
  try {
    const { emailData } = req.body;
    
    if (!emailData || !Array.isArray(emailData)) {
      return res.status(400).json({ error: 'Email data array is required' });
    }

    const results = await aiDataExtraction.processEmailData(emailData);
    
    res.json({
      success: true,
      data: results,
      message: 'Email data processed successfully'
    });

  } catch (error) {
    logger.error('Error processing email data:', error);
    res.status(500).json({ error: 'Failed to process email data' });
  }
});

// Extract carbon data from any text
router.post('/extract/text', authenticateToken, async (req, res) => {
  try {
    const { text, source = 'unknown' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const result = await aiDataExtraction.extractCarbonDataFromText(text, source);
    
    res.json({
      success: true,
      data: result,
      message: 'Text processed successfully'
    });

  } catch (error) {
    logger.error('Error processing text:', error);
    res.status(500).json({ error: 'Failed to process text' });
  }
});

// Advanced Carbon Calculation Endpoints

// Calculate advanced carbon footprint
router.post('/calculate/advanced', authenticateToken, async (req, res) => {
  try {
    const { extractedData, msmeId } = req.body;
    
    if (!extractedData || !msmeId) {
      return res.status(400).json({ error: 'Extracted data and MSME ID are required' });
    }

    // Get MSME profile
    const msmeProfile = await MSME.findById(msmeId);
    if (!msmeProfile) {
      return res.status(404).json({ error: 'MSME not found' });
    }

    const calculation = await advancedCarbonCalculation.calculateAdvancedCarbonFootprint(
      extractedData, 
      msmeProfile
    );

    // Save calculation to database
    const carbonAssessment = new CarbonAssessment({
      msmeId,
      assessmentType: 'automatic',
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date()
      },
      totalCO2Emissions: calculation.totalCO2Emissions,
      breakdown: calculation.breakdown,
      scopeBreakdown: calculation.scopeBreakdown,
      industryAdjustment: calculation.industryAdjustment,
      carbonScore: calculation.carbonScore,
      sustainabilityRating: calculation.sustainabilityRating,
      mlInsights: calculation.mlInsights,
      recommendations: calculation.recommendations
    });

    await carbonAssessment.save();

    res.json({
      success: true,
      data: calculation,
      message: 'Advanced carbon footprint calculated successfully'
    });

  } catch (error) {
    logger.error('Error calculating advanced carbon footprint:', error);
    res.status(500).json({ error: 'Failed to calculate carbon footprint' });
  }
});

// Predict future emissions
router.post('/predict/emissions', authenticateToken, async (req, res) => {
  try {
    const { msmeId, timeHorizon = 12 } = req.body;
    
    if (!msmeId) {
      return res.status(400).json({ error: 'MSME ID is required' });
    }

    // Get historical data
    const historicalData = await CarbonAssessment.find({ msmeId })
      .sort({ 'period.endDate': -1 })
      .limit(12)
      .select('totalCO2Emissions period.endDate');

    const predictions = await advancedCarbonCalculation.predictFutureEmissions(
      historicalData, 
      timeHorizon
    );

    res.json({
      success: true,
      data: predictions,
      message: 'Future emissions predicted successfully'
    });

  } catch (error) {
    logger.error('Error predicting future emissions:', error);
    res.status(500).json({ error: 'Failed to predict future emissions' });
  }
});

// Pattern Recognition Endpoints

// Analyze business activities from text
router.post('/analyze/activities', authenticateToken, async (req, res) => {
  try {
    const { text, source = 'unknown' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    const analysis = await patternRecognition.analyzeBusinessActivity(text, source);
    
    res.json({
      success: true,
      data: analysis,
      message: 'Business activities analyzed successfully'
    });

  } catch (error) {
    logger.error('Error analyzing business activities:', error);
    res.status(500).json({ error: 'Failed to analyze business activities' });
  }
});

// Analyze multiple text patterns
router.post('/analyze/patterns', authenticateToken, async (req, res) => {
  try {
    const { texts } = req.body;
    
    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: 'Texts array is required' });
    }

    const results = await patternRecognition.analyzeTextPatterns(texts);
    
    res.json({
      success: true,
      data: results,
      message: 'Text patterns analyzed successfully'
    });

  } catch (error) {
    logger.error('Error analyzing text patterns:', error);
    res.status(500).json({ error: 'Failed to analyze text patterns' });
  }
});

// Detect anomalies
router.post('/detect/anomalies', authenticateToken, async (req, res) => {
  try {
    const { msmeId, currentData } = req.body;
    
    if (!msmeId || !currentData) {
      return res.status(400).json({ error: 'MSME ID and current data are required' });
    }

    // Get historical data
    const historicalData = await CarbonAssessment.find({ msmeId })
      .sort({ 'period.endDate': -1 })
      .limit(10)
      .select('totalCO2Emissions breakdown period.endDate');

    const anomalies = await patternRecognition.detectAnomalies(historicalData, currentData);
    
    res.json({
      success: true,
      data: anomalies,
      message: 'Anomalies detected successfully'
    });

  } catch (error) {
    logger.error('Error detecting anomalies:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

// AI Carbon Scoring Endpoints

// Calculate AI carbon score
router.post('/score/calculate', authenticateToken, async (req, res) => {
  try {
    const { carbonData, msmeId } = req.body;
    
    if (!carbonData || !msmeId) {
      return res.status(400).json({ error: 'Carbon data and MSME ID are required' });
    }

    // Get MSME profile
    const msmeProfile = await MSME.findById(msmeId);
    if (!msmeProfile) {
      return res.status(404).json({ error: 'MSME not found' });
    }

    // Get historical data for trend analysis
    const historicalData = await CarbonAssessment.find({ msmeId })
      .sort({ 'period.endDate': -1 })
      .limit(6)
      .select('totalCO2Emissions breakdown carbonScore sustainabilityRating period.endDate');

    const score = await carbonScoring.calculateAICarbonScore(
      carbonData, 
      msmeProfile, 
      historicalData
    );

    res.json({
      success: true,
      data: score,
      message: 'AI carbon score calculated successfully'
    });

  } catch (error) {
    logger.error('Error calculating AI carbon score:', error);
    res.status(500).json({ error: 'Failed to calculate AI carbon score' });
  }
});

// Generate sustainability report
router.post('/report/sustainability', authenticateToken, async (req, res) => {
  try {
    const { msmeId, carbonData, predictions } = req.body;
    
    if (!msmeId || !carbonData) {
      return res.status(400).json({ error: 'MSME ID and carbon data are required' });
    }

    // Get MSME profile
    const msmeProfile = await MSME.findById(msmeId);
    if (!msmeProfile) {
      return res.status(404).json({ error: 'MSME not found' });
    }

    const report = await carbonScoring.generateSustainabilityReport(
      carbonData, 
      msmeProfile
    );

    res.json({
      success: true,
      data: report,
      message: 'Sustainability report generated successfully'
    });

  } catch (error) {
    logger.error('Error generating sustainability report:', error);
    res.status(500).json({ error: 'Failed to generate sustainability report' });
  }
});

// Real-time Monitoring Endpoints

// Start monitoring
router.post('/monitoring/start', authenticateToken, async (req, res) => {
  try {
    const { msmeId, options = {} } = req.body;
    
    if (!msmeId) {
      return res.status(400).json({ error: 'MSME ID is required' });
    }

    const sessionId = await realTimeMonitoring.startMonitoring(msmeId, options);
    
    res.json({
      success: true,
      data: { sessionId },
      message: 'Monitoring started successfully'
    });

  } catch (error) {
    logger.error('Error starting monitoring:', error);
    res.status(500).json({ error: 'Failed to start monitoring' });
  }
});

// Stop monitoring
router.post('/monitoring/stop', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    await realTimeMonitoring.stopMonitoring(sessionId);
    
    res.json({
      success: true,
      message: 'Monitoring stopped successfully'
    });

  } catch (error) {
    logger.error('Error stopping monitoring:', error);
    res.status(500).json({ error: 'Failed to stop monitoring' });
  }
});

// Update carbon data for monitoring
router.post('/monitoring/update', authenticateToken, async (req, res) => {
  try {
    const { msmeId, carbonData } = req.body;
    
    if (!msmeId || !carbonData) {
      return res.status(400).json({ error: 'MSME ID and carbon data are required' });
    }

    await realTimeMonitoring.updateCarbonData(msmeId, carbonData);
    
    res.json({
      success: true,
      message: 'Carbon data updated successfully'
    });

  } catch (error) {
    logger.error('Error updating carbon data:', error);
    res.status(500).json({ error: 'Failed to update carbon data' });
  }
});

// Get monitoring status
router.get('/monitoring/status/:msmeId', authenticateToken, async (req, res) => {
  try {
    const { msmeId } = req.params;
    
    const status = realTimeMonitoring.getMonitoringStatus(msmeId);
    
    res.json({
      success: true,
      data: status,
      message: 'Monitoring status retrieved successfully'
    });

  } catch (error) {
    logger.error('Error getting monitoring status:', error);
    res.status(500).json({ error: 'Failed to get monitoring status' });
  }
});

// Get alert history
router.get('/monitoring/alerts/:msmeId', authenticateToken, async (req, res) => {
  try {
    const { msmeId } = req.params;
    const { limit = 50 } = req.query;
    
    const alerts = realTimeMonitoring.getAlertHistory(msmeId, parseInt(limit));
    
    res.json({
      success: true,
      data: alerts,
      message: 'Alert history retrieved successfully'
    });

  } catch (error) {
    logger.error('Error getting alert history:', error);
    res.status(500).json({ error: 'Failed to get alert history' });
  }
});

// Get trend analysis
router.get('/monitoring/trends/:msmeId', authenticateToken, async (req, res) => {
  try {
    const { msmeId } = req.params;
    
    const trends = realTimeMonitoring.getTrendAnalysis(msmeId);
    
    res.json({
      success: true,
      data: trends,
      message: 'Trend analysis retrieved successfully'
    });

  } catch (error) {
    logger.error('Error getting trend analysis:', error);
    res.status(500).json({ error: 'Failed to get trend analysis' });
  }
});

// Get predictions
router.get('/monitoring/predictions/:msmeId', authenticateToken, async (req, res) => {
  try {
    const { msmeId } = req.params;
    
    const predictions = realTimeMonitoring.getPredictions(msmeId);
    
    res.json({
      success: true,
      data: predictions,
      message: 'Predictions retrieved successfully'
    });

  } catch (error) {
    logger.error('Error getting predictions:', error);
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

// Update alert thresholds
router.put('/monitoring/thresholds', authenticateToken, async (req, res) => {
  try {
    const { sessionId, thresholds } = req.body;
    
    if (!sessionId || !thresholds) {
      return res.status(400).json({ error: 'Session ID and thresholds are required' });
    }

    realTimeMonitoring.updateAlertThresholds(sessionId, thresholds);
    
    res.json({
      success: true,
      message: 'Alert thresholds updated successfully'
    });

  } catch (error) {
    logger.error('Error updating alert thresholds:', error);
    res.status(500).json({ error: 'Failed to update alert thresholds' });
  }
});

// Get system status
router.get('/system/status', authenticateToken, async (req, res) => {
  try {
    const status = realTimeMonitoring.getSystemStatus();
    
    res.json({
      success: true,
      data: status,
      message: 'System status retrieved successfully'
    });

  } catch (error) {
    logger.error('Error getting system status:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// Comprehensive Analysis Endpoint

// Complete AI analysis pipeline
router.post('/analyze/complete', authenticateToken, async (req, res) => {
  try {
    const { msmeId, smsData = [], emailData = [], textData = [] } = req.body;
    
    if (!msmeId) {
      return res.status(400).json({ error: 'MSME ID is required' });
    }

    // Get MSME profile
    const msmeProfile = await MSME.findById(msmeId);
    if (!msmeProfile) {
      return res.status(404).json({ error: 'MSME not found' });
    }

    const results = {
      dataExtraction: {},
      carbonCalculation: {},
      patternAnalysis: {},
      carbonScoring: {},
      recommendations: [],
      insights: []
    };

    // Step 1: Extract data from all sources
    if (smsData.length > 0) {
      results.dataExtraction.sms = await aiDataExtraction.processSMSData(smsData);
    }
    
    if (emailData.length > 0) {
      results.dataExtraction.email = await aiDataExtraction.processEmailData(emailData);
    }
    
    if (textData.length > 0) {
      results.dataExtraction.text = await Promise.all(
        textData.map(text => aiDataExtraction.extractCarbonDataFromText(text.content, text.source))
      );
    }

    // Step 2: Aggregate extracted data
    const aggregatedData = this.aggregateExtractedData(results.dataExtraction);

    // Step 3: Calculate advanced carbon footprint
    results.carbonCalculation = await advancedCarbonCalculation.calculateAdvancedCarbonFootprint(
      aggregatedData, 
      msmeProfile
    );

    // Step 4: Analyze patterns
    const allTexts = [
      ...smsData.map(sms => ({ content: sms.message, source: 'sms' })),
      ...emailData.map(email => ({ content: email.content, source: 'email' })),
      ...textData
    ];

    if (allTexts.length > 0) {
      results.patternAnalysis = await patternRecognition.analyzeTextPatterns(allTexts);
    }

    // Step 5: Calculate AI carbon score
    results.carbonScoring = await carbonScoring.calculateAICarbonScore(
      results.carbonCalculation, 
      msmeProfile
    );

    // Step 6: Generate comprehensive recommendations
    results.recommendations = [
      ...results.carbonCalculation.recommendations,
      ...results.carbonScoring.recommendations
    ];

    // Step 7: Generate insights
    results.insights = [
      ...results.carbonCalculation.mlInsights,
      ...results.carbonScoring.insights
    ];

    // Save results to database
    const carbonAssessment = new CarbonAssessment({
      msmeId,
      assessmentType: 'ai_comprehensive',
      period: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      },
      totalCO2Emissions: results.carbonCalculation.totalCO2Emissions,
      breakdown: results.carbonCalculation.breakdown,
      scopeBreakdown: results.carbonCalculation.scopeBreakdown,
      carbonScore: results.carbonScoring.overall,
      sustainabilityRating: results.carbonScoring.categories.sustainability.rating,
      mlInsights: results.insights,
      recommendations: results.recommendations,
      aiAnalysis: results
    });

    await carbonAssessment.save();

    res.json({
      success: true,
      data: results,
      message: 'Complete AI analysis performed successfully'
    });

  } catch (error) {
    logger.error('Error performing complete AI analysis:', error);
    res.status(500).json({ error: 'Failed to perform complete AI analysis' });
  }
});

// Helper function to aggregate extracted data
function aggregateExtractedData(dataExtraction) {
  const aggregated = {
    energy: { electricity: { consumption: 0 }, fuel: { consumption: 0 }, renewable: { percentage: 0 } },
    materials: { rawMaterials: { quantity: 0 }, packaging: { quantity: 0 } },
    transportation: { distance: 0, fuelConsumption: 0 },
    waste: { solid: { quantity: 0 }, hazardous: { quantity: 0 } },
    water: { consumption: 0 }
  };

  // Aggregate data from all sources
  Object.values(dataExtraction).forEach(sourceData => {
    if (Array.isArray(sourceData)) {
      sourceData.forEach(item => {
        if (item.analysis && item.analysis.extractedData) {
          const data = item.analysis.extractedData;
          
          // Aggregate energy data
          if (data.energy) {
            aggregated.energy.electricity.consumption += data.energy.electricity?.consumption || 0;
            aggregated.energy.fuel.consumption += data.energy.fuel?.consumption || 0;
            aggregated.energy.renewable.percentage = Math.max(
              aggregated.energy.renewable.percentage, 
              data.energy.renewable?.percentage || 0
            );
          }
          
          // Aggregate material data
          if (data.materials) {
            aggregated.materials.rawMaterials.quantity += data.materials.rawMaterials?.quantity || 0;
            aggregated.materials.packaging.quantity += data.materials.packaging?.quantity || 0;
          }
          
          // Aggregate transportation data
          if (data.transportation) {
            aggregated.transportation.distance += data.transportation.distance || 0;
            aggregated.transportation.fuelConsumption += data.transportation.fuelConsumption || 0;
          }
          
          // Aggregate waste data
          if (data.waste) {
            aggregated.waste.solid.quantity += data.waste.solid?.quantity || 0;
            aggregated.waste.hazardous.quantity += data.waste.hazardous?.quantity || 0;
          }
          
          // Aggregate water data
          if (data.water) {
            aggregated.water.consumption += data.water.consumption || 0;
          }
        }
      });
    }
  });

  return aggregated;
}

module.exports = router;
