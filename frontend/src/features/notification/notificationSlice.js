import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  notifications: [],
  unreadCount: 0,
  isOpen: false,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) state.unreadCount += 1;
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    setNotifications: (state, action) => {
      state.notifications = action.payload.notifications;
      state.unreadCount = action.payload.unreadCount;
    },
    markAsRead: (state, action) => {
      if (action.payload === 'all') {
        state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }));
        state.unreadCount = 0;
      } else {
        const n = state.notifications.find((n) => n.id === action.payload);
        if (n && !n.isRead) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      }
    },
    removeNotification: (state, action) => {
      const idx = state.notifications.findIndex((n) => n.id === action.payload);
      if (idx !== -1) {
        if (!state.notifications[idx].isRead) state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.notifications.splice(idx, 1);
      }
    },
    toggleNotificationPanel: (state) => { state.isOpen = !state.isOpen; },
    setUnreadCount: (state, action) => { state.unreadCount = action.payload; },
  },
});

export const {
  addNotification, setNotifications, markAsRead,
  removeNotification, toggleNotificationPanel, setUnreadCount,
} = notificationSlice.actions;

export default notificationSlice.reducer;
