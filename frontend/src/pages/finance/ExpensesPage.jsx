import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, RefreshCw, X, Loader2, Receipt } from 'lucide-react';
import { useGetExpensesQuery, useCreateExpenseMutation } from '../../features/finance/financeApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = [
  'rent', 'utilities', 'salaries', 'marketing', 'travel', 'office_supplies',
  'software', 'hardware', 'maintenance', 'insurance', 'taxes', 'other',
];

const AddExpenseModal = ({ onClose }) => {
  const [createExpense, { isLoading }] = useCreateExpenseMutation();
  const [form, setForm] = useState({
    description: '',
    category: 'other',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    reference: '',
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) {
      toast.error('Description and amount are required.');
      return;
    }
    try {
      await createExpense({ ...form, amount: parseFloat(form.amount) }).unwrap();
      toast.success('Expense added.');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add expense.');
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
            <h2 className="text-lg font-semibold text-foreground">Add Expense</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="label-base mb-1.5 block">Description <span className="text-destructive">*</span></label>
              <input value={form.description} onChange={set('description')} placeholder="Office supplies purchase" className="input-base" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-base mb-1.5 block">Category</label>
                <select value={form.category} onChange={set('category')} className="input-base">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-base mb-1.5 block">Amount (₹) <span className="text-destructive">*</span></label>
                <input type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} placeholder="0.00" className="input-base" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-base mb-1.5 block">Date</label>
                <input type="date" value={form.date} onChange={set('date')} className="input-base" />
              </div>
              <div>
                <label className="label-base mb-1.5 block">Payment Method</label>
                <select value={form.paymentMethod} onChange={set('paymentMethod')} className="input-base">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label-base mb-1.5 block">Reference</label>
              <input value={form.reference} onChange={set('reference')} placeholder="Receipt / Invoice number" className="input-base" />
            </div>
            <div>
              <label className="label-base mb-1.5 block">Notes</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2} className="input-base resize-none" />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Expense
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

const ExpensesPage = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetExpensesQuery({
    page, limit: 20, search, category: categoryFilter, dateFrom, dateTo,
  });

  const expenses = data?.data || data?.expenses || [];
  const pagination = data?.pagination || {};

  useEffect(() => {
    dispatch(setPageTitle('Expenses'));
    dispatch(setBreadcrumbs([{ label: 'Finance' }, { label: 'Expenses' }]));
  }, [dispatch]);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination.total || expenses.length} expenses · {formatCurrency(totalExpenses)} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search expenses..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="input-base w-auto"
        >
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="input-base w-auto"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="input-base w-auto"
        />
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-header">
            <tr>
              <th className="table-th">Description</th>
              <th className="table-th">Category</th>
              <th className="table-th">Date</th>
              <th className="table-th">Payment Method</th>
              <th className="table-th">Reference</th>
              <th className="table-th text-right">Amount</th>
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
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-td text-center py-16">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No expenses found</p>
                  <button onClick={() => setShowModal(true)} className="btn-primary mt-3 text-sm">
                    Add your first expense
                  </button>
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <motion.tr
                  key={expense._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="table-row"
                >
                  <td className="table-td">
                    <p className="text-sm font-medium text-foreground">{expense.description}</p>
                    {expense.notes && <p className="text-xs text-muted-foreground">{expense.notes}</p>}
                  </td>
                  <td className="table-td">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground capitalize">
                      {expense.category?.replace(/_/g, ' ') || '—'}
                    </span>
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {formatDate(expense.date || expense.createdAt)}
                  </td>
                  <td className="table-td text-sm text-muted-foreground capitalize">
                    {expense.paymentMethod?.replace(/_/g, ' ') || '—'}
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {expense.reference || '—'}
                  </td>
                  <td className="table-td text-right font-semibold text-sm text-red-500">
                    -{formatCurrency(expense.amount)}
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

      <AnimatePresence>
        {showModal && <AddExpenseModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default ExpensesPage;
