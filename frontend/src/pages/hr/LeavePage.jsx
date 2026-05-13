import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Calendar, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useGetLeavesQuery, useApproveLeaveMutation, useRejectLeaveMutation } from '../../features/hr/hrApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatDate, getInitials } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const LeavePage = () => {
  const dispatch = useDispatch();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);

  const { data, isLoading, isFetching, refetch } = useGetLeavesQuery({
    page, limit: 20, status: statusFilter, type: typeFilter,
  });
  const [approveLeave] = useApproveLeaveMutation();
  const [rejectLeave] = useRejectLeaveMutation();

  const leaves = data?.data || data?.leaves || [];
  const pagination = data?.pagination || {};

  useEffect(() => {
    dispatch(setPageTitle('Leave Requests'));
    dispatch(setBreadcrumbs([{ label: 'HR' }, { label: 'Leave' }]));
  }, [dispatch]);

  const handleApprove = async (id) => {
    setActionLoading(id + '_approve');
    try {
      await approveLeave(id).unwrap();
      toast.success('Leave approved.');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Approval failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this leave request?')) return;
    setActionLoading(id + '_reject');
    try {
      await rejectLeave(id).unwrap();
      toast.success('Leave rejected.');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Rejection failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const statusTabs = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Leave Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination.total || leaves.length} requests
          </p>
        </div>
        <button onClick={refetch} className="btn-ghost p-2 self-start" title="Refresh">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                statusFilter === tab.value ? 'bg-primary text-primary-foreground' : 'btn-ghost'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="input-base w-auto"
        >
          <option value="">All Types</option>
          <option value="annual">Annual Leave</option>
          <option value="sick">Sick Leave</option>
          <option value="casual">Casual Leave</option>
          <option value="maternity">Maternity Leave</option>
          <option value="paternity">Paternity Leave</option>
          <option value="unpaid">Unpaid Leave</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-header">
            <tr>
              <th className="table-th">Employee</th>
              <th className="table-th">Type</th>
              <th className="table-th">From</th>
              <th className="table-th">To</th>
              <th className="table-th">Days</th>
              <th className="table-th">Reason</th>
              <th className="table-th">Applied On</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="shimmer h-4 rounded w-full max-w-[100px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : leaves.length === 0 ? (
              <tr>
                <td colSpan={9} className="table-td text-center py-16">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No leave requests found</p>
                </td>
              </tr>
            ) : (
              leaves.map((leave) => (
                <motion.tr
                  key={leave._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="table-row"
                >
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {getInitials(leave.employee?.firstName, leave.employee?.lastName)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {leave.employee?.firstName} {leave.employee?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">{leave.employee?.designation}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground capitalize">
                      {leave.type?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="table-td text-sm text-muted-foreground">{formatDate(leave.startDate)}</td>
                  <td className="table-td text-sm text-muted-foreground">{formatDate(leave.endDate)}</td>
                  <td className="table-td text-sm font-medium">{leave.days || '—'}</td>
                  <td className="table-td text-sm text-muted-foreground max-w-[160px] truncate">
                    {leave.reason || '—'}
                  </td>
                  <td className="table-td text-sm text-muted-foreground">{formatDate(leave.createdAt)}</td>
                  <td className="table-td">
                    {leave.status === 'approved' ? <span className="badge-success">Approved</span> :
                     leave.status === 'rejected' ? <span className="badge-danger">Rejected</span> :
                     <span className="badge-warning">Pending</span>}
                  </td>
                  <td className="table-td">
                    {leave.status === 'pending' && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleApprove(leave._id)}
                          disabled={actionLoading === leave._id + '_approve'}
                          className="p-1.5 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-500 transition-colors"
                          title="Approve"
                        >
                          {actionLoading === leave._id + '_approve' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(leave._id)}
                          disabled={actionLoading === leave._id + '_reject'}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Reject"
                        >
                          {actionLoading === leave._id + '_reject' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
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
    </div>
  );
};

export default LeavePage;
