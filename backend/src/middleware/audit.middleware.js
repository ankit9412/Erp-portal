const AuditLog = require('../modules/audit/auditLog.model');
const logger = require('../config/logger');
const UAParser = require('ua-parser-js');

/**
 * Audit logging middleware factory.
 * Usage: auditLog('inventory', 'CREATE', 'Product')
 */
const auditLog = (module, action, entity = null) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    const startTime = Date.now();

    res.json = async function (data) {
      try {
        const duration = Date.now() - startTime;
        const ua = new UAParser(req.headers['user-agent']);
        const browser = ua.getBrowser();
        const os = ua.getOS();
        const device = ua.getDevice();

        const logEntry = {
          tenantId: req.tenantId,
          user: req.user?._id,
          userEmail: req.user?.email,
          userName: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System',
          action,
          module,
          entity: entity || req.params.id ? entity : null,
          entityId: req.params.id || data?.data?._id,
          description: `${action} on ${module}${entity ? ` (${entity})` : ''}`,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'],
          browser: `${browser.name} ${browser.version}`,
          os: `${os.name} ${os.version}`,
          device: device.type || 'desktop',
          status: res.statusCode < 400 ? 'success' : 'failed',
          errorMessage: data?.message && res.statusCode >= 400 ? data.message : undefined,
          duration,
        };

        // Don't await - fire and forget to not slow down response
        AuditLog.create(logEntry).catch((err) =>
          logger.error(`Audit log creation failed: ${err.message}`)
        );
      } catch (err) {
        logger.error(`Audit middleware error: ${err.message}`);
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Track changes for update operations
 */
const trackChanges = (getOriginal) => {
  return async (req, res, next) => {
    try {
      if (getOriginal) {
        req.originalDocument = await getOriginal(req);
      }
    } catch (err) {
      logger.error(`Track changes error: ${err.message}`);
    }
    next();
  };
};

module.exports = { auditLog, trackChanges };
