const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { requireTenant } = require('../../middleware/tenant.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const AuditLog = require('./auditLog.model');

router.use(authenticate, requireTenant);

router.get('/', authorize('audit', 'read'), async (req, res, next) => {
  try {
    const { page = 1, limit = 50, module, action, userId, startDate, endDate } = req.query;
    const query = { tenantId: req.tenantId };
    if (module) query.module = module;
    if (action) query.action = action;
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({ success: true, data: logs, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) { next(error); }
});

router.get('/entity/:entityId', authorize('audit', 'read'), async (req, res, next) => {
  try {
    const logs = await AuditLog.find({
      tenantId: req.tenantId,
      entityId: req.params.entityId,
    })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
});

module.exports = router;
