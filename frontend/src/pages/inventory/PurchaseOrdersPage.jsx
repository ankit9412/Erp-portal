import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, RefreshCw, Eye, ShoppingCart } from 'lucide-react';
import { useGetPurchaseOrdersQuery } from '../../features/inventory/inventoryApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const STATUS_CONFIG = {
  draft: { label: 'Draft', cls: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground' },
  pending_approval: { label: 'Pending Approval', cls: 'badge-warning' },
  approved: { label: 'Approved', cls: 'badge-success' },
  sent: { label: 'Sent', cls: 'badge-info' },
  received: { label: 'Received', cls: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-600' },
  cancelled: { label: 'Cancelled', cls: 'badge-danger' },
};

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return <span className={config.cls}>{config.label}</span>;
};

const PurchaseOrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useGetPurchaseOrdersQuery({
    page, limit: 20, search, status: statusFilter,
  });

  const orders = data?.data || [];
  const pagination = data?.pagination || {};

  useEffect(() => {
    dispatch(setPageTitle('Purchase Orders'));
    dispatch(setBreadcrumbs([{ label: 'Inventory' }, { label: 'Purchase Orders' }]));
  }, [dispatch]);

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Purchase Orders</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination.total || 0} purchase orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          <button
            onClick={() => navigate('/inventory/purchase-orders/create')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create PO
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search PO number, supplier..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-base w-auto"
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-header">
            <tr>
              <th className="table-th">PO Number</th>
              <th className="table-th">Supplier</th>
              <th className="table-th">Date</th>
              <th className="table-th">Expected</th>
              <th className="table-th">Amount</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="shimmer h-4 rounded w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-td text-center py-16">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No purchase orders found</p>
                  <button
                    onClick={() => navigate('/inventory/purchase-orders/create')}
                    className="btn-primary mt-3 text-sm"
                  >
                    Create your first PO
                  </button>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <motion.tr
                  key={order._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="table-row"
                >
                  <td className="table-td">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono font-semibold">
                      {order.poNumber}
                    </code>
                  </td>
                  <td className="table-td">
                    <p className="text-sm font-medium text-foreground">{order.supplier?.name || '—'}</p>
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {formatDate(order.orderDate)}
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {formatDate(order.expectedDelivery)}
                  </td>
                  <td className="table-td font-semibold text-sm">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="table-td">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => navigate(`/inventory/purchase-orders/${order._id}`)}
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

export default PurchaseOrdersPage;
