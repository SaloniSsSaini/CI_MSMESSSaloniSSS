const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MSME = require('../models/MSME');

// Mock data - in production, this would come from database
const carbonData = [
  { month: 'Jan', carbonFootprint: 45.2, target: 40, reduction: 2.1 },
  { month: 'Feb', carbonFootprint: 42.8, target: 40, reduction: 3.2 },
  { month: 'Mar', carbonFootprint: 38.5, target: 40, reduction: 4.8 },
  { month: 'Apr', carbonFootprint: 35.2, target: 40, reduction: 6.1 },
  { month: 'May', carbonFootprint: 32.8, target: 40, reduction: 7.5 },
  { month: 'Jun', carbonFootprint: 29.5, target: 40, reduction: 9.2 }
];

const categoryData = [
  { name: 'Energy', value: 35, color: '#8884d8' },
  { name: 'Transportation', value: 25, color: '#82ca9d' },
  { name: 'Waste', value: 20, color: '#ffc658' },
  { name: 'Water', value: 15, color: '#ff7300' },
  { name: 'Materials', value: 5, color: '#00ff00' }
];

const trendData = [
  { period: 'This Month', current: 29.5, previous: 32.8, change: -10.1 },
  { period: 'This Quarter', current: 101.5, previous: 115.2, change: -11.9 },
  { period: 'This Year', current: 223.8, previous: 245.6, change: -8.9 }
];

const recommendations = [
  {
    id: 1,
    title: 'Switch to LED Lighting',
    impact: 'High',
    cost: 'Low',
    savings: '15% energy reduction',
    status: 'Not Implemented',
    priority: 1,
    estimatedCO2Reduction: 50,
    estimatedSavings: 15000,
    implementationTime: '1-2 weeks'
  },
  {
    id: 2,
    title: 'Install Solar Panels',
    impact: 'Very High',
    cost: 'High',
    savings: '40% energy reduction',
    status: 'In Progress',
    priority: 2,
    estimatedCO2Reduction: 200,
    estimatedSavings: 50000,
    implementationTime: '3-6 months'
  },
  {
    id: 3,
    title: 'Implement Waste Segregation',
    impact: 'Medium',
    cost: 'Low',
    savings: '20% waste reduction',
    status: 'Completed',
    priority: 3,
    estimatedCO2Reduction: 30,
    estimatedSavings: 10000,
    implementationTime: '2-4 weeks'
  },
  {
    id: 4,
    title: 'Use Electric Vehicles',
    impact: 'High',
    cost: 'Medium',
    savings: '30% transport emissions',
    status: 'Not Implemented',
    priority: 4,
    estimatedCO2Reduction: 80,
    estimatedSavings: 25000,
    implementationTime: '1-3 months'
  }
];

const cbamGoodsCatalog = [
  {
    id: 'iron_steel',
    name: 'Iron & Steel Products',
    hsCode: '7208',
    baseIntensity: 2.1,
    baseVolume: 48,
    scope: 'Scope 1+2',
    category: 'steel',
    dataQuality: 'estimated'
  },
  {
    id: 'aluminum_profiles',
    name: 'Aluminum Profiles',
    hsCode: '7604',
    baseIntensity: 8.6,
    baseVolume: 18,
    scope: 'Scope 1+2',
    category: 'aluminum',
    dataQuality: 'supplier'
  },
  {
    id: 'cement_clinker',
    name: 'Cement Clinker',
    hsCode: '2523',
    baseIntensity: 0.86,
    baseVolume: 32,
    scope: 'Scope 1+2',
    category: 'cement',
    dataQuality: 'estimated'
  },
  {
    id: 'nitrogen_fertilizers',
    name: 'Nitrogen Fertilizers',
    hsCode: '3102',
    baseIntensity: 2.5,
    baseVolume: 14,
    scope: 'Scope 1+2',
    category: 'fertilizer',
    dataQuality: 'primary'
  },
  {
    id: 'hydrogen',
    name: 'Hydrogen',
    hsCode: '2804',
    baseIntensity: 10.0,
    baseVolume: 6,
    scope: 'Scope 1+2',
    category: 'hydrogen',
    dataQuality: 'estimated'
  },
  {
    id: 'electricity',
    name: 'Electricity',
    hsCode: '2716',
    baseIntensity: 0.45,
    baseVolume: 80,
    scope: 'Scope 2',
    category: 'electricity',
    dataQuality: 'estimated'
  }
];

