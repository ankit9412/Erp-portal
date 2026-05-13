import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Shield, Search, RefreshCw, Filter } from 'lucide-react';
import { apiSlice } from '../../app/api/apiSlice';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatDateTime, getInitials } from '../../utils/formatters';
import { cn } from '../../utils/cn';

// Create audit API endpoints
const auditApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuditLogs: builder.query({
      query: (params) => ({ url: '/audit', params }),
      providesTags: ['Audit'],
    }),
  }),
});

const { useGetAuditLogsQuery } = auditApi;

const ACTION_COLORS = {
  create: 'badge-success',
  update: 'badge-info',
  delete: 'badge-danger',
  login: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-600',
  logout: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground',
  approve: 'badge-success',
  reject: 'badge-danger',
  export: 'badge-warning',
  view: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground',
};

const MODULES = ['inventory', 'finance', 'hr', 'analytics', 'settings', 'auth', 'users'];
const ACTIONS = ['create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'export', 'view'];

const AuditPage = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetAuditLogsQuery({
    page, limit: 25, search, module: moduleFilter, action: actionFilter, dateFrom, dateTo,
  });

  const logs = data?.data || data?.logs || [];
  const pagination = data?.pagination || {};

  useEffect(() => {
    dispatch(setPageTitle('Audit Log'));
    dispatch(setBreadcrumbs([{ label: 'Audit Log' }]));
  }, [dispatch]);

  const clearFilters = () => {
    setModuleFilter('');
    setActionFilter('');
    setDateFrom('');
    setDateTo('');
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = moduleFilter || actionFilter || dateFrom || dateTo || search;

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Audit Log</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination.total || logs.length} audit events
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn('btn-ghost flex items-center gap-2', showFilters && 'bg-accent')}
          >
            <Filter className="h-4 w-4" /> Filters
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by user, action, resource..."
          className="input-base pl-9"
        />
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card-base p-4"
        >
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="label-base mb-1.5 block text-xs">Module</label>
              <select
                value={moduleFilter}
                onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}
                className="input-base w-auto h-9 text-sm"
              >
                <option value="">All Modules</option>
                {MODULES.map((m) => (
                  <option key={m} value={m} className="capitalize">{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base mb-1.5 block text-xs">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                className="input-base w-auto h-9 text-sm"
              >
                <option value="">All Actions</option>
                {ACTIONS.map((a) => (
                  <option key={a} value={a} className="capitalize">{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base mb-1.5 block text-xs">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                className="input-base w-auto h-9 text-sm"
              />
            </div>
            <div>
              <label className="label-base mb-1.5 block text-xs">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                className="input-base w-auto h-9 text-sm"
              />
            </div>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-ghost text-sm h-9">
                Clear Filters
              </button>
            )}
          </div>
        </motion.div>
      )}

      <div className="table-container">
        <table className="table-base">
          <thead className="table-header">
            <tr>
              <th className="table-th">User</th>
              <th className="table-th">Action</th>
              <th className="table-th">Module</th>
              <th className="table-th">Resource</th>
              <th className="table-th">IP Address</th>
              <th className="table-th">Timestamp</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="shimmer h-4 rounded w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-td text-center py-16">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No audit logs found</p>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="btn-ghost mt-2 text-sm">
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <motion.tr
                  key={log._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="table-row"
                >
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {getInitials(log.user?.firstName, log.user?.lastName)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {log.user?.firstName} {log.user?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{log.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className={cn(ACTION_COLORS[log.action] || ACTION_COLORS.view, 'capitalize')}>
                      {log.action}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground capitalize">
                      {log.module}
                    </span>
                  </td>
                  <td className="table-td">
                    <div>
                      <p className="text-sm text-foreground capitalize">{log.resourceType?.replace(/_/g, ' ')}</p>
                      {log.resourceId && (
                        <p className="text-xs text-muted-foreground font-mono">{String(log.resourceId).slice(-8)}</p>
                      )}
                    </div>
                  </td>
                  <td className="table-td">
                    <code className="text-xs text-muted-foreground">{log.ipAddress || '—'}</code>
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="table-td">
                    {log.status === 'success' || !log.status ? (
                      <span className="badge-success">Success</span>
                    ) : (
                      <span className="badge-danger">Failed</span>
                    )}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const p = Math.max(1, Math.min(pagination.pages - 4, page - 2)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm transition-colors',
                      page === p ? 'bg-primary text-primary-foreground' : 'btn-ghost'
                    )}
                  >
                    {p}
                  </button>
                );
              })}
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
    </div>
  );
};

export default AuditPage;
