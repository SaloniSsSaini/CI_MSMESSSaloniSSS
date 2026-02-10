const { buildBRSRReport, normalizeScopeTotals } = require('../services/brsrReportingService');

describe('BRSR Reporting Service', () => {
  test('should build BRSR report with scope 1, 2 and 3 metrics', () => {
    const msme = {
      companyName: 'Green Metals MSME',
      companyType: 'small',
      industry: 'manufacturing',
      businessDomain: 'manufacturing',
      business: {
        annualTurnover: 50000000,
        numberOfEmployees: 120,
        manufacturingUnits: 2,
        primaryProducts: 'Steel components'
      },
      contact: {
        address: {
          state: 'Gujarat',
          country: 'India'
        }
      },
      environmentalCompliance: {
        hasEnvironmentalClearance: true,
        hasPollutionControlBoard: true,
        hasWasteManagement: true
      }
    };

    const assessment = {
      period: {
        startDate: new Date('2025-04-01T00:00:00Z'),
        endDate: new Date('2026-03-31T23:59:59Z')
      },
      totalCO2Emissions: 1500,
      carbonScore: 78,
      esgScopes: {
        scope1: {
          total: 400,
          breakdown: {
            directFuel: 300,
            directTransport: 70,
            directManufacturing: 30
          }
        },
        scope2: {
          total: 500,
          breakdown: {
            electricity: 500
          }
        },
        scope3: {
          total: 600,
          breakdown: {
            purchasedGoods: 350,
            transportation: 170,
            wasteDisposal: 60,
            other: 20
          }
        }
      },
      breakdown: {
        energy: { electricity: 500, fuel: 400, total: 900 },
        water: { consumption: 12000, co2Emissions: 6 },
        waste: { solid: 50, hazardous: 20, total: 70 },
        transportation: { co2Emissions: 170 },
        materials: { co2Emissions: 350 }
      },
      recommendations: [{ title: 'Switch to renewable energy' }]
    };

    const transactions = [
      { category: 'energy', subcategory: 'renewable' },
      { category: 'energy', subcategory: 'grid' },
      { category: 'transportation', subcategory: 'diesel' }
    ];

    const report = buildBRSRReport({
      msme,
      assessment,
      transactions,
      requestedPeriod: 'annual'
    });

    expect(report.reportType).toBe('BRSR');
    expect(report.framework).toBe('SEBI_BRSR');
    expect(report.environmental.greenhouseGasEmissions.scope1).toBe(400);
    expect(report.environmental.greenhouseGasEmissions.scope2).toBe(500);
    expect(report.environmental.greenhouseGasEmissions.scope3).toBe(600);
    expect(report.environmental.greenhouseGasEmissions.total).toBe(1500);
    expect(report.compliance.isBRSRCompliant).toBe(true);

    const principle6 = report.sectionC.principleWisePerformance.find(
      entry => entry.principle === 6
    );
    expect(principle6).toBeDefined();
    expect(principle6.indicators.scopeEmissions.scope1).toBe(400);
    expect(principle6.indicators.scopeEmissions.scope2).toBe(500);
    expect(principle6.indicators.scopeEmissions.scope3).toBe(600);
  });

  test('should infer scope totals from category breakdown when esg scopes are absent', () => {
    const scopeTotals = normalizeScopeTotals({
      totalCO2Emissions: 120,
      breakdown: {
        energy: {
          fuel: 30,
          electricity: 40
        }
      }
    });

    expect(scopeTotals.scope1).toBe(30);
    expect(scopeTotals.scope2).toBe(40);
    expect(scopeTotals.scope3).toBe(50);
    expect(scopeTotals.totalScopes).toBe(120);
    expect(scopeTotals.percentages.scope1).toBe(25);
    expect(scopeTotals.percentages.scope2).toBeCloseTo(33.33, 2);
    expect(scopeTotals.percentages.scope3).toBeCloseTo(41.67, 2);
  });

  test('should mark BRSR compliance as incomplete when mandatory metadata is missing', () => {
    const report = buildBRSRReport({
      msme: {},
      assessment: {
        totalCO2Emissions: 0,
        breakdown: {}
      },
      transactions: [],
      requestedPeriod: 'annual'
    });

    expect(report.compliance.isBRSRCompliant).toBe(false);
    expect(report.compliance.completenessScore).toBeLessThan(80);
  });
});
