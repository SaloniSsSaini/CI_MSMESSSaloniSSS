const mongoose = require('mongoose');
const AIAgent = require('../models/AIAgent');
const logger = require('../utils/logger');
require('dotenv').config();

const defaultAgents = [
  {
    name: 'Carbon Analyzer Agent',
    type: 'carbon_analyzer',
    description: 'Specialized agent for carbon footprint analysis and sustainability assessment',
    capabilities: [
      'transaction_analysis',
      'emission_calculation',
      'carbon_scoring',
      'sustainability_assessment',
      'esg_scope_analysis'
    ],
    configuration: {
      model: 'carbon_analysis_v1',
      parameters: {
        emissionFactors: 'default',
        calculationMethod: 'transaction_based',
        includeScope3: true
      },
      thresholds: {
        highEmissionThreshold: 100,
        anomalyThreshold: 3.0,
        confidenceThreshold: 0.7
      }
    }
  },
  {
    name: 'Recommendation Engine Agent',
    type: 'recommendation_engine',
    description: 'Generates personalized sustainability recommendations and optimization suggestions',
    capabilities: [
      'sustainability_recommendations',
      'cost_optimization',
      'efficiency_improvements',
      'compliance_guidance',
      'technology_adoption'
    ],
    configuration: {
      model: 'recommendation_v1',
      parameters: {
        maxRecommendations: 10,
        priorityWeights: {
          high: 3,
          medium: 2,
          low: 1
        },
        includeCostBenefit: true
      },
      thresholds: {
        minConfidence: 0.6,
        minImpact: 0.1
      }
    }
  },
  {
    name: 'Data Processor Agent',
    type: 'data_processor',
    description: 'Processes, cleans, and classifies transaction data for carbon calculations',
    capabilities: [
      'data_cleaning',
      'transaction_classification',
      'text_analysis',
      'data_enrichment',
      'quality_validation'
    ],
    configuration: {
      model: 'data_processing_v1',
      parameters: {
        enableNLP: true,
        autoClassification: true,
        dataEnrichment: true,
        validationStrict: true
      },
      thresholds: {
        classificationConfidence: 0.7,
        validationStrictness: 0.8
      }
    }
  },
  {
    name: 'Anomaly Detector Agent',
    type: 'anomaly_detector',
    description: 'Detects unusual patterns and anomalies in transaction and emission data',
    capabilities: [
      'pattern_analysis',
      'anomaly_detection',
      'outlier_identification',
      'trend_analysis',
      'risk_assessment'
    ],
    configuration: {
      model: 'anomaly_detection_v1',
      parameters: {
        sensitivity: 'medium',
        lookbackPeriod: 30,
        enableML: true
      },
      thresholds: {
        anomalyThreshold: 2.5,
        riskThreshold: 0.8
      }
    }
  },
  {
    name: 'Trend Analyzer Agent',
    type: 'trend_analyzer',
    description: 'Analyzes trends and patterns in carbon emissions and sustainability metrics',
    capabilities: [
      'trend_analysis',
      'pattern_recognition',
      'forecasting',
      'seasonal_analysis',
      'performance_tracking'
    ],
    configuration: {
      model: 'trend_analysis_v1',
      parameters: {
        forecastPeriod: 12,
        seasonalAnalysis: true,
        enablePredictions: true
      },
      thresholds: {
        trendSignificance: 0.05,
        forecastConfidence: 0.7
      }
    }
  },
  {
    name: 'Compliance Monitor Agent',
    type: 'compliance_monitor',
    description: 'Monitors environmental compliance and regulatory requirements',
    capabilities: [
      'compliance_checking',
      'regulatory_monitoring',
      'audit_preparation',
      'gap_analysis',
      'reporting'
    ],
    configuration: {
      model: 'compliance_v1',
      parameters: {
        regulations: ['ISO 14001', 'EPA', 'Local Environmental'],
        checkFrequency: 'weekly',
        autoReporting: true
      },
      thresholds: {
        complianceThreshold: 0.9,
        riskThreshold: 0.7
      }
    }
  },
  {
    name: 'Optimization Advisor Agent',
    type: 'optimization_advisor',
    description: 'Provides optimization suggestions for processes and resource utilization',
    capabilities: [
      'process_optimization',
      'resource_efficiency',
      'cost_reduction',
      'energy_optimization',
      'waste_reduction'
    ],
    configuration: {
      model: 'optimization_v1',
      parameters: {
        optimizationAreas: ['energy', 'waste', 'transportation', 'materials'],
        includeROI: true,
        implementationGuidance: true
      },
      thresholds: {
        minSavings: 0.1,
        maxPaybackPeriod: 36
      }
    }
  },
  {
    name: 'Report Generator Agent',
    type: 'report_generator',
    description: 'Generates comprehensive reports and visualizations for carbon intelligence',
    capabilities: [
      'report_generation',
      'data_visualization',
      'chart_creation',
      'summary_analysis',
      'export_formats'
    ],
    configuration: {
      model: 'report_generation_v1',
      parameters: {
        formats: ['PDF', 'Excel', 'JSON'],
        includeCharts: true,
        autoScheduling: true
      },
      thresholds: {
        dataCompleteness: 0.8,
        reportQuality: 0.9
      }
    }
  }
];

async function initializeAIAgents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/carbon-intelligence');
    logger.info('Connected to MongoDB');

    // Clear existing agents (for development)
    if (process.env.NODE_ENV === 'development') {
      await AIAgent.deleteMany({});
      logger.info('Cleared existing AI agents');
    }

    // Create default agents
    const createdAgents = [];
    for (const agentData of defaultAgents) {
      try {
        // Check if agent already exists
        let agent = await AIAgent.findOne({ name: agentData.name });
        
        if (!agent) {
          agent = new AIAgent({
            ...agentData,
            status: 'active',
            isActive: true,
            performance: {
              tasksCompleted: 0,
              successRate: 100,
              averageResponseTime: 0,
              lastActivity: new Date(),
              errorCount: 0
            }
          });
          
          await agent.save();
          createdAgents.push(agent);
          logger.info(`Created AI Agent: ${agent.name}`);
        } else {
          logger.info(`AI Agent already exists: ${agent.name}`);
        }
      } catch (error) {
        logger.error(`Failed to create agent ${agentData.name}:`, error);
      }
    }

    logger.info(`AI Agents initialization completed. Created: ${createdAgents.length} agents`);
    
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');

  } catch (error) {
    logger.error('Failed to initialize AI agents:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeAIAgents();
}

module.exports = { initializeAIAgents, defaultAgents };