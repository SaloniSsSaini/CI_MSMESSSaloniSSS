jest.mock('../services/carbonCalculationService', () => ({
  calculateTransactionCarbonFootprint: jest.fn((transaction) => ({
    co2Emissions: Number(transaction.amount || 0) * 0.1,
    emissionFactor: 0.1,
    calculationMethod: 'mock'
  })),
  calculateMSMECarbonFootprint: jest.fn((msmeData, transactions) => ({
    totalCO2Emissions: transactions.reduce((sum, txn) => sum + (Number(txn.amount) || 0) * 0.1, 0),
    breakdown: {
      energy: { electricity: 0, fuel: 0, total: 0 },
      water: { consumption: 0, co2Emissions: 0 },
      waste: { solid: 0, hazardous: 0, total: 0 },
      transportation: { distance: 0, co2Emissions: 0, vehicleCount: 0, fuelEfficiency: 0 },
      materials: { consumption: 0, co2Emissions: 0, type: 'mixed', supplierDistance: 0 },
      manufacturing: { productionVolume: 0, co2Emissions: 0, efficiency: 0, equipmentAge: 0 }
    },
    esgScopes: {
      scope1: { total: 10 },
      scope2: { total: 0 },
      scope3: { total: 0 },
      scope4: { total: 0 }
    },
    carbonScore: 88,
    recommendations: [{ category: 'energy', title: 'Mock Recommendation' }]
  })),
  resolveRegion: jest.fn(() => 'north-india')
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

  test('should build document carbon analysis with category breakdown', async () => {
    const document = {
      msmeId: 'msme123',
      documentType: 'bill',
      _id: 'doc123',
      fileName: 'doc.pdf',
      originalName: 'doc.pdf'
    };
    const extractedData = {
      description: 'Utility charges',
      currency: 'INR',
      date: new Date(),
      vendor: { name: 'Utility Provider' }
    };
    const itemFootprints = [
      {
        name: 'Electricity charge',
        total: 1000,
        category: 'energy',
        subcategory: 'grid',
        carbonFootprint: { co2Emissions: 100 }
      },
      {
        name: 'Water charge',
        total: 500,
        category: 'water',
        subcategory: 'general',
        carbonFootprint: { co2Emissions: 50 }
      }
    ];
    const msmeProfile = {
      industry: 'services',
      businessDomain: 'services',
      contact: { address: { state: 'Delhi', country: 'India' } }
    };

    const analysis = await documentProcessingService.calculateDocumentCarbonAnalysis(
      document,
      extractedData,
      itemFootprints,
      msmeProfile
    );

    expect(analysis).toBeTruthy();
    expect(analysis.totalAmount).toBe(1500);
    expect(analysis.transactionCount).toBe(2);
    expect(analysis.categoryBreakdown.energy.count).toBe(1);
    expect(analysis.categoryBreakdown.energy.emissions).toBeCloseTo(100);
    expect(analysis.carbonScore).toBe(88);
  });

  test('should calculate bill/receipt carbon analysis from pdf extraction', async () => {
    const originalAdvancedService = documentProcessingService.advancedCarbonCalculationService;
    documentProcessingService.advancedCarbonCalculationService = {
      calculateAdvancedCarbonFootprint: jest.fn().mockResolvedValue({
        totalCO2Emissions: 800,
        breakdown: {
          energy: { co2: 800, percentage: 100 }
        },
        scopeBreakdown: {
          scope1: { co2: 200, percentage: 25 },
          scope2: { co2: 600, percentage: 75 },
          scope3: { co2: 0, percentage: 0 }
        },
        carbonScore: 72,
        recommendations: [{ category: 'energy', title: 'Test Recommendation' }]
      })
    };

    try {
      const document = {
        msmeId: 'msme123',
        documentType: 'bill'
      };
      const extractedData = { amount: 5000, currency: 'INR' };
      const carbonExtraction = {
        extractedData: {
          carbonRelevant: true,
          energy: { electricity: { consumption: 1000 }, fuel: { consumption: 0 }, renewable: { percentage: 0 } },
          materials: { rawMaterials: { quantity: 0 }, packaging: { quantity: 0 } },
          transportation: { distance: 0, fuelConsumption: 0 },
          waste: { solid: { quantity: 0 }, hazardous: { quantity: 0 } },
          water: { consumption: 0 }
        }
      };
      const msmeProfile = { industry: 'services', businessDomain: 'services' };

      const analysis = await documentProcessingService.calculateBillReceiptCarbonAnalysis(
        document,
        extractedData,
        carbonExtraction,
        msmeProfile
      );

      expect(analysis).toBeTruthy();
      expect(analysis.totalCO2Emissions).toBe(800);
      expect(analysis.totalAmount).toBe(5000);
      expect(analysis.categoryBreakdown.energy.emissions).toBe(800);
      expect(analysis.carbonScore).toBe(72);
      expect(documentProcessingService.advancedCarbonCalculationService.calculateAdvancedCarbonFootprint).toHaveBeenCalled();
    } finally {
      documentProcessingService.advancedCarbonCalculationService = originalAdvancedService;
    }
  });
});
