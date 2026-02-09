const getCarbonCalculationService = () => require('../../carbonCalculationService');
const dataProcessorService = require('../dataProcessorAgent');

const generateCarbonInsights = (analysis) => ([
  {
    type: 'emission_peak',
    message: 'Highest emissions detected in energy category',
    value: Math.max(...Object.values(analysis.categoryBreakdown))
  }
]);

const generateCarbonRecommendations = (analysis) => ([
  {
    category: 'energy',
    title: 'Switch to renewable energy',
    priority: 'high',
    potentialReduction: analysis.totalEmissions * 0.3
  }
]);

const generateSustainabilityRecommendations = () => [];
const generateTransactionRecommendations = () => [];
const cleanTransactionData = (transaction) => transaction;
const classifyTransaction = (transaction) => transaction;
const enrichTransactionData = (transaction) => transaction;
const validateForCarbonCalculation = (transaction) => transaction;
const analyzeTransactionPatterns = () => ({});
const detectEmissionAnomalies = () => [];
const detectSpendingAnomalies = () => [];
const detectFrequencyAnomalies = () => [];
const calculateAnomalySeverity = () => 'low';
const analyzeEmissionTrends = () => ({});
const analyzeSpendingTrends = () => ({});
const analyzeEfficiencyTrends = () => ({});
const analyzeSustainabilityTrends = () => ({});
const generateTrendPredictions = () => ({});
const generateTrendInsights = () => [];
const checkEnvironmentalCompliance = () => ({ issues: [], recommendations: [] });
const checkRegulatoryCompliance = () => ({ issues: [], recommendations: [] });
const suggestEnergyOptimizations = () => [];
const suggestWasteOptimizations = () => [];
const suggestTransportOptimizations = () => [];
const suggestProcessOptimizations = () => [];
const calculatePotentialSavings = () => 0;
const prioritizeOptimizations = (optimizations) => optimizations;
const generateReportSummary = () => ({});
const generateCarbonSection = () => ({});
const generateCarbonCharts = () => [];
const generateTrendsSection = () => ({});
const generateTrendCharts = () => [];
const generateRecommendationsSection = () => ({});

const SENSITIVE_PATTERNS = [
  { label: 'email', regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, replacement: '[redacted-email]' },
  { label: 'phone', regex: /(\+?\d[\d\s-]{7,}\d)/g, replacement: '[redacted-phone]' },
  { label: 'pan', regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, replacement: '[redacted-pan]' },
  { label: 'gst', regex: /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g, replacement: '[redacted-gst]' },
  { label: 'udyam', regex: /\bUDYAM-[A-Z]{2}-\d{2}-\d{7}\b/g, replacement: '[redacted-udyam]' }
];

const redactSensitiveText = (value) => {
  if (value === null || value === undefined) return value;
  let text = String(value);
  SENSITIVE_PATTERNS.forEach(pattern => {
    text = text.replace(pattern.regex, pattern.replacement);
  });
  return text;
};

const redactTransaction = (transaction) => {
  if (!transaction || typeof transaction !== 'object') return transaction;
  const redacted = { ...transaction };
  const fieldsToRedact = ['description', 'vendor', 'counterparty', 'reference', 'referenceId', 'notes'];
  fieldsToRedact.forEach(field => {
    if (typeof redacted[field] === 'string') {
      redacted[field] = redactSensitiveText(redacted[field]);
    }
  });
  return redacted;
};

const dataPrivacyAgent = async (task) => {
  const { input } = task || {};
  const transactions = Array.isArray(input?.transactions) ? input.transactions : [];
  const msmeData = input?.msmeData || {};
  const policyUpdates = input?.policyUpdates || input?.context?.policyUpdates;

  const redactedTransactions = transactions.map(redactTransaction);

  return {
    redactedTransactions,
    redactionSummary: {
      totalTransactions: transactions.length,
      redactedFields: ['description', 'vendor', 'counterparty', 'reference', 'referenceId', 'notes'],
      appliedRules: SENSITIVE_PATTERNS.map(pattern => pattern.label),
      policyStatus: policyUpdates?.status || 'placeholder'
    },
    policyContext: policyUpdates || {
      status: 'placeholder',
      notes: 'Government policy updates pending ingestion.'
    },
    msmeSnapshot: {
      companyName: msmeData.companyName,
      businessDomain: msmeData.businessDomain
    }
  };
};

