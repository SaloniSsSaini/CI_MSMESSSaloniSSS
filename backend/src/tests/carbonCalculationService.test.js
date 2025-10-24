const CarbonCalculationService = require('../services/carbonCalculationService');

describe('Carbon Calculation Service', () => {
  let service;

  beforeEach(() => {
    service = CarbonCalculationService;
  });

  describe('calculateTransactionCarbonFootprint', () => {
    test('should calculate energy emissions for grid electricity', () => {
      const transaction = {
        category: 'energy',
        amount: 1000, // kWh
        subcategory: 'grid',
        industry: 'manufacturing',
        sustainability: { isGreen: false, greenScore: 0 }
      };

      const result = service.calculateTransactionCarbonFootprint(transaction);

      expect(result.co2Emissions).toBe(800); // 1000 * 0.8
      expect(result.emissionFactor).toBe(0.8);
      expect(result.calculationMethod).toBe('transaction_analysis');
    });

    test('should calculate energy emissions for renewable electricity', () => {
      const transaction = {
        category: 'energy',
        amount: 1000, // kWh
        subcategory: 'renewable',
        industry: 'manufacturing',
        sustainability: { isGreen: false, greenScore: 0 }
      };

      const result = service.calculateTransactionCarbonFootprint(transaction);

      expect(result.co2Emissions).toBe(100); // 1000 * 0.1
      expect(result.emissionFactor).toBe(0.1);
    });

    test('should calculate fuel emissions for diesel', () => {
      const transaction = {
        category: 'transportation',
        amount: 100, // liters
        subcategory: 'diesel',
        industry: 'manufacturing',
        sustainability: { isGreen: false, greenScore: 0 }
      };

      const result = service.calculateTransactionCarbonFootprint(transaction);

      expect(result.co2Emissions).toBe(268); // 100 * 2.68
      expect(result.emissionFactor).toBe(2.68);
    });

    test('should calculate water emissions', () => {
      const transaction = {
        category: 'water',
        amount: 10000, // liters
        industry: 'manufacturing',
        sustainability: { isGreen: false, greenScore: 0 }
      };

      const result = service.calculateTransactionCarbonFootprint(transaction);

      expect(result.co2Emissions).toBe(4); // 10000 * 0.0004
      expect(result.emissionFactor).toBe(0.0004);
    });

    test('should calculate waste emissions for solid waste', () => {
      const transaction = {
        category: 'waste_management',
        amount: 100, // kg
        subcategory: 'solid',
        industry: 'manufacturing',
        sustainability: { isGreen: false, greenScore: 0 }
      };

      const result = service.calculateTransactionCarbonFootprint(transaction);

      expect(result.co2Emissions).toBe(50); // 100 * 0.5
      expect(result.emissionFactor).toBe(0.5);
    });

    test('should calculate waste emissions for hazardous waste', () => {
      const transaction = {
        category: 'waste_management',
        amount: 50, // kg
        description: 'hazardous waste disposal',
        industry: 'manufacturing',
        sustainability: { isGreen: false, greenScore: 0 }
      };

      const result = service.calculateTransactionCarbonFootprint(transaction);

      expect(result.co2Emissions).toBe(100); // 50 * 2.0
      expect(result.emissionFactor).toBe(2.0);
    });

    test('should calculate material emissions for steel', () => {
      const transaction = {
        category: 'raw_materials',
        amount: 1000, // kg
        subcategory: 'steel',
        industry: 'manufacturing',
        sustainability: { isGreen: false, greenScore: 0 }
      };

      const result = service.calculateTransactionCarbonFootprint(transaction);

      expect(result.co2Emissions).toBe(1850); // 1000 * 1.85
      expect(result.emissionFactor).toBe(1.85);
    });

    test('should apply sustainability factors for green transactions', () => {
      const transaction = {
        category: 'energy',
        amount: 1000,
        subcategory: 'grid',
        industry: 'manufacturing',
        sustainability: { isGreen: true, greenScore: 80 }
      };

      const result = service.calculateTransactionCarbonFootprint(transaction);

      // Should reduce emissions by 40% (80/200)
      expect(result.co2Emissions).toBe(480); // 800 * (1 - 0.4)
    });

    test('should apply industry factors', () => {
      const transaction = {
        category: 'energy',
        amount: 1000,
        subcategory: 'grid',
        industry: 'chemicals', // 1.5x factor
        sustainability: { isGreen: false, greenScore: 0 }
      };

      const result = service.calculateTransactionCarbonFootprint(transaction);

      expect(result.co2Emissions).toBe(1200); // 800 * 1.5
    });
  });

  describe('calculateMSMECarbonFootprint', () => {
    test('should calculate complete MSME carbon footprint', () => {
      const msmeData = {
        companyType: 'micro',
        industry: 'manufacturing',
        environmentalCompliance: {
          hasEnvironmentalClearance: true,
          hasPollutionControlBoard: true,
          hasWasteManagement: true
        }
      };

      const transactions = [
        {
          category: 'energy',
          amount: 1000,
          subcategory: 'grid',
          industry: 'manufacturing',
          sustainability: { isGreen: false, greenScore: 0 }
        },
        {
          category: 'water',
          amount: 5000,
          industry: 'manufacturing',
          sustainability: { isGreen: false, greenScore: 0 }
        },
        {
          category: 'waste_management',
          amount: 100,
          subcategory: 'solid',
          industry: 'manufacturing',
          sustainability: { isGreen: false, greenScore: 0 }
        }
      ];

      const result = service.calculateMSMECarbonFootprint(msmeData, transactions);

      expect(result.totalCO2Emissions).toBe(8054); // 800 + 2 + 50 + industry factor
      expect(result.breakdown.energy.total).toBe(800);
      expect(result.breakdown.water.co2Emissions).toBe(2);
      expect(result.breakdown.waste.total).toBe(50);
      expect(result.carbonScore).toBeGreaterThan(0);
      expect(result.recommendations).toBeDefined();
    });

    test('should calculate ESG scope breakdown', () => {
      const msmeData = {
        companyType: 'micro',
        industry: 'manufacturing',
        environmentalCompliance: {
          hasEnvironmentalClearance: false,
          hasPollutionControlBoard: false,
          hasWasteManagement: false
        }
      };

      const transactions = [
        {
          category: 'energy',
          amount: 1000,
          subcategory: 'grid',
          industry: 'manufacturing',
          sustainability: { isGreen: false, greenScore: 0 }
        },
        {
          category: 'raw_materials',
          amount: 500,
          subcategory: 'steel',
          industry: 'manufacturing',
          sustainability: { isGreen: false, greenScore: 0 }
        }
      ];

      const result = service.calculateMSMECarbonFootprint(msmeData, transactions);

      expect(result.esgScopes.scope1.total).toBe(0); // No direct emissions
      expect(result.esgScopes.scope2.total).toBe(800); // Grid electricity
      expect(result.esgScopes.scope3.total).toBe(925); // Raw materials
    });
  });

  describe('calculateCarbonSavings', () => {
    test('should calculate period savings', () => {
      const msmeData = {
        industry: 'manufacturing',
        companyType: 'micro'
      };

      const currentAssessment = {
        totalCO2Emissions: 1000,
        breakdown: {
          energy: { total: 500 },
          water: { total: 100 },
          waste: { total: 200 },
          transportation: { total: 100 },
          materials: { total: 50 },
          manufacturing: { total: 50 }
        },
        recommendations: [
          { isImplemented: true, potentialCO2Reduction: 100 },
          { isImplemented: false, potentialCO2Reduction: 200 }
        ]
      };

      const previousAssessment = {
        totalCO2Emissions: 1500,
        breakdown: {
          energy: { total: 800 },
          water: { total: 150 },
          waste: { total: 300 },
          transportation: { total: 150 },
          materials: { total: 50 },
          manufacturing: { total: 50 }
        }
      };

      const result = service.calculateCarbonSavings(msmeData, currentAssessment, previousAssessment);

      expect(result.periodSavings).toBe(500); // 1500 - 1000
      expect(result.savingsPercentage).toBeCloseTo(33.33, 2); // (500/1500) * 100
      expect(result.totalSavings).toBe(500);
      expect(result.implementedRecommendations).toBe(1);
      expect(result.potentialSavings).toBe(200);
    });

    test('should calculate category-wise savings', () => {
      const msmeData = {
        industry: 'manufacturing',
        companyType: 'micro'
      };

      const currentAssessment = {
        totalCO2Emissions: 1000,
        breakdown: {
          energy: { total: 500 },
          water: { total: 100 },
          waste: { total: 200 },
          transportation: { total: 100 },
          materials: { total: 50 },
          manufacturing: { total: 50 }
        },
        recommendations: []
      };

      const previousAssessment = {
        totalCO2Emissions: 1500,
        breakdown: {
          energy: { total: 800 },
          water: { total: 150 },
          waste: { total: 300 },
          transportation: { total: 150 },
          materials: { total: 50 },
          manufacturing: { total: 50 }
        }
      };

      const result = service.calculateCarbonSavings(msmeData, currentAssessment, previousAssessment);

      expect(result.categorySavings.energy).toBe(300); // 800 - 500
      expect(result.categorySavings.water).toBe(50); // 150 - 100
      expect(result.categorySavings.waste).toBe(100); // 300 - 200
    });
  });

  describe('generateRecommendations', () => {
    test('should generate energy recommendations for high energy usage', () => {
      const msmeData = {
        industry: 'manufacturing',
        companyType: 'micro'
      };

      const assessment = {
        totalCO2Emissions: 1000,
        breakdown: {
          energy: { total: 600 },
          water: { total: 100 },
          waste: { total: 100 },
          transportation: { total: 100 },
          materials: { total: 50 },
          manufacturing: { total: 50 }
        }
      };

      const recommendations = service.generateRecommendations(assessment, msmeData);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].category).toBe('energy');
      expect(recommendations[0].title).toBe('Switch to Renewable Energy');
      expect(recommendations[0].priority).toBe('high');
    });

    test('should generate waste recommendations for high waste emissions', () => {
      const msmeData = {
        industry: 'manufacturing',
        companyType: 'micro'
      };

      const assessment = {
        totalCO2Emissions: 1000,
        breakdown: {
          energy: { total: 200 },
          water: { total: 100 },
          waste: { total: 150 },
          transportation: { total: 100 },
          materials: { total: 200 },
          manufacturing: { total: 250 }
        }
      };

      const recommendations = service.generateRecommendations(assessment, msmeData);

      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].category).toBe('waste');
      expect(recommendations[0].title).toBe('Improve Waste Recycling');
    });
  });

  describe('getIndustryBenchmarks', () => {
    test('should return correct benchmarks for manufacturing micro enterprise', () => {
      const benchmarks = service.getIndustryBenchmarks('manufacturing', 'micro');

      expect(benchmarks.average).toBe(3.0); // 2.5 * 1.2
      expect(benchmarks.bestInClass).toBe(1.44); // 1.2 * 1.2
    });

    test('should return correct benchmarks for chemicals small enterprise', () => {
      const benchmarks = service.getIndustryBenchmarks('chemicals', 'small');

      expect(benchmarks.average).toBe(4.5); // 4.5 * 1.0
      expect(benchmarks.bestInClass).toBe(2.8); // 2.8 * 1.0
    });
  });

  describe('calculatePerformanceLevel', () => {
    test('should return excellent for low emissions', () => {
      const performance = service.calculatePerformanceLevel(100, { average: 200, bestInClass: 100 });
      expect(performance).toBe('excellent');
    });

    test('should return good for below average emissions', () => {
      const performance = service.calculatePerformanceLevel(150, { average: 200, bestInClass: 100 });
      expect(performance).toBe('good');
    });

    test('should return average for average emissions', () => {
      const performance = service.calculatePerformanceLevel(200, { average: 200, bestInClass: 100 });
      expect(performance).toBe('average');
    });

    test('should return poor for high emissions', () => {
      const performance = service.calculatePerformanceLevel(300, { average: 200, bestInClass: 100 });
      expect(performance).toBe('poor');
    });
  });

  describe('generateAchievements', () => {
    test('should generate carbon reduction achievements', () => {
      const msmeData = {
        industry: 'manufacturing',
        companyType: 'micro'
      };

      const savings = {
        savingsPercentage: 25,
        periodSavings: 500,
        implementedRecommendations: 3
      };

      const assessment = {
        carbonScore: 85
      };

      const achievements = service.generateAchievements(savings, assessment, msmeData);

      expect(achievements).toHaveLength(3);
      expect(achievements[0].type).toBe('carbon_reduction');
      expect(achievements[0].title).toBe('Carbon Reduction Champion');
      expect(achievements[0].level).toBe('gold');
    });
  });

  describe('generateNextMilestones', () => {
    test('should generate appropriate milestones', () => {
      const msmeData = {
        industry: 'manufacturing',
        companyType: 'micro'
      };

      const savings = {
        savingsPercentage: 15,
        implementedRecommendations: 2
      };

      const assessment = {
        carbonScore: 75
      };

      const milestones = service.generateNextMilestones(savings, assessment, msmeData);

      expect(milestones).toHaveLength(3);
      expect(milestones[0].type).toBe('carbon_reduction');
      expect(milestones[0].targetValue).toBe(20);
      expect(milestones[1].type).toBe('recommendations');
      expect(milestones[1].targetValue).toBe(4);
      expect(milestones[2].type).toBe('score');
      expect(milestones[2].targetValue).toBe(85);
    });
  });
});
