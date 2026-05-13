const { Queue } = require('bullmq');
const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

// Define queues
const emailQueue = new Queue('email', { connection });
const notificationQueue = new Queue('notification', { connection });
const reportQueue = new Queue('report', { connection });
const invoiceQueue = new Queue('invoice', { connection });
const payrollQueue = new Queue('payroll', { connection });
const stockAlertQueue = new Queue('stock-alert', { connection });
const cleanupQueue = new Queue('cleanup', { connection });

// Log queue events
const queues = [emailQueue, notificationQueue, reportQueue, invoiceQueue, payrollQueue, stockAlertQueue, cleanupQueue];

queues.forEach((queue) => {
  queue.on('error', (error) => {
    logger.error(`Queue ${queue.name} error: ${error.message}`);
  });
});

module.exports = {
  emailQueue,
  notificationQueue,
  reportQueue,
  invoiceQueue,
  payrollQueue,
  stockAlertQueue,
  cleanupQueue,
};
