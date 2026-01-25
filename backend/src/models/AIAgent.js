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
      'data_privacy',
      'document_analyzer',
      'recommendation_engine', 
      'data_processor',
      'anomaly_detector',
      'trend_analyzer',
      'compliance_monitor',
      'optimization_advisor',
      'report_generator',
      'sector_profiler',
      'process_machinery_profiler'
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