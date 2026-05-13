import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, CreditCard, Download, FileText, X, Loader2 } from 'lucide-react';
import { useGetInvoiceQuery, useSendInvoiceMutation, useRecordPaymentMutation } from '../../features/finance/financeApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  draft: { label: 'Draft', cls: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground' },
  sent: { label: 'Sent', cls: 'badge-info' },
  paid: { label: 'Paid', cls: 'badge-success' },
  partial: { label: 'Partial', cls: 'badge-warning' },
  overdue: { label: 'Overdue', cls: 'badge-danger' },
};

const PaymentModal = ({ invoice, onClose }) => {
  const [recordPayment, { isLoading }] = useRecordPaymentMutation();
  const [form, setForm] = useState({
    amount: invoice?.balanceDue || '',
    method: 'bank_transfer',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Enter a valid payment amount.');
      return;
    }
    try {
      await recordPayment({ id: invoice._id, ...form }).unwrap();
      toast.success('Payment recorded.');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record payment.');
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
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Record Payment</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="label-base mb-1.5 block">Amount (₹) <span className="text-destructive">*</span></label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={set('amount')}
                placeholder="0.00"
                className="input-base"
              />
              <p className="text-xs text-muted-foreground mt-1">Balance due: {formatCurrency(invoice?.balanceDue)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-base mb-1.5 block">Payment Method</label>
                <select value={form.method} onChange={set('method')} className="input-base">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div>
                <label className="label-base mb-1.5 block">Payment Date</label>
                <input type="date" value={form.date} onChange={set('date')} className="input-base" />
              </div>
            </div>
            <div>
              <label className="label-base mb-1.5 block">Reference / Transaction ID</label>
              <input value={form.reference} onChange={set('reference')} placeholder="TXN123456" className="input-base" />
            </div>
            <div>
              <label className="label-base mb-1.5 block">Notes</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2} className="input-base resize-none" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Record Payment
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

const InvoiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data, isLoading } = useGetInvoiceQuery(id);
  const [sendInvoice, { isLoading: sending }] = useSendInvoiceMutation();

  const invoice = data?.data || data;

  useEffect(() => {
    if (invoice) {
      dispatch(setPageTitle(invoice.invoiceNumber));
      dispatch(setBreadcrumbs([
        { label: 'Finance' },
        { label: 'Invoices', href: '/finance/invoices' },
        { label: invoice.invoiceNumber },
      ]));
    }
  }, [dispatch, invoice]);

  const handleSend = async () => {
    if (!window.confirm('Send this invoice to the customer?')) return;
    try {
      await sendInvoice(id).unwrap();
      toast.success('Invoice sent.');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send invoice.');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="shimmer h-8 w-48 rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-base p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="shimmer h-6 rounded" />)}
          </div>
          <div className="card-base p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-6 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="page-container">
        <div className="text-center py-20">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Invoice not found.</p>
          <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go Back</button>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[invoice.status] || STATUS_CONFIG.draft;
  const canSend = invoice.status === 'draft';
  const canPay = invoice.status !== 'paid' && invoice.status !== 'cancelled';
  const payments = invoice.payments || [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="section-title">{invoice.invoiceNumber}</h1>
            <span className={statusConfig.cls}>{statusConfig.label}</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Issued {formatDate(invoice.invoiceDate || invoice.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost flex items-center gap-2">
            <Download className="h-4 w-4" /> PDF
          </button>
          {canSend && (
            <button
              onClick={handleSend}
              disabled={sending}
              className="btn-secondary flex items-center gap-2"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Invoice
            </button>
          )}
          {canPay && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" /> Record Payment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="card-base overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Invoice Items</h3>
            </div>
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
                {(invoice.items || []).map((item, i) => (
                  <tr key={i} className="table-row">
                    <td className="table-td">
                      <p className="text-sm font-medium text-foreground">{item.description || item.product?.name}</p>
                      {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                    </td>
                    <td className="table-td text-sm">{item.quantity}</td>
                    <td className="table-td text-sm">{formatCurrency(item.rate || item.unitPrice)}</td>
                    <td className="table-td text-sm text-muted-foreground">{item.taxRate || 0}%</td>
                    <td className="table-td text-sm font-medium text-right">
                      {formatCurrency(item.amount || (item.quantity * (item.rate || item.unitPrice)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 border-t border-border bg-muted/30">
              <div className="flex flex-col items-end gap-1.5 text-sm">
                <div className="flex justify-between w-52">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.taxAmount > 0 && (
                  <div className="flex justify-between w-52">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatCurrency(invoice.taxAmount)}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="flex justify-between w-52">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-500">-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between w-52 pt-1.5 border-t border-border font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between w-52">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="text-green-500">{formatCurrency(invoice.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between w-52 font-bold text-base">
                  <span className="text-foreground">Balance Due</span>
                  <span className={cn(invoice.balanceDue > 0 ? 'text-red-500' : 'text-green-500')}>
                    {formatCurrency(invoice.balanceDue || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div className="card-base p-5">
              <h3 className="font-semibold text-foreground mb-4">Payment History</h3>
              <div className="space-y-3">
                {payments.map((payment, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">
                        {payment.method?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(payment.date)} {payment.reference && `· Ref: ${payment.reference}`}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-green-500">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card-base p-5">
            <h3 className="font-semibold text-foreground mb-4">Customer</h3>
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">{invoice.customer?.name || invoice.customerName || '—'}</p>
              {invoice.customer?.email && <p className="text-muted-foreground">{invoice.customer.email}</p>}
              {invoice.customer?.phone && <p className="text-muted-foreground">{invoice.customer.phone}</p>}
              {invoice.customer?.address && (
                <p className="text-muted-foreground mt-2">{invoice.customer.address}</p>
              )}
            </div>
          </div>

          <div className="card-base p-5">
            <h3 className="font-semibold text-foreground mb-4">Invoice Details</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Invoice Date', value: formatDate(invoice.invoiceDate || invoice.createdAt) },
                { label: 'Due Date', value: formatDate(invoice.dueDate) },
                { label: 'Payment Terms', value: invoice.paymentTerms || '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {invoice.notes && (
            <div className="card-base p-5">
              <h3 className="font-semibold text-foreground mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal invoice={invoice} onClose={() => setShowPaymentModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvoiceDetailPage;
