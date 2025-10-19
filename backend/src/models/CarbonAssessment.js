const mongoose = require('mongoose');

const carbonAssessmentSchema = new mongoose.Schema({
  msmeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MSME',
    required: true
  },
  assessmentType: {
    type: String,
    enum: ['manual', 'automatic', 'hybrid'],
    required: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  totalCO2Emissions: {
    type: Number,
    required: true,
    min: 0
  },
  breakdown: {
    energy: {
      electricity: {
        consumption: Number,
        co2Emissions: Number,
        source: String
      },
      fuel: {
        consumption: Number,
        co2Emissions: Number,
        type: String
      },
      total: Number
    },
    water: {
      consumption: Number,
      co2Emissions: Number,
      treatment: Boolean
    },
    waste: {
      solid: {
        generated: Number,
        co2Emissions: Number,
        recyclingRate: Number
      },
      hazardous: {
        generated: Number,
        co2Emissions: Number
      },
      total: Number
    },
    transportation: {
      distance: Number,
      co2Emissions: Number,
      vehicleCount: Number,
      fuelEfficiency: Number
    },
    materials: {
      consumption: Number,
      co2Emissions: Number,
      type: String,
      supplierDistance: Number
    },
    manufacturing: {
      productionVolume: Number,
      co2Emissions: Number,
      efficiency: Number,
      equipmentAge: Number
    }
  },
  carbonScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  scoreBreakdown: {
    energyEfficiency: Number,
    wasteManagement: Number,
    waterConservation: Number,
    transportation: Number,
    materialSourcing: Number,
    processOptimization: Number,
    environmentalControls: Number
  },
  recommendations: [{
    category: String,
    title: String,
    description: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    potentialCO2Reduction: Number,
    implementationCost: Number,
    paybackPeriod: Number,
    isImplemented: {
      type: Boolean,
      default: false
    }
  }],
  benchmarks: {
    industryAverage: Number,
    bestInClass: Number,
    previousAssessment: Number
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'reviewed', 'approved'],
    default: 'draft'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes
carbonAssessmentSchema.index({ msmeId: 1, 'period.startDate': -1 });
carbonAssessmentSchema.index({ carbonScore: -1 });
carbonAssessmentSchema.index({ status: 1 });

module.exports = mongoose.model('CarbonAssessment', carbonAssessmentSchema);