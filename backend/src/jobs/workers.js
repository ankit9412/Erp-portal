const { Worker } = require('bullmq');
const logger = require('../config/logger');
const { sendEmail } = require('../shared/email.service');
const notificationService = require('../modules/notification/notification.service');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

// Email worker
const emailWorker = new Worker(
  'email',
  async (job) => {
    logger.info(`Processing email job: ${job.id} - ${job.name}`);
    await sendEmail(job.data);
    logger.info(`Email job completed: ${job.id}`);
  },
  {
    connection,
    concurrency: 5,
    limiter: { max: 100, duration: 60000 }, // 100 emails per minute
  }
);

// Notification worker
const notificationWorker = new Worker(
  'notification',
  async (job) => {
    logger.info(`Processing notification job: ${job.id} - ${job.name}`);

    switch (job.name) {
      case 'low-stock-alert':
        await notificationService.sendLowStockAlert(job.data);
        break;
      case 'invoice-reminder':
        await handleInvoiceReminder(job.data);
        break;
      case 'bulk-notification':
        await notificationService.sendBulk(job.data);
        break;
      default:
        await notificationService.send(job.data);
    }
  },
  { connection, concurrency: 10 }
);

// Report worker
const reportWorker = new Worker(
  'report',
  async (job) => {
    logger.info(`Processing report job: ${job.id} - ${job.name}`);
    // Generate scheduled reports
    switch (job.name) {
      case 'daily-summary':
        await generateDailySummary(job.data);
        break;
      case 'weekly-report':
        await generateWeeklyReport(job.data);
        break;
    }
  },
  { connection, concurrency: 2 }
);

// Stock alert worker
const stockAlertWorker = new Worker(
  'stock-alert',
  async (job) => {
    logger.info(`Processing stock alert: ${job.id}`);
    await notificationService.sendLowStockAlert(job.data);
  },
  { connection, concurrency: 5 }
);

// Cleanup worker
const cleanupWorker = new Worker(
  'cleanup',
  async (job) => {
    logger.info(`Processing cleanup job: ${job.id} - ${job.name}`);
    switch (job.name) {
      case 'expired-tokens':
        await cleanupExpiredTokens();
        break;
      case 'old-audit-logs':
        await cleanupOldAuditLogs();
        break;
    }
  },
  { connection, concurrency: 1 }
);

// Helper functions
async function handleInvoiceReminder(data) {
  const Invoice = require('../modules/finance/invoice.model');
  const invoice = await Invoice.findById(data.invoiceId).lean();
  if (!invoice || invoice.paymentStatus === 'paid') return;

  await sendEmail({
    to: invoice.customerDetails?.email,
    subject: `Payment Reminder: Invoice ${invoice.invoiceNumber}`,
    template: 'invoiceReminder',
    data: {
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.balanceAmount,
      dueDate: invoice.dueDate,
    },
  });
}

async function generateDailySummary(data) {
  logger.info(`Generating daily summary for tenant: ${data.tenantId}`);
  // Implementation: aggregate daily stats and email to business owner
}

async function generateWeeklyReport(data) {
  logger.info(`Generating weekly report for tenant: ${data.tenantId}`);
}

async function cleanupExpiredTokens() {
  const User = require('../modules/user/user.model');
  await User.updateMany(
    {},
    { $pull: { refreshTokens: { expiresAt: { $lt: new Date() } } } }
  );
  logger.info('Expired tokens cleaned up');
}

async function cleanupOldAuditLogs() {
  const AuditLog = require('../modules/audit/auditLog.model');
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const result = await AuditLog.deleteMany({ createdAt: { $lt: cutoff } });
  logger.info(`Cleaned up ${result.deletedCount} old audit logs`);
}

// Worker event handlers
[emailWorker, notificationWorker, reportWorker, stockAlertWorker, cleanupWorker].forEach((worker) => {
  worker.on('completed', (job) => {
    logger.debug(`Job ${job.id} completed in queue ${worker.name}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed in queue ${worker.name}: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error(`Worker ${worker.name} error: ${err.message}`);
  });
});

module.exports = { emailWorker, notificationWorker, reportWorker, stockAlertWorker, cleanupWorker };
