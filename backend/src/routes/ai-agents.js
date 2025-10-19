const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AIAgent = require('../models/AIAgent');
const AITask = require('../models/AITask');
const AIWorkflow = require('../models/AIWorkflow');
const AIExecution = require('../models/AIExecution');
const aiAgentService = require('../services/aiAgentService');
const logger = require('../utils/logger');

// @route   GET /api/ai-agents
// @desc    Get all AI agents
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type, status, isActive } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const agents = await AIAgent.find(query)
      .sort({ createdAt: -1 })
      .select('-configuration.parameters'); // Exclude sensitive config

    res.json({
      success: true,
      data: agents
    });
  } catch (error) {
    logger.error('Get AI agents error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/ai-agents/:id
// @desc    Get single AI agent
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const agent = await AIAgent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'AI agent not found'
      });
    }

    res.json({
      success: true,
      data: agent
    });
  } catch (error) {
    logger.error('Get AI agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/ai-agents
// @desc    Create new AI agent
// @access  Private (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    const agentData = {
      ...req.body,
      createdBy: req.user.id
    };

    const agent = new AIAgent(agentData);
    await agent.save();

    // Register agent with service
    await aiAgentService.registerAgent(agent);

    logger.info(`AI Agent created: ${agent.name}`, {
      agentId: agent._id,
      type: agent.type,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'AI agent created successfully',
      data: agent
    });
  } catch (error) {
    logger.error('Create AI agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   PUT /api/ai-agents/:id
// @desc    Update AI agent
// @access  Private (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const agent = await AIAgent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'AI agent not found'
      });
    }

    // Update agent data
    Object.assign(agent, req.body);
    agent.lastUpdated = new Date();
    await agent.save();

    // Re-register agent with service
    await aiAgentService.registerAgent(agent);

    logger.info(`AI Agent updated: ${agent.name}`, {
      agentId: agent._id,
      updatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'AI agent updated successfully',
      data: agent
    });
  } catch (error) {
    logger.error('Update AI agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/ai-agents/:id
// @desc    Delete AI agent
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const agent = await AIAgent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'AI agent not found'
      });
    }

    // Soft delete
    agent.isActive = false;
    agent.status = 'inactive';
    await agent.save();

    logger.info(`AI Agent deactivated: ${agent.name}`, {
      agentId: agent._id,
      deactivatedBy: req.user.id
    });

    res.json({
      success: true,
      message: 'AI agent deactivated successfully'
    });
  } catch (error) {
    logger.error('Delete AI agent error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/ai-agents/:id/tasks
// @desc    Create task for AI agent
// @access  Private
router.post('/:id/tasks', auth, async (req, res) => {
  try {
    const agent = await AIAgent.findById(req.params.id);
    
    if (!agent || !agent.isActive) {
      return res.status(404).json({
        success: false,
        message: 'AI agent not found or inactive'
      });
    }

    const taskData = {
      agentId: agent._id,
      msmeId: req.user.msmeId,
      ...req.body
    };

    const task = await aiAgentService.createTask(taskData);

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    logger.error('Create AI task error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/ai-agents/:id/tasks
// @desc    Get tasks for AI agent
// @access  Private
router.get('/:id/tasks', auth, async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    const query = { 
      agentId: req.params.id,
      msmeId: req.user.msmeId
    };
    if (status) query.status = status;

    const tasks = await AITask.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AITask.countDocuments(query);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    logger.error('Get AI tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/ai-agents/:id/performance
// @desc    Get AI agent performance metrics
// @access  Private
router.get('/:id/performance', auth, async (req, res) => {
  try {
    const agent = await AIAgent.findById(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'AI agent not found'
      });
    }

    // Get recent tasks for additional metrics
    const recentTasks = await AITask.find({
      agentId: agent._id,
      msmeId: req.user.msmeId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });

    const performance = {
      ...agent.performance,
      recentActivity: {
        tasksLast30Days: recentTasks.length,
        successRateLast30Days: recentTasks.length > 0 
          ? (recentTasks.filter(t => t.status === 'completed').length / recentTasks.length * 100).toFixed(1)
          : 0,
        averageProcessingTime: recentTasks.length > 0
          ? recentTasks.reduce((sum, t) => sum + (t.metadata?.actualDuration || 0), 0) / recentTasks.length
          : 0
      }
    };

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Get AI agent performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/ai-agents/analyze-carbon
// @desc    Analyze carbon data using AI agents
// @access  Private
router.post('/analyze-carbon', auth, async (req, res) => {
  try {
    const { transactions, msmeData } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: 'Transactions data is required'
      });
    }

    // Create task for carbon analyzer agent
    const carbonAnalyzerAgent = await AIAgent.findOne({ type: 'carbon_analyzer', isActive: true });
    
    if (!carbonAnalyzerAgent) {
      return res.status(404).json({
        success: false,
        message: 'Carbon analyzer agent not available'
      });
    }

    const task = await aiAgentService.createTask({
      agentId: carbonAnalyzerAgent._id,
      msmeId: req.user.msmeId,
      taskType: 'carbon_analysis',
      input: { transactions, msmeData },
      priority: 'high'
    });

    res.json({
      success: true,
      message: 'Carbon analysis task created',
      data: {
        taskId: task.taskId,
        status: task.status,
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      }
    });
  } catch (error) {
    logger.error('Carbon analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/ai-agents/generate-recommendations
// @desc    Generate recommendations using AI agents
// @access  Private
router.post('/generate-recommendations', auth, async (req, res) => {
  try {
    const input = req.body;

    const recommendationAgent = await AIAgent.findOne({ type: 'recommendation_engine', isActive: true });
    
    if (!recommendationAgent) {
      return res.status(404).json({
        success: false,
        message: 'Recommendation engine agent not available'
      });
    }

    const task = await aiAgentService.createTask({
      agentId: recommendationAgent._id,
      msmeId: req.user.msmeId,
      taskType: 'recommendation_generation',
      input,
      priority: 'medium'
    });

    res.json({
      success: true,
      message: 'Recommendation generation task created',
      data: {
        taskId: task.taskId,
        status: task.status,
        estimatedCompletion: new Date(Date.now() + 3 * 60 * 1000) // 3 minutes
      }
    });
  } catch (error) {
    logger.error('Recommendation generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   POST /api/ai-agents/process-data
// @desc    Process transaction data using AI agents
// @access  Private
router.post('/process-data', auth, async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({
        success: false,
        message: 'Transactions data is required'
      });
    }

    const dataProcessorAgent = await AIAgent.findOne({ type: 'data_processor', isActive: true });
    
    if (!dataProcessorAgent) {
      return res.status(404).json({
        success: false,
        message: 'Data processor agent not available'
      });
    }

    const task = await aiAgentService.createTask({
      agentId: dataProcessorAgent._id,
      msmeId: req.user.msmeId,
      taskType: 'data_processing',
      input: { transactions },
      priority: 'medium'
    });

    res.json({
      success: true,
      message: 'Data processing task created',
      data: {
        taskId: task.taskId,
        status: task.status,
        estimatedCompletion: new Date(Date.now() + 2 * 60 * 1000) // 2 minutes
      }
    });
  } catch (error) {
    logger.error('Data processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;