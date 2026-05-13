import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Bell, CheckCheck, Filter, RefreshCw, Package, FileText, Users, DollarSign, AlertTriangle } from 'lucide-react';
import { apiSlice } from '../../app/api/apiSlice';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatRelativeTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

// Create notifications API endpoints
const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params) => ({ url: '/notifications', params }),
      providesTags: ['Notification'],
    }),
    markAsRead: builder.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PUT' }),
      invalidatesTags: ['Notification'],
    }),
    markAllAsRead: builder.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'PUT' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

const { useGetNotificationsQuery, useMarkAsReadMutation, useMarkAllAsReadMutation } = notificationsApi;

const NOTIFICATION_ICONS = {
  inventory: Package,
  finance: DollarSign,
  hr: Users,
  invoice: FileText,
  alert: AlertTriangle,
  default: Bell,
};

const NOTIFICATION_COLORS = {
  inventory: 'text-blue-500 bg-blue-500/10',
  finance: 'text-green-500 bg-green-500/10',
  hr: 'text-purple-500 bg-purple-500/10',
  invoice: 'text-orange-500 bg-orange-500/10',
  alert: 'text-red-500 bg-red-500/10',
  default: 'text-muted-foreground bg-muted',
};

const NotificationsPage = () => {
  const dispatch = useDispatch();
  const [typeFilter, setTypeFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useGetNotificationsQuery({
    page, limit: 20, type: typeFilter, read: readFilter,
  });
  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const notifications = data?.data || data?.notifications || [];
  const pagination = data?.pagination || {};

  useEffect(() => {
    dispatch(setPageTitle('Notifications'));
    dispatch(setBreadcrumbs([{ label: 'Notifications' }]));
  }, [dispatch]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id).unwrap();
    } catch (err) {
      toast.error('Failed to mark as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      toast.success('All notifications marked as read.');
    } catch (err) {
      toast.error('Failed to mark all as read.');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'inventory', label: 'Inventory' },
    { value: 'finance', label: 'Finance' },
    { value: 'hr', label: 'HR' },
    { value: 'invoice', label: 'Invoice' },
    { value: 'alert', label: 'Alert' },
  ];

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'} · {pagination.total || notifications.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn-secondary flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="input-base w-auto"
        >
          {typeOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={readFilter}
          onChange={(e) => { setReadFilter(e.target.value); setPage(1); }}
          className="input-base w-auto"
        >
          <option value="">All</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-base p-4">
              <div className="flex items-start gap-4">
                <div className="shimmer w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="shimmer h-4 w-3/4 rounded" />
                  <div className="shimmer h-3 w-1/2 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="card-base p-12 text-center">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No notifications found</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;
            const colorClass = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.default;

            return (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'card-base p-4 cursor-pointer transition-all hover:shadow-md',
                  !notification.read && 'border-l-4 border-l-primary bg-primary/5'
                )}
                onClick={() => !notification.read && handleMarkAsRead(notification._id)}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-medium', notification.read ? 'text-muted-foreground' : 'text-foreground')}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                      {notification.type && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground capitalize">
                          {notification.type}
                        </span>
                      )}
                      {notification.priority === 'high' && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400">
                          High Priority
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Page {page} of {pagination.pages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