const cbamKeywordMap = [
  { category: 'steel', keywords: ['steel', 'iron', 'metal'] },
  { category: 'aluminum', keywords: ['aluminum', 'aluminium', 'bauxite'] },
  { category: 'cement', keywords: ['cement', 'clinker'] },
  { category: 'fertilizer', keywords: ['fertilizer', 'fertiliser', 'ammonia'] },
  { category: 'hydrogen', keywords: ['hydrogen', 'electrolysis'] },
  { category: 'electricity', keywords: ['electricity', 'power', 'energy'] }
];

const getCompanyScale = (companyType) => {
  switch (companyType) {
    case 'micro':
      return 0.6;
    case 'small':
      return 0.85;
    case 'medium':
      return 1.15;
    default:
      return 0.9;
  }
};

const roundTo = (value, decimals = 1) => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

const sumBy = (items, selector) => items.reduce((sum, item) => sum + selector(item), 0);

const getQuarterLabel = (year, quarter) => `Q${quarter} ${year}`;

const getRecentQuarters = (count) => {
  const now = new Date();
  let year = now.getFullYear();
  let quarter = Math.floor(now.getMonth() / 3) + 1;
  const quarters = [];

  for (let i = 0; i < count; i += 1) {
    quarters.unshift({ year, quarter });
    quarter -= 1;
    if (quarter === 0) {
      quarter = 4;
      year -= 1;
    }
  }

  return quarters;
};

const getNextCbamDeadline = () => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const year = now.getFullYear();
  const dueMonthMap = { 1: 3, 2: 6, 3: 9, 4: 0 };
  const dueMonth = dueMonthMap[quarter];
  const dueYear = quarter === 4 ? year + 1 : year;
  return new Date(dueYear, dueMonth + 1, 0);
};

