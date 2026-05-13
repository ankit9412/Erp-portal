const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const User = require('../modules/user/user.model');
const { cache } = require('../config/redis');
const logger = require('../config/logger');

/**
 * Verify JWT access token
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header or cookie
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    // Check token blacklist in Redis
    const isBlacklisted = await cache.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Token has been invalidated. Please log in again.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // Try to get user from cache first
    let user = await cache.get(`user:${decoded.userId}`);

    if (!user) {
      user = await User.findById(decoded.userId)
        .populate('role')
        .select('-password -refreshTokens -mfa.secret -mfa.backupCodes')
        .lean();

      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'User not found.',
        });
      }

      // Cache user for 5 minutes
      await cache.set(`user:${decoded.userId}`, user, 300);
    }

    if (user.status !== 'active') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Account is ${user.status}. Please contact support.`,
      });
    }

    req.user = user;
    req.userId = user._id;
    req.tenantId = user.tenantId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Token expired. Please refresh your session.',
        code: 'TOKEN_EXPIRED',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    logger.error(`Auth middleware error: ${error.message}`);
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId).lean();
    if (user) {
      req.user = user;
      req.userId = user._id;
      req.tenantId = user.tenantId;
    }
    next();
  } catch {
    next();
  }
};

/**
 * Super admin only
 */
const superAdminOnly = (req, res, next) => {
  if (!req.user?.isSuperAdmin) {
    return res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: 'Super admin access required.',
    });
  }
  next();
};

module.exports = { authenticate, optionalAuth, superAdminOnly };
