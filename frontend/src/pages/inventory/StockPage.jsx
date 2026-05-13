import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, RefreshCw, SlidersHorizontal, X, Loader2 } from 'lucide-react';
import { useGetStockQuery, useGetWarehousesQuery, useAdjustStockMutation } from '../../features/inventory/inventoryApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatNumber } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const AdjustStockModal = ({ onClose }) => {
  const [adjustStock, { isLoading }] = useAdjustStockMutation();
  const { data: warehousesData } = useGetWarehousesQuery();
  const warehouses = warehousesData?.data || [];
  const [form, setForm] = useState({ productId: '', warehouseId: '', quantity: '', type: 'add', reason: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.warehouseId || !form.quantity) {
      toast.error('Please fill all required fields.');
      return;
    }
    try {
      await adjustStock(form).unwrap();
      toast.success('Stock adjusted successfully.');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Adjustment failed.');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Adjust Stock</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="label-base mb-1.5 block">Product ID <span className="text-destructive">*</span></label>
              <input
                value={form.productId}
                onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                placeholder="Enter product ID"
                className="input-base"
              />
            </div>
            <div>
              <label className="label-base mb-1.5 block">Warehouse <span className="text-destructive">*</span></label>
              <select
                value={form.warehouseId}
                onChange={(e) => setForm((f) => ({ ...f, warehouseId: e.target.value }))}
                className="input-base"
              >
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-base mb-1.5 block">Adjustment Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="input-base"
                >
                  <option value="add">Add Stock</option>
                  <option value="remove">Remove Stock</option>
                  <option value="set">Set Quantity</option>
                </select>
              </div>
              <div>
                <label className="label-base mb-1.5 block">Quantity <span className="text-destructive">*</span></label>
                <input
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  placeholder="0"
                  className="input-base"
                />
              </div>
            </div>
            <div>
              <label className="label-base mb-1.5 block">Reason</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                rows={2}
                placeholder="Reason for adjustment..."
                className="input-base resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Adjust Stock
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

const StockPage = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetStockQuery({
    search, warehouseId: warehouseFilter,
  });
  const { data: warehousesData } = useGetWarehousesQuery();

  const stockItems = data?.data || [];
  const warehouses = warehousesData?.data || [];

  useEffect(() => {
    dispatch(setPageTitle('Stock Levels'));
    dispatch(setBreadcrumbs([{ label: 'Inventory' }, { label: 'Stock' }]));
  }, [dispatch]);

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Stock Levels</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {stockItems.length} items across all warehouses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" /> Adjust Stock
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className="input-base w-auto"
        >
          <option value="">All Warehouses</option>
          {warehouses.map((w) => (
            <option key={w._id} value={w._id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead className="table-header">
            <tr>
              <th className="table-th">Product</th>
              <th className="table-th">Warehouse</th>
              <th className="table-th">Quantity</th>
              <th className="table-th">Reserved</th>
              <th className="table-th">Available</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="shimmer h-4 rounded w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : stockItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-td text-center py-16">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No stock records found</p>
                </td>
              </tr>
            ) : (
              stockItems.map((item) => {
                const available = (item.quantity || 0) - (item.reserved || 0);
                const isLow = available <= (item.product?.minStockLevel || 0);
                return (
                  <motion.tr
                    key={item._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="table-row"
                  >
                    <td className="table-td">
                      <div>
                        <p className="font-medium text-foreground text-sm">{item.product?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{item.product?.sku}</p>
                      </div>
                    </td>
                    <td className="table-td text-sm text-muted-foreground">
                      {item.warehouse?.name || '—'}
                    </td>
                    <td className="table-td font-medium text-sm">
                      {formatNumber(item.quantity)}
                    </td>
                    <td className="table-td text-sm text-orange-500">
                      {formatNumber(item.reserved || 0)}
                    </td>
                    <td className="table-td">
                      <span className={cn('text-sm font-semibold', available <= 0 ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-green-500')}>
                        {formatNumber(available)}
                      </span>
                    </td>
                    <td className="table-td">
                      {available <= 0 ? (
                        <span className="badge-danger">Out of Stock</span>
                      ) : isLow ? (
                        <span className="badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge-success">In Stock</span>
                      )}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && <AdjustStockModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default StockPage;
