const aiAgentService = require('./aiAgentService');
const carbonCalculationService = require('./carbonCalculationService');
const AIAgent = require('../models/AIAgent');
const MSME = require('../models/MSME');
const logger = require('../utils/logger');

const BEHAVIOR_DEFINITIONS = {
  energy: {
    label: 'Energy Use',
    categories: ['energy']
  },
  water: {
    label: 'Water Use',
    categories: ['water']
  },
  waste: {
    label: 'Waste Generation',
    categories: ['waste_management']
  },
  transportation: {
    label: 'Transportation',
    categories: ['transportation']
  },
  materials: {
    label: 'Material Inputs',
    categories: ['raw_materials']
  },
  manufacturing: {
    label: 'Operations and Equipment',
    categories: ['equipment', 'maintenance']
  },
  other: {
    label: 'Other Activities',
    categories: ['utilities', 'services', 'other', 'misc']
  }
};

const STATE_REGION_MAP = {
  'andhra pradesh': 'south-india',
  'arunachal pradesh': 'northeast-india',
  'assam': 'northeast-india',
  'bihar': 'east-india',
  'chhattisgarh': 'east-india',
  'goa': 'west-india',
  'gujarat': 'west-india',
  'haryana': 'north-india',
  'himachal pradesh': 'north-india',
  'jharkhand': 'east-india',
  'karnataka': 'south-india',
  'kerala': 'south-india',
  'madhya pradesh': 'west-india',
  'maharashtra': 'west-india',
  'manipur': 'northeast-india',
  'meghalaya': 'northeast-india',
  'mizoram': 'northeast-india',
  'nagaland': 'northeast-india',
  'odisha': 'east-india',
  'punjab': 'north-india',
  'rajasthan': 'north-india',
  'sikkim': 'northeast-india',
  'tamil nadu': 'south-india',
  'telangana': 'south-india',
  'tripura': 'northeast-india',
  'uttar pradesh': 'north-india',
  'uttarakhand': 'north-india',
  'west bengal': 'east-india',
  'delhi': 'north-india',
  'jammu and kashmir': 'north-india',
  'ladakh': 'north-india',
  'puducherry': 'south-india',
  'chandigarh': 'north-india',
  'andaman and nicobar': 'south-india',
  'lakshadweep': 'south-india',
  'dadra and nagar haveli': 'west-india',
  'daman and diu': 'west-india'
};

