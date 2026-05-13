const AuditLog = require('./auditLog.model');
const { StatusCodes } = require('http-status-codes');

class AuditController {
  async getLogs(req, res, next) {
    try {
      const { 
        module, action, userId, 
        startDate, endDate, 
        page = 1, limit = 50 
      } = req.query;

      const query = { tenantId: req.tenantId };

      if (module) query.module = module;
      if (action) query.action = action;
      if (userId) query.userId = userId;
      
      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      const logs = await AuditLog.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await AuditLog.countDocuments(query);

      res.status(StatusCodes.OK).json({
        success: true,
        data: logs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await AuditLog.aggregate([
        { $match: { tenantId: req.tenantId } },
        { $group: { _id: '$module', count: { $sum: 1 } } },
      ]);
      res.status(StatusCodes.OK).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
