import { format, formatDistanceToNow, isValid } from 'date-fns';

export const formatCurrency = (amount, currency = 'INR') => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '—';
  return new Intl.NumberFormat('en-IN').format(num);
};

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—';
  const d = new Date(date);
  if (!isValid(d)) return '—';
  return format(d, fmt);
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (!isValid(d)) return '—';
  return format(d, 'dd MMM yyyy, hh:mm a');
};

export const formatRelativeTime = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  if (!isValid(d)) return '—';
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined) return '—';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const truncate = (str, length = 50) => {
  if (!str) return '';
  return str.length > length ? `${str.substring(0, length)}...` : str;
};

export const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const getStatusColor = (status) => {
  const map = {
    active: 'success', inactive: 'danger', pending: 'warning',
    paid: 'success', unpaid: 'danger', partial: 'warning', overdue: 'danger',
    approved: 'success', rejected: 'danger', draft: 'muted',
    present: 'success', absent: 'danger', on_leave: 'warning',
    completed: 'success', cancelled: 'danger', processing: 'info',
  };
  return map[status] || 'muted';
};
