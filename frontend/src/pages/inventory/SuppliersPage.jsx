import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, RefreshCw, X, Loader2, Edit, Star, Truck } from 'lucide-react';
import { useGetSuppliersQuery, useCreateSupplierMutation, useUpdateSupplierMutation } from '../../features/inventory/inventoryApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={cn('h-3.5 w-3.5', i < Math.round(rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30')}
      />
    ))}
    <span className="text-xs text-muted-foreground ml-1">{rating ? rating.toFixed(1) : '—'}</span>
  </div>
);

const SupplierModal = ({ supplier, onClose }) => {
  const isEdit = !!supplier;
  const [createSupplier, { isLoading: creating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updating }] = useUpdateSupplierMutation();
  const isLoading = creating || updating;

  const [form, setForm] = useState({
    name: supplier?.name || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    contactPerson: supplier?.contactPerson || '',
    address: supplier?.address || '',
    paymentTerms: supplier?.paymentTerms || 'net30',
    status: supplier?.status || 'active',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error('Name and email are required.');
      return;
    }
    try {
      if (isEdit) {
        await updateSupplier({ id: supplier._id, ...form }).unwrap();
        toast.success('Supplier updated.');
      } else {
        await createSupplier(form).unwrap();
        toast.success('Supplier added.');
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
              {isEdit ? 'Edit Supplier' : 'Add Supplier'}
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="label-base mb-1.5 block">Company Name <span className="text-destructive">*</span></label>
              <input value={form.name} onChange={set('name')} placeholder="Supplier Co. Ltd." className="input-base" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base mb-1.5 block">Email <span className="text-destructive">*</span></label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="supplier@example.com" className="input-base" />
              </div>
              <div>
                <label className="label-base mb-1.5 block">Phone</label>
                <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className="input-base" />
              </div>
            </div>
            <div>
              <label className="label-base mb-1.5 block">Contact Person</label>
              <input value={form.contactPerson} onChange={set('contactPerson')} placeholder="John Doe" className="input-base" />
            </div>
            <div>
              <label className="label-base mb-1.5 block">Address</label>
              <textarea value={form.address} onChange={set('address')} rows={2} placeholder="Supplier address..." className="input-base resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base mb-1.5 block">Payment Terms</label>
                <select value={form.paymentTerms} onChange={set('paymentTerms')} className="input-base">
                  <option value="immediate">Immediate</option>
                  <option value="net15">Net 15</option>
                  <option value="net30">Net 30</option>
                  <option value="net60">Net 60</option>
                  <option value="net90">Net 90</option>
                </select>
              </div>
              <div>
                <label className="label-base mb-1.5 block">Status</label>
                <select value={form.status} onChange={set('status')} className="input-base">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blacklisted">Blacklisted</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? 'Update' : 'Add'} Supplier
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

const SuppliersPage = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);

  const { data, isLoading, isFetching, refetch } = useGetSuppliersQuery({ search, status: statusFilter });
  const suppliers = data?.data || [];

  useEffect(() => {
    dispatch(setPageTitle('Suppliers'));
    dispatch(setBreadcrumbs([{ label: 'Inventory' }, { label: 'Suppliers' }]));
  }, [dispatch]);

  const statusBadge = (status) => {
    if (status === 'active') return <span className="badge-success">Active</span>;
    if (status === 'blacklisted') return <span className="badge-danger">Blacklisted</span>;
    return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">Inactive</span>;
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Suppliers</h1>
          <p className="text-muted-foreground text-sm mt-1">{suppliers.length} suppliers</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          <button
            onClick={() => { setEditSupplier(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Supplier
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-base w-auto"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-header">
            <tr>
              <th className="table-th">Supplier</th>
              <th className="table-th">Email</th>
              <th className="table-th">Phone</th>
              <th className="table-th">Rating</th>
              <th className="table-th">Orders</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="shimmer h-4 rounded w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-td text-center py-16">
                  <Truck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No suppliers found</p>
                  <button
                    onClick={() => { setEditSupplier(null); setShowModal(true); }}
                    className="btn-primary mt-3 text-sm"
                  >
                    Add your first supplier
                  </button>
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <motion.tr
                  key={supplier._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="table-row"
                >
                  <td className="table-td">
                    <div>
                      <p className="font-medium text-foreground text-sm">{supplier.name}</p>
                      {supplier.contactPerson && (
                        <p className="text-xs text-muted-foreground">{supplier.contactPerson}</p>
                      )}
                    </div>
                  </td>
                  <td className="table-td text-sm text-muted-foreground">{supplier.email || '—'}</td>
                  <td className="table-td text-sm text-muted-foreground">{supplier.phone || '—'}</td>
                  <td className="table-td">
                    <StarRating rating={supplier.rating} />
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {supplier.totalOrders || 0} orders
                  </td>
                  <td className="table-td">{statusBadge(supplier.status)}</td>
                  <td className="table-td">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => { setEditSupplier(supplier); setShowModal(true); }}
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
          <SupplierModal
            supplier={editSupplier}
            onClose={() => { setShowModal(false); setEditSupplier(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuppliersPage;
