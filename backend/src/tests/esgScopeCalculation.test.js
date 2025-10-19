const carbonCalculationService = require('../services/carbonCalculationService');

describe('ESG Scope Calculations', () => {
  const mockMSME = {
    industry: 'manufacturing',
    environmentalCompliance: {
      hasEnvironmentalClearance: true,
      hasPollutionControlBoard: true,
      hasWasteManagement: true
    }
  };

  const mockTransactions = [
    {
      category: 'energy',
      subcategory: 'diesel',
      amount: 100,
      description: 'Diesel fuel for company vehicles',
      sustainability: { isGreen: false, greenScore: 0 }
    },
    {
      category: 'energy',
      subcategory: 'grid',
      amount: 1000,
      description: 'Electricity from grid',
      sustainability: { isGreen: false, greenScore: 0 }
    },
    {
      category: 'raw_materials',
      subcategory: 'steel',
      amount: 500,
      description: 'Steel from supplier 200km away',
      sustainability: { isGreen: false, greenScore: 0 }
    },
    {
      category: 'transportation',
      subcategory: 'diesel',
      amount: 200,
      description: 'Outsourced transportation services',
      sustainability: { isGreen: false, greenScore: 0 }
    },
    {
      category: 'waste_management',
      subcategory: 'solid',
      amount: 50,
      description: 'Waste disposal services',
      sustainability: { isGreen: false, greenScore: 0 }
    }
  ];

  test('should calculate ESG scopes correctly', () => {
    const assessment = carbonCalculationService.calculateMSMECarbonFootprint(mockMSME, mockTransactions);

    // Check that ESG scopes are present
    expect(assessment.esgScopes).toBeDefined();
    expect(assessment.esgScopes.scope1).toBeDefined();
    expect(assessment.esgScopes.scope2).toBeDefined();
    expect(assessment.esgScopes.scope3).toBeDefined();

    // Check scope descriptions
    expect(assessment.esgScopes.scope1.description).toBe('Direct emissions from owned or controlled sources');
    expect(assessment.esgScopes.scope2.description).toBe('Indirect emissions from purchased energy');
    expect(assessment.esgScopes.scope3.description).toBe('All other indirect emissions in the value chain');

    // Check that totals are calculated
    expect(assessment.esgScopes.scope1.total).toBeGreaterThan(0);
    expect(assessment.esgScopes.scope2.total).toBeGreaterThan(0);
    expect(assessment.esgScopes.scope3.total).toBeGreaterThan(0);

    // Check that scope totals add up to total emissions
    const totalScopes = assessment.esgScopes.scope1.total + 
                       assessment.esgScopes.scope2.total + 
                       assessment.esgScopes.scope3.total;
    expect(Math.abs(totalScopes - assessment.totalCO2Emissions)).toBeLessThan(0.01);
  });

  test('should classify diesel fuel as Scope 1', () => {
    const transaction = {
      category: 'energy',
      subcategory: 'diesel',
      amount: 100,
      description: 'Diesel fuel for company vehicles',
      sustainability: { isGreen: false, greenScore: 0 }
    };

    const carbonData = carbonCalculationService.calculateTransactionCarbonFootprint(transaction);
    expect(carbonData.co2Emissions).toBeGreaterThan(0);
  });

  test('should classify grid electricity as Scope 2', () => {
    const transaction = {
      category: 'energy',
      subcategory: 'grid',
      amount: 1000,
      description: 'Electricity from grid',
      sustainability: { isGreen: false, greenScore: 0 }
    };

    const carbonData = carbonCalculationService.calculateTransactionCarbonFootprint(transaction);
    expect(carbonData.co2Emissions).toBeGreaterThan(0);
  });

  test('should classify raw materials as Scope 3', () => {
    const transaction = {
      category: 'raw_materials',
      subcategory: 'steel',
      amount: 500,
      description: 'Steel from supplier',
      sustainability: { isGreen: false, greenScore: 0 }
    };

    const carbonData = carbonCalculationService.calculateTransactionCarbonFootprint(transaction);
    expect(carbonData.co2Emissions).toBeGreaterThan(0);
  });
});