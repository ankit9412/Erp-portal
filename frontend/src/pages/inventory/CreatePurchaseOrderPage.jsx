import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, ChevronRight, ChevronLeft, Loader2, ShoppingCart } from 'lucide-react';
import { useCreatePurchaseOrderMutation, useGetSuppliersQuery, useGetWarehousesQuery } from '../../features/inventory/inventoryApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STEPS = ['Supplier & Delivery', 'Line Items', 'Review'];

const emptyItem = () => ({ description: '', quantity: 1, rate: 0 });

const CreatePurchaseOrderPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [createPO, { isLoading }] = useCreatePurchaseOrderMutation();
  const { data: suppliersData } = useGetSuppliersQuery();
  const { data: warehousesData } = useGetWarehousesQuery();
  
  const suppliers = suppliersData?.data || [];
  const warehouses = warehousesData?.data || [];

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    supplierId: '',
    warehouseId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    notes: '',
  });

  const [items, setItems] = useState([emptyItem()]);

  useEffect(() => {
    dispatch(setPageTitle('Create Purchase Order'));
    dispatch(setBreadcrumbs([
      { label: 'Inventory' },
      { label: 'Purchase Orders', href: '/inventory/purchase-orders' },
      { label: 'Create' },
    ]));
  }, [dispatch]);

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0), 0);

  const validateStep = () => {
    if (step === 0) {
      if (!formData.supplierId || !formData.warehouseId) {
        toast.error('Supplier and Warehouse are required.');
        return false;
      }
    }
    if (step === 1) {
      if (items.some((item) => !item.description || !item.quantity || !item.rate)) {
        toast.error('All items must have description, quantity, and rate.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        items: items.map((item) => ({
          ...item,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          amount: (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0),
        })),
        totalAmount: subtotal,
      };
      const result = await createPO(payload).unwrap();
      toast.success('Purchase order created successfully.');
      navigate(`/inventory/purchase-orders/${result.data?._id || result._id}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create PO.');
    }
  };

  return (
    <div className="page-container">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="section-title">Create Purchase Order</h1>
          <p className="text-muted-foreground text-sm mt-1">Step {step + 1} of {STEPS.length}</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors',
                i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={cn('text-sm font-medium', i === step ? 'text-foreground' : 'text-muted-foreground')}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 max-w-16', i < step ? 'bg-primary' : 'bg-border')} />
            )}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
          {step === 0 && (
            <div className="card-base p-6 space-y-5">
              <h2 className="font-semibold text-foreground text-lg">Supplier & Delivery Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-base mb-1.5 block">Supplier <span className="text-destructive">*</span></label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData(f => ({ ...f, supplierId: e.target.value }))}
                    className="input-base"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Target Warehouse <span className="text-destructive">*</span></label>
                  <select
                    value={formData.warehouseId}
                    onChange={(e) => setFormData(f => ({ ...f, warehouseId: e.target.value }))}
                    className="input-base"
                  >
                    <option value="">Select warehouse</option>
                    {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Order Date</label>
                  <input
                    type="date"
                    value={formData.orderDate}
                    onChange={(e) => setFormData(f => ({ ...f, orderDate: e.target.value }))}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Expected Delivery</label>
                  <input
                    type="date"
                    value={formData.expectedDelivery}
                    onChange={(e) => setFormData(f => ({ ...f, expectedDelivery: e.target.value }))}
                    className="input-base"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="card-base overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-foreground text-lg">Line Items</h2>
                <button onClick={addItem} className="btn-secondary flex items-center gap-2 text-sm">
                  <Plus className="h-4 w-4" /> Add Item
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead className="table-header">
                    <tr>
                      <th className="table-th">Description</th>
                      <th className="table-th w-32">Qty</th>
                      <th className="table-th w-40">Rate (₹)</th>
                      <th className="table-th w-40 text-right">Amount</th>
                      <th className="table-th w-12" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="table-row">
                        <td className="table-td">
                          <input
                            value={item.description}
                            onChange={(e) => updateItem(i, 'description', e.target.value)}
                            placeholder="Item description"
                            className="input-base h-9"
                          />
                        </td>
                        <td className="table-td">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                            className="input-base h-9"
                          />
                        </td>
                        <td className="table-td">
                          <input
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) => updateItem(i, 'rate', e.target.value)}
                            className="input-base h-9"
                          />
                        </td>
                        <td className="table-td text-right font-medium text-sm">
                          {formatCurrency((item.quantity || 0) * (item.rate || 0))}
                        </td>
                        <td className="table-td">
                          {items.length > 1 && (
                            <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive p-1.5 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end">
                <div className="flex gap-4 items-center">
                  <span className="text-muted-foreground text-sm font-medium">Total Amount:</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(subtotal)}</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="card-base p-6 grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Supplier</p>
                  <p className="font-semibold text-foreground">{suppliers.find(s => s._id === formData.supplierId)?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Deliver To</p>
                  <p className="font-semibold text-foreground">{warehouses.find(w => w._id === formData.warehouseId)?.name || '—'}</p>
                </div>
              </div>
              <div className="card-base overflow-hidden">
                <table className="table-base">
                  <thead className="table-header">
                    <tr>
                      <th className="table-th">Description</th>
                      <th className="table-th">Qty</th>
                      <th className="table-th text-right">Rate</th>
                      <th className="table-th text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="table-row">
                        <td className="table-td text-sm">{item.description}</td>
                        <td className="table-td text-sm">{item.quantity}</td>
                        <td className="table-td text-sm text-right">{formatCurrency(item.rate)}</td>
                        <td className="table-td text-sm font-semibold text-right">{formatCurrency(item.quantity * item.rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card-base p-5">
                <label className="label-base mb-1.5 block">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(f => ({ ...f, notes: e.target.value }))}
                  className="input-base resize-none"
                  rows={3}
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between pt-6">
        <button
          onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
          className="btn-ghost flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => validateStep() && setStep(s => s + 1)} className="btn-primary flex items-center gap-2">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={isLoading} className="btn-primary flex items-center gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            Confirm & Create PO
          </button>
        )}
      </div>
    </div>
  );
};

export default CreatePurchaseOrderPage;