const mapDocumentToTransactionType = (documentType) => {
  switch (documentType) {
    case 'invoice':
    case 'bill':
      return 'expense';
    case 'receipt':
      return 'purchase';
    case 'statement':
      return 'other';
    default:
      return 'other';
  }
};

const buildDocumentTransaction = (document) => {
  const extracted = document?.extractedData || {};
  if (!extracted.amount || !extracted.date) {
    return null;
  }
  return {
    source: 'document',
    sourceId: document._id?.toString() || document.fileName || `doc_${Date.now()}`,
    transactionType: mapDocumentToTransactionType(document.documentType),
    amount: extracted.amount,
    currency: extracted.currency || 'INR',
    description: extracted.description || document.originalName || 'Document transaction',
    vendor: extracted.vendor || { name: extracted.vendor?.name || null },
    category: extracted.category || 'other',
    subcategory: extracted.subcategory || 'general',
    date: extracted.date,
    metadata: {
      documentId: document._id?.toString(),
      documentType: document.documentType,
      documentName: document.originalName,
      extractedData: extracted
    }
  };
};

const documentAnalyzerAgent = async (task) => {
  const { input } = task || {};
  const documents = Array.isArray(input?.documents) ? input.documents : [];

  const summary = {
    totalDocuments: documents.length,
    processedDocuments: documents.filter(doc => doc?.status === 'processed').length,
    documentTypes: {},
    categoryBreakdown: {},
    vendorBreakdown: {},
    totalAmount: 0,
    averageAmount: 0,
    dateRange: { start: null, end: null }
  };

  const derivedTransactions = [];

  documents.forEach(document => {
    const documentType = document?.documentType || 'other';
    summary.documentTypes[documentType] = (summary.documentTypes[documentType] || 0) + 1;

    const extracted = document?.extractedData || {};
    if (extracted.category) {
      summary.categoryBreakdown[extracted.category] = (summary.categoryBreakdown[extracted.category] || 0) + 1;
    }
    if (extracted.vendor?.name) {
      summary.vendorBreakdown[extracted.vendor.name] = (summary.vendorBreakdown[extracted.vendor.name] || 0) + 1;
    }
    if (Number.isFinite(extracted.amount)) {
      summary.totalAmount += extracted.amount;
    }
    if (extracted.date) {
      const docDate = new Date(extracted.date);
      if (!summary.dateRange.start || docDate < new Date(summary.dateRange.start)) {
        summary.dateRange.start = docDate.toISOString();
      }
      if (!summary.dateRange.end || docDate > new Date(summary.dateRange.end)) {
        summary.dateRange.end = docDate.toISOString();
      }
    }

    const transaction = buildDocumentTransaction(document);
    if (transaction) {
      derivedTransactions.push(transaction);
    }
  });

  summary.averageAmount = documents.length > 0 ? summary.totalAmount / documents.length : 0;

  return {
    summary,
    derivedTransactions,
    documentIds: documents.map(document => document?._id?.toString()).filter(Boolean)
  };
};

const summarizeDataQuality = (dataQuality = {}) => ({
  confidence: Number.isFinite(dataQuality.confidence) ? dataQuality.confidence : null,
  completeness: Number.isFinite(dataQuality.completeness) ? dataQuality.completeness : null,
  consistency: Number.isFinite(dataQuality.consistency) ? dataQuality.consistency : null,
  coverage: Number.isFinite(dataQuality.coverage) ? dataQuality.coverage : null
});

const summarizeKnownParameters = (known = {}) => ({
  processCount: Array.isArray(known.processes) ? known.processes.length : 0,
  machineryCount: Array.isArray(known.machinery) ? known.machinery.length : 0,
  waterConsumption: known.waterConsumption?.total ?? null,
  fuelConsumption: known.fuelConsumption?.total ?? null,
  wasteGeneration: known.wasteGeneration?.total ?? null,
  materialsConsumption: known.materialsConsumption?.total ?? null,
  chemicalsConsumption: known.chemicalsConsumption?.total ?? null,
  airPollutants: Array.isArray(known.airPollution?.pollutants) ? known.airPollution.pollutants.length : 0
});

const summarizeUnknownParameters = (unknown = {}) => ({
  needsReview: Boolean(unknown.needsReview),
  detectedCategories: Array.isArray(unknown.detectedCategories)
    ? unknown.detectedCategories.slice(0, 5)
    : [],
  weightedCount: Array.isArray(unknown.weightedParameters)
    ? unknown.weightedParameters.length
    : 0
});

const summarizeDocumentContext = (documentAnalysis, context = {}) => {
  const summary = documentAnalysis?.summary || context.documentSummary || {};
  return {
    totalDocuments: Number.isFinite(summary.totalDocuments) ? summary.totalDocuments : 0,
    processedDocuments: Number.isFinite(summary.processedDocuments) ? summary.processedDocuments : 0,
    categoryCount: summary.categoryBreakdown ? Object.keys(summary.categoryBreakdown).length : 0,
    vendorCount: summary.vendorBreakdown ? Object.keys(summary.vendorBreakdown).length : 0
  };
};

const buildSharedContext = ({
  stage,
  orchestrationId,
  msmeSnapshot,
  context = {},
  orchestrationPlan,
  transactions = [],
  processedTransactions = [],
  agentOutputs = {}
}) => {
  const transactionCount = processedTransactions.length || transactions.length;
  const dataQuality = summarizeDataQuality(context.dataQuality || agentOutputs.dataQuality);
  const knownParameters = summarizeKnownParameters(context.knownParameters);
  const unknownParameters = summarizeUnknownParameters(context.unknownParameters);
  const documentContext = summarizeDocumentContext(agentOutputs.documentAnalysis, context);

  return {
    stage,
    orchestrationId: orchestrationId || null,
    msme: msmeSnapshot || null,
    businessDomain: context.businessDomain,
    industry: context.industry,
    region: context.region,
    season: context.season,
    transactionCount,
    dataQuality,
    knownParameters,
    unknownParameters,
    policyStatus: context.policyUpdates?.status || 'unknown',
    documentContext,
    orchestrationPlan: orchestrationPlan ? {
      coordinationMode: orchestrationPlan.coordinationMode,
      parallelAgents: orchestrationPlan.parallelAgents,
      outputs: orchestrationPlan.outputs
    } : null
  };
};

const buildAgentBriefings = (sharedContext, input = {}) => {
  const baseBriefing = {
    stage: sharedContext.stage,
    orchestrationId: sharedContext.orchestrationId,
    policyStatus: sharedContext.policyStatus,
    dataQuality: sharedContext.dataQuality,
    transactionCount: sharedContext.transactionCount
  };

  return {
    data_processor: {
      ...baseBriefing,
      focus: 'data_enrichment',
      documentContext: sharedContext.documentContext,
      knownParameters: sharedContext.knownParameters
    },
    carbon_analyzer: {
      ...baseBriefing,
      focus: 'emissions_analysis',
      behaviorSignals: input.context?.behaviorSignals || {},
      knownParameters: sharedContext.knownParameters,
      unknownParameters: sharedContext.unknownParameters
    },
    anomaly_detector: {
      ...baseBriefing,
      focus: 'risk_detection',
      unknownParameters: sharedContext.unknownParameters
    },
    trend_analyzer: {
      ...baseBriefing,
      focus: 'trend_context',
      documentContext: sharedContext.documentContext
    },
    compliance_monitor: {
      ...baseBriefing,
      focus: 'regulatory_checks',
      policyStatus: sharedContext.policyStatus,
      knownParameters: sharedContext.knownParameters,
      unknownParameters: sharedContext.unknownParameters
    },
    optimization_advisor: {
      ...baseBriefing,
      focus: 'optimization_targets',
      knownParameters: sharedContext.knownParameters
    },
    recommendation_engine: {
      ...baseBriefing,
      focus: 'recommendation_alignment',
      orchestrationPlan: sharedContext.orchestrationPlan
    },
    report_generator: {
      ...baseBriefing,
      focus: 'report_alignment',
      orchestrationPlan: sharedContext.orchestrationPlan
    }
  };
};

const buildOrchestrationMessages = (sharedContext) => {
  const messages = [];
  const timestamp = new Date().toISOString();

  const pushMessage = (targets, message, severity = 'info', context = {}) => {
    messages.push({
      targets: Array.isArray(targets) ? targets : [targets],
      message,
      severity,
      context,
      timestamp
    });
  };

  if (Number.isFinite(sharedContext.dataQuality?.confidence) &&
      sharedContext.dataQuality.confidence < 0.6) {
    pushMessage('broadcast', 'Data quality is below target; interpret results cautiously.', 'warning', {
      confidence: sharedContext.dataQuality.confidence
    });
  }

  if (sharedContext.unknownParameters?.needsReview) {
    pushMessage(['anomaly_detector', 'compliance_monitor'], 'Unknown parameters detected; prioritize review.', 'warning', {
      detectedCategories: sharedContext.unknownParameters.detectedCategories
    });
  }

  if (sharedContext.policyStatus === 'placeholder') {
    pushMessage('compliance_monitor', 'Policy updates are placeholders; note regulatory uncertainty.', 'info');
  }

  if (sharedContext.documentContext?.totalDocuments === 0 && sharedContext.transactionCount > 0) {
    pushMessage('data_processor', 'No document context available; consider requesting supporting documents.', 'info');
  }

  return messages;
};

const orchestrationAgent = async (task) => {
  const { input } = task || {};
  const stage = input?.stage || 'unknown';
  const context = input?.context || {};
  const coordinationContext = input?.coordinationContext || {};
  const orchestrationId = input?.orchestrationId || coordinationContext.orchestrationId || null;

  const sharedContext = buildSharedContext({
    stage,
    orchestrationId,
    msmeSnapshot: input?.msmeSnapshot,
    context,
    orchestrationPlan: input?.orchestrationPlan,
    transactions: Array.isArray(input?.transactions) ? input.transactions : [],
    processedTransactions: Array.isArray(input?.processedTransactions) ? input.processedTransactions : [],
    agentOutputs: input?.agentOutputs || {}
  });

  const agentBriefings = buildAgentBriefings(sharedContext, input);
  const messages = buildOrchestrationMessages(sharedContext);

  return {
    stage,
    updatedAt: new Date().toISOString(),
    summary: {
      transactionCount: sharedContext.transactionCount,
      dataQuality: sharedContext.dataQuality,
      unknownParameters: sharedContext.unknownParameters,
      policyStatus: sharedContext.policyStatus
    },
    sharedContext,
    agentBriefings,
    messages
  };
};

const carbonAnalyzerAgent = async (task) => {
  const { input } = task;

  if (input.transactions) {
    const analysis = {
      totalEmissions: 0,
      categoryBreakdown: {},
      recommendations: [],
      insights: []
    };

    const carbonCalculationService = getCarbonCalculationService();
    for (const transaction of input.transactions) {
      const carbonData = carbonCalculationService.calculateTransactionCarbonFootprint(transaction);
      analysis.totalEmissions += carbonData.co2Emissions;

      if (!analysis.categoryBreakdown[transaction.category]) {
        analysis.categoryBreakdown[transaction.category] = 0;
      }
      analysis.categoryBreakdown[transaction.category] += carbonData.co2Emissions;
    }

    analysis.insights = generateCarbonInsights(analysis);
    analysis.recommendations = generateCarbonRecommendations(analysis);

    return analysis;
  }

  return { error: 'Invalid input for carbon analyzer' };
};

const recommendationEngineAgent = async (task) => {
  const { input } = task;
  const recommendations = [];

  if (input.carbonData) {
    recommendations.push(...generateSustainabilityRecommendations(input.carbonData));
  }

  if (input.transactions) {
    recommendations.push(...generateTransactionRecommendations(input.transactions));
  }

  recommendations.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
  });

  return {
    recommendations: recommendations.slice(0, 10),
    totalGenerated: recommendations.length,
    categories: [...new Set(recommendations.map(r => r.category))]
  };
};

const dataProcessorAgent = async (task) => {
  const { input } = task || {};
  const transactions = Array.isArray(input?.transactions) ? input.transactions : [];

  if (transactions.length === 0) {
    return {
      cleaned: [],
      classified: [],
      enriched: [],
      validated: [],
      documentRequests: [],
      statistics: {
        totalProcessed: 0,
        successfullyClassified: 0,
        validationErrors: 0,
        enrichmentApplied: 0,
        uncertainTransactions: 0,
        documentRequests: 0,
        autoLearnedCategories: 0,
        autoLearnedTransactionTypes: 0
      }
    };
  }

  return dataProcessorService.processTransactions(transactions, {
    context: input?.context,
    documents: input?.documents,
    documentSummary: input?.documentSummary,
    transactionTypeContext: input?.transactionTypeContext,
    thresholds: input?.thresholds || input?.orchestrationOptions?.thresholds || input?.context?.orchestrationOptions?.thresholds
  });
};

const anomalyDetectorAgent = async (task) => {
  const { input } = task;
  const anomalies = [];

  if (input.transactions) {
    const patterns = analyzeTransactionPatterns(input.transactions);
    anomalies.push(...detectEmissionAnomalies(patterns));
    anomalies.push(...detectSpendingAnomalies(patterns));
    anomalies.push(...detectFrequencyAnomalies(patterns));
  }

  return {
    anomalies,
    totalDetected: anomalies.length,
    severity: calculateAnomalySeverity(anomalies)
  };
};

const trendAnalyzerAgent = async (task) => {
  const { input } = task;
  const trends = {
    emissions: analyzeEmissionTrends(input.data),
    spending: analyzeSpendingTrends(input.data),
    efficiency: analyzeEfficiencyTrends(input.data),
    sustainability: analyzeSustainabilityTrends(input.data)
  };

  return {
    trends,
    predictions: generateTrendPredictions(trends),
    insights: generateTrendInsights(trends)
  };
};

const complianceMonitorAgent = async (task) => {
  const { input } = task;
  const compliance = {
    status: 'compliant',
    issues: [],
    recommendations: []
  };

  if (input.carbonData) {
    const envCompliance = checkEnvironmentalCompliance(input.carbonData);
    compliance.issues.push(...envCompliance.issues);
    compliance.recommendations.push(...envCompliance.recommendations);
  }

  if (input.regulations) {
    const regCompliance = checkRegulatoryCompliance(input.regulations, input.data);
    compliance.issues.push(...regCompliance.issues);
    compliance.recommendations.push(...regCompliance.recommendations);
  }

  if (compliance.issues.length > 0) {
    compliance.status = 'non_compliant';
  }

  return compliance;
};

const optimizationAdvisorAgent = async (task) => {
  const { input } = task;
  const optimizations = [];

  if (input.carbonData) {
    optimizations.push(...suggestEnergyOptimizations(input.carbonData));
    optimizations.push(...suggestWasteOptimizations(input.carbonData));
    optimizations.push(...suggestTransportOptimizations(input.carbonData));
  }

  if (input.processes) {
    optimizations.push(...suggestProcessOptimizations(input.processes));
  }

  return {
    optimizations,
    potentialSavings: calculatePotentialSavings(optimizations),
    implementationPriority: prioritizeOptimizations(optimizations)
  };
};

const reportGeneratorAgent = async (task) => {
  const { input } = task;
  const report = {
    summary: generateReportSummary(input),
    sections: [],
    charts: [],
    recommendations: []
  };

  if (input.carbonData) {
    report.sections.push(generateCarbonSection(input.carbonData));
    report.charts.push(...generateCarbonCharts(input.carbonData));
  }

  if (input.trends) {
    report.sections.push(generateTrendsSection(input.trends));
    report.charts.push(...generateTrendCharts(input.trends));
  }

  if (input.recommendations) {
    report.sections.push(generateRecommendationsSection(input.recommendations));
  }

  return report;
};

const handlers = {
  carbon_analyzer: carbonAnalyzerAgent,
  data_privacy: dataPrivacyAgent,
  document_analyzer: documentAnalyzerAgent,
  orchestration_agent: orchestrationAgent,
  recommendation_engine: recommendationEngineAgent,
  data_processor: dataProcessorAgent,
  anomaly_detector: anomalyDetectorAgent,
  trend_analyzer: trendAnalyzerAgent,
  compliance_monitor: complianceMonitorAgent,
  optimization_advisor: optimizationAdvisorAgent,
  report_generator: reportGeneratorAgent
};

const getHandler = (type) => handlers[type];

module.exports = {
  handlers,
  getHandler,
  helpers: {
    generateCarbonInsights,
    generateCarbonRecommendations,
    generateSustainabilityRecommendations,
    generateTransactionRecommendations,
    cleanTransactionData,
    classifyTransaction,
    enrichTransactionData,
    validateForCarbonCalculation,
    analyzeTransactionPatterns,
    detectEmissionAnomalies,
    detectSpendingAnomalies,
    detectFrequencyAnomalies,
    calculateAnomalySeverity,
    analyzeEmissionTrends,
    analyzeSpendingTrends,
    analyzeEfficiencyTrends,
    analyzeSustainabilityTrends,
    generateTrendPredictions,
    generateTrendInsights,
    checkEnvironmentalCompliance,
    checkRegulatoryCompliance,
    suggestEnergyOptimizations,
    suggestWasteOptimizations,
    suggestTransportOptimizations,
    suggestProcessOptimizations,
    calculatePotentialSavings,
    prioritizeOptimizations,
    generateReportSummary,
    generateCarbonSection,
    generateCarbonCharts,
    generateTrendsSection,
    generateTrendCharts,
    generateRecommendationsSection
  }
};
