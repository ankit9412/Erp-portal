import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Warehouse, RefreshCw, X, Loader2, Edit } from 'lucide-react';
import { useGetWarehousesQuery, useCreateWarehouseMutation, useUpdateWarehouseMutation } from '../../features/inventory/inventoryApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const WarehouseModal = ({ warehouse, onClose }) => {
  const isEdit = !!warehouse;
  const [createWarehouse, { isLoading: creating }] = useCreateWarehouseMutation();
  const [updateWarehouse, { isLoading: updating }] = useUpdateWarehouseMutation();
  const isLoading = creating || updating;

  const [form, setForm] = useState({
    name: warehouse?.name || '',
    code: warehouse?.code || '',
    type: warehouse?.type || 'main',
    capacity: warehouse?.capacity || '',
    manager: warehouse?.manager || '',
    address: warehouse?.address || '',
    status: warehouse?.status || 'active',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) {
      toast.error('Name and code are required.');
      return;
    }
    try {
      if (isEdit) {
        await updateWarehouse({ id: warehouse._id, ...form }).unwrap();
        toast.success('Warehouse updated.');
      } else {
        await createWarehouse(form).unwrap();
        toast.success('Warehouse created.');
      }
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Operation failed.');
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

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
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">
              {isEdit ? 'Edit Warehouse' : 'Add Warehouse'}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base mb-1.5 block">Name <span className="text-destructive">*</span></label>
                <input value={form.name} onChange={set('name')} placeholder="Main Warehouse" className="input-base" />
              </div>
              <div>
                <label className="label-base mb-1.5 block">Code <span className="text-destructive">*</span></label>
                <input value={form.code} onChange={set('code')} placeholder="WH-001" className="input-base" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base mb-1.5 block">Type</label>
                <select value={form.type} onChange={set('type')} className="input-base">
                  <option value="main">Main</option>
                  <option value="transit">Transit</option>
                  <option value="returns">Returns</option>
                  <option value="cold_storage">Cold Storage</option>
                </select>
              </div>
              <div>
                <label className="label-base mb-1.5 block">Capacity (units)</label>
                <input type="number" value={form.capacity} onChange={set('capacity')} placeholder="10000" className="input-base" />
              </div>
            </div>
            <div>
              <label className="label-base mb-1.5 block">Manager</label>
              <input value={form.manager} onChange={set('manager')} placeholder="Manager name" className="input-base" />
            </div>
            <div>
              <label className="label-base mb-1.5 block">Address</label>
              <textarea value={form.address} onChange={set('address')} rows={2} placeholder="Warehouse address..." className="input-base resize-none" />
            </div>
            <div>
              <label className="label-base mb-1.5 block">Status</label>
              <select value={form.status} onChange={set('status')} className="input-base">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? 'Update' : 'Create'} Warehouse
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

const WarehousesPage = () => {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState(null);

  const { data, isLoading, isFetching, refetch } = useGetWarehousesQuery();
  const warehouses = data?.data || [];

  useEffect(() => {
    dispatch(setPageTitle('Warehouses'));
    dispatch(setBreadcrumbs([{ label: 'Inventory' }, { label: 'Warehouses' }]));
  }, [dispatch]);

  const typeColors = {
    main: 'badge-info',
    transit: 'badge-warning',
    returns: 'badge-danger',
    cold_storage: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-500/10 text-purple-600',
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Warehouses</h1>
          <p className="text-muted-foreground text-sm mt-1">{warehouses.length} warehouses configured</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          <button
            onClick={() => { setEditWarehouse(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Warehouse
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-header">
            <tr>
              <th className="table-th">Warehouse</th>
              <th className="table-th">Code</th>
              <th className="table-th">Type</th>
              <th className="table-th">Capacity</th>
              <th className="table-th">Manager</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="shimmer h-4 rounded w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : warehouses.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-td text-center py-16">
                  <Warehouse className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No warehouses found</p>
                  <button
                    onClick={() => { setEditWarehouse(null); setShowModal(true); }}
                    className="btn-primary mt-3 text-sm"
                  >
                    Add your first warehouse
                  </button>
                </td>
              </tr>
            ) : (
              warehouses.map((wh) => (
                <motion.tr
                  key={wh._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="table-row"
                >
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                        <Warehouse className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{wh.name}</p>
                        {wh.address && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{wh.address}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{wh.code}</code>
                  </td>
                  <td className="table-td">
                    <span className={typeColors[wh.type] || 'badge-info'}>
                      {wh.type?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {wh.capacity ? wh.capacity.toLocaleString() : '—'}
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {wh.manager || '—'}
                  </td>
                  <td className="table-td">
                    {wh.status === 'active' ? (
                      <span className="badge-success">Active</span>
                    ) : (
                      <span className="badge-danger">Inactive</span>
                    )}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => { setEditWarehouse(wh); setShowModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <WarehouseModal
            warehouse={editWarehouse}
            onClose={() => { setShowModal(false); setEditWarehouse(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WarehousesPage;
