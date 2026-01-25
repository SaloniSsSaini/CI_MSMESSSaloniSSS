jest.mock('../services/carbonCalculationService', () => ({
  calculateTransactionCarbonFootprint: jest.fn((transaction) => ({
    co2Emissions: Number(transaction.amount || 0) * 0.1,
    emissionFactor: 0.1,
    calculationMethod: 'mock'
  }))
}));

const documentProcessingService = require('../services/documentProcessingService');

describe('Document Processing Service - Itemized Carbon', () => {
  test('should compute item-level carbon and aggregate totals', async () => {
    const extractedData = {
      description: 'Monthly utilities',
      category: 'energy',
      items: [
        { name: 'Electricity charge', quantity: 1, price: 1000, total: 1000 },
        { name: 'Diesel fuel', quantity: 2, price: 500 }
      ]
    };

    const itemFootprints = documentProcessingService.calculateItemCarbonFootprints(extractedData);

    expect(itemFootprints).toHaveLength(2);
    expect(itemFootprints[0].carbonFootprint.co2Emissions).toBeCloseTo(100);
    expect(itemFootprints[1].total).toBe(1000);

    const carbonFootprint = await documentProcessingService.calculateCarbonFootprint({
      ...extractedData,
      items: itemFootprints
    });

    expect(carbonFootprint.co2Emissions).toBeCloseTo(200);
    expect(carbonFootprint.emissionFactor).toBeCloseTo(0.1);
    expect(carbonFootprint.calculationMethod).toBe('document_itemized');
  });
});
