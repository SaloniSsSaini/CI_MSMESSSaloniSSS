const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  msmeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MSME',
    required: true
  },
  source: {
    type: String,
    enum: ['sms', 'email', 'manual', 'api'],
    required: true
  },
  sourceId: {
    type: String, // ID from SMS or email system
    required: true
  },
  transactionType: {
    type: String,
    enum: ['purchase', 'sale', 'expense', 'investment', 'utility', 'transport', 'other'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  vendor: {
    name: String,
    category: String,
    location: String
  },
  category: {
    type: String,
    enum: [
      'raw_materials',
      'energy',
      'transportation',
      'waste_management',
      'water',
      'equipment',
      'maintenance',
      'utilities',
      'other'
    ],
    required: true
  },
  subcategory: String,
  date: {
    type: Date,
    required: true
  },
  carbonFootprint: {
    co2Emissions: {
      type: Number,
      default: 0
    },
    emissionFactor: {
      type: Number,
      default: 0
    },
    calculationMethod: String
  },
  sustainability: {
    isGreen: {
      type: Boolean,
      default: false
    },
    greenScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    sustainabilityFactors: [String]
  },
  metadata: {
    originalText: String, // Original SMS/email text
    extractedData: mongoose.Schema.Types.Mixed,
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  processedAt: Date,
  tags: [String]
}, {
  timestamps: true
});

// Indexes for efficient queries
transactionSchema.index({ msmeId: 1, date: -1 });
transactionSchema.index({ source: 1, sourceId: 1 });
transactionSchema.index({ category: 1, date: -1 });
transactionSchema.index({ 'carbonFootprint.co2Emissions': -1 });
transactionSchema.index({ description: 'text' });

module.exports = mongoose.model('Transaction', transactionSchema);