import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, ChevronRight, ChevronLeft, Loader2, FileText } from 'lucide-react';
import { useCreateInvoiceMutation } from '../../features/finance/financeApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STEPS = ['Customer Info', 'Line Items', 'Review'];

const emptyItem = () => ({ description: '', quantity: 1, rate: 0, taxRate: 0 });

const CreateInvoicePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [createInvoice, { isLoading }] = useCreateInvoiceMutation();
  const [step, setStep] = useState(0);

  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    gstin: '',
  });

  const [meta, setMeta] = useState({
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentTerms: 'net30',
    notes: '',
  });

  const [items, setItems] = useState([emptyItem()]);

  useEffect(() => {
    dispatch(setPageTitle('Create Invoice'));
    dispatch(setBreadcrumbs([
      { label: 'Finance' },
      { label: 'Invoices', href: '/finance/invoices' },
      { label: 'Create' },
    ]));
  }, [dispatch]);

  const setCustomerField = (key) => (e) => setCustomer((c) => ({ ...c, [key]: e.target.value }));
  const setMetaField = (key) => (e) => setMeta((m) => ({ ...m, [key]: e.target.value }));

  const updateItem = (index, key, value) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [key]: value } : item));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const calcItemAmount = (item) => {
    const base = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    const tax = base * ((parseFloat(item.taxRate) || 0) / 100);
    return base + tax;
  };

  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
  }, 0);

  const taxAmount = items.reduce((sum, item) => {
    const base = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
    return sum + base * ((parseFloat(item.taxRate) || 0) / 100);
  }, 0);

  const total = subtotal + taxAmount;

  const validateStep = () => {
    if (step === 0) {
      if (!customer.name || !customer.email) {
        toast.error('Customer name and email are required.');
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

  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        customer,
        ...meta,
        items: items.map((item) => ({
          ...item,
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          taxRate: parseFloat(item.taxRate) || 0,
          amount: calcItemAmount(item),
        })),
        subtotal,
        taxAmount,
        totalAmount: total,
      };
      const result = await createInvoice(payload).unwrap();
      toast.success('Invoice created successfully.');
      navigate(`/finance/invoices/${result.data?._id || result._id}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to create invoice.');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="section-title">Create Invoice</h1>
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
                i < step ? 'bg-primary text-primary-foreground' :
                i === step ? 'bg-primary text-primary-foreground' :
                'bg-muted text-muted-foreground'
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

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Step 0: Customer Info */}
          {step === 0 && (
            <div className="card-base p-6 space-y-5">
              <h2 className="font-semibold text-foreground text-lg">Customer Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label-base mb-1.5 block">Customer Name <span className="text-destructive">*</span></label>
                  <input value={customer.name} onChange={setCustomerField('name')} placeholder="Acme Corp" className="input-base" />
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Email <span className="text-destructive">*</span></label>
                  <input type="email" value={customer.email} onChange={setCustomerField('email')} placeholder="billing@acme.com" className="input-base" />
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Phone</label>
                  <input value={customer.phone} onChange={setCustomerField('phone')} placeholder="+91 98765 43210" className="input-base" />
                </div>
                <div>
                  <label className="label-base mb-1.5 block">GSTIN</label>
                  <input value={customer.gstin} onChange={setCustomerField('gstin')} placeholder="22AAAAA0000A1Z5" className="input-base" />
                </div>
              </div>
              <div>
                <label className="label-base mb-1.5 block">Billing Address</label>
                <textarea value={customer.address} onChange={setCustomerField('address')} rows={3} placeholder="Full billing address..." className="input-base resize-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
                <div>
                  <label className="label-base mb-1.5 block">Invoice Date</label>
                  <input type="date" value={meta.invoiceDate} onChange={setMetaField('invoiceDate')} className="input-base" />
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Due Date</label>
                  <input type="date" value={meta.dueDate} onChange={setMetaField('dueDate')} className="input-base" />
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Payment Terms</label>
                  <select value={meta.paymentTerms} onChange={setMetaField('paymentTerms')} className="input-base">
                    <option value="immediate">Immediate</option>
                    <option value="net15">Net 15</option>
                    <option value="net30">Net 30</option>
                    <option value="net60">Net 60</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Line Items */}
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
                      <th className="table-th w-24">Qty</th>
                      <th className="table-th w-32">Rate (₹)</th>
                      <th className="table-th w-24">Tax %</th>
                      <th className="table-th w-32 text-right">Amount</th>
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
                            className="input-base h-9 w-20"
                          />
                        </td>
                        <td className="table-td">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.rate}
                            onChange={(e) => updateItem(i, 'rate', e.target.value)}
                            className="input-base h-9 w-28"
                          />
                        </td>
                        <td className="table-td">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.taxRate}
                            onChange={(e) => updateItem(i, 'taxRate', e.target.value)}
                            className="input-base h-9 w-20"
                          />
                        </td>
                        <td className="table-td text-right font-medium text-sm">
                          {formatCurrency(calcItemAmount(item))}
                        </td>
                        <td className="table-td">
                          {items.length > 1 && (
                            <button
                              onClick={() => removeItem(i)}
                              className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-border bg-muted/30">
                <div className="flex flex-col items-end gap-1.5 text-sm">
                  <div className="flex justify-between w-48">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between w-48">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between w-48 pt-1.5 border-t border-border font-bold text-base">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Review */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="card-base p-6">
                <h2 className="font-semibold text-foreground text-lg mb-4">Review Invoice</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Bill To</p>
                    <p className="font-semibold text-foreground">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                    {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
                    {customer.address && <p className="text-sm text-muted-foreground mt-1">{customer.address}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Invoice Details</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Invoice Date</span>
                        <span>{meta.invoiceDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Due Date</span>
                        <span>{meta.dueDate || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Payment Terms</span>
                        <span>{meta.paymentTerms}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-base overflow-hidden">
                <table className="table-base">
                  <thead className="table-header">
                    <tr>
                      <th className="table-th">Description</th>
                      <th className="table-th">Qty</th>
                      <th className="table-th">Rate</th>
                      <th className="table-th">Tax</th>
                      <th className="table-th text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => (
                      <tr key={i} className="table-row">
                        <td className="table-td text-sm">{item.description}</td>
                        <td className="table-td text-sm">{item.quantity}</td>
                        <td className="table-td text-sm">{formatCurrency(item.rate)}</td>
                        <td className="table-td text-sm">{item.taxRate}%</td>
                        <td className="table-td text-sm font-medium text-right">{formatCurrency(calcItemAmount(item))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-4 border-t border-border bg-muted/30">
                  <div className="flex flex-col items-end gap-1.5 text-sm">
                    <div className="flex justify-between w-48">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between w-48">
                      <span className="text-muted-foreground">Tax</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between w-48 pt-1.5 border-t border-border font-bold text-base">
                      <span className="text-foreground">Total</span>
                      <span className="text-foreground">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card-base p-5">
                <label className="label-base mb-1.5 block">Notes (optional)</label>
                <textarea
                  value={meta.notes}
                  onChange={setMetaField('notes')}
                  rows={3}
                  placeholder="Any additional notes for the customer..."
                  className="input-base resize-none"
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => step === 0 ? navigate(-1) : setStep((s) => s - 1)}
          className="btn-ghost flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={handleNext} className="btn-primary flex items-center gap-2">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="btn-primary flex items-center gap-2"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Create Invoice
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateInvoicePage;
