import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../features/notification/notificationSlice';
import { selectAccessToken } from '../features/auth/authSlice';
import toast from 'react-hot-toast';

let socketInstance = null;

export const useSocket = () => {
  const dispatch = useDispatch();
  const accessToken = useSelector(selectAccessToken);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!accessToken) return;

    if (socketInstance?.connected) {
      socketRef.current = socketInstance;
      return;
    }

    const socket = io(import.meta.env.VITE_SOCKET_URL || '', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('dashboard:subscribe');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('notification', (notification) => {
      dispatch(addNotification({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        link: notification.link,
        priority: notification.priority || 'medium',
        isRead: false,
        createdAt: notification.createdAt || new Date().toISOString(),
      }));

      if (notification.priority === 'high' || notification.priority === 'urgent') {
        toast(notification.title, {
          icon: notification.type === 'stock_alert' ? '⚠️' : '🔔',
          duration: 5000,
        });
      }
    });

    socket.on('inventory:update', (data) => {
      console.log('Inventory update:', data);
    });

    socket.on('dashboard:update', (data) => {
      console.log('Dashboard update:', data);
    });

    socketInstance = socket;
    socketRef.current = socket;
  }, [accessToken, dispatch]);

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  const joinRoom = useCallback((room) => {
    socketRef.current?.emit('join:room', room);
  }, []);

  const leaveRoom = useCallback((room) => {
    socketRef.current?.emit('leave:room', room);
  }, []);

  return {
    socket: socketRef.current,
    emit,
    joinRoom,
    leaveRoom,
    isConnected: socketRef.current?.connected || false,
  };
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};
