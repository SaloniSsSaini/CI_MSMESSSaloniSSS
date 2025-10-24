const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

// Mock data for demonstration
const mockPrivacySettings = {
  dataProcessing: true,
  marketingCommunications: false,
  thirdPartySharing: false,
  analyticsTracking: true,
  cookieConsent: true,
  dataRetention: true,
  twoFactorAuth: false,
  sessionTimeout: 30,
  dataEncryption: true,
  auditLogging: true
};

const mockDataRequests = [
  {
    _id: '1',
    type: 'access',
    status: 'completed',
    description: 'Request for access to all personal data',
    requestedAt: '2024-01-15T10:30:00Z',
    completedAt: '2024-01-16T14:20:00Z',
    response: 'Your personal data has been provided in the attached file.'
  },
  {
    _id: '2',
    type: 'deletion',
    status: 'in_progress',
    description: 'Request for deletion of marketing data',
    requestedAt: '2024-01-20T09:15:00Z'
  }
];

const mockDataActivities = [
  {
    _id: '1',
    action: 'Data Access',
    dataType: 'Personal Information',
    timestamp: '2024-01-15T10:30:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: 'Accessed personal profile information'
  },
  {
    _id: '2',
    action: 'Data Update',
    dataType: 'Contact Information',
    timestamp: '2024-01-14T15:45:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: 'Updated email address and phone number'
  },
  {
    _id: '3',
    action: 'Consent Update',
    dataType: 'Privacy Settings',
    timestamp: '2024-01-13T11:20:00Z',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    details: 'Updated marketing communication preferences'
  }
];

// @route   GET /api/data-privacy/settings
// @desc    Get privacy settings for user
// @access  Private
router.get('/settings', auth, async (req, res) => {
  try {
    logger.info('Get privacy settings request', { userId: req.user.id });
    
    res.json({
      success: true,
      data: mockPrivacySettings
    });
  } catch (error) {
    logger.error('Get privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/data-privacy/settings
// @desc    Update privacy settings for user
// @access  Private
router.put('/settings', auth, async (req, res) => {
  try {
    const {
      dataProcessing,
      marketingCommunications,
      thirdPartySharing,
      analyticsTracking,
      cookieConsent,
      dataRetention,
      twoFactorAuth,
      sessionTimeout,
      dataEncryption,
      auditLogging
    } = req.body;

    logger.info('Update privacy settings request', { 
      userId: req.user.id,
      settings: {
        dataProcessing,
        marketingCommunications,
        thirdPartySharing,
        analyticsTracking,
        cookieConsent,
        dataRetention
      }
    });

    // Update mock settings
    Object.assign(mockPrivacySettings, {
      dataProcessing,
      marketingCommunications,
      thirdPartySharing,
      analyticsTracking,
      cookieConsent,
      dataRetention,
      twoFactorAuth,
      sessionTimeout,
      dataEncryption,
      auditLogging
    });

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: mockPrivacySettings
    });
  } catch (error) {
    logger.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/data-privacy/requests
// @desc    Get data subject requests for user
// @access  Private
router.get('/requests', auth, async (req, res) => {
  try {
    logger.info('Get data requests request', { userId: req.user.id });
    
    res.json({
      success: true,
      data: mockDataRequests
    });
  } catch (error) {
    logger.error('Get data requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/data-privacy/requests
// @desc    Submit data subject request
// @access  Private
router.post('/requests', auth, async (req, res) => {
  try {
    const { type, description } = req.body;

    if (!type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Request type and description are required'
      });
    }

    const newRequest = {
      _id: Date.now().toString(),
      type,
      status: 'pending',
      description,
      requestedAt: new Date().toISOString()
    };

    mockDataRequests.push(newRequest);

    logger.info('Data request submitted', { 
      userId: req.user.id,
      requestType: type
    });

    res.json({
      success: true,
      message: 'Data request submitted successfully',
      data: newRequest
    });
  } catch (error) {
    logger.error('Submit data request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/data-privacy/activities
// @desc    Get data activities for user
// @access  Private
router.get('/activities', auth, async (req, res) => {
  try {
    logger.info('Get data activities request', { userId: req.user.id });
    
    res.json({
      success: true,
      data: mockDataActivities
    });
  } catch (error) {
    logger.error('Get data activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/data-privacy/download
// @desc    Download personal data for user
// @access  Private
router.get('/download', auth, async (req, res) => {
  try {
    logger.info('Download personal data request', { userId: req.user.id });

    // Mock personal data
    const personalData = {
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name || 'User',
        registrationDate: '2024-01-01T00:00:00Z',
        lastLogin: new Date().toISOString()
      },
      profile: {
        companyName: 'Sample MSME',
        industry: 'Manufacturing',
        location: 'Mumbai, India',
        contactInfo: {
          phone: '+91-9876543210',
          address: '123 Business Street, Mumbai'
        }
      },
      carbonData: {
        assessments: [
          {
            date: '2024-01-15',
            carbonScore: 75,
            co2Emissions: 1500,
            savings: 250
          }
        ],
        credits: {
          total: 100,
          used: 25,
          available: 75
        }
      },
      privacySettings: mockPrivacySettings,
      dataRequests: mockDataRequests,
      activities: mockDataActivities
    };

    res.json({
      success: true,
      data: personalData
    });
  } catch (error) {
    logger.error('Download personal data error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/data-privacy/consent
// @desc    Update consent preferences
// @access  Private
router.post('/consent', auth, async (req, res) => {
  try {
    const {
      dataProcessing,
      marketingCommunications,
      thirdPartySharing,
      analyticsTracking,
      cookieConsent,
      dataRetention
    } = req.body;

    logger.info('Update consent preferences', { 
      userId: req.user.id,
      consent: {
        dataProcessing,
        marketingCommunications,
        thirdPartySharing,
        analyticsTracking,
        cookieConsent,
        dataRetention
      }
    });

    // Update consent in mock settings
    Object.assign(mockPrivacySettings, {
      dataProcessing,
      marketingCommunications,
      thirdPartySharing,
      analyticsTracking,
      cookieConsent,
      dataRetention
    });

    res.json({
      success: true,
      message: 'Consent preferences updated successfully',
      data: {
        dataProcessing,
        marketingCommunications,
        thirdPartySharing,
        analyticsTracking,
        cookieConsent,
        dataRetention
      }
    });
  } catch (error) {
    logger.error('Update consent preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;