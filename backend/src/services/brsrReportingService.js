const PRINCIPLE_TITLES = [
  'Principle 1: Businesses should conduct and govern themselves with integrity and in a manner that is Ethical, Transparent and Accountable',
  'Principle 2: Businesses should provide goods and services in a manner that is sustainable and safe',
  'Principle 3: Businesses should respect and promote the well-being of all employees, including those in their value chains',
  'Principle 4: Businesses should respect the interests of and be responsive to all their stakeholders',
  'Principle 5: Businesses should respect and promote human rights',
  'Principle 6: Businesses should respect and make efforts to protect and restore the environment',
  'Principle 7: Businesses, when engaging in influencing public and regulatory policy, should do so in a manner that is responsible and transparent',
  'Principle 8: Businesses should promote inclusive growth and equitable development',
  'Principle 9: Businesses should engage with and provide value to their consumers in a responsible manner'
];

const roundTo = (value, decimals = 2) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round(numeric * factor) / factor;
};

const asNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const extractEmissionValue = (value) => {
  if (value && typeof value === 'object') {
    return asNumber(
      value.co2Emissions ??
      value.total ??
      value.value ??
      value.generated
    );
  }
  return asNumber(value);
};

const ensureDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getFinancialYear = (referenceDate = new Date()) => {
  const date = ensureDate(referenceDate) || new Date();
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 3) {
    return `FY ${year}-${String(year + 1).slice(-2)}`;
  }
  return `FY ${year - 1}-${String(year).slice(-2)}`;
};

const normalizeScopeTotals = (assessment = {}) => {
  const totalCO2Emissions = asNumber(assessment.totalCO2Emissions);
  const esgScopes = assessment.esgScopes || {};

  const explicitScope1 = asNumber(esgScopes?.scope1?.total);
  const explicitScope2 = asNumber(esgScopes?.scope2?.total);
  const explicitScope3 = asNumber(esgScopes?.scope3?.total);
  const hasExplicitScopes = explicitScope1 > 0 || explicitScope2 > 0 || explicitScope3 > 0;

  const inferredScope1 = extractEmissionValue(assessment?.breakdown?.energy?.fuel);
  const inferredScope2 = extractEmissionValue(assessment?.breakdown?.energy?.electricity);

  const scope1 = hasExplicitScopes ? explicitScope1 : inferredScope1;
  const scope2 = hasExplicitScopes ? explicitScope2 : inferredScope2;
  const residualScope3 = Math.max(0, totalCO2Emissions - scope1 - scope2);
  const scope3 = hasExplicitScopes ? explicitScope3 : residualScope3;

  const totalScopes = scope1 + scope2 + scope3;
  const denominator = totalScopes > 0 ? totalScopes : totalCO2Emissions;

  return {
    scope1: roundTo(scope1, 2),
    scope2: roundTo(scope2, 2),
    scope3: roundTo(scope3, 2),
    totalScopes: roundTo(totalScopes, 2),
    percentages: {
      scope1: denominator > 0 ? roundTo((scope1 / denominator) * 100, 2) : 0,
      scope2: denominator > 0 ? roundTo((scope2 / denominator) * 100, 2) : 0,
      scope3: denominator > 0 ? roundTo((scope3 / denominator) * 100, 2) : 0
    }
  };
};

const getComplianceChecklist = ({ msme = {}, scopeTotals, assessment }) => {
  const mandatoryFields = {
    companyName: Boolean(msme.companyName),
    industry: Boolean(msme.industry),
    reportingPeriod: Boolean(assessment?.period?.startDate && assessment?.period?.endDate),
    totalCO2Emissions: asNumber(assessment?.totalCO2Emissions) >= 0,
    scope1Disclosed: scopeTotals.scope1 >= 0,
    scope2Disclosed: scopeTotals.scope2 >= 0,
    scope3Disclosed: scopeTotals.scope3 >= 0
  };

  const completedCount = Object.values(mandatoryFields).filter(Boolean).length;
  const completenessScore = roundTo((completedCount / Object.keys(mandatoryFields).length) * 100, 1);

  return {
    mandatoryFields,
    completenessScore,
    isBRSRCompliant: completenessScore >= 80
  };
};

const buildPrincipleWisePerformance = ({
  scopeTotals,
  assessment = {},
  transactions = [],
  totalCO2Emissions = 0
}) => {
  const renewableTransactions = transactions.filter(
    transaction => transaction?.category === 'energy' && transaction?.subcategory === 'renewable'
  ).length;

  const environmentalIndicators = {
    totalGHGEmissions: roundTo(totalCO2Emissions, 2),
    scopeEmissions: {
      scope1: scopeTotals.scope1,
      scope2: scopeTotals.scope2,
      scope3: scopeTotals.scope3
    },
    scopeContributionPercent: scopeTotals.percentages,
    renewableEnergyTransactions: renewableTransactions,
    wasteEmissions: roundTo(extractEmissionValue(assessment?.breakdown?.waste?.total), 2),
    waterEmissions: roundTo(extractEmissionValue(assessment?.breakdown?.water?.co2Emissions), 2)
  };

  return PRINCIPLE_TITLES.map((title, index) => {
    const principleNumber = index + 1;

    if (principleNumber === 6) {
      return {
        principle: principleNumber,
        title,
        status: totalCO2Emissions > 0 ? 'reported' : 'limited_data',
        indicators: environmentalIndicators
      };
    }

    return {
      principle: principleNumber,
      title,
      status: 'disclosed',
      indicators: {}
    };
  });
};

