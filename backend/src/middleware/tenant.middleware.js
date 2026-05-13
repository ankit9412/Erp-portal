const { StatusCodes } = require('http-status-codes');
const Tenant = require('../modules/tenant/tenant.model');
const { cache } = require('../config/redis');
const logger = require('../config/logger');

/**
 * Inject tenant context into every request.
 * Reads tenantId from authenticated user or X-Tenant-ID header (super admin).
 */
const injectTenant = async (req, res, next) => {
  try {
    let tenantId;

    // Super admin can pass X-Tenant-ID header to act on behalf of a tenant
    if (req.user?.isSuperAdmin && req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'];
    } else if (req.user?.tenantId) {
      tenantId = req.user.tenantId;
    }

    if (!tenantId) {
      return next(); // Public routes or super admin without tenant context
    }

    // Try cache first
    let tenant = await cache.get(`tenant:${tenantId}`);

    if (!tenant) {
      tenant = await Tenant.findById(tenantId).lean();
      if (!tenant) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Tenant not found.',
        });
      }
      await cache.set(`tenant:${tenantId}`, tenant, 600); // 10 min cache
    }

    if (tenant.status === 'suspended') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.',
      });
    }

    if (tenant.isTrialExpired) {
      return res.status(StatusCodes.PAYMENT_REQUIRED).json({
        success: false,
        message: 'Trial period has expired. Please upgrade your plan.',
        code: 'TRIAL_EXPIRED',
      });
    }

    req.tenant = tenant;
    req.tenantId = tenantId;
    next();
  } catch (error) {
    logger.error(`Tenant middleware error: ${error.message}`);
    next(error);
  }
};

/**
 * Ensure request has a valid tenant context
 */
const requireTenant = (req, res, next) => {
  if (!req.tenantId || !req.tenant) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Tenant context is required.',
    });
  }
  next();
};

/**
 * Prevent cross-tenant data access.
 * Use on routes that accept a tenantId param.
 */
const preventCrossTenant = (req, res, next) => {
  const requestedTenantId = req.params.tenantId || req.body.tenantId;

  if (requestedTenantId && !req.user?.isSuperAdmin) {
    if (requestedTenantId.toString() !== req.tenantId?.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Cross-tenant access is not allowed.',
      });
    }
  }
  next();
};

module.exports = { injectTenant, requireTenant, preventCrossTenant };
