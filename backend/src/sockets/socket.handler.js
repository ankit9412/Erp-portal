const jwt = require('jsonwebtoken');
const User = require('../modules/user/user.model');
const logger = require('../config/logger');
const notificationService = require('../modules/notification/notification.service');

const setupSocketIO = (io) => {
  // Inject io into notification service
  notificationService.setSocketIO(io);

  // Authentication middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.userId).select('-password').lean();

      if (!user || user.status !== 'active') {
        return next(new Error('Invalid user'));
      }

      socket.userId = user._id.toString();
      socket.tenantId = user.tenantId?.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Join tenant room
    if (socket.tenantId) {
      socket.join(`tenant:${socket.tenantId}`);
    }

    // Handle joining specific rooms
    socket.on('join:room', (room) => {
      // Validate room access
      if (room.startsWith('tenant:') && room !== `tenant:${socket.tenantId}`) {
        socket.emit('error', { message: 'Access denied to this room' });
        return;
      }
      socket.join(room);
      logger.debug(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave:room', (room) => {
      socket.leave(room);
    });

    // Real-time inventory updates
    socket.on('inventory:subscribe', (warehouseId) => {
      socket.join(`inventory:${socket.tenantId}:${warehouseId}`);
    });

    // Real-time dashboard updates
    socket.on('dashboard:subscribe', () => {
      socket.join(`dashboard:${socket.tenantId}`);
    });

    // Typing indicators for messaging
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        userId: socket.userId,
        userName: `${socket.user.firstName} ${socket.user.lastName}`,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        userId: socket.userId,
      });
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (Reason: ${reason})`);
    });

    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}: ${error.message}`);
    });
  });

  // Helper functions to emit events
  const emitToTenant = (tenantId, event, data) => {
    io.to(`tenant:${tenantId}`).emit(event, data);
  };

  const emitToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  const emitInventoryUpdate = (tenantId, warehouseId, data) => {
    io.to(`inventory:${tenantId}:${warehouseId}`).emit('inventory:update', data);
  };

  const emitDashboardUpdate = (tenantId, data) => {
    io.to(`dashboard:${tenantId}`).emit('dashboard:update', data);
  };

  return { emitToTenant, emitToUser, emitInventoryUpdate, emitDashboardUpdate };
};

module.exports = setupSocketIO;
