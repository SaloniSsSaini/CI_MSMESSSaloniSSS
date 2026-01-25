const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const orchestrationManagerEventService = require('../services/orchestrationManagerEventService');
const aiAgentService = require('../services/aiAgentService');
const logger = require('../utils/logger');

// @route   GET /api/orchestration-manager/events
// @desc    Get recent orchestration manager events
// @access  Private
router.get('/events', auth, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const events = orchestrationManagerEventService.getRecentEvents(limit);

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Get orchestration events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/orchestration-manager/status
// @desc    Get orchestration manager status summary
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const multiAgentStatus = await aiAgentService.getMultiAgentStatus();
    const events = orchestrationManagerEventService.getRecentEvents(50);

    res.json({
      success: true,
      data: {
        totalEvents: events.length,
        lastEvent: events[0] || null,
        multiAgentStatus
      }
    });
  } catch (error) {
    logger.error('Get orchestration status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/orchestration-manager/trigger
// @desc    Trigger orchestration manager execution
// @access  Private
router.post('/trigger', auth, async (req, res) => {
  try {
    const {
      msmeId,
      msmeData,
      transactions,
      documents,
      behaviorOverrides,
      contextOverrides,
      triggerSource
    } = req.body;

    const resolvedMsmeId = msmeId || req.user?.msmeId || msmeData?._id;
    if (!resolvedMsmeId && !msmeData) {
      return res.status(400).json({
        success: false,
        message: 'MSME ID or MSME profile data is required'
      });
    }

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Transactions data is required for orchestration'
      });
    }

    const result = await orchestrationManagerEventService.triggerOrchestration({
      msmeId: resolvedMsmeId,
      msmeData,
      transactions,
      documents,
      behaviorOverrides,
      contextOverrides,
      triggerSource: triggerSource || 'api'
    });

    res.json({
      success: true,
      message: 'Orchestration manager execution completed',
      data: result
    });
  } catch (error) {
    logger.error('Orchestration manager trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/orchestration-manager/workflow/trigger
// @desc    Trigger a workflow execution via orchestration manager
// @access  Private
router.post('/workflow/trigger', auth, async (req, res) => {
  try {
    const { workflowId, msmeId, triggerData, triggerSource } = req.body;

    if (!workflowId) {
      return res.status(400).json({
        success: false,
        message: 'Workflow ID is required'
      });
    }

    const resolvedMsmeId = msmeId || req.user?.msmeId;
    const execution = await orchestrationManagerEventService.triggerWorkflow({
      workflowId,
      msmeId: resolvedMsmeId,
      triggerData,
      triggerSource: triggerSource || 'api'
    });

    res.json({
      success: true,
      message: 'Workflow execution triggered',
      data: execution
    });
  } catch (error) {
    logger.error('Workflow trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/orchestration-manager/emit-event
// @desc    Emit an event into the orchestration manager event bus
// @access  Private
router.post('/emit-event', auth, async (req, res) => {
  try {
    const { eventType, payload, source } = req.body;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required'
      });
    }

    const event = await orchestrationManagerEventService.emitEvent(
      eventType,
      payload || {},
      source || 'api'
    );

    res.json({
      success: true,
      message: 'Event emitted successfully',
      data: event
    });
  } catch (error) {
    logger.error('Emit orchestration event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
