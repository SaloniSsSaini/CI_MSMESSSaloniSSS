const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const aiAgentService = require('./services/aiAgentService');

// Import routes
const authRoutes = require('./routes/auth');
const msmeRoutes = require('./routes/msme');
const transactionRoutes = require('./routes/transactions');
const carbonRoutes = require('./routes/carbon');
const carbonTradingRoutes = require('./routes/carbonTrading');
const smsRoutes = require('./routes/sms');
const emailRoutes = require('./routes/email');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const incentivesRoutes = require('./routes/incentives');
const reportingRoutes = require('./routes/reporting');
const aiAgentRoutes = require('./routes/ai-agents');
const aiWorkflowRoutes = require('./routes/ai-workflows');
const multiAgentWorkflowRoutes = require('./routes/multi-agent-workflows');
const optimizedAiAgentRoutes = require('./routes/optimized-ai-agents');
const bankRoutes = require('./routes/banks');
const greenLoanRoutes = require('./routes/greenLoans');
const carbonForecastingRoutes = require('./routes/carbonForecasting');
const carbonCreditsRoutes = require('./routes/carbonCredits');
const giftSchemeRoutes = require('./routes/giftSchemes');
const giftApplicationRoutes = require('./routes/giftApplications');
const documentRoutes = require('./routes/documents');
const dataPrivacyRoutes = require('./routes/dataPrivacy');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Initialize AI Agent Service
aiAgentService.initialize().catch(error => {
  logger.error('Failed to initialize AI Agent Service:', error);
});

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/msme', msmeRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/carbon/trading', carbonTradingRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/incentives', incentivesRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/ai-agents', aiAgentRoutes);
app.use('/api/ai-workflows', aiWorkflowRoutes);
app.use('/api/multi-agent-workflows', multiAgentWorkflowRoutes);
app.use('/api/optimized-ai-agents', optimizedAiAgentRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/green-loans', greenLoanRoutes);
app.use('/api/carbon-forecasting', carbonForecastingRoutes);
app.use('/api/carbon-credits', carbonCreditsRoutes);
app.use('/api/gift-schemes', giftSchemeRoutes);
app.use('/api/gift-applications', giftApplicationRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/data-privacy', dataPrivacyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;