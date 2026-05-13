const cron = require('node-cron');
const { reportQueue, cleanupQueue, notificationQueue } = require('./queues');
const Invoice = require('../modules/finance/invoice.model');
const logger = require('../config/logger');

const setupScheduler = () => {
  // Daily: Send overdue invoice reminders (9 AM)
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running: Overdue invoice reminder job');
    try {
      const overdueInvoices = await Invoice.find({
        dueDate: { $lt: new Date() },
        paymentStatus: { $in: ['unpaid', 'partial'] },
        status: { $ne: 'cancelled' },
      }).lean();

      for (const invoice of overdueInvoices) {
        await notificationQueue.add('invoice-reminder', {
          invoiceId: invoice._id.toString(),
          tenantId: invoice.tenantId.toString(),
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        });
      }

      logger.info(`Queued ${overdueInvoices.length} invoice reminders`);
    } catch (error) {
      logger.error(`Invoice reminder job failed: ${error.message}`);
    }
  });

  // Daily: Generate daily summary reports (6 PM)
  cron.schedule('0 18 * * *', async () => {
    logger.info('Running: Daily summary report job');
    try {
      const Tenant = require('../modules/tenant/tenant.model');
      const activeTenants = await Tenant.find({ status: { $in: ['active', 'trial'] } }).select('_id').lean();

      for (const tenant of activeTenants) {
        await reportQueue.add('daily-summary', { tenantId: tenant._id.toString() }, {
          attempts: 2,
        });
      }
    } catch (error) {
      logger.error(`Daily summary job failed: ${error.message}`);
    }
  });

  // Weekly: Generate weekly reports (Monday 8 AM)
  cron.schedule('0 8 * * 1', async () => {
    logger.info('Running: Weekly report job');
    try {
      const Tenant = require('../modules/tenant/tenant.model');
      const activeTenants = await Tenant.find({ status: 'active' }).select('_id').lean();

      for (const tenant of activeTenants) {
        await reportQueue.add('weekly-report', { tenantId: tenant._id.toString() });
      }
    } catch (error) {
      logger.error(`Weekly report job failed: ${error.message}`);
    }
  });

  // Daily: Cleanup expired tokens (2 AM)
  cron.schedule('0 2 * * *', async () => {
    logger.info('Running: Token cleanup job');
    await cleanupQueue.add('expired-tokens', {});
  });

  // Monthly: Cleanup old audit logs (1st of month, 3 AM)
  cron.schedule('0 3 1 * *', async () => {
    logger.info('Running: Audit log cleanup job');
    await cleanupQueue.add('old-audit-logs', {});
  });

  // Every 5 minutes: Check low stock levels
  cron.schedule('*/5 * * * *', async () => {
    try {
      const Product = require('../modules/inventory/product.model');
      const lowStockProducts = await Product.find({
        status: 'active',
        deletedAt: null,
        $expr: { $lte: ['$stock', '$reorderPoint'] },
        reorderPoint: { $gt: 0 },
      }).lean();

      for (const product of lowStockProducts) {
        await notificationQueue.add('low-stock-alert', {
          tenantId: product.tenantId.toString(),
          productId: product._id.toString(),
          productName: product.name,
          currentStock: product.stock,
          minStockLevel: product.minStockLevel,
          reorderPoint: product.reorderPoint,
        }, {
          jobId: `low-stock-${product._id}`, // Deduplicate
          attempts: 2,
        });
      }
    } catch (error) {
      logger.error(`Low stock check failed: ${error.message}`);
    }
  });

  logger.info('Job scheduler initialized');
};

module.exports = setupScheduler;