const buildBRSRReport = ({
  msme = {},
  assessment = {},
  transactions = [],
  requestedPeriod = 'annual',
  generatedAt = new Date()
}) => {
  const periodStart = ensureDate(assessment?.period?.startDate);
  const periodEnd = ensureDate(assessment?.period?.endDate);

  const totalCO2Emissions = asNumber(assessment?.totalCO2Emissions);
  const scopeTotals = normalizeScopeTotals(assessment);

  const annualTurnover = asNumber(msme?.business?.annualTurnover);
  const employeeCount = asNumber(msme?.business?.numberOfEmployees);

  const emissionsPerINRMillionTurnover = annualTurnover > 0
    ? roundTo(totalCO2Emissions / (annualTurnover / 1000000), 2)
    : null;
  const emissionsPerEmployee = employeeCount > 0
    ? roundTo(totalCO2Emissions / employeeCount, 2)
    : null;

  const compliance = getComplianceChecklist({ msme, scopeTotals, assessment });

  const principleWisePerformance = buildPrincipleWisePerformance({
    scopeTotals,
    assessment,
    transactions,
    totalCO2Emissions
  });

  return {
    reportType: 'BRSR',
    framework: 'SEBI_BRSR',
    standardVersion: 'BRSR Core',
    generatedAt: new Date(generatedAt).toISOString(),
    reportingPeriod: {
      requestedPeriod,
      startDate: periodStart ? periodStart.toISOString() : null,
      endDate: periodEnd ? periodEnd.toISOString() : null,
      financialYear: getFinancialYear(periodEnd || generatedAt)
    },
    organization: {
      companyName: msme?.companyName || 'MSME',
      companyType: msme?.companyType || 'small',
      industry: msme?.industry || 'General',
      businessDomain: msme?.businessDomain || 'other',
      state: msme?.contact?.address?.state || 'Unknown',
      country: msme?.contact?.address?.country || 'India',
      primaryProducts: msme?.business?.primaryProducts || null
    },
    sectionA: {
      generalDisclosures: {
        listedEntity: false,
        turnoverINR: annualTurnover,
        employeeCount,
        manufacturingUnits: asNumber(msme?.business?.manufacturingUnits),
        environmentalCompliance: {
          hasEnvironmentalClearance: Boolean(msme?.environmentalCompliance?.hasEnvironmentalClearance),
          hasPollutionControlBoard: Boolean(msme?.environmentalCompliance?.hasPollutionControlBoard),
          hasWasteManagement: Boolean(msme?.environmentalCompliance?.hasWasteManagement)
        }
      }
    },
    sectionB: {
      managementAndProcessDisclosures: {
        policyCommitments: PRINCIPLE_TITLES.map((title, index) => ({
          principle: index + 1,
          title,
          policyAvailable: true,
          approvedByBoard: false
        })),
        governance: {
          carbonScore: asNumber(assessment?.carbonScore),
          recommendationsCount: Array.isArray(assessment?.recommendations)
            ? assessment.recommendations.length
            : 0
        }
      }
    },
    sectionC: {
      principleWisePerformance
    },
    environmental: {
      greenhouseGasEmissions: {
        unit: 'kgCO2e',
        scope1: scopeTotals.scope1,
        scope2: scopeTotals.scope2,
        scope3: scopeTotals.scope3,
        total: roundTo(totalCO2Emissions, 2),
        scopeContributionPercent: scopeTotals.percentages,
        intensity: {
          perINRMillionTurnover: emissionsPerINRMillionTurnover,
          perEmployee: emissionsPerEmployee
        }
      },
      energy: {
        electricityEmissions: roundTo(extractEmissionValue(assessment?.breakdown?.energy?.electricity), 2),
        fuelEmissions: roundTo(extractEmissionValue(assessment?.breakdown?.energy?.fuel), 2),
        totalEnergyEmissions: roundTo(extractEmissionValue(assessment?.breakdown?.energy?.total), 2)
      },
      water: {
        consumption: roundTo(asNumber(assessment?.breakdown?.water?.consumption), 2),
        emissions: roundTo(extractEmissionValue(assessment?.breakdown?.water?.co2Emissions), 2)
      },
      waste: {
        totalEmissions: roundTo(extractEmissionValue(assessment?.breakdown?.waste?.total), 2),
        hazardousEmissions: roundTo(extractEmissionValue(assessment?.breakdown?.waste?.hazardous), 2),
        solidEmissions: roundTo(extractEmissionValue(assessment?.breakdown?.waste?.solid), 2)
      }
    },
    compliance
  };
};

module.exports = {
  buildBRSRReport,
  normalizeScopeTotals
};
