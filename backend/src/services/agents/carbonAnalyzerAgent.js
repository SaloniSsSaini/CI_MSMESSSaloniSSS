const carbonCalculationService = require('../carbonCalculationService');
const logger = require('../../utils/logger');

class CarbonAnalyzerAgent {
  constructor() {
    this.name = 'Carbon Analyzer Agent';
    this.type = 'carbon_analyzer';
    this.capabilities = [
      'transaction_analysis',
      'emission_calculation',
      'carbon_scoring',
      'sustainability_assessment',
      'esg_scope_analysis'
    ];
  }

  async analyzeTransactions(transactions, msmeData) {
    try {
      const analysis = {
        totalEmissions: 0,
        categoryBreakdown: {},
        esgScopeBreakdown: {
          scope1: 0,
          scope2: 0,
          scope3: 0
        },
        carbonScore: 0,
        insights: [],
        recommendations: [],
        anomalies: []
      };

      // Process each transaction
      for (const transaction of transactions) {
        const carbonData = carbonCalculationService.calculateTransactionCarbonFootprint(transaction);
        
        // Update totals
        analysis.totalEmissions += carbonData.co2Emissions;
        
        // Category breakdown
        if (!analysis.categoryBreakdown[transaction.category]) {
          analysis.categoryBreakdown[transaction.category] = {
            count: 0,
            emissions: 0,
            amount: 0
          };
        }
        analysis.categoryBreakdown[transaction.category].count += 1;
        analysis.categoryBreakdown[transaction.category].emissions += carbonData.co2Emissions;
        analysis.categoryBreakdown[transaction.category].amount += transaction.amount;

        // ESG scope classification
        this.classifyESGScope(transaction, carbonData.co2Emissions, analysis.esgScopeBreakdown);
      }

      // Calculate carbon score
      analysis.carbonScore = this.calculateCarbonScore(analysis, msmeData);

      // Generate insights
      analysis.insights = this.generateInsights(analysis, transactions);

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis, msmeData);

      // Detect anomalies
      analysis.anomalies = this.detectAnomalies(transactions, analysis);

      return analysis;
    } catch (error) {
      logger.error('Carbon analysis failed:', error);
      throw error;
    }
  }

  async calculateCarbonFootprint(msmeData, transactions) {
    try {
      return carbonCalculationService.calculateMSMECarbonFootprint(msmeData, transactions);
    } catch (error) {
      logger.error('Carbon footprint calculation failed:', error);
      throw error;
    }
  }

  async assessSustainability(msmeData, carbonData) {
    try {
      const assessment = {
        overallScore: 0,
        categoryScores: {},
        strengths: [],
        weaknesses: [],
        opportunities: [],
        threats: []
      };

      // Energy efficiency assessment
      assessment.categoryScores.energy = this.assessEnergyEfficiency(carbonData);
      
      // Waste management assessment
      assessment.categoryScores.waste = this.assessWasteManagement(carbonData);
      
      // Water usage assessment
      assessment.categoryScores.water = this.assessWaterUsage(carbonData);
      
      // Transportation assessment
      assessment.categoryScores.transportation = this.assessTransportation(carbonData);
      
      // Material sourcing assessment
      assessment.categoryScores.materials = this.assessMaterialSourcing(carbonData);

      // Calculate overall score
      assessment.overallScore = this.calculateOverallScore(assessment.categoryScores);

      // Generate SWOT analysis
      this.generateSWOTAnalysis(assessment, msmeData, carbonData);

      return assessment;
    } catch (error) {
      logger.error('Sustainability assessment failed:', error);
      throw error;
    }
  }

  classifyESGScope(transaction, emissions, scopeBreakdown) {
    const { category, subcategory, description } = transaction;

    // Scope 1: Direct emissions
    if (this.isScope1Emission(transaction)) {
      scopeBreakdown.scope1 += emissions;
    }
    // Scope 2: Indirect emissions from purchased energy
    else if (this.isScope2Emission(transaction)) {
      scopeBreakdown.scope2 += emissions;
    }
    // Scope 3: All other indirect emissions
    else {
      scopeBreakdown.scope3 += emissions;
    }
  }

  isScope1Emission(transaction) {
    const { category, subcategory, description } = transaction;
    
    // Direct fuel combustion
    if (category === 'energy' && subcategory !== 'renewable' && subcategory !== 'grid') {
      return true;
    }
    
    // Company-owned vehicles
    if (category === 'transportation' && description && 
        (description.toLowerCase().includes('company') || 
         description.toLowerCase().includes('owned') ||
         description.toLowerCase().includes('fleet'))) {
      return true;
    }
    
    // Direct manufacturing processes
    if (category === 'equipment' || category === 'maintenance') {
      return true;
    }
    
    return false;
  }

  isScope2Emission(transaction) {
    const { category, subcategory } = transaction;
    
    // Purchased electricity, heating, cooling, steam
    if (category === 'energy' && (subcategory === 'grid' || subcategory === 'renewable')) {
      return true;
    }
    
    return false;
  }

  calculateCarbonScore(analysis, msmeData) {
    let score = 100; // Start with perfect score
    
    // Penalize high emissions
    const emissionPenalty = Math.min(50, analysis.totalEmissions / 100);
    score -= emissionPenalty;
    
    // Bonus for environmental controls
    if (msmeData.environmentalCompliance?.hasEnvironmentalClearance) score += 5;
    if (msmeData.environmentalCompliance?.hasPollutionControlBoard) score += 5;
    if (msmeData.environmentalCompliance?.hasWasteManagement) score += 5;
    
    // Bonus for renewable energy usage
    const energyTotal = analysis.categoryBreakdown.energy?.emissions || 0;
    if (energyTotal > 0) {
      const renewableRatio = this.calculateRenewableRatio(analysis);
      if (renewableRatio > 0.5) score += 10;
    }
    
    // Penalty for high transportation emissions
    const transportEmissions = analysis.categoryBreakdown.transportation?.emissions || 0;
    if (transportEmissions > 100) score -= 10;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  calculateRenewableRatio(analysis) {
    // This would need to be calculated based on actual renewable vs non-renewable energy usage
    // For now, return a placeholder
    return 0.3;
  }

  generateInsights(analysis, transactions) {
    const insights = [];
    
    // High emission categories
    const sortedCategories = Object.entries(analysis.categoryBreakdown)
      .sort(([,a], [,b]) => b.emissions - a.emissions);
    
    if (sortedCategories.length > 0) {
      const [topCategory, topData] = sortedCategories[0];
      insights.push({
        type: 'emission_peak',
        category: topCategory,
        message: `Highest emissions detected in ${topCategory} category`,
        value: topData.emissions,
        percentage: (topData.emissions / analysis.totalEmissions * 100).toFixed(1)
      });
    }

    // ESG scope distribution
    const totalScope = analysis.esgScopeBreakdown.scope1 + 
                      analysis.esgScopeBreakdown.scope2 + 
                      analysis.esgScopeBreakdown.scope3;
    
    if (totalScope > 0) {
      insights.push({
        type: 'esg_distribution',
        message: 'ESG Scope distribution analysis',
        scope1: (analysis.esgScopeBreakdown.scope1 / totalScope * 100).toFixed(1),
        scope2: (analysis.esgScopeBreakdown.scope2 / totalScope * 100).toFixed(1),
        scope3: (analysis.esgScopeBreakdown.scope3 / totalScope * 100).toFixed(1)
      });
    }

    // Transaction frequency analysis
    const avgEmissionsPerTransaction = analysis.totalEmissions / transactions.length;
    insights.push({
      type: 'transaction_efficiency',
      message: `Average emissions per transaction: ${avgEmissionsPerTransaction.toFixed(2)} kg CO2`,
      value: avgEmissionsPerTransaction
    });

    return insights;
  }

  generateRecommendations(analysis, msmeData) {
    const recommendations = [];
    
    // Energy recommendations
    const energyEmissions = analysis.categoryBreakdown.energy?.emissions || 0;
    if (energyEmissions > 500) {
      recommendations.push({
        category: 'energy',
        title: 'Switch to Renewable Energy',
        description: 'Consider installing solar panels or purchasing renewable energy credits',
        priority: 'high',
        potentialCO2Reduction: energyEmissions * 0.3,
        implementationCost: 50000,
        paybackPeriod: 24,
        confidence: 0.85
      });
    }
    
    // Waste management recommendations
    const wasteEmissions = analysis.categoryBreakdown.waste_management?.emissions || 0;
    if (wasteEmissions > 100) {
      recommendations.push({
        category: 'waste',
        title: 'Improve Waste Recycling',
        description: 'Implement comprehensive waste segregation and recycling program',
        priority: 'medium',
        potentialCO2Reduction: wasteEmissions * 0.4,
        implementationCost: 10000,
        paybackPeriod: 12,
        confidence: 0.75
      });
    }
    
    // Transportation recommendations
    const transportEmissions = analysis.categoryBreakdown.transportation?.emissions || 0;
    if (transportEmissions > 50) {
      recommendations.push({
        category: 'transportation',
        title: 'Optimize Transportation',
        description: 'Use fuel-efficient vehicles and optimize delivery routes',
        priority: 'medium',
        potentialCO2Reduction: transportEmissions * 0.2,
        implementationCost: 20000,
        paybackPeriod: 18,
        confidence: 0.70
      });
    }

    return recommendations;
  }

  detectAnomalies(transactions, analysis) {
    const anomalies = [];
    
    // High emission transactions
    const avgEmission = analysis.totalEmissions / transactions.length;
    const threshold = avgEmission * 3; // 3x average
    
    transactions.forEach(transaction => {
      if (transaction.carbonFootprint?.co2Emissions > threshold) {
        anomalies.push({
          type: 'high_emission',
          transactionId: transaction._id,
          message: 'Unusually high emission transaction detected',
          value: transaction.carbonFootprint.co2Emissions,
          threshold: threshold,
          severity: 'high'
        });
      }
    });

    // Unusual spending patterns
    const avgAmount = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;
    const spendingThreshold = avgAmount * 5; // 5x average
    
    transactions.forEach(transaction => {
      if (transaction.amount > spendingThreshold) {
        anomalies.push({
          type: 'high_spending',
          transactionId: transaction._id,
          message: 'Unusually high spending transaction detected',
          value: transaction.amount,
          threshold: spendingThreshold,
          severity: 'medium'
        });
      }
    });

    return anomalies;
  }

  assessEnergyEfficiency(carbonData) {
    // Placeholder implementation
    return 75; // Score out of 100
  }

  assessWasteManagement(carbonData) {
    // Placeholder implementation
    return 80;
  }

  assessWaterUsage(carbonData) {
    // Placeholder implementation
    return 70;
  }

  assessTransportation(carbonData) {
    // Placeholder implementation
    return 65;
  }

  assessMaterialSourcing(carbonData) {
    // Placeholder implementation
    return 85;
  }

  calculateOverallScore(categoryScores) {
    const scores = Object.values(categoryScores);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  generateSWOTAnalysis(assessment, msmeData, carbonData) {
    // Strengths
    if (assessment.categoryScores.energy > 80) {
      assessment.strengths.push('Strong energy efficiency practices');
    }
    if (assessment.categoryScores.waste > 80) {
      assessment.strengths.push('Effective waste management system');
    }

    // Weaknesses
    if (assessment.categoryScores.transportation < 60) {
      assessment.weaknesses.push('Transportation efficiency needs improvement');
    }
    if (assessment.categoryScores.water < 60) {
      assessment.weaknesses.push('Water usage optimization required');
    }

    // Opportunities
    assessment.opportunities.push('Renewable energy adoption');
    assessment.opportunities.push('Supply chain optimization');
    assessment.opportunities.push('Process automation');

    // Threats
    assessment.threats.push('Regulatory compliance requirements');
    assessment.threats.push('Rising energy costs');
    assessment.threats.push('Climate change impacts');
  }
}

module.exports = new CarbonAnalyzerAgent();