const aiAgentService = require('./aiAgentService');
const carbonCalculationService = require('./carbonCalculationService');
const Document = require('../models/Document');
const { extractDynamicParameters } = require('./dynamicParameterExtractionService');
const AIAgent = require('../models/AIAgent');
const MSME = require('../models/MSME');
const logger = require('../utils/logger');

const BEHAVIOR_DEFINITIONS = {
  energy: {
    label: 'Energy Use',
    categories: ['energy', 'electricity', 'fuel', 'diesel', 'petrol', 'gas', 'lpg', 'natural_gas', 'coal', 'biomass']
  },
  water: {
    label: 'Water Use',
    categories: ['water', 'water_supply', 'water_treatment', 'wastewater']
  },
  waste: {
    label: 'Waste Generation',
    categories: ['waste_management', 'waste', 'hazardous_waste', 'recycling', 'scrap']
  },
  transportation: {
    label: 'Transportation',
    categories: ['transportation']
  },
  materials: {
    label: 'Material Inputs',
    categories: ['raw_materials', 'materials', 'chemicals', 'packaging', 'consumables']
  },
  manufacturing: {
    label: 'Operations and Equipment',
    categories: ['equipment', 'maintenance', 'machinery', 'process']
  },
  other: {
    label: 'Other Activities',
    categories: ['utilities', 'services', 'other', 'misc', 'air_pollution', 'air_emissions']
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

const ORCHESTRATION_DEFAULTS = {
  thresholds: {
    minTransactionsForAnomaly: 20,
    minTransactionsForTrends: 12,
    energyShareHigh: 0.2,
    wasteShareHigh: 0.1,
    transportShareHigh: 0.15,
    materialsShareHigh: 0.15,
    manufacturingShareHigh: 0.12,
    highValueAmount: 250000
  },
  weights: {
    completeness: 0.4,
    consistency: 0.3,
    coverage: 0.3
  },
  orchestration: {
    preferParallel: true,
    continueOnPartialFailures: true,
    emitRecommendations: true,
    emitReport: true
  },
  tuning: {
    anomalySensitivity: 'medium',
    trendHorizonMonths: 6,
    optimizationDepth: 'standard',
    complianceStrictness: 'standard'
  }
};

class OrchestrationManagerService {
  async orchestrateEmissions({
    msmeId,
    msmeData,
    transactions = [],
    documents = [],
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
    const orchestrationOptions = this.getOrchestrationOptions(contextOverrides?.orchestrationOptions);
    const baseContext = this.buildBaseContext(msmeProfile, contextOverrides);
    const coordinationContext = {
      orchestrationId,
      startedAt: new Date(),
      interactions: [],
      previousResults: {},
      warnings: [],
      orchestrationOptions,
      communication: this.initializeCommunicationContext(orchestrationId)
    };

    const sectorAgentType = this.getSectorAgentType(msmeProfile.businessDomain);
    const processMachineryAgentType = this.getProcessMachineryAgentType(msmeProfile.businessDomain);
    const agentAvailability = await this.resolveAgentAvailability([
      'document_analyzer',
      sectorAgentType,
      processMachineryAgentType
    ]);

    await this.runOrchestrationAgent({
      stage: 'bootstrap',
      msmeProfile,
      context: baseContext,
      coordinationContext,
      agentAvailability,
      transactions: normalizedTransactions
    });

    const resolvedDocuments = await this.resolveDocuments(
      msmeProfile._id || msmeId,
      documents
    );

    const documentAnalysis = await this.executeAgent(
      'document_analyzer',
      () => aiAgentService.documentAnalyzerAgent({
        input: {
          documents: resolvedDocuments,
          msmeData: msmeProfile,
          context: baseContext,
          ...this.buildCoordinationPayload(coordinationContext, 'document_analyzer')
        }
      }),
      coordinationContext,
      {
        stage: 'document_analysis',
        allowFailure: true,
        executionMode: this.getExecutionMode(agentAvailability, 'document_analyzer')
      }
    );

    const mergedTransactions = this.mergeDocumentTransactions(
      normalizedTransactions,
      this.selectDocumentTransactions(documentAnalysis)
    );

    const privacyReview = await this.executeAgent(
      'data_privacy',
      () => aiAgentService.dataPrivacyAgent({
        input: {
          transactions: mergedTransactions,
          msmeData: msmeProfile,
          context: baseContext,
          policyUpdates: baseContext.policyUpdates,
          ...this.buildCoordinationPayload(coordinationContext, 'data_privacy')
        }
      }),
      coordinationContext,
      {
        stage: 'data_privacy',
        allowFailure: true,
        executionMode: this.getExecutionMode(agentAvailability, 'data_privacy')
      }
    );

    const privacySafeTransactions = this.selectPrivacySafeTransactions(
      privacyReview,
      mergedTransactions
    );

    const dynamicParameters = extractDynamicParameters(privacySafeTransactions);

    const transactionStats = this.computeTransactionStats(privacySafeTransactions);
    const dataQuality = this.assessDataQuality(transactionStats, privacySafeTransactions, orchestrationOptions.weights);

    baseContext.transactionStats = transactionStats;
    baseContext.dataQuality = dataQuality;
    baseContext.orchestrationOptions = orchestrationOptions;
    baseContext.dynamicParameters = dynamicParameters;
    baseContext.documentSummary = documentAnalysis?.summary || null;

    await this.runOrchestrationAgent({
      stage: 'context_enrichment',
      msmeProfile,
      context: baseContext,
      coordinationContext,
      agentAvailability,
      agentOutputs: {
        documentAnalysis,
        dataPrivacy: privacyReview
      },
      transactions: privacySafeTransactions
    });

    const sectorProfile = await this.executeAgent(
      sectorAgentType,
      () => aiAgentService.sectorProfilerAgent({
        input: {
          msmeData: msmeProfile,
          transactions: privacySafeTransactions,
          context: baseContext,
          ...this.buildCoordinationPayload(coordinationContext, sectorAgentType)
        }
      }),
      coordinationContext,
      {
        stage: 'sector_profile',
        allowFailure: true,
        executionMode: this.getExecutionMode(agentAvailability, sectorAgentType)
      }
    );

    const processMachineryProfile = await this.executeAgent(
      processMachineryAgentType,
      () => aiAgentService.processMachineryProfilerAgent({
        input: {
          msmeData: msmeProfile,
          transactions: privacySafeTransactions,
          context: baseContext,
          sectorProfile,
          ...this.buildCoordinationPayload(coordinationContext, processMachineryAgentType)
        }
      }),
      coordinationContext,
      {
        stage: 'process_machinery_profile',
        allowFailure: true,
        executionMode: this.getExecutionMode(agentAvailability, processMachineryAgentType)
      }
    );

    const context = this.buildContext(
      baseContext,
      sectorProfile,
      processMachineryProfile,
      contextOverrides
    );
    const behaviorProfiles = this.buildBehaviorProfiles(
      privacySafeTransactions,
      context,
      behaviorOverrides
    );
    context.behaviorSignals = this.buildBehaviorSignals(behaviorProfiles);
    context.unknownParameters = this.buildUnknownParameterPlaceholders(
      privacySafeTransactions,
      behaviorProfiles,
      context.dynamicParameters
    );

    if (dataQuality.confidence < 0.5) {
      coordinationContext.warnings.push({
        message: 'Low data quality may affect orchestration accuracy.',
        dataQuality
      });
    }

    await this.runOrchestrationAgent({
      stage: 'profiling_complete',
      msmeProfile,
      context,
      coordinationContext,
      agentAvailability,
      agentOutputs: {
        sectorProfile,
        processMachineryProfile
      },
      transactions: privacySafeTransactions
    });

    const dataProcessing = await this.executeAgent(
      'data_processor',
      () => aiAgentService.dataProcessorAgent({
        input: {
          transactions: privacySafeTransactions,
          documents: resolvedDocuments,
          documentSummary: documentAnalysis?.summary,
          context,
          behaviorProfiles,
          orchestrationOptions,
          ...this.buildCoordinationPayload(coordinationContext, 'data_processor')
        }
      }),
      coordinationContext,
      {
        stage: 'data_processing',
        executionMode: this.getExecutionMode(agentAvailability, 'data_processor')
      }
    );

    if (dataProcessing?.documentRequests?.length) {
      coordinationContext.warnings.push({
        message: 'Additional documents required to classify some transactions.',
        documentRequests: dataProcessing.documentRequests
      });
    }

    const processedTransactions = this.selectProcessedTransactions(
      dataProcessing,
      privacySafeTransactions
    );

    const carbonAnalysis = await this.executeAgent(
      'carbon_analyzer',
      () => aiAgentService.carbonAnalyzerAgent({
        input: {
          transactions: processedTransactions,
          msmeData: msmeProfile,
          context,
          behaviorProfiles,
          orchestrationOptions,
          ...this.buildCoordinationPayload(coordinationContext, 'carbon_analyzer')
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
      coordinationContext,
      processMachineryProfile,
      transactionStats,
      dataQuality,
      orchestrationOptions,
      knownParameters: context.knownParameters,
      policyUpdates: context.policyUpdates,
      dynamicParameters: context.dynamicParameters,
      unknownParameters: context.unknownParameters,
      transactionTypeContext: context.transactionTypeContext,
      documentSummary: context.documentSummary,
      documentAnalysis,
      privacyReview
    };

    const orchestrationPlan = this.buildOrchestrationPlan({
      sectorProfile,
      analysisContext,
      msmeProfile,
      orchestrationOptions
    });

    await this.runOrchestrationAgent({
      stage: 'core_analysis_complete',
      msmeProfile,
      context,
      coordinationContext,
      agentAvailability,
      orchestrationPlan,
      agentOutputs: {
        dataProcessing,
        carbonAnalysis
      },
      processedTransactions
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

    await this.runOrchestrationAgent({
      stage: 'parallel_insights',
      msmeProfile,
      context,
      coordinationContext,
      agentAvailability,
      orchestrationPlan,
      agentOutputs: {
        anomalies: parallelResults.anomaly_detector,
        trends: parallelResults.trend_analyzer,
        compliance: parallelResults.compliance_monitor,
        optimization: parallelResults.optimization_advisor
      },
      processedTransactions
    });

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
            knownParameters: analysisContext.knownParameters,
            unknownParameters: analysisContext.unknownParameters,
            dynamicParameters: analysisContext.dynamicParameters,
            transactionTypeContext: analysisContext.transactionTypeContext,
            processMachineryProfile,
            orchestrationOptions,
            ...this.buildCoordinationPayload(coordinationContext, 'recommendation_engine')
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
            knownParameters: analysisContext.knownParameters,
            unknownParameters: analysisContext.unknownParameters,
            dynamicParameters: analysisContext.dynamicParameters,
            transactionTypeContext: analysisContext.transactionTypeContext,
            processMachineryProfile,
            orchestrationOptions,
            ...this.buildCoordinationPayload(coordinationContext, 'report_generator')
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

    await this.runOrchestrationAgent({
      stage: 'outputs_compiled',
      msmeProfile,
      context,
      coordinationContext,
      agentAvailability,
      orchestrationPlan,
      agentOutputs: {
        recommendations,
        report
      },
      processedTransactions
    });

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
      processMachineryProfile,
      behaviorProfiles,
      orchestrationPlan,
      emissionsSummary,
      agentAvailability,
      agentOutputs: {
        dataPrivacy: privacyReview,
        documentAnalysis,
        sectorProfile,
        processMachineryProfile,
        dataProcessing,
        carbonAnalysis,
        anomalies: parallelResults.anomaly_detector,
        trends: parallelResults.trend_analyzer,
        compliance: parallelResults.compliance_monitor,
        optimization: parallelResults.optimization_advisor,
        orchestrationAgent: coordinationContext.previousResults?.orchestration_agent || null,
        recommendations,
        report
      },
      interactions: coordinationContext.interactions,
      warnings: coordinationContext.warnings,
      communication: coordinationContext.communication
    };
  }

  async resolveDocuments(msmeId, providedDocuments = []) {
    if (Array.isArray(providedDocuments) && providedDocuments.length > 0) {
      return providedDocuments;
    }
    if (!msmeId) {
      return [];
    }
    try {
      return await Document.find({
        msmeId,
        status: 'processed',
        'duplicateDetection.isDuplicate': { $ne: true }
      })
        .sort({ updatedAt: -1 })
        .limit(50)
        .select('documentType status extractedData processingResults fileName originalName createdAt updatedAt')
        .lean();
    } catch (error) {
      logger.warn('Failed to fetch documents for orchestration', { error: error.message, msmeId });
      return [];
    }
  }

  selectDocumentTransactions(documentAnalysis) {
    if (!documentAnalysis || !Array.isArray(documentAnalysis.derivedTransactions)) {
      return [];
    }
    return documentAnalysis.derivedTransactions;
  }

  mergeDocumentTransactions(transactions, documentTransactions) {
    const merged = Array.isArray(transactions) ? [...transactions] : [];
    const docTransactions = Array.isArray(documentTransactions) ? documentTransactions : [];

    const existingSourceIds = new Set(
      merged.map(txn => txn.sourceId).filter(Boolean)
    );
    const existingSignatures = new Set(
      merged.map(txn => this.buildTransactionSignature(txn))
    );

    docTransactions.forEach(docTxn => {
      const sourceId = docTxn.sourceId;
      const signature = this.buildTransactionSignature(docTxn);
      if ((sourceId && existingSourceIds.has(sourceId)) || existingSignatures.has(signature)) {
        return;
      }
      merged.push(docTxn);
      if (sourceId) {
        existingSourceIds.add(sourceId);
      }
      existingSignatures.add(signature);
    });

    return merged;
  }

  buildTransactionSignature(transaction) {
    const date = transaction?.date ? new Date(transaction.date) : null;
    const dateKey = date ? date.toISOString().slice(0, 10) : 'unknown';
    const amount = Number(transaction?.amount) || 0;
    const description = (transaction?.description || '').toLowerCase().slice(0, 60);
    return `${dateKey}|${amount}|${description}`;
  }

  normalizeTransaction(transaction, msmeProfile) {
    const locationState = transaction?.location?.state || msmeProfile?.contact?.address?.state;
    const region = this.resolveRegion(locationState);
    const normalized = {
      ...transaction,
      category: (transaction.category || 'other').toLowerCase(),
      subcategory: transaction.subcategory || 'general',
      description: transaction.description || '',
      amount: Number(transaction.amount) || 0,
      industry: transaction.industry || msmeProfile.industry,
      businessDomain: transaction.businessDomain || msmeProfile.businessDomain,
      region: transaction.region || region,
      location: {
        ...(transaction.location || {}),
        state: transaction?.location?.state || msmeProfile?.contact?.address?.state || 'unknown',
        country: transaction?.location?.country || msmeProfile?.contact?.address?.country || 'India'
      },
      sustainability: transaction.sustainability || {
        isGreen: false,
        greenScore: 0
      }
    };

    return normalized;
  }

  getOrchestrationOptions(overrides = {}) {
    return {
      thresholds: {
        ...ORCHESTRATION_DEFAULTS.thresholds,
        ...(overrides.thresholds || {})
      },
      weights: {
        ...ORCHESTRATION_DEFAULTS.weights,
        ...(overrides.weights || {})
      },
      orchestration: {
        ...ORCHESTRATION_DEFAULTS.orchestration,
        ...(overrides.orchestration || {})
      },
      tuning: {
        ...ORCHESTRATION_DEFAULTS.tuning,
        ...(overrides.tuning || {})
      }
    };
  }

  computeTransactionStats(transactions) {
    const stats = {
      totalCount: transactions.length,
      totalAmount: 0,
      averageAmount: 0,
      minAmount: null,
      maxAmount: null,
      categoryTotals: {},
      categoryCounts: {},
      missingCategoryCount: 0,
      missingAmountCount: 0,
      invalidAmountCount: 0
    };

    transactions.forEach(transaction => {
      const category = (transaction.category || '').toLowerCase();
      const rawAmount = transaction.amount;
      const amount = Number(rawAmount);
      const hasAmount = rawAmount !== null && rawAmount !== undefined && rawAmount !== '';
      if (!category) {
        stats.missingCategoryCount += 1;
      } else {
        stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;
        stats.categoryTotals[category] = (stats.categoryTotals[category] || 0) + (Number.isFinite(amount) ? amount : 0);
      }

      if (!hasAmount) {
        stats.missingAmountCount += 1;
      } else if (!Number.isFinite(amount)) {
        stats.invalidAmountCount += 1;
      } else {
        stats.totalAmount += amount;
        stats.minAmount = stats.minAmount === null ? amount : Math.min(stats.minAmount, amount);
        stats.maxAmount = stats.maxAmount === null ? amount : Math.max(stats.maxAmount, amount);
      }
    });

    stats.averageAmount = transactions.length > 0 ? stats.totalAmount / transactions.length : 0;

    return stats;
  }

  assessDataQuality(stats, transactions, weights) {
    const total = stats.totalCount || 0;
    if (total === 0) {
      return {
        completeness: 0,
        consistency: 0,
        coverage: 0,
        confidence: 0,
        details: stats
      };
    }

    const missingCategoryRate = stats.missingCategoryCount / total;
    const invalidAmountRate = stats.invalidAmountCount / total;
    const completeness = this.clamp(1 - (missingCategoryRate + invalidAmountRate) / 2);

    const negativeAmountCount = transactions.filter(txn => Number(txn.amount) < 0).length;
    const consistency = this.clamp(1 - (negativeAmountCount + invalidAmountRate) / total);

    const uniqueBehaviors = new Set(
      Object.keys(stats.categoryTotals).map(category => this.mapCategoryToBehavior(category))
    );
    const coverage = this.clamp(uniqueBehaviors.size / Object.keys(BEHAVIOR_DEFINITIONS).length);

    const confidence = this.clamp(
      completeness * weights.completeness +
      consistency * weights.consistency +
      coverage * weights.coverage
    );

    return {
      completeness,
      consistency,
      coverage,
      confidence,
      details: stats
    };
  }

  buildBehaviorSignals(behaviorProfiles) {
    const signals = {};
    Object.values(behaviorProfiles).forEach(profile => {
      signals[profile.behavior] = {
        emissionsShare: profile.emissionsShare,
        emissionIntensity: profile.emissionIntensity,
        severity: profile.severity
      };
    });
    return signals;
  }

  clamp(value) {
    return Math.max(0, Math.min(1, value));
  }

  getSectorAgentType(businessDomain) {
    return 'sector_profiler';
  }

  getProcessMachineryAgentType(businessDomain) {
    return 'process_machinery_profiler';
  }

  buildBaseContext(msmeProfile, overrides = {}) {
    const locationState = msmeProfile?.contact?.address?.state || 'unknown';
    const region = overrides.region || this.resolveRegion(locationState);
    const season = overrides.season || this.getSeason(new Date());
    const businessDomain = overrides.businessDomain || msmeProfile.businessDomain;
    const industry = overrides.industry || msmeProfile.industry;
    const companyType = overrides.companyType || msmeProfile.companyType;
    const policyUpdates = this.buildPolicyUpdates(
      overrides.policyUpdates || overrides.governmentPolicyUpdates
    );
    const knownParameters = this.buildKnownParameters(msmeProfile, overrides);
    const unknownParameters = overrides.unknownParameters || this.buildUnknownParameterPlaceholders([], {});

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
      },
      knownParameters,
      unknownParameters,
      policyUpdates
    };
  }

  buildContext(baseContext, sectorProfile, processMachineryProfile, overrides = {}) {
    const context = { ...baseContext };
    const derivedWeights = this.deriveBehaviorWeights(context);
    context.behaviorWeights = this.mergeBehaviorWeights(
      derivedWeights,
      sectorProfile?.behaviorWeights,
      overrides.behaviorWeights
    );
    context.sectorProfile = sectorProfile || null;
    context.processMachineryProfile = processMachineryProfile || null;
    context.transactionTypeContext = sectorProfile?.transactionContext?.transactionTypes ||
      sectorProfile?.sectorModel?.transactionTypes ||
      {};
    context.documentSummary = baseContext.documentSummary || null;
    context.transactionStats = baseContext.transactionStats || null;
    context.dataQuality = baseContext.dataQuality || null;
    context.orchestrationOptions = baseContext.orchestrationOptions || this.getOrchestrationOptions();
    context.processContext = {
      ...(baseContext.processContext || {}),
      processes: processMachineryProfile?.processes || [],
      machinery: processMachineryProfile?.machinery || [],
      emissionFactors: processMachineryProfile?.emissionFactors || [],
      intensityProfile: processMachineryProfile?.intensityProfile || null
    };
    context.dynamicParameters = baseContext.dynamicParameters || this.buildDynamicParametersFallback();
    context.knownParameters = this.mergeKnownParameters(
      baseContext.knownParameters,
      context.processContext,
      overrides.knownParameters,
      context.dynamicParameters
    );
    context.policyUpdates = baseContext.policyUpdates || this.buildPolicyUpdates(
      overrides.policyUpdates || overrides.governmentPolicyUpdates
    );
    context.unknownParameters = baseContext.unknownParameters ||
      this.buildUnknownParameterPlaceholders([], {}, context.dynamicParameters);

    return context;
  }

  buildPolicyUpdates(overrides = {}) {
    const normalized = overrides && typeof overrides === 'object' ? overrides : {};
    return {
      status: normalized.status || 'placeholder',
      lastChecked: normalized.lastChecked || null,
      sources: Array.isArray(normalized.sources) ? normalized.sources : [],
      impactAreas: Array.isArray(normalized.impactAreas) ? normalized.impactAreas : [],
      notes: normalized.notes || 'Government policy updates pending ingestion.',
      region: normalized.region || null
    };
  }

  buildKnownParameters(msmeProfile, overrides = {}) {
    const knownOverrides = overrides.knownParameters || {};
    return {
      msmeProfile: {
        businessDomain: overrides.businessDomain || msmeProfile.businessDomain,
        industry: overrides.industry || msmeProfile.industry,
        companyType: overrides.companyType || msmeProfile.companyType
      },
      businessDomain: overrides.businessDomain || msmeProfile.businessDomain,
      processes: knownOverrides.processes || overrides.processes || [],
      machinery: knownOverrides.machinery || overrides.machinery || [],
      environmentalResources: this.buildConsumptionBucket(
        knownOverrides.environmentalResources || overrides.environmentalResourcesConsumption,
        'mixed'
      ),
      waterConsumption: this.buildConsumptionBucket(knownOverrides.waterConsumption, 'kl'),
      fuelConsumption: this.buildConsumptionBucket(knownOverrides.fuelConsumption, 'liters'),
      wasteGeneration: this.buildWasteBucket(knownOverrides.wasteGeneration),
      chemicalsConsumption: this.buildConsumptionBucket(knownOverrides.chemicalsConsumption, 'kg'),
      airPollution: this.buildAirPollutionBucket(knownOverrides.airPollution),
      materialsConsumption: this.buildConsumptionBucket(knownOverrides.materialsConsumption, 'kg'),
      metadata: {
        lastUpdated: knownOverrides.lastUpdated || null,
        source: knownOverrides.source || 'msme_profile'
      }
    };
  }

  buildConsumptionBucket(overrides = {}, defaultUnit = 'unknown') {
    const normalized = overrides && typeof overrides === 'object' ? overrides : {};
    return {
      total: Number.isFinite(normalized.total) ? normalized.total : null,
      unit: normalized.unit || defaultUnit,
      types: Array.isArray(normalized.types) ? normalized.types : [],
      intensity: normalized.intensity || null,
      notes: normalized.notes || null,
      source: normalized.source || 'placeholder'
    };
  }

  buildWasteBucket(overrides = {}) {
    const normalized = overrides && typeof overrides === 'object' ? overrides : {};
    return {
      ...this.buildConsumptionBucket(normalized, normalized.unit || 'kg'),
      hazardousTypes: Array.isArray(normalized.hazardousTypes) ? normalized.hazardousTypes : [],
      treatmentMethods: Array.isArray(normalized.treatmentMethods) ? normalized.treatmentMethods : []
    };
  }

  buildAirPollutionBucket(overrides = {}) {
    const normalized = overrides && typeof overrides === 'object' ? overrides : {};
    return {
      pollutants: Array.isArray(normalized.pollutants) ? normalized.pollutants : [],
      monitoringFrequency: normalized.monitoringFrequency || 'unknown',
      total: Number.isFinite(normalized.total) ? normalized.total : null,
      unit: normalized.unit || 'unknown',
      notes: normalized.notes || null,
      source: normalized.source || 'placeholder'
    };
  }

  mergeKnownParameters(baseKnown = {}, processContext = {}, overrides = {}, dynamicParameters = {}) {
    const base = baseKnown || {};
    const updated = overrides && typeof overrides === 'object' ? overrides : {};
    const dynamicConsumption = dynamicParameters?.consumptionSignals || {};
    const dynamicProcesses = dynamicParameters?.processSignals || {};
    const dynamicMachinery = dynamicParameters?.machinerySignals || {};
    return {
      ...base,
      processes: Array.from(new Set([
        ...(updated.processes || []),
        ...(processContext.processes || []),
        ...(base.processes || []),
        ...Object.keys(dynamicProcesses || {})
      ])),
      machinery: Array.from(new Set([
        ...(updated.machinery || []),
        ...(processContext.machinery || []),
        ...(base.machinery || []),
        ...Object.keys(dynamicMachinery || {})
      ])),
      environmentalResources: {
        ...this.buildConsumptionBucket({
          ...(base.environmentalResources || {}),
          ...(updated.environmentalResources || updated.environmentalResourcesConsumption || {})
        }, base.environmentalResources?.unit || 'mixed'),
        emissionFactors: processContext.emissionFactors || base.environmentalResources?.emissionFactors || []
      },
      waterConsumption: this.buildConsumptionBucket({
        ...(base.waterConsumption || {}),
        ...(updated.waterConsumption || {}),
        total: Number.isFinite(updated.waterConsumption?.total)
          ? updated.waterConsumption.total
          : (Number.isFinite(base.waterConsumption?.total)
            ? base.waterConsumption.total
            : dynamicConsumption.waterConsumption?.totalAmount),
        types: Array.from(new Set([
          ...((base.waterConsumption || {}).types || []),
          ...((updated.waterConsumption || {}).types || []),
          ...Object.keys(dynamicConsumption.waterConsumption?.types || {})
        ]))
      }, base.waterConsumption?.unit || 'kl'),
      fuelConsumption: this.buildConsumptionBucket({
        ...(base.fuelConsumption || {}),
        ...(updated.fuelConsumption || {}),
        total: Number.isFinite(updated.fuelConsumption?.total)
          ? updated.fuelConsumption.total
          : (Number.isFinite(base.fuelConsumption?.total)
            ? base.fuelConsumption.total
            : dynamicConsumption.fuelConsumption?.totalAmount),
        types: Array.from(new Set([
          ...((base.fuelConsumption || {}).types || []),
          ...((updated.fuelConsumption || {}).types || []),
          ...Object.keys(dynamicConsumption.fuelConsumption?.types || {})
        ]))
      }, base.fuelConsumption?.unit || 'liters'),
      wasteGeneration: this.buildWasteBucket({
        ...(base.wasteGeneration || {}),
        ...(updated.wasteGeneration || {}),
        total: Number.isFinite(updated.wasteGeneration?.total)
          ? updated.wasteGeneration.total
          : (Number.isFinite(base.wasteGeneration?.total)
            ? base.wasteGeneration.total
            : dynamicConsumption.wasteGeneration?.totalAmount),
        types: Array.from(new Set([
          ...((base.wasteGeneration || {}).types || []),
          ...((updated.wasteGeneration || {}).types || []),
          ...Object.keys(dynamicConsumption.wasteGeneration?.types || {})
        ]))
      }),
      chemicalsConsumption: this.buildConsumptionBucket({
        ...(base.chemicalsConsumption || {}),
        ...(updated.chemicalsConsumption || {}),
        total: Number.isFinite(updated.chemicalsConsumption?.total)
          ? updated.chemicalsConsumption.total
          : (Number.isFinite(base.chemicalsConsumption?.total)
            ? base.chemicalsConsumption.total
            : dynamicConsumption.chemicalsConsumption?.totalAmount),
        types: Array.from(new Set([
          ...((base.chemicalsConsumption || {}).types || []),
          ...((updated.chemicalsConsumption || {}).types || []),
          ...Object.keys(dynamicConsumption.chemicalsConsumption?.types || {})
        ]))
      }, base.chemicalsConsumption?.unit || 'kg'),
      airPollution: this.buildAirPollutionBucket({
        ...(base.airPollution || {}),
        ...(updated.airPollution || {}),
        pollutants: Array.from(new Set([
          ...((base.airPollution || {}).pollutants || []),
          ...((updated.airPollution || {}).pollutants || []),
          ...Object.keys(dynamicConsumption.airPollution?.types || {})
        ]))
      }),
      materialsConsumption: this.buildConsumptionBucket({
        ...(base.materialsConsumption || {}),
        ...(updated.materialsConsumption || {}),
        total: Number.isFinite(updated.materialsConsumption?.total)
          ? updated.materialsConsumption.total
          : (Number.isFinite(base.materialsConsumption?.total)
            ? base.materialsConsumption.total
            : dynamicConsumption.materialsConsumption?.totalAmount),
        types: Array.from(new Set([
          ...((base.materialsConsumption || {}).types || []),
          ...((updated.materialsConsumption || {}).types || []),
          ...Object.keys(dynamicConsumption.materialsConsumption?.types || {})
        ]))
      }, base.materialsConsumption?.unit || 'kg'),
      metadata: {
        ...(base.metadata || {}),
        ...(updated.metadata || {}),
        lastUpdated: updated.lastUpdated || base.metadata?.lastUpdated || null
      }
    };
  }

  buildUnknownParameterPlaceholders(transactions = [], behaviorProfiles = {}, dynamicParameters = {}) {
    const knownCategories = new Set(
      Object.values(BEHAVIOR_DEFINITIONS).flatMap(definition => definition.categories)
    );
    const unknownCategories = new Set();
    const unknownCategoryStats = new Map();
    const totalAmount = transactions.reduce((sum, transaction) => sum + (Number(transaction.amount) || 0), 0);
    transactions.forEach(transaction => {
      const category = (transaction.category || '').toLowerCase();
      if (category && !knownCategories.has(category)) {
        unknownCategories.add(category);
        const stats = unknownCategoryStats.get(category) || { count: 0, totalAmount: 0 };
        stats.count += 1;
        stats.totalAmount += Number(transaction.amount) || 0;
        unknownCategoryStats.set(category, stats);
      }
    });

    const otherProfile = behaviorProfiles?.other || {};
    const needsReview = unknownCategories.size > 0 || (otherProfile.emissionsShare || 0) > 0.2;
    const dynamicUnknownParameters = dynamicParameters.unknownParameters || [];

    const weightedCategoryParameters = Array.from(unknownCategoryStats.entries()).map(([category, stats]) => {
      const amountShare = totalAmount > 0 ? stats.totalAmount / totalAmount : 0;
      const mentionRate = transactions.length > 0 ? stats.count / transactions.length : 0;
      const weight = Math.min(1, 0.6 * mentionRate + 0.4 * amountShare);
      return {
        name: category,
        count: stats.count,
        totalAmount: stats.totalAmount,
        amountShare,
        weight,
        source: 'category'
      };
    });

    const weightedParametersMap = new Map();
    [...dynamicUnknownParameters, ...weightedCategoryParameters].forEach(param => {
      if (!param?.name) return;
      const existing = weightedParametersMap.get(param.name) || { ...param };
      existing.count = (existing.count || 0) + (param.count || 0);
      existing.totalAmount = (existing.totalAmount || 0) + (param.totalAmount || 0);
      existing.weight = Math.max(existing.weight || 0, param.weight || 0);
      existing.amountShare = Math.max(existing.amountShare || 0, param.amountShare || 0);
      weightedParametersMap.set(param.name, existing);
    });

    return {
      detectedCategories: Array.from(unknownCategories),
      behaviorSignals: {
        otherEmissionsShare: otherProfile.emissionsShare || 0,
        otherTransactionCount: otherProfile.transactionCount || 0
      },
      weightedParameters: Array.from(weightedParametersMap.values()).sort((a, b) => (b.weight || 0) - (a.weight || 0)),
      dynamicUnknownParameters,
      unknownCategoryParameters: weightedCategoryParameters,
      placeholders: {
        resourceConsumption: [],
        processInputs: [],
        emissionTypes: [],
        measurements: dynamicParameters.measurements || []
      },
      needsReview,
      notes: needsReview
        ? 'Unknown categories detected; add parameters when available.'
        : 'No unknown categories detected.'
    };
  }

  buildDynamicParametersFallback() {
    return {
      consumptionSignals: {},
      processSignals: {},
      machinerySignals: {},
      measurements: [],
      unknownParameters: [],
      totals: {
        totalTransactions: 0,
        totalAmount: 0
      }
    };
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

  buildOrchestrationPlan({ sectorProfile, analysisContext, msmeProfile, orchestrationOptions }) {
    const defaultParallelAgents = [
      'anomaly_detector',
      'trend_analyzer',
      'compliance_monitor',
      'optimization_advisor'
    ];

    const thresholds = orchestrationOptions.thresholds;
    const sectorPlan = sectorProfile?.orchestrationPlan || {};
    const parallelAgents = new Set(sectorPlan.parallelAgents || defaultParallelAgents);
    const rationale = [];

    const transactionCount = analysisContext.transactions?.length || 0;
    const behaviorProfiles = analysisContext.behaviorProfiles || {};
    const knownParameters = analysisContext.knownParameters || {};
    const highSeverity = Object.values(behaviorProfiles).filter(profile => profile.severity === 'high');
    if (highSeverity.length > 0) {
      parallelAgents.add('anomaly_detector');
      rationale.push('High severity behaviors trigger anomaly detection.');
    }

    if (transactionCount >= thresholds.minTransactionsForAnomaly) {
      parallelAgents.add('anomaly_detector');
      rationale.push('Sufficient transaction volume supports anomaly detection.');
    }

    if (transactionCount >= thresholds.minTransactionsForTrends) {
      parallelAgents.add('trend_analyzer');
      rationale.push('Transaction volume supports trend analysis.');
    }

    if ((behaviorProfiles.energy?.emissionsShare || 0) > thresholds.energyShareHigh) {
      parallelAgents.add('optimization_advisor');
      rationale.push('Energy emissions indicate optimization opportunities.');
    }

    if ((behaviorProfiles.waste?.emissionsShare || 0) > thresholds.wasteShareHigh) {
      parallelAgents.add('compliance_monitor');
      rationale.push('Waste emissions warrant compliance review.');
    }

    if ((behaviorProfiles.transportation?.emissionsShare || 0) > thresholds.transportShareHigh) {
      parallelAgents.add('trend_analyzer');
      rationale.push('Transportation intensity adds trend monitoring.');
    }

    if ((behaviorProfiles.materials?.emissionsShare || 0) > thresholds.materialsShareHigh) {
      parallelAgents.add('optimization_advisor');
      rationale.push('Material emissions indicate optimization opportunity.');
    }

    if ((behaviorProfiles.manufacturing?.emissionsShare || 0) > thresholds.manufacturingShareHigh) {
      parallelAgents.add('compliance_monitor');
      rationale.push('Manufacturing emissions drive compliance review.');
    }

    if (msmeProfile?.environmentalCompliance &&
        (!msmeProfile.environmentalCompliance.hasPollutionControlBoard ||
         !msmeProfile.environmentalCompliance.hasEnvironmentalClearance)) {
      parallelAgents.add('compliance_monitor');
      rationale.push('Missing compliance signals add regulatory checks.');
    }

    if (analysisContext.dataQuality?.confidence < 0.6) {
      rationale.push('Data quality below target; interpret results cautiously.');
    }

    const weightedUnknowns = analysisContext.unknownParameters?.weightedParameters || [];
    const highUnknowns = weightedUnknowns.filter(param => (param.weight || 0) >= 0.35);
    if (highUnknowns.length > 0) {
      parallelAgents.add('anomaly_detector');
      parallelAgents.add('compliance_monitor');
      rationale.push('High-weight unknown parameters trigger anomaly and compliance review.');
    }

    if ((knownParameters.processes || []).length > 0 || (knownParameters.machinery || []).length > 0) {
      parallelAgents.add('optimization_advisor');
      rationale.push('Process and machinery signals add optimization review.');
    }

    if (knownParameters.wasteGeneration?.total || (knownParameters.wasteGeneration?.types || []).length > 0) {
      parallelAgents.add('compliance_monitor');
      rationale.push('Known waste generation triggers compliance review.');
    }

    if (knownParameters.fuelConsumption?.total || (knownParameters.fuelConsumption?.types || []).length > 0) {
      parallelAgents.add('optimization_advisor');
      rationale.push('Fuel consumption signals optimization opportunities.');
    }

    if ((knownParameters.airPollution?.pollutants || []).length > 0) {
      parallelAgents.add('compliance_monitor');
      rationale.push('Air pollution signals require compliance monitoring.');
    }

    if (sectorProfile?.label) {
      rationale.push(`Sector orchestration aligned to ${sectorProfile.label}.`);
    }

    const coordinationMode = orchestrationOptions.orchestration.preferParallel && parallelAgents.size > 1
      ? 'parallel'
      : 'sequential';

    const scope = {
      preProcessingAgents: ['document_analyzer', 'data_privacy', 'sector_profiler', 'process_machinery_profiler'],
      coreAgents: ['data_processor', 'carbon_analyzer'],
      parallelAgents: Array.from(parallelAgents),
      postProcessingAgents: ['recommendation_engine', 'report_generator']
    };

    return {
      sector: sectorProfile?.sector || msmeProfile?.businessDomain || 'other',
      parallelAgents: Array.from(parallelAgents),
      coordinationMode,
      scope,
      outputs: {
        recommendations: orchestrationOptions.orchestration.emitRecommendations,
        report: orchestrationOptions.orchestration.emitReport,
        ...(sectorPlan.outputs || {})
      },
      thresholds,
      rationale
    };
  }

  buildParallelAgentDefinitions(analysisContext, orchestrationPlan, coordinationContext) {
    const requestedAgents = orchestrationPlan?.parallelAgents || [];
    const orchestrationOptions = analysisContext.orchestrationOptions || this.getOrchestrationOptions();
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
            unknownParameters: analysisContext.unknownParameters,
            dynamicParameters: analysisContext.dynamicParameters,
            transactionTypeContext: analysisContext.transactionTypeContext,
            dataQuality: analysisContext.dataQuality,
            orchestrationOptions,
            thresholds: orchestrationOptions.thresholds,
            ...this.buildCoordinationPayload(coordinationContext, 'anomaly_detector')
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
              context: analysisContext.context,
              processMachineryProfile: analysisContext.processMachineryProfile,
              transactionStats: analysisContext.transactionStats,
              dataQuality: analysisContext.dataQuality,
              unknownParameters: analysisContext.unknownParameters,
              dynamicParameters: analysisContext.dynamicParameters,
              transactionTypeContext: analysisContext.transactionTypeContext
            },
            orchestrationOptions,
            ...this.buildCoordinationPayload(coordinationContext, 'trend_analyzer')
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
            policyUpdates: analysisContext.policyUpdates,
            knownParameters: analysisContext.knownParameters,
            unknownParameters: analysisContext.unknownParameters,
            dynamicParameters: analysisContext.dynamicParameters,
            transactionTypeContext: analysisContext.transactionTypeContext,
            context: analysisContext.context,
            processMachineryProfile: analysisContext.processMachineryProfile,
            orchestrationOptions,
            ...this.buildCoordinationPayload(coordinationContext, 'compliance_monitor')
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
            knownParameters: analysisContext.knownParameters,
            unknownParameters: analysisContext.unknownParameters,
            dynamicParameters: analysisContext.dynamicParameters,
            transactionTypeContext: analysisContext.transactionTypeContext,
            context: analysisContext.context,
            processMachineryProfile: analysisContext.processMachineryProfile,
            orchestrationOptions,
            ...this.buildCoordinationPayload(coordinationContext, 'optimization_advisor')
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

  selectPrivacySafeTransactions(privacyReview, fallbackTransactions) {
    if (privacyReview &&
        Array.isArray(privacyReview.redactedTransactions) &&
        privacyReview.redactedTransactions.length > 0) {
      return privacyReview.redactedTransactions;
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

  initializeCommunicationContext(orchestrationId) {
    return {
      orchestrationId: orchestrationId || null,
      sharedContext: {},
      agentBriefings: {},
      messages: [],
      stageSummaries: [],
      lastUpdated: null
    };
  }

  applyOrchestrationUpdate(coordinationContext, update) {
    if (!coordinationContext) return;
    if (!coordinationContext.communication) {
      coordinationContext.communication = this.initializeCommunicationContext(
        coordinationContext.orchestrationId
      );
    }
    if (!update) return;

    const communication = coordinationContext.communication;
    if (update.sharedContext) {
      communication.sharedContext = update.sharedContext;
    }
    if (update.agentBriefings) {
      communication.agentBriefings = {
        ...communication.agentBriefings,
        ...update.agentBriefings
      };
    }
    if (Array.isArray(update.messages) && update.messages.length > 0) {
      communication.messages.push(...update.messages);
    }
    if (update.summary || update.stage) {
      communication.stageSummaries.push({
        stage: update.stage || 'unknown',
        summary: update.summary || null,
        updatedAt: update.updatedAt || new Date().toISOString()
      });
    }
    communication.lastUpdated = new Date().toISOString();
  }

  getAgentBriefing(coordinationContext, agentType) {
    if (!coordinationContext?.communication?.agentBriefings || !agentType) {
      return null;
    }
    return coordinationContext.communication.agentBriefings[agentType] || null;
  }

  buildCoordinationPayload(coordinationContext, agentType) {
    return {
      coordinationContext,
      communication: coordinationContext?.communication || null,
      agentBriefing: this.getAgentBriefing(coordinationContext, agentType)
    };
  }

  async runOrchestrationAgent({
    stage,
    msmeProfile,
    context,
    coordinationContext,
    agentAvailability,
    orchestrationPlan,
    agentOutputs = {},
    transactions = [],
    processedTransactions = []
  }) {
    const output = await this.executeAgent(
      'orchestration_agent',
      () => aiAgentService.orchestrationAgent({
        input: {
          stage,
          orchestrationId: coordinationContext?.orchestrationId,
          msmeSnapshot: this.buildMSMESnapshot(msmeProfile),
          context,
          coordinationContext,
          communicationState: coordinationContext?.communication,
          orchestrationPlan,
          agentOutputs,
          transactions,
          processedTransactions
        }
      }),
      coordinationContext,
      {
        stage: `orchestration_${stage}`,
        allowFailure: true,
        executionMode: this.getExecutionMode(agentAvailability, 'orchestration_agent')
      }
    );

    this.applyOrchestrationUpdate(coordinationContext, output);
    return output;
  }

  async resolveAgentAvailability(additionalTypes = []) {
    try {
      const agentTypes = [
        'orchestration_agent',
        'document_analyzer',
        'data_privacy',
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

module.exports = new OrchestrationManagerService();