const buildCbamReport = (msme, period = 'quarter') => {
  const profileText = `${msme?.industry || ''} ${msme?.business?.primaryProducts || ''}`.toLowerCase();
  const matchedCategories = new Set();
  cbamKeywordMap.forEach(({ category, keywords }) => {
    if (keywords.some(keyword => profileText.includes(keyword))) {
      matchedCategories.add(category);
    }
  });

  const isExporter = msme?.businessDomain === 'export_import' || msme?.businessDomain === 'manufacturing';
  const companyScale = getCompanyScale(msme?.companyType);
  const baseGoods = cbamGoodsCatalog.filter(good => matchedCategories.has(good.category));
  const selectedGoods = baseGoods.length > 0 ? baseGoods : cbamGoodsCatalog.slice(0, 2);
  const carbonPriceEUR = 90;

  const goods = isExporter ? selectedGoods.map((good, index) => {
    const exportVolumeTonnes = roundTo(good.baseVolume * companyScale * (1 + index * 0.05), 1);
    const embeddedEmissions = roundTo(exportVolumeTonnes * good.baseIntensity, 1);
    const emissionIntensity = exportVolumeTonnes > 0 ? roundTo(embeddedEmissions / exportVolumeTonnes, 2) : 0;
    const estimatedLiabilityEUR = Math.round(embeddedEmissions * carbonPriceEUR);
    const reportingStatus = index === 0 ? 'submitted' : index === 1 ? 'in_progress' : 'pending';

    return {
      id: good.id,
      name: good.name,
      hsCode: good.hsCode,
      exportVolumeTonnes,
      embeddedEmissions,
      emissionIntensity,
      scope: good.scope,
      dataQuality: good.dataQuality,
      reportingStatus,
      carbonPriceEUR,
      estimatedLiabilityEUR
    };
  }) : [];

  const totalEmbeddedEmissions = roundTo(sumBy(goods, item => item.embeddedEmissions), 1);
  const totalExportVolume = roundTo(sumBy(goods, item => item.exportVolumeTonnes), 1);
  const estimatedLiabilityEUR = Math.round(sumBy(goods, item => item.estimatedLiabilityEUR));
  const coveredGoodsCount = goods.length;

  const documentation = [
    { id: 'importer', title: 'EU importer declaration', status: isExporter ? 'in_progress' : 'missing', owner: 'Finance' },
    { id: 'supplier', title: 'Supplier emission factors', status: isExporter ? 'missing' : 'missing', owner: 'Procurement' },
    { id: 'production', title: 'Production emissions ledger', status: isExporter ? 'in_progress' : 'missing', owner: 'Operations' },
    { id: 'transport', title: 'Transport emissions evidence', status: isExporter ? 'complete' : 'missing', owner: 'Logistics' },
    { id: 'verification', title: 'Third-party verification plan', status: isExporter ? 'missing' : 'missing', owner: 'Compliance' }
  ];

  const docComplete = documentation.filter(item => item.status === 'complete').length;
  const docInProgress = documentation.filter(item => item.status === 'in_progress').length;
  const readinessScore = isExporter
    ? Math.round(((docComplete + docInProgress * 0.5) / documentation.length) * 100)
    : 0;
  const complianceStatus = !isExporter
    ? 'Not Required'
    : readinessScore >= 80
      ? 'On Track'
      : readinessScore >= 50
        ? 'Needs Attention'
        : 'At Risk';

  const exposureLevel = !isExporter
    ? 'None'
    : totalEmbeddedEmissions > 150
      ? 'High'
      : totalEmbeddedEmissions > 80
        ? 'Medium'
        : 'Low';

  const periodConfig = {
    month: 1,
    quarter: 2,
    '3months': 2,
    '6months': 2,
    'half-year': 2,
    year: 4,
    '1year': 4
  };
  const trendPoints = periodConfig[period] || 2;
  const quarters = getRecentQuarters(trendPoints);
  const emissionsTrend = goods.length > 0
    ? quarters.map((quarterItem, index) => {
      const weight = 1 - (trendPoints - 1 - index) * 0.04;
      const embeddedEmissions = roundTo(totalEmbeddedEmissions * weight, 1);
      const exportVolume = roundTo(totalExportVolume * weight, 1);
      return {
        period: getQuarterLabel(quarterItem.year, quarterItem.quarter),
        embeddedEmissions,
        exportVolume,
        estimatedLiabilityEUR: Math.round(embeddedEmissions * carbonPriceEUR)
      };
    })
    : [];

  const recommendations = [];
  if (!isExporter) {
    recommendations.push('No EU CBAM reporting required for the current business domain. Update export markets if this changes.');
  } else {
    recommendations.push('Request supplier-specific emission factors for high-intensity materials.');
    recommendations.push('Finalize EU importer declarations ahead of the next reporting deadline.');
    recommendations.push('Align production emissions ledger with CBAM scope 1+2 guidance.');
    recommendations.push('Schedule third-party verification before the next submission window.');
  }

  const nextDeadline = getNextCbamDeadline();

  return {
    overview: {
      reportingPeriod: getQuarterLabel(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) + 1),
      nextDeadline: nextDeadline.toISOString(),
      lastSubmitted: isExporter ? new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() : null,
      exposureLevel,
      complianceStatus,
      totalEmbeddedEmissions,
      totalExportVolume,
      estimatedLiabilityEUR,
      readinessScore,
      coveredGoodsCount
    },
    goods,
    emissionsTrend,
    documentation,
    recommendations,
    msmeProfile: {
      companyName: msme?.companyName || 'MSME',
      companyType: msme?.companyType || 'small',
      industry: msme?.industry || 'General',
      businessDomain: msme?.businessDomain || 'services'
    }
  };
};

