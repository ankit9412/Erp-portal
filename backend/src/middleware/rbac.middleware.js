const { StatusCodes } = require('http-status-codes');
const Role = require('../modules/auth/role.model');
const { cache } = require('../config/redis');
const logger = require('../config/logger');

/**
 * Check if user has required permission for a module and action.
 * Usage: authorize('inventory', 'create')
 */
const authorize = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      // Super admin has all permissions
      if (req.user.isSuperAdmin) return next();

      // Business owner has all permissions within their tenant
      if (req.user.roleType === 'business_owner') return next();

      // Check custom restricted permissions
      const restrictedKey = `${module}:${action}`;
      if (req.user.restrictedPermissions?.includes(restrictedKey)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: 'Access denied. This permission has been restricted for your account.',
        });
      }

      // Check custom granted permissions
      if (req.user.customPermissions?.includes(restrictedKey)) {
        return next();
      }

      // Get role permissions from cache or DB
      const roleId = req.user.role?._id || req.user.role;
      if (!roleId) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: 'No role assigned. Please contact your administrator.',
        });
      }

      const cacheKey = `role:${roleId}`;
      let role = await cache.get(cacheKey);

      if (!role) {
        role = await Role.findById(roleId).lean();
        if (!role) {
          return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: 'Role not found.',
          });
        }
        await cache.set(cacheKey, role, 600);
      }

      // Check permission
      const permission = role.permissions?.find((p) => p.module === module);
      if (!permission || !permission.actions[action]) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: `You don't have permission to ${action} ${module}.`,
          required: { module, action },
        });
      }

      next();
    } catch (error) {
      logger.error(`RBAC middleware error: ${error.message}`);
      next(error);
    }
  };
};

/**
 * Check multiple permissions (user needs ALL of them)
 */
const authorizeAll = (...permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      if (req.user.isSuperAdmin || req.user.roleType === 'business_owner') {
        return next();
      }

      const roleId = req.user.role?._id || req.user.role;
      const cacheKey = `role:${roleId}`;
      let role = await cache.get(cacheKey);

      if (!role) {
        role = await Role.findById(roleId).lean();
        if (role) await cache.set(cacheKey, role, 600);
      }

      for (const [module, action] of permissions) {
        const permission = role?.permissions?.find((p) => p.module === module);
        if (!permission || !permission.actions[action]) {
          return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: `Missing required permission: ${action} on ${module}.`,
          });
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user has any of the specified role types
 */
const requireRole = (...roleTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (req.user.isSuperAdmin) return next();

    if (!roleTypes.includes(req.user.roleType)) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: `Access restricted to: ${roleTypes.join(', ')}.`,
      });
    }

    next();
  };
};

module.exports = { authorize, authorizeAll, requireRole };
