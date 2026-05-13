import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, RefreshCw, Eye, FileText } from 'lucide-react';
import { useGetInvoicesQuery } from '../../features/finance/financeApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const STATUS_CONFIG = {
  draft: { label: 'Draft', cls: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground' },
  sent: { label: 'Sent', cls: 'badge-info' },
  paid: { label: 'Paid', cls: 'badge-success' },
  partial: { label: 'Partial', cls: 'badge-warning' },
  overdue: { label: 'Overdue', cls: 'badge-danger' },
  cancelled: { label: 'Cancelled', cls: 'badge-danger' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return <span className={config.cls}>{config.label}</span>;
};

const InvoicesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useGetInvoicesQuery({
    page, limit: 20, search, status: statusFilter,
  });

  const invoices = data?.invoices || data?.data || [];
  const pagination = data?.pagination || {};

  useEffect(() => {
    dispatch(setPageTitle('Invoices'));
    dispatch(setBreadcrumbs([{ label: 'Finance' }, { label: 'Invoices' }]));
  }, [dispatch]);

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination.total || invoices.length} invoices · {formatCurrency(totalAmount)} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          <button
            onClick={() => navigate('/finance/invoices/create')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create Invoice
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {[{ value: '', label: 'All' }, ...Object.entries(STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))].map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              statusFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'btn-ghost'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search invoice number, customer..."
          className="input-base pl-9"
        />
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-header">
            <tr>
              <th className="table-th">Invoice #</th>
              <th className="table-th">Customer</th>
              <th className="table-th">Date</th>
              <th className="table-th">Due Date</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Paid</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="shimmer h-4 rounded w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-td text-center py-16">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No invoices found</p>
                  <button
                    onClick={() => navigate('/finance/invoices/create')}
                    className="btn-primary mt-3 text-sm"
                  >
                    Create your first invoice
                  </button>
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <motion.tr
                  key={invoice._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="table-row cursor-pointer"
                  onClick={() => navigate(`/finance/invoices/${invoice._id}`)}
                >
                  <td className="table-td">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono font-semibold">
                      {invoice.invoiceNumber}
                    </code>
                  </td>
                  <td className="table-td">
                    <p className="text-sm font-medium text-foreground">{invoice.customer?.name || invoice.customerName || '—'}</p>
                    <p className="text-xs text-muted-foreground">{invoice.customer?.email}</p>
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {formatDate(invoice.invoiceDate || invoice.createdAt)}
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {formatDate(invoice.dueDate)}
                  </td>
                  <td className="table-td font-semibold text-sm">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td className="table-td text-sm text-green-500 font-medium">
                    {formatCurrency(invoice.paidAmount || 0)}
                  </td>
                  <td className="table-td">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="table-td" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => navigate(`/finance/invoices/${invoice._id}`)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
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

export default InvoicesPage;