// Get carbon footprint data
router.get('/carbon-footprint', auth, (req, res) => {
  try {
    const { period = '6months' } = req.query;
    
    let filteredData = carbonData;
    
    // Filter data based on period
    switch (period) {
      case '1month':
        filteredData = carbonData.slice(-1);
        break;
      case '3months':
        filteredData = carbonData.slice(-3);
        break;
      case '6months':
        filteredData = carbonData;
        break;
      case '1year':
        // Mock data for 12 months
        filteredData = [
          ...carbonData,
          { month: 'Jul', carbonFootprint: 28.2, target: 40, reduction: 10.1 },
          { month: 'Aug', carbonFootprint: 26.8, target: 40, reduction: 11.5 },
          { month: 'Sep', carbonFootprint: 24.5, target: 40, reduction: 13.2 },
          { month: 'Oct', carbonFootprint: 22.1, target: 40, reduction: 15.8 },
          { month: 'Nov', carbonFootprint: 20.3, target: 40, reduction: 17.2 },
          { month: 'Dec', carbonFootprint: 18.7, target: 40, reduction: 18.9 }
        ];
        break;
    }

    res.json({
      success: true,
      data: {
        carbonData: filteredData,
        categoryData,
        trendData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching carbon footprint data',
      error: error.message
    });
  }
});

// Get recommendations data
router.get('/recommendations', auth, (req, res) => {
  try {
    const { status, impact, cost } = req.query;
    
    let filteredRecommendations = recommendations;
    
    // Apply filters
    if (status) {
      filteredRecommendations = filteredRecommendations.filter(rec => 
        rec.status.toLowerCase() === status.toLowerCase()
      );
    }
    
    if (impact) {
      filteredRecommendations = filteredRecommendations.filter(rec => 
        rec.impact.toLowerCase() === impact.toLowerCase()
      );
    }
    
    if (cost) {
      filteredRecommendations = filteredRecommendations.filter(rec => 
        rec.cost.toLowerCase() === cost.toLowerCase()
      );
    }

    res.json({
      success: true,
      data: filteredRecommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations data',
      error: error.message
    });
  }
});

// Get trends data
router.get('/trends', auth, (req, res) => {
  try {
    const { period = '6months' } = req.query;
    
    res.json({
      success: true,
      data: {
        carbonData,
        trendData,
        period
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trends data',
      error: error.message
    });
  }
});

// Get comparison data
router.get('/comparisons', auth, (req, res) => {
  try {
    const comparisonData = {
      industryAverage: 45.2,
      userPerformance: 29.5,
      performanceImprovement: 35,
      goalProgress: 75,
      goalTarget: 40,
      benchmarkData: [
        { category: 'Energy Efficiency', user: 85, industry: 65 },
        { category: 'Waste Management', user: 78, industry: 60 },
        { category: 'Water Conservation', user: 72, industry: 55 },
        { category: 'Transportation', user: 68, industry: 70 },
        { category: 'Materials', user: 80, industry: 75 }
      ]
    };

    res.json({
      success: true,
      data: comparisonData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching comparison data',
      error: error.message
    });
  }
});

// Get CBAM reporting data for MSME
router.get('/cbam', auth, async (req, res) => {
  try {
    const { period = 'quarter' } = req.query;

    if (!req.user?.msmeId) {
      return res.status(404).json({
        success: false,
        message: 'MSME profile not found'
      });
    }

    const msme = await MSME.findById(req.user.msmeId).lean();
    const cbamReport = buildCbamReport(msme, period);

    res.json({
      success: true,
      data: cbamReport
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching CBAM reporting data',
      error: error.message
    });
  }
});

// Generate comprehensive report
router.post('/generate', auth, (req, res) => {
  try {
    const { reportType = 'comprehensive', dateRange = '6months', format = 'pdf' } = req.body;
    
    // Mock report generation
    const reportData = {
      reportId: `RPT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      reportType,
      dateRange,
      format,
      summary: {
        totalCarbonFootprint: 29.5,
        reduction: 35.2,
        recommendationsImplemented: 3,
        totalSavings: 75000,
        co2Reduction: 280
      },
      sections: [
        'Executive Summary',
        'Carbon Footprint Analysis',
        'Recommendations Status',
        'Performance Trends',
        'Industry Comparison',
        'Action Plan'
      ]
    };

    res.json({
      success: true,
      message: 'Report generated successfully',
      data: reportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating report',
      error: error.message
    });
  }
});

// Export report
router.post('/export', auth, (req, res) => {
  try {
    const { reportId, format = 'pdf', email } = req.body;
    
    // Mock export process
    const exportData = {
      exportId: `EXP-${Date.now()}`,
      reportId,
      format,
      status: 'processing',
      downloadUrl: `https://api.carbonintelligence.com/reports/${reportId}/download`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };

    if (email) {
      // Mock email sending
      exportData.emailSent = true;
      exportData.emailAddress = email;
    }

    res.json({
      success: true,
      message: 'Report export initiated',
      data: exportData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error exporting report',
      error: error.message
    });
  }
});

// Get report history
router.get('/history', auth, (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const reportHistory = [
      {
        id: 'RPT-001',
        title: 'Monthly Sustainability Report - June 2024',
        generatedAt: '2024-06-30T10:00:00Z',
        type: 'monthly',
        status: 'completed',
        format: 'pdf',
        size: '2.5MB'
      },
      {
        id: 'RPT-002',
        title: 'Quarterly Carbon Analysis - Q2 2024',
        generatedAt: '2024-06-15T14:30:00Z',
        type: 'quarterly',
        status: 'completed',
        format: 'excel',
        size: '1.8MB'
      },
      {
        id: 'RPT-003',
        title: 'Annual Sustainability Report - 2024',
        generatedAt: '2024-06-01T09:15:00Z',
        type: 'annual',
        status: 'processing',
        format: 'pdf',
        size: '5.2MB'
      }
    ];

    res.json({
      success: true,
      data: {
        reports: reportHistory,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: reportHistory.length,
          pages: Math.ceil(reportHistory.length / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching report history',
      error: error.message
    });
  }
});

// Get dashboard summary
router.get('/dashboard', auth, (req, res) => {
  try {
    const dashboardData = {
      currentMonth: {
        carbonFootprint: 29.5,
        target: 40,
        reduction: 26.25,
        trend: 'down'
      },
      yearToDate: {
        carbonFootprint: 223.8,
        target: 480,
        reduction: 53.4,
        trend: 'down'
      },
      keyMetrics: {
        energyEfficiency: 85,
        wasteReduction: 78,
        waterConservation: 72,
        renewableEnergy: 45
      },
      recentAchievements: [
        {
          title: 'Energy Efficiency Champion',
          description: 'Achieved 85% energy efficiency rating',
          date: '2024-06-28',
          points: 100
        },
        {
          title: 'Waste Reduction Leader',
          description: 'Reduced waste by 20% this month',
          date: '2024-06-25',
          points: 75
        }
      ],
      upcomingGoals: [
        {
          title: 'Install Solar Panels',
          targetDate: '2024-08-15',
          progress: 60,
          priority: 'high'
        },
        {
          title: 'Implement Electric Fleet',
          targetDate: '2024-09-30',
          progress: 25,
          priority: 'medium'
        }
      ]
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data',
      error: error.message
    });
  }
});

module.exports = router;