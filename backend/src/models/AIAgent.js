const mongoose = require('mongoose');

const aiAgentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: [
      'carbon_analyzer',
      'recommendation_engine', 
      'data_processor',
      'anomaly_detector',
      'trend_analyzer',
      'compliance_monitor',
      'optimization_advisor',
      'report_generator',
      'sector_profiler_manufacturing',
      'sector_profiler_trading',
      'sector_profiler_services',
      'sector_profiler_export_import',
      'sector_profiler_retail',
      'sector_profiler_wholesale',
      'sector_profiler_e_commerce',
      'sector_profiler_consulting',
      'sector_profiler_logistics',
      'sector_profiler_agriculture',
      'sector_profiler_handicrafts',
      'sector_profiler_food_processing',
      'sector_profiler_textiles',
      'sector_profiler_electronics',
      'sector_profiler_automotive',
      'sector_profiler_construction',
      'sector_profiler_healthcare',
      'sector_profiler_education',
      'sector_profiler_tourism',
      'sector_profiler_other'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  capabilities: [{
    type: String,
    required: true
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'error'],
    default: 'active'
  },
  configuration: {
    model: String,
    parameters: mongoose.Schema.Types.Mixed,
    thresholds: mongoose.Schema.Types.Mixed,
    preferences: mongoose.Schema.Types.Mixed
  },
  performance: {
    tasksCompleted: {
      type: Number,
      default: 0
    },
    successRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageResponseTime: {
      type: Number,
      default: 0
    },
    lastActivity: Date,
    errorCount: {
      type: Number,
      default: 0
    }
  },
  dependencies: [{
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIAgent'
    },
    required: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
aiAgentSchema.index({ type: 1, status: 1 });
aiAgentSchema.index({ isActive: 1 });
aiAgentSchema.index({ 'performance.lastActivity': -1 });

module.exports = mongoose.model('AIAgent', aiAgentSchema);