const Notification = require('./notification.model');
const { redisClient } = require('../../config/redis');
const { sendEmail } = require('../../shared/email.service');
const logger = require('../../config/logger');

class NotificationService {
  constructor() {
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  /**
   * Create and send a notification
   */
  async send({ tenantId, recipientId, type, title, message, data, link, channels = {}, priority = 'medium' }) {
    try {
      const notification = await Notification.create({
        tenantId,
        recipient: recipientId,
        type,
        title,
        message,
        data,
        link,
        channels: {
          inApp: channels.inApp !== false,
          email: channels.email || false,
          sms: channels.sms || false,
          push: channels.push || false,
        },
        priority,
      });

      // Send real-time notification via Socket.IO
      if (this.io && channels.inApp !== false) {
        this.io.to(`user:${recipientId}`).emit('notification', {
          id: notification._id,
          type,
          title,
          message,
          data,
          link,
          priority,
          createdAt: notification.createdAt,
        });
      }

      // Send email notification
      if (channels.email) {
        this.sendEmailNotification(notification).catch((err) =>
          logger.error(`Email notification failed: ${err.message}`)
        );
      }

      return notification;
    } catch (error) {
      logger.error(`Notification send error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulk({ tenantId, recipientIds, type, title, message, data, link }) {
    const notifications = recipientIds.map((recipientId) => ({
      tenantId,
      recipient: recipientId,
      type,
      title,
      message,
      data,
      link,
    }));

    const created = await Notification.insertMany(notifications);

    // Emit to all recipients
    if (this.io) {
      recipientIds.forEach((recipientId, i) => {
        this.io.to(`user:${recipientId}`).emit('notification', {
          id: created[i]._id,
          type,
          title,
          message,
          data,
          link,
          createdAt: created[i].createdAt,
        });
      });
    }

    return created;
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(notification) {
    const user = await require('../user/user.model').findById(notification.recipient).lean();
    if (!user?.email) return;

    await sendEmail({
      to: user.email,
      subject: notification.title,
      template: 'notification',
      data: {
        name: user.firstName,
        title: notification.title,
        message: notification.message,
        link: notification.link,
      },
    });

    await Notification.findByIdAndUpdate(notification._id, { emailSent: true });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
    const query = { recipient: userId };
    if (unreadOnly) query.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return { notifications, total, unreadCount, page, limit };
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(userId, notificationIds) {
    if (notificationIds === 'all') {
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true, readAt: new Date() } }
      );
    } else {
      await Notification.updateMany(
        { _id: { $in: notificationIds }, recipient: userId },
        { $set: { isRead: true, readAt: new Date() } }
      );
    }
  }

  /**
   * Send low stock alert
   */
  async sendLowStockAlert({ tenantId, productName, currentStock, minStockLevel }) {
    // Get all users with inventory permissions in this tenant
    const User = require('../user/user.model');
    const managers = await User.find({
      tenantId,
      roleType: { $in: ['business_owner', 'manager', 'inventory_staff'] },
      status: 'active',
    }).select('_id').lean();

    for (const user of managers) {
      await this.send({
        tenantId,
        recipientId: user._id,
        type: 'stock_alert',
        title: 'Low Stock Alert',
        message: `${productName} is running low. Current stock: ${currentStock} (Min: ${minStockLevel})`,
        data: { productName, currentStock, minStockLevel },
        link: '/inventory/products',
        priority: 'high',
      });
    }
  }
}

module.exports = new NotificationService();