class MSMEEmissionsOrchestrationService {
  async orchestrateEmissions({
    msmeId,
    msmeData,
    transactions = [],
    behaviorOverrides = {},
    contextOverrides = {}
  }) {
    if (!Array.isArray(transactions) || transactions.length === 0) {
      throw new Error('Transactions data is required for emissions orchestration');
    }

    const msmeProfile = msmeData || await MSME.findById(msmeId).lean();
    if (!msmeProfile) {
      throw new Error('MSME profile not found for orchestration');
    }

    const orchestrationId = `orch_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const normalizedTransactions = transactions.map(transaction =>
      this.normalizeTransaction(transaction, msmeProfile)
    );

    const coordinationContext = {
      orchestrationId,
      startedAt: new Date(),
      interactions: [],
      previousResults: {},
      warnings: []
    };

    const sectorAgentType = this.getSectorAgentType(msmeProfile.businessDomain);
    const agentAvailability = await this.resolveAgentAvailability([sectorAgentType]);

    const baseContext = this.buildBaseContext(msmeProfile, contextOverrides);
    const sectorProfile = await this.executeAgent(
      sectorAgentType,
      () => aiAgentService.sectorProfilerAgent({
        input: {
          msmeData: msmeProfile,
          transactions: normalizedTransactions,
          context: baseContext
        }
      }),
      coordinationContext,
      {
        stage: 'sector_profile',
        allowFailure: true,
        executionMode: this.getExecutionMode(agentAvailability, sectorAgentType)
      }
    );

    const context = this.buildContext(baseContext, sectorProfile, contextOverrides);
    const behaviorProfiles = this.buildBehaviorProfiles(
      normalizedTransactions,
      context,
      behaviorOverrides
    );

    const dataProcessing = await this.executeAgent(
      'data_processor',
      () => aiAgentService.dataProcessorAgent({
        input: {
          transactions: normalizedTransactions,
          context,
          behaviorProfiles,
          coordinationContext
        }
      }),
      coordinationContext,
      {
        stage: 'data_processing',
        executionMode: this.getExecutionMode(agentAvailability, 'data_processor')
      }
    );

    const processedTransactions = this.selectProcessedTransactions(
      dataProcessing,
      normalizedTransactions
    );

    const carbonAnalysis = await this.executeAgent(
      'carbon_analyzer',
      () => aiAgentService.carbonAnalyzerAgent({
        input: {
          transactions: processedTransactions,
          msmeData: msmeProfile,
          context,
          behaviorProfiles,
          coordinationContext
        }
      }),
      coordinationContext,
      {
        stage: 'carbon_analysis',
        executionMode: this.getExecutionMode(agentAvailability, 'carbon_analyzer')
      }
    );

    const analysisContext = {
      carbonData: carbonAnalysis,
      behaviorProfiles,
      transactions: processedTransactions,
      msmeData: msmeProfile,
      context,
      coordinationContext
    };

    const orchestrationPlan = this.buildOrchestrationPlan({
      sectorProfile,
      analysisContext,
      msmeProfile
    });

    const parallelAgents = this.buildParallelAgentDefinitions(
      analysisContext,
      orchestrationPlan,
      coordinationContext
    );

    const parallelResults = parallelAgents.length > 0
      ? await this.executeParallelAgents(
        parallelAgents,
        coordinationContext,
        agentAvailability
      )
      : {};

    let recommendations = null;
    if (orchestrationPlan.outputs?.recommendations !== false) {
      recommendations = await this.executeAgent(
        'recommendation_engine',
        () => aiAgentService.recommendationEngineAgent({
          input: {
            carbonData: analysisContext.carbonData,
            transactions: analysisContext.transactions,
            msmeData: analysisContext.msmeData,
            trends: parallelResults.trend_analyzer?.trends,
            anomalies: parallelResults.anomaly_detector,
            compliance: parallelResults.compliance_monitor,
            optimization: parallelResults.optimization_advisor,
            behaviorProfiles: analysisContext.behaviorProfiles,
            context: analysisContext.context,
            coordinationContext
          }
        }),
        coordinationContext,
        {
          stage: 'recommendation_generation',
          allowFailure: true,
          executionMode: this.getExecutionMode(agentAvailability, 'recommendation_engine')
        }
      );
    }

    let report = null;
    if (orchestrationPlan.outputs?.report !== false) {
      report = await this.executeAgent(
        'report_generator',
        () => aiAgentService.reportGeneratorAgent({
          input: {
            carbonData: analysisContext.carbonData,
            trends: parallelResults.trend_analyzer?.trends,
            recommendations: recommendations?.recommendations || recommendations,
            behaviorProfiles: analysisContext.behaviorProfiles,
            context: analysisContext.context,
            coordinationContext
          }
        }),
        coordinationContext,
        {
          stage: 'report_generation',
          allowFailure: true,
          executionMode: this.getExecutionMode(agentAvailability, 'report_generator')
        }
      );
    }

    const emissionsSummary = this.buildEmissionsSummary(
      behaviorProfiles,
      carbonAnalysis
    );

    return {
      orchestrationId,
      msmeId: msmeProfile._id?.toString() || msmeId,
      msmeSnapshot: this.buildMSMESnapshot(msmeProfile),
      context,
      sectorProfile,
      behaviorProfiles,
      orchestrationPlan,
      emissionsSummary,
      agentAvailability,
      agentOutputs: {
        sectorProfile,
        dataProcessing,
        carbonAnalysis,
        anomalies: parallelResults.anomaly_detector,
        trends: parallelResults.trend_analyzer,
        compliance: parallelResults.compliance_monitor,
        optimization: parallelResults.optimization_advisor,
        recommendations,
        report
      },
      interactions: coordinationContext.interactions,
      warnings: coordinationContext.warnings
    };
  }

  normalizeTransaction(transaction, msmeProfile) {
    const normalized = {
      ...transaction,
      category: (transaction.category || 'other').toLowerCase(),
      subcategory: transaction.subcategory || 'general',
      description: transaction.description || '',
      amount: Number(transaction.amount) || 0,
      industry: transaction.industry || msmeProfile.industry,
      businessDomain: transaction.businessDomain || msmeProfile.businessDomain,
      sustainability: transaction.sustainability || {
        isGreen: false,
        greenScore: 0
      }
    };

    return normalized;
  }

  getSectorAgentType(businessDomain) {
    const normalized = (businessDomain || 'other').toLowerCase();
    return `sector_profiler_${normalized}`;
  }

  buildBaseContext(msmeProfile, overrides = {}) {
    const locationState = msmeProfile?.contact?.address?.state || 'unknown';
    const region = overrides.region || this.resolveRegion(locationState);
    const season = overrides.season || this.getSeason(new Date());
    const businessDomain = overrides.businessDomain || msmeProfile.businessDomain;
    const industry = overrides.industry || msmeProfile.industry;
    const companyType = overrides.companyType || msmeProfile.companyType;

    return {
      businessDomain,
      industry,
      companyType,
      location: {
        state: locationState,
        country: msmeProfile?.contact?.address?.country || 'India'
      },
      region,
      season,
      regulatoryContext: overrides.regulatoryContext || {
        region,
        industry,
        domain: businessDomain
      },
      processContext: overrides.processContext || {
        primaryProducts: msmeProfile?.business?.primaryProducts,
        manufacturingUnits: msmeProfile?.business?.manufacturingUnits
      }
    };
  }

  buildContext(baseContext, sectorProfile, overrides = {}) {
    const context = { ...baseContext };
    const derivedWeights = this.deriveBehaviorWeights(context);
    context.behaviorWeights = this.mergeBehaviorWeights(
      derivedWeights,
      sectorProfile?.behaviorWeights,
      overrides.behaviorWeights
    );
    context.sectorProfile = sectorProfile || null;

    return context;
  }

  mergeBehaviorWeights(baseWeights, sectorWeights, overrideWeights) {
    const merged = { ...baseWeights };
    Object.entries(sectorWeights || {}).forEach(([key, value]) => {
      if (Number.isFinite(value)) {
        merged[key] = (merged[key] || 1) * value;
      }
    });
    Object.entries(overrideWeights || {}).forEach(([key, value]) => {
      if (Number.isFinite(value)) {
        merged[key] = value;
      }
    });
    return merged;
  }

  resolveRegion(state) {
    if (!state) return 'north-india';
    const normalized = state.toLowerCase();
    return STATE_REGION_MAP[normalized] || 'north-india';
  }

  getSeason(date) {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 'summer';
    if (month >= 6 && month <= 9) return 'monsoon';
    if (month >= 12 || month <= 2) return 'winter';
    return 'dry';
  }

  deriveBehaviorWeights(context) {
    const weights = {
      energy: 1,
      water: 1,
      waste: 1,
      transportation: 1,
      materials: 1,
      manufacturing: 1,
      other: 1
    };

    const domainFactors = carbonCalculationService.domainFactors?.[context.businessDomain] || {};
    weights.energy *= domainFactors.energy || 1;
    weights.transportation *= domainFactors.transportation || 1;
    weights.materials *= domainFactors.materials || 1;
    weights.waste *= domainFactors.waste || 1;
    weights.manufacturing *= ((domainFactors.energy || 1) + (domainFactors.materials || 1)) / 2;

    const sizeFactors = carbonCalculationService.esgParameters?.sizeFactors?.[context.companyType];
    if (sizeFactors?.scale) {
      Object.keys(weights).forEach(key => {
        weights[key] *= sizeFactors.scale;
      });
    }

    const locationFactors = carbonCalculationService.esgParameters?.locationFactors?.[context.region];
    if (locationFactors?.electricity) {
      weights.energy *= locationFactors.electricity;
    }
    if (locationFactors?.transport) {
      weights.transportation *= locationFactors.transport;
    }

    const temporalFactors = carbonCalculationService.esgParameters?.temporalFactors?.[context.season];
    if (temporalFactors?.energy) {
      weights.energy *= temporalFactors.energy;
    }
    if (temporalFactors?.transport) {
      weights.transportation *= temporalFactors.transport;
    }

    return weights;
  }

  buildBehaviorProfiles(transactions, context, behaviorOverrides) {
    const profiles = {};
    Object.entries(BEHAVIOR_DEFINITIONS).forEach(([behaviorKey, definition]) => {
      profiles[behaviorKey] = {
        behavior: behaviorKey,
        label: definition.label,
        categories: definition.categories,
        weight: context.behaviorWeights?.[behaviorKey] || 1,
        transactionCount: 0,
        totalAmount: 0,
        totalEmissions: 0,
        emissionIntensity: 0,
        weightedEmissions: 0,
        emissionsShare: 0,
        severity: 'low',
        confidence: 0,
        subcategoryBreakdown: {}
      };
    });

    transactions.forEach(transaction => {
      const behaviorKey = this.mapCategoryToBehavior(transaction.category);
      const profile = profiles[behaviorKey];
      if (!profile) return;

      const carbonData = carbonCalculationService.calculateTransactionCarbonFootprint(transaction);

      profile.transactionCount += 1;
      profile.totalAmount += transaction.amount;
      profile.totalEmissions += carbonData.co2Emissions;

      const subcategory = transaction.subcategory || 'general';
      profile.subcategoryBreakdown[subcategory] = (profile.subcategoryBreakdown[subcategory] || 0) + carbonData.co2Emissions;
    });

    Object.keys(profiles).forEach(behaviorKey => {
      const override = behaviorOverrides?.[behaviorKey];
      if (!override) return;
      if (Number.isFinite(override.totalEmissions)) {
        profiles[behaviorKey].totalEmissions = override.totalEmissions;
      }
      if (Number.isFinite(override.totalAmount)) {
        profiles[behaviorKey].totalAmount = override.totalAmount;
      }
      if (Number.isFinite(override.transactionCount)) {
        profiles[behaviorKey].transactionCount = override.transactionCount;
      }
    });

    const totalEmissions = Object.values(profiles)
      .reduce((sum, profile) => sum + profile.totalEmissions, 0);

    Object.values(profiles).forEach(profile => {
      profile.emissionIntensity = profile.totalAmount > 0
        ? profile.totalEmissions / profile.totalAmount
        : 0;
      profile.weightedEmissions = profile.totalEmissions * profile.weight;
      profile.emissionsShare = totalEmissions > 0 ? profile.totalEmissions / totalEmissions : 0;
      profile.severity = this.classifySeverity(profile.emissionsShare);
      profile.confidence = Math.min(1, profile.transactionCount / 10);
    });

    return profiles;
  }

  buildOrchestrationPlan({ sectorProfile, analysisContext, msmeProfile }) {
    const defaultParallelAgents = [
      'anomaly_detector',
      'trend_analyzer',
      'compliance_monitor',
      'optimization_advisor'
    ];

    const sectorPlan = sectorProfile?.orchestrationPlan || {};
    const parallelAgents = new Set(sectorPlan.parallelAgents || defaultParallelAgents);
    const rationale = [];

    const behaviorProfiles = analysisContext.behaviorProfiles || {};
    const highSeverity = Object.values(behaviorProfiles).filter(profile => profile.severity === 'high');
    if (highSeverity.length > 0) {
      parallelAgents.add('anomaly_detector');
      rationale.push('High severity behaviors trigger anomaly detection.');
    }

    if ((behaviorProfiles.energy?.emissionsShare || 0) > 0.2) {
      parallelAgents.add('optimization_advisor');
      rationale.push('Energy emissions indicate optimization opportunities.');
    }

    if ((behaviorProfiles.waste?.emissionsShare || 0) > 0.1) {
      parallelAgents.add('compliance_monitor');
      rationale.push('Waste emissions warrant compliance review.');
    }

    if ((behaviorProfiles.transportation?.emissionsShare || 0) > 0.15) {
      parallelAgents.add('trend_analyzer');
      rationale.push('Transportation intensity adds trend monitoring.');
    }

    if (msmeProfile?.environmentalCompliance &&
        (!msmeProfile.environmentalCompliance.hasPollutionControlBoard ||
         !msmeProfile.environmentalCompliance.hasEnvironmentalClearance)) {
      parallelAgents.add('compliance_monitor');
      rationale.push('Missing compliance signals add regulatory checks.');
    }

    if (sectorProfile?.label) {
      rationale.push(`Sector orchestration aligned to ${sectorProfile.label}.`);
    }

    return {
      sector: sectorProfile?.sector || msmeProfile?.businessDomain || 'other',
      parallelAgents: Array.from(parallelAgents),
      outputs: {
        recommendations: true,
        report: true,
        ...(sectorPlan.outputs || {})
      },
      rationale
    };
  }

  buildParallelAgentDefinitions(analysisContext, orchestrationPlan, coordinationContext) {
    const requestedAgents = orchestrationPlan?.parallelAgents || [];
    const builders = {
      anomaly_detector: () => ({
        type: 'anomaly_detector',
        stage: 'anomaly_detection',
        allowFailure: true,
        handler: () => aiAgentService.anomalyDetectorAgent({
          input: {
            transactions: analysisContext.transactions,
            carbonData: analysisContext.carbonData,
            behaviorProfiles: analysisContext.behaviorProfiles,
            context: analysisContext.context,
            coordinationContext
          }
        })
      }),
      trend_analyzer: () => ({
        type: 'trend_analyzer',
        stage: 'trend_analysis',
        allowFailure: true,
        handler: () => aiAgentService.trendAnalyzerAgent({
          input: {
            data: {
              carbonData: analysisContext.carbonData,
              behaviorProfiles: analysisContext.behaviorProfiles,
              context: analysisContext.context
            },
            coordinationContext
          }
        })
      }),
      compliance_monitor: () => ({
        type: 'compliance_monitor',
        stage: 'compliance_check',
        allowFailure: true,
        handler: () => aiAgentService.complianceMonitorAgent({
          input: {
            carbonData: analysisContext.carbonData,
            regulations: analysisContext.context.regulatoryContext,
            context: analysisContext.context,
            coordinationContext
          }
        })
      }),
      optimization_advisor: () => ({
        type: 'optimization_advisor',
        stage: 'optimization_advice',
        allowFailure: true,
        handler: () => aiAgentService.optimizationAdvisorAgent({
          input: {
            carbonData: analysisContext.carbonData,
            processes: analysisContext.context.processContext,
            context: analysisContext.context,
            coordinationContext
          }
        })
      })
    };

    return requestedAgents
      .map(agentType => builders[agentType]?.())
      .filter(Boolean);
  }

  mapCategoryToBehavior(category) {
    const normalized = (category || 'other').toLowerCase();
    const match = Object.entries(BEHAVIOR_DEFINITIONS)
      .find(([, definition]) => definition.categories.includes(normalized));
    return match ? match[0] : 'other';
  }

  classifySeverity(share) {
    if (share >= 0.35) return 'high';
    if (share >= 0.2) return 'medium';
    return 'low';
  }

  selectProcessedTransactions(processedResult, fallbackTransactions) {
    if (!processedResult) return fallbackTransactions;
    if (Array.isArray(processedResult.validated) && processedResult.validated.length > 0) {
      return processedResult.validated;
    }
    if (Array.isArray(processedResult.enriched) && processedResult.enriched.length > 0) {
      return processedResult.enriched;
    }
    if (Array.isArray(processedResult.cleaned) && processedResult.cleaned.length > 0) {
      return processedResult.cleaned;
    }
    return fallbackTransactions;
  }

  async executeAgent(agentType, executor, coordinationContext, metadata = {}) {
    const startTime = new Date();
    try {
      const output = await executor();
      this.recordInteraction(coordinationContext, {
        agentType,
        stage: metadata.stage,
        executionMode: metadata.executionMode || 'agent',
        startedAt: startTime,
        completedAt: new Date(),
        status: 'completed'
      });
      coordinationContext.previousResults[agentType] = output;
      return output;
    } catch (error) {
      this.recordInteraction(coordinationContext, {
        agentType,
        stage: metadata.stage,
        executionMode: metadata.executionMode || 'agent',
        startedAt: startTime,
        completedAt: new Date(),
        status: 'failed',
        error: error.message
      });
      if (metadata.allowFailure) {
        coordinationContext.warnings.push({
          agentType,
          stage: metadata.stage,
          message: error.message
        });
        return null;
      }
      logger.error(`Orchestration step failed for ${agentType}:`, error);
      throw error;
    }
  }

  async executeParallelAgents(agents, coordinationContext, agentAvailability) {
    const executions = agents.map(agent => this.executeAgent(
      agent.type,
      agent.handler,
      coordinationContext,
      {
        stage: agent.stage,
        allowFailure: agent.allowFailure,
        executionMode: this.getExecutionMode(agentAvailability, agent.type)
      }
    ));

    const results = await Promise.all(executions);
    return agents.reduce((acc, agent, index) => {
      acc[agent.type] = results[index];
      return acc;
    }, {});
  }

  recordInteraction(coordinationContext, interaction) {
    coordinationContext.interactions.push({
      ...interaction,
      timestamp: new Date()
    });
  }

  async resolveAgentAvailability(additionalTypes = []) {
    try {
      const agentTypes = [
        'data_processor',
        'carbon_analyzer',
        'anomaly_detector',
        'trend_analyzer',
        'compliance_monitor',
        'optimization_advisor',
        'recommendation_engine',
        'report_generator'
      ];
      const requestedTypes = [
        ...agentTypes,
        ...(additionalTypes || [])
      ].filter(Boolean);

      const agents = await AIAgent.find({
        type: { $in: requestedTypes },
        isActive: true,
        status: 'active'
      }).select('type name').lean();

      const availability = {};
      requestedTypes.forEach(type => {
        availability[type] = { available: false };
      });

      agents.forEach(agent => {
        availability[agent.type] = {
          available: true,
          name: agent.name
        };
      });

      return availability;
    } catch (error) {
      logger.error('Failed to resolve agent availability:', error);
      return {};
    }
  }

  getExecutionMode(agentAvailability, agentType) {
    const availability = agentAvailability?.[agentType];
    if (!availability) {
      return 'fallback';
    }
    return availability.available ? 'agent' : 'fallback';
  }

  buildEmissionsSummary(behaviorProfiles, carbonAnalysis) {
    const behaviors = Object.values(behaviorProfiles);
    const totalEmissions = behaviors.reduce((sum, behavior) => sum + behavior.totalEmissions, 0);
    const totalWeightedEmissions = behaviors.reduce((sum, behavior) => sum + behavior.weightedEmissions, 0);
    const primaryBehaviors = [...behaviors]
      .sort((a, b) => b.weightedEmissions - a.weightedEmissions)
      .slice(0, 3)
      .map(behavior => behavior.behavior);

    return {
      totalEmissions,
      totalWeightedEmissions,
      primaryBehaviors,
      behaviorBreakdown: behaviorProfiles,
      carbonInsights: carbonAnalysis?.insights || [],
      carbonRecommendations: carbonAnalysis?.recommendations || []
    };
  }

  buildMSMESnapshot(msmeProfile) {
    return {
      companyName: msmeProfile.companyName,
      industry: msmeProfile.industry,
      businessDomain: msmeProfile.businessDomain,
      companyType: msmeProfile.companyType,
      location: msmeProfile?.contact?.address?.state || 'unknown'
    };
  }
}

module.exports = new MSMEEmissionsOrchestrationService();
