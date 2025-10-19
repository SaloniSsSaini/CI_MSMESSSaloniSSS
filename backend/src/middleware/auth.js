const jwt = require('jsonwebtoken');
const User = require('../models/User');
const MSME = require('../models/MSME');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    // Get MSME data if user is MSME
    let msmeData = null;
    if (user.role === 'msme') {
      msmeData = await MSME.findOne({ userId: user._id });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      msmeId: msmeData?._id
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

module.exports = auth;