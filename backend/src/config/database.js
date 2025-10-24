const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    // Use in-memory database for tests
    const mongoUri = process.env.NODE_ENV === 'test' 
      ? 'mongodb://localhost:27017/carbon-intelligence-test'
      : process.env.MONGODB_URI || 'mongodb://localhost:27017/carbon-intelligence';
    
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Database connection error:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;