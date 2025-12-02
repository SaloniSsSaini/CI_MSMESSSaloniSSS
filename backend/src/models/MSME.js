const mongoose = require('mongoose');

const msmeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  companyType: {
    type: String,
    enum: ['micro', 'small', 'medium'],
    required: true
  },
  industry: {
    type: String,
    required: true
  },
  businessDomain: {
    type: String,
    required: true,
    enum: [
      'manufacturing',
      'trading',
      'services',
      'export_import',
      'retail',
      'wholesale',
      'e_commerce',
      'consulting',
      'logistics',
      'agriculture',
      'handicrafts',
      'food_processing',
      'textiles',
      'electronics',
      'automotive',
      'construction',
      'healthcare',
      'education',
      'tourism',
      'other'
    ]
  },
  establishmentYear: {
    type: Number,
    required: true
  },
  // udyamRegistrationNumber: {
  //   type: String,
  //   required: true,
  //   // unique: true,
  //   match: /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/
  // },
  udyamRegistrationNumber: { type: String, unique: false, sparse: true },
  gstNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  },
  panNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  },
  contact: {
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: 'India'
      }
    }
  },
  business: {
    annualTurnover: {
      type: Number,
      required: true
    },
    numberOfEmployees: {
      type: Number,
      required: true
    },
    manufacturingUnits: {
      type: Number,
      required: true
    },
    primaryProducts: {
      type: String,
      required: true
    }
  },
  environmentalCompliance: {
    hasEnvironmentalClearance: {
      type: Boolean,
      default: false
    },
    hasPollutionControlBoard: {
      type: Boolean,
      default: false
    },
    hasWasteManagement: {
      type: Boolean,
      default: false
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDate: Date,
  carbonScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastCarbonAssessment: Date
}, {
  timestamps: true
});

// Index for efficient queries
msmeSchema.index({ userId: 1 });
msmeSchema.index({ udyamRegistrationNumber: 1 });
msmeSchema.index({ gstNumber: 1 });
msmeSchema.index({ companyName: 'text' });

module.exports = mongoose.model('MSME', msmeSchema);