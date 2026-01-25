jest.mock('../services/aiAgentService', () => ({
  sectorProfilerAgent: jest.fn(),
  processMachineryProfilerAgent: jest.fn(),
  dataPrivacyAgent: jest.fn(),
  documentAnalyzerAgent: jest.fn(),
  dataProcessorAgent: jest.fn(),
  carbonAnalyzerAgent: jest.fn(),
  anomalyDetectorAgent: jest.fn(),
  trendAnalyzerAgent: jest.fn(),
  complianceMonitorAgent: jest.fn(),
  optimizationAdvisorAgent: jest.fn(),
  recommendationEngineAgent: jest.fn(),
  reportGeneratorAgent: jest.fn()
}));

jest.mock('../models/MSME', () => ({
  findById: jest.fn()
}));

jest.mock('../models/AIAgent', () => ({
  find: jest.fn()
}));

jest.mock('../models/Document', () => ({
  find: jest.fn()
}));

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

const aiAgentService = require('../services/aiAgentService');
const MSME = require('../models/MSME');
const AIAgent = require('../models/AIAgent');
const Document = require('../models/Document');
const orchestrationService = require('../services/msmeEmissionsOrchestrationService');

describe('MSME Emissions Orchestration Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Document.find.mockResolvedValue([]);
  });

  test('should merge orchestration options with defaults', () => {
    const options = orchestrationService.getOrchestrationOptions({
      thresholds: { energyShareHigh: 0.33 },
      orchestration: { emitReport: false }
    });

    expect(options.thresholds.energyShareHigh).toBe(0.33);
    expect(options.thresholds.minTransactionsForAnomaly).toBe(20);
    expect(options.orchestration.emitReport).toBe(false);
    expect(options.orchestration.emitRecommendations).toBe(true);
  });

  test('should compute transaction stats with missing values', () => {
    const transactions = [
      { category: 'energy', amount: 100 },
      { category: '', amount: 50 },
      { amount: 'abc' },
      { category: 'transportation' }
    ];

    const stats = orchestrationService.computeTransactionStats(transactions);

    expect(stats.totalCount).toBe(4);
    expect(stats.missingCategoryCount).toBe(2);
    expect(stats.missingAmountCount).toBe(1);
    expect(stats.invalidAmountCount).toBe(1);
    expect(stats.totalAmount).toBe(150);
    expect(stats.averageAmount).toBeCloseTo(37.5, 5);
  });

  test('should assess data quality with weighted confidence', () => {
    const transactions = [
      { category: 'energy', amount: 100 },
      { category: 'transportation', amount: -10 }
    ];
    const stats = orchestrationService.computeTransactionStats(transactions);
    const weights = orchestrationService.getOrchestrationOptions().weights;
    const quality = orchestrationService.assessDataQuality(stats, transactions, weights);

    expect(quality.completeness).toBeCloseTo(1, 5);
    expect(quality.consistency).toBeCloseTo(0.5, 5);
    expect(quality.coverage).toBeCloseTo(2 / 7, 5);
    expect(quality.confidence).toBeCloseTo(0.6357, 4);
  });

  test('should build orchestration plan with thresholds and outputs', () => {
    const orchestrationOptions = orchestrationService.getOrchestrationOptions({
      orchestration: { emitRecommendations: false }
    });
    const analysisContext = {
      transactions: Array.from({ length: 25 }, (_, index) => ({
        category: 'energy',
        amount: 100 + index
      })),
      behaviorProfiles: {
        energy: { emissionsShare: 0.3, severity: 'high' },
        waste: { emissionsShare: 0.2, severity: 'medium' }
      },
      dataQuality: { confidence: 0.8 }
    };
    const sectorProfile = { label: 'Manufacturing', orchestrationPlan: {} };
    const msmeProfile = {
      businessDomain: 'manufacturing',
      environmentalCompliance: {
        hasPollutionControlBoard: false,
        hasEnvironmentalClearance: false
      }
    };

    const plan = orchestrationService.buildOrchestrationPlan({
      sectorProfile,
      analysisContext,
      msmeProfile,
      orchestrationOptions
    });

    expect(plan.parallelAgents).toEqual(
      expect.arrayContaining(['anomaly_detector', 'trend_analyzer', 'compliance_monitor', 'optimization_advisor'])
    );
    expect(plan.outputs.recommendations).toBe(false);
    expect(plan.outputs.report).toBe(true);
  });

  test('should build parallel agent definitions with enriched inputs', async () => {
    const orchestrationOptions = orchestrationService.getOrchestrationOptions();
    const analysisContext = {
      transactions: [{ category: 'energy', amount: 100 }],
      carbonData: { totalEmissions: 10 },
      behaviorProfiles: { energy: { emissionsShare: 0.4, severity: 'high' } },
      context: { regulatoryContext: {} },
      processMachineryProfile: { processes: ['assembly'] },
      transactionStats: { totalCount: 1 },
      dataQuality: { confidence: 0.9 },
      orchestrationOptions
    };
    const orchestrationPlan = { parallelAgents: ['anomaly_detector', 'optimization_advisor'] };
    const coordinationContext = { interactions: [] };

    aiAgentService.anomalyDetectorAgent.mockResolvedValue({ anomalies: [] });
    aiAgentService.optimizationAdvisorAgent.mockResolvedValue({ optimizations: [] });

    const agents = orchestrationService.buildParallelAgentDefinitions(
      analysisContext,
      orchestrationPlan,
      coordinationContext
    );

    expect(agents).toHaveLength(2);
    await agents[0].handler();
    await agents[1].handler();

    expect(aiAgentService.anomalyDetectorAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ orchestrationOptions })
      })
    );
    expect(aiAgentService.optimizationAdvisorAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ orchestrationOptions })
      })
    );
  });

  test('should orchestrate emissions with dynamic sector outputs', async () => {
    const msmeProfile = {
      _id: '507f1f77bcf86cd799439011',
      companyName: 'Test MSME',
      industry: 'manufacturing',
      businessDomain: 'manufacturing',
      companyType: 'small',
      business: { primaryProducts: 'metal parts' },
      contact: { address: { state: 'Karnataka', country: 'India' } },
      environmentalCompliance: {
        hasPollutionControlBoard: true,
        hasEnvironmentalClearance: true
      }
    };

    const transactions = [
      {
        category: 'energy',
        amount: 100,
        description: 'Electricity bill'
      }
    ];

    MSME.findById.mockResolvedValue(msmeProfile);
    AIAgent.find.mockResolvedValue([
      { type: 'sector_profiler', name: 'Sector Profiler' },
      { type: 'process_machinery_profiler', name: 'Process Profiler' },
      { type: 'trend_analyzer', name: 'Trend Analyzer' }
    ]);

    aiAgentService.sectorProfilerAgent.mockResolvedValue({
      sector: 'manufacturing',
      label: 'Manufacturing',
      behaviorWeights: { energy: 1.2 },
      orchestrationPlan: {
        parallelAgents: ['trend_analyzer'],
        outputs: { recommendations: false, report: false }
      }
    });
    aiAgentService.dataPrivacyAgent.mockResolvedValue({
      redactedTransactions: transactions,
      redactionSummary: { totalTransactions: transactions.length }
    });
    aiAgentService.documentAnalyzerAgent.mockResolvedValue({
      derivedTransactions: [],
      summary: { totalDocuments: 0 }
    });
    aiAgentService.processMachineryProfilerAgent.mockResolvedValue({
      processes: ['assembly'],
      machinery: ['cnc_machines'],
      emissionFactors: [{ category: 'energy', value: 0.8 }],
      intensityProfile: { score: 0.4 }
    });
    aiAgentService.dataProcessorAgent.mockResolvedValue({ validated: transactions });
    aiAgentService.carbonAnalyzerAgent.mockResolvedValue({ totalEmissions: 10 });
    aiAgentService.trendAnalyzerAgent.mockResolvedValue({ trends: {} });

    const result = await orchestrationService.orchestrateEmissions({
      msmeId: msmeProfile._id,
      transactions,
      contextOverrides: {
        orchestrationOptions: {
          thresholds: {
            minTransactionsForAnomaly: 100,
            minTransactionsForTrends: 100,
            energyShareHigh: 1.1,
            wasteShareHigh: 1.1,
            transportShareHigh: 1.1,
            materialsShareHigh: 1.1,
            manufacturingShareHigh: 1.1
          },
          orchestration: {
            emitRecommendations: false,
            emitReport: false
          }
        }
      }
    });

    expect(result.processMachineryProfile).toBeDefined();
    expect(result.orchestrationPlan.outputs.recommendations).toBe(false);
    expect(result.agentOutputs.recommendations).toBeNull();
    expect(result.agentOutputs.report).toBeNull();
    expect(aiAgentService.trendAnalyzerAgent).toHaveBeenCalled();
    expect(aiAgentService.anomalyDetectorAgent).not.toHaveBeenCalled();
    expect(aiAgentService.complianceMonitorAgent).not.toHaveBeenCalled();
  });
});
