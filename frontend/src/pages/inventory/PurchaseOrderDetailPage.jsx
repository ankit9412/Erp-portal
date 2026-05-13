import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Package, Loader2, ShoppingCart } from 'lucide-react';
import { useGetPurchaseOrdersQuery, useApprovePurchaseOrderMutation, useReceiveGoodsMutation } from '../../features/inventory/inventoryApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  draft: { label: 'Draft', cls: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground' },
  pending_approval: { label: 'Pending Approval', cls: 'badge-warning' },
  approved: { label: 'Approved', cls: 'badge-success' },
  sent: { label: 'Sent', cls: 'badge-info' },
  received: { label: 'Received', cls: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-600' },
  cancelled: { label: 'Cancelled', cls: 'badge-danger' },
};

const PurchaseOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Fetch single PO by passing id as filter — backend should support ?id= or we use the list endpoint
  const { data, isLoading } = useGetPurchaseOrdersQuery({ id });
  const [approvePO, { isLoading: approving }] = useApprovePurchaseOrderMutation();
  const [receiveGoods, { isLoading: receiving }] = useReceiveGoodsMutation();

  // Support both array response and single object response
  const rawData = data?.data;
  const order = Array.isArray(rawData) ? rawData.find((o) => o._id === id) : rawData;

  useEffect(() => {
    if (order) {
      dispatch(setPageTitle(order.poNumber));
      dispatch(setBreadcrumbs([
        { label: 'Inventory' },
        { label: 'Purchase Orders', href: '/inventory/purchase-orders' },
        { label: order.poNumber },
      ]));
    }
  }, [dispatch, order]);

  const handleApprove = async () => {
    if (!window.confirm('Approve this purchase order?')) return;
    try {
      await approvePO(id).unwrap();
      toast.success('Purchase order approved.');
    } catch (err) {
      toast.error(err?.data?.message || 'Approval failed.');
    }
  };

  const handleReceive = async () => {
    if (!window.confirm('Mark all items as received?')) return;
    try {
      await receiveGoods({ id, items: order.items }).unwrap();
      toast.success('Goods received and stock updated.');
    } catch (err) {
      toast.error(err?.data?.message || 'Receive failed.');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="shimmer h-8 w-48 rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-base p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-6 rounded" />)}
          </div>
          <div className="card-base p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-6 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="page-container">
        <div className="text-center py-20">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Purchase order not found.</p>
          <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go Back</button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.draft;
  const canApprove = order.status === 'pending_approval';
  const canReceive = order.status === 'approved' || order.status === 'sent';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="section-title">{order.poNumber}</h1>
            <span className={statusConfig.cls}>{statusConfig.label}</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Created {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canApprove && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="btn-primary flex items-center gap-2"
            >
              {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              Approve PO
            </button>
          )}
          {canReceive && (
            <button
              onClick={handleReceive}
              disabled={receiving}
              className="btn-secondary flex items-center gap-2"
            >
              {receiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              Receive Goods
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="card-base overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Order Items</h3>
            </div>
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Product</th>
                  <th className="table-th">Qty Ordered</th>
                  <th className="table-th">Qty Received</th>
                  <th className="table-th">Unit Price</th>
                  <th className="table-th">Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="table-row"
                  >
                    <td className="table-td">
                      <p className="font-medium text-foreground text-sm">{item.product?.name || item.productName || '—'}</p>
                      <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                    </td>
                    <td className="table-td text-sm">{item.quantity}</td>
                    <td className="table-td text-sm">
                      <span className={cn(
                        item.receivedQuantity >= item.quantity ? 'text-green-500' : 'text-muted-foreground'
                      )}>
                        {item.receivedQuantity || 0}
                      </span>
                    </td>
                    <td className="table-td text-sm">{formatCurrency(item.unitPrice)}</td>
                    <td className="table-td font-semibold text-sm">
                      {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="px-6 py-4 border-t border-border bg-muted/30">
              <div className="flex flex-col items-end gap-1.5 text-sm">
                <div className="flex justify-between w-48">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(order.subtotal)}</span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between w-48">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="font-medium">{formatCurrency(order.taxAmount)}</span>
                  </div>
                )}
                {order.shippingCost > 0 && (
                  <div className="flex justify-between w-48">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">{formatCurrency(order.shippingCost)}</span>
                  </div>
                )}
                <div className="flex justify-between w-48 pt-1.5 border-t border-border">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-bold text-foreground">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="card-base p-5">
              <h3 className="font-semibold text-foreground mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card-base p-5">
            <h3 className="font-semibold text-foreground mb-4">Supplier</h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">{order.supplier?.name || '—'}</p>
              {order.supplier?.email && <p className="text-muted-foreground">{order.supplier.email}</p>}
              {order.supplier?.phone && <p className="text-muted-foreground">{order.supplier.phone}</p>}
            </div>
          </div>

          <div className="card-base p-5">
            <h3 className="font-semibold text-foreground mb-4">Order Details</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Order Date', value: formatDate(order.orderDate) },
                { label: 'Expected Delivery', value: formatDate(order.expectedDelivery) },
                { label: 'Payment Terms', value: order.paymentTerms || '—' },
                { label: 'Warehouse', value: order.warehouse?.name || '—' },
                { label: 'Created By', value: order.createdBy?.firstName ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;
