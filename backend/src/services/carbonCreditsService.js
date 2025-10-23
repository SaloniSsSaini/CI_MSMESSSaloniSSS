const { CarbonCredits, MSMECarbonCredits, CarbonCreditTransaction } = require('../models/CarbonCredits');
const CarbonAssessment = require('../models/CarbonAssessment');
const MSME = require('../models/MSME');
const logger = require('../utils/logger');

class CarbonCreditsService {
  constructor() {
    this.poolId = 'indian_carbon_market_pool';
    this.minimumCreditsThreshold = 100; // Minimum credits to be eligible for allocation
    this.creditPerKgCO2 = 0.1; // 1 credit per 10kg CO2 reduced
  }

  // Initialize the carbon credits pool
  async initializePool() {
    try {
      let pool = await CarbonCredits.findOne({ poolId: this.poolId });
      
      if (!pool) {
        pool = new CarbonCredits({
          poolId: this.poolId,
          currentPricePerCredit: 50, // ₹50 per credit
          verificationStatus: 'pending'
        });
        await pool.save();
        logger.info('Carbon credits pool initialized');
      }
      
      return pool;
    } catch (error) {
      logger.error('Error initializing carbon credits pool:', error);
      throw error;
    }
  }

  // Aggregate carbon savings from all MSMEs and allocate credits
  async aggregateAndAllocateCredits(period = 'monthly') {
    try {
      const pool = await this.initializePool();
      
      // Calculate period date range
      const now = new Date();
      let startDate, endDate;
      
      if (period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (period === 'quarterly') {
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      } else { // yearly
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
      }

      // Get all MSMEs with carbon assessments in the period
      const assessments = await CarbonAssessment.find({
        'period.startDate': { $gte: startDate },
        'period.endDate': { $lte: endDate },
        status: 'completed'
      }).populate('msmeId');

      if (assessments.length === 0) {
        logger.warn('No carbon assessments found for the period');
        return { success: false, message: 'No assessments found for the period' };
      }

      // Calculate total CO2 reduced and group by MSME
      const msmeSavings = {};
      let totalCO2Reduced = 0;

      for (const assessment of assessments) {
        const msmeId = assessment.msmeId._id.toString();
        
        if (!msmeSavings[msmeId]) {
          msmeSavings[msmeId] = {
            msme: assessment.msmeId,
            totalCO2Reduced: 0,
            assessments: []
          };
        }

        // Calculate CO2 reduction (this would need to be compared with baseline)
        // For now, we'll use a simplified calculation
        const co2Reduced = this.calculateCO2Reduction(assessment);
        msmeSavings[msmeId].totalCO2Reduced += co2Reduced;
        msmeSavings[msmeId].assessments.push(assessment);
        totalCO2Reduced += co2Reduced;
      }

      // Calculate total credits to be allocated
      const totalCreditsToAllocate = Math.floor(totalCO2Reduced * this.creditPerKgCO2);
      
      if (totalCreditsToAllocate < this.minimumCreditsThreshold) {
        logger.warn(`Total credits to allocate (${totalCreditsToAllocate}) below threshold (${this.minimumCreditsThreshold})`);
        return { success: false, message: 'Insufficient carbon savings for credit allocation' };
      }

      // Allocate credits to each MSME
      const allocationResults = [];
      
      for (const [msmeId, data] of Object.entries(msmeSavings)) {
        try {
          const creditsToAllocate = Math.floor(data.totalCO2Reduced * this.creditPerKgCO2);
          
          if (creditsToAllocate > 0) {
            const result = await this.allocateCreditsToMSME(
              msmeId,
              creditsToAllocate,
              data.totalCO2Reduced,
              'proportional',
              data.assessments[0]._id
            );
            
            allocationResults.push({
              msmeId,
              companyName: data.msme.companyName,
              creditsAllocated: creditsToAllocate,
              co2Reduced: data.totalCO2Reduced,
              success: true
            });
          }
        } catch (error) {
          logger.error(`Error allocating credits to MSME ${msmeId}:`, error);
          allocationResults.push({
            msmeId,
            companyName: data.msme.companyName,
            creditsAllocated: 0,
            co2Reduced: data.totalCO2Reduced,
            success: false,
            error: error.message
          });
        }
      }

      // Update pool statistics
      pool.totalCreditsAvailable += totalCreditsToAllocate;
      pool.totalCreditsIssued += totalCreditsToAllocate;
      pool.totalCO2Reduced += totalCO2Reduced;
      pool.totalMSMEParticipants = Object.keys(msmeSavings).length;
      pool.lastAggregationDate = new Date();
      
      await pool.save();

      logger.info(`Carbon credits aggregated and allocated`, {
        period,
        totalCO2Reduced,
        totalCreditsAllocated: totalCreditsToAllocate,
        msmeCount: Object.keys(msmeSavings).length,
        successfulAllocations: allocationResults.filter(r => r.success).length
      });

      return {
        success: true,
        data: {
          period,
          totalCO2Reduced,
          totalCreditsAllocated: totalCreditsToAllocate,
          msmeCount: Object.keys(msmeSavings).length,
          allocations: allocationResults,
          poolStats: {
            totalCreditsAvailable: pool.totalCreditsAvailable,
            totalCreditsIssued: pool.totalCreditsIssued,
            totalCO2Reduced: pool.totalCO2Reduced,
            totalMSMEParticipants: pool.totalMSMEParticipants
          }
        }
      };

    } catch (error) {
      logger.error('Error in aggregateAndAllocateCredits:', error);
      throw error;
    }
  }

  // Allocate credits to a specific MSME
  async allocateCreditsToMSME(msmeId, creditsAmount, co2Reduced, method, assessmentId) {
    try {
      let msmeCredits = await MSMECarbonCredits.findOne({ msmeId });
      
      if (!msmeCredits) {
        msmeCredits = new MSMECarbonCredits({
          msmeId,
          poolId: this.poolId
        });
      }

      await msmeCredits.allocateCredits(creditsAmount, co2Reduced, method, assessmentId);
      await msmeCredits.updatePerformanceMetrics();

      logger.info(`Credits allocated to MSME ${msmeId}`, {
        creditsAmount,
        co2Reduced,
        method
      });

      return msmeCredits;
    } catch (error) {
      logger.error(`Error allocating credits to MSME ${msmeId}:`, error);
      throw error;
    }
  }

  // Get MSME carbon credits
  async getMSMECredits(msmeId) {
    try {
      let msmeCredits = await MSMECarbonCredits.findOne({ msmeId })
        .populate('msmeId', 'companyName companyType industry');
      
      if (!msmeCredits) {
        // Create new record if doesn't exist
        msmeCredits = new MSMECarbonCredits({
          msmeId,
          poolId: this.poolId
        });
        await msmeCredits.save();
      }

      return msmeCredits;
    } catch (error) {
      logger.error(`Error getting MSME credits for ${msmeId}:`, error);
      throw error;
    }
  }

  // Use credits for a specific purpose
  async useCredits(msmeId, amount, purpose, referenceId) {
    try {
      const msmeCredits = await this.getMSMECredits(msmeId);
      
      if (msmeCredits.availableCredits < amount) {
        throw new Error('Insufficient credits available');
      }

      await msmeCredits.useCredits(amount, purpose, referenceId);

      logger.info(`Credits used by MSME ${msmeId}`, {
        amount,
        purpose,
        remainingCredits: msmeCredits.availableCredits
      });

      return msmeCredits;
    } catch (error) {
      logger.error(`Error using credits for MSME ${msmeId}:`, error);
      throw error;
    }
  }

  // Retire credits (permanent removal from circulation)
  async retireCredits(msmeId, amount, reason) {
    try {
      const msmeCredits = await this.getMSMECredits(msmeId);
      
      if (msmeCredits.availableCredits < amount) {
        throw new Error('Insufficient credits available');
      }

      await msmeCredits.retireCredits(amount, reason);

      // Update pool statistics
      const pool = await CarbonCredits.findOne({ poolId: this.poolId });
      if (pool) {
        pool.totalCreditsRetired += amount;
        await pool.save();
      }

      logger.info(`Credits retired by MSME ${msmeId}`, {
        amount,
        reason,
        remainingCredits: msmeCredits.availableCredits
      });

      return msmeCredits;
    } catch (error) {
      logger.error(`Error retiring credits for MSME ${msmeId}:`, error);
      throw error;
    }
  }

  // Get carbon credits market data
  async getMarketData() {
    try {
      const pool = await CarbonCredits.findOne({ poolId: this.poolId });
      
      if (!pool) {
        await this.initializePool();
        return await this.getMarketData();
      }

      // Get recent transactions
      const recentTransactions = await CarbonCreditTransaction.find({
        poolId: this.poolId,
        status: 'completed'
      })
      .populate('fromMSME', 'companyName')
      .populate('toMSME', 'companyName')
      .sort({ createdAt: -1 })
      .limit(10);

      // Get MSME participation stats
      const msmeStats = await MSMECarbonCredits.aggregate([
        {
          $group: {
            _id: null,
            totalMSMEs: { $sum: 1 },
            totalAllocatedCredits: { $sum: '$allocatedCredits' },
            totalAvailableCredits: { $sum: '$availableCredits' },
            totalUsedCredits: { $sum: '$usedCredits' },
            totalRetiredCredits: { $sum: '$retiredCredits' },
            totalCO2Reduced: { $sum: '$totalCO2Reduced' }
          }
        }
      ]);

      return {
        pool: pool,
        recentTransactions,
        msmeStats: msmeStats[0] || {},
        marketMetrics: {
          averagePrice: pool.currentPricePerCredit,
          totalVolume: recentTransactions.reduce((sum, t) => sum + t.creditsAmount, 0),
          activeMSMEs: msmeStats[0]?.totalMSMEs || 0
        }
      };
    } catch (error) {
      logger.error('Error getting market data:', error);
      throw error;
    }
  }

  // Calculate CO2 reduction from assessment (simplified)
  calculateCO2Reduction(assessment) {
    // This is a simplified calculation
    // In reality, you would compare with baseline emissions
    // For now, we'll use a percentage of total emissions as "reduction"
    const reductionPercentage = Math.min(assessment.carbonScore / 100, 0.3); // Max 30% reduction
    return assessment.totalCO2Emissions * reductionPercentage;
  }

  // Get MSME leaderboard based on carbon credits
  async getMSMELeaderboard(limit = 10, period = 'all') {
    try {
      let matchStage = {};
      
      if (period !== 'all') {
        const days = period === 'monthly' ? 30 : period === 'quarterly' ? 90 : 365;
        const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        matchStage = {
          'allocationHistory.date': { $gte: cutoffDate }
        };
      }

      const leaderboard = await MSMECarbonCredits.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'msmes',
            localField: 'msmeId',
            foreignField: '_id',
            as: 'msme'
          }
        },
        { $unwind: '$msme' },
        {
          $project: {
            msmeId: 1,
            companyName: '$msme.companyName',
            companyType: '$msme.companyType',
            industry: '$msme.industry',
            allocatedCredits: 1,
            availableCredits: 1,
            usedCredits: 1,
            totalCO2Reduced: 1,
            performanceMetrics: 1,
            recentAllocations: {
              $slice: ['$allocationHistory', -3] // Last 3 allocations
            }
          }
        },
        { $sort: { 'performanceMetrics.participationScore': -1 } },
        { $limit: parseInt(limit) }
      ]);

      return leaderboard;
    } catch (error) {
      logger.error('Error getting MSME leaderboard:', error);
      throw error;
    }
  }

  // Create carbon credit transaction
  async createTransaction(transactionData) {
    try {
      const transaction = new CarbonCreditTransaction({
        ...transactionData,
        transactionId: `CCT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        poolId: this.poolId
      });

      await transaction.save();

      logger.info(`Carbon credit transaction created: ${transaction.transactionId}`);
      return transaction;
    } catch (error) {
      logger.error('Error creating carbon credit transaction:', error);
      throw error;
    }
  }

  // Verify carbon credits pool
  async verifyPool(verifiedBy, notes) {
    try {
      const pool = await CarbonCredits.findOne({ poolId: this.poolId });
      
      if (!pool) {
        throw new Error('Carbon credits pool not found');
      }

      pool.verificationStatus = 'verified';
      pool.verifiedBy = verifiedBy;
      pool.verifiedAt = new Date();
      pool.verificationNotes = notes;
      pool.indianCarbonMarketCompliance.isCompliant = true;
      pool.indianCarbonMarketCompliance.complianceDate = new Date();

      await pool.save();

      logger.info(`Carbon credits pool verified by ${verifiedBy}`);
      return pool;
    } catch (error) {
      logger.error('Error verifying carbon credits pool:', error);
      throw error;
    }
  }
}

module.exports = new CarbonCreditsService();