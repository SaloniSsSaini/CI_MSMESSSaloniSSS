const dataProcessorAgent = require('../services/agents/dataProcessorAgent');

describe('Data Processor Agent - Learning and Uncertainty Handling', () => {
  beforeEach(() => {
    dataProcessorAgent.resetLearning();
  });

  test('should learn new keywords from confirmed transactions', async () => {
    const trainingResult = await dataProcessorAgent.processTransactions([{
      description: 'Biomass pellet procurement',
      category: 'energy',
      transactionType: 'utility',
      amount: 1200,
      date: new Date(),
      source: 'manual'
    }]);

    expect(trainingResult.statistics.autoLearnedCategories).toBeGreaterThan(0);

    const result = await dataProcessorAgent.processTransactions([{
      description: 'Biomass pellet delivery',
      amount: 800,
      date: new Date()
    }]);

    expect(result.classified[0].category).toBe('energy');
  });

  test('should request documents when classification is uncertain', async () => {
    const result = await dataProcessorAgent.processTransactions([{
      description: 'Adjustment note applied',
      amount: 450,
      date: new Date()
    }]);

    expect(result.documentRequests).toHaveLength(1);
    expect(result.documentRequests[0].message).toMatch(/upload/i);
    expect(result.classified[0].processingMetadata.needsReview).toBe(true);
  });

  test('should skip document requests when documents are provided', async () => {
    const result = await dataProcessorAgent.processTransactions([{
      description: 'Adjustment note applied',
      amount: 450,
      date: new Date()
    }], {
      documents: [{ id: 'doc-1' }]
    });

    expect(result.documentRequests).toHaveLength(0);
  });

  test('should fallback category from transaction type', async () => {
    const result = await dataProcessorAgent.processTransactions([{
      description: 'Monthly billing charge',
      transactionType: 'utility',
      amount: 600,
      date: new Date()
    }]);

    expect(result.classified[0].category).toBe('energy');
    expect(result.classified[0].processingMetadata.classification.category.source).toBe('fallback');
  });

  test('should throw for invalid transaction input', async () => {
    await expect(dataProcessorAgent.processTransactions(null)).rejects.toThrow('Transactions input must be an array');
  });
});
