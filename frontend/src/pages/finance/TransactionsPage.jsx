import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Search, RefreshCw, ArrowUpRight, ArrowDownLeft, Activity } from 'lucide-react';
import { useGetTransactionsQuery } from '../../features/finance/financeApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const TransactionsPage = () => {
  const dispatch = useDispatch();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useGetTransactionsQuery({
    page, limit: 25, search, type: typeFilter, dateFrom, dateTo,
  });

  const transactions = data?.data || data?.transactions || [];
  const pagination = data?.pagination || {};

  useEffect(() => {
    dispatch(setPageTitle('Transactions'));
    dispatch(setBreadcrumbs([{ label: 'Finance' }, { label: 'Transactions' }]));
  }, [dispatch]);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Transactions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination.total || transactions.length} transactions
          </p>
        </div>
        <button onClick={refetch} className="btn-ghost p-2 self-start" title="Refresh">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-base p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
            <ArrowDownLeft className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Income</p>
            <p className="text-lg font-bold text-green-500">{formatCurrency(totalIncome)}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <ArrowUpRight className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Expense</p>
            <p className="text-lg font-bold text-red-500">{formatCurrency(totalExpense)}</p>
          </div>
        </div>
        <div className="card-base p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net</p>
            <p className={cn('text-lg font-bold', totalIncome - totalExpense >= 0 ? 'text-green-500' : 'text-red-500')}>
              {formatCurrency(totalIncome - totalExpense)}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search transactions..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="input-base w-auto"
        >
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
          <option value="transfer">Transfer</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
          className="input-base w-auto"
          placeholder="From date"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
          className="input-base w-auto"
          placeholder="To date"
        />
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-header">
            <tr>
              <th className="table-th">Type</th>
              <th className="table-th">Category</th>
              <th className="table-th">Description</th>
              <th className="table-th">Date</th>
              <th className="table-th">Reference</th>
              <th className="table-th text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="shimmer h-4 rounded w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-td text-center py-16">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No transactions found</p>
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <motion.tr
                  key={txn._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="table-row"
                >
                  <td className="table-td">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                        txn.type === 'income' ? 'bg-green-500/10' : txn.type === 'expense' ? 'bg-red-500/10' : 'bg-blue-500/10'
                      )}>
                        {txn.type === 'income' ? (
                          <ArrowDownLeft className="h-3.5 w-3.5 text-green-500" />
                        ) : txn.type === 'expense' ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
                        ) : (
                          <Activity className="h-3.5 w-3.5 text-blue-500" />
                        )}
                      </div>
                      <span className="text-sm capitalize">{txn.type}</span>
                    </div>
                  </td>
                  <td className="table-td text-sm text-muted-foreground capitalize">
                    {txn.category?.replace(/_/g, ' ') || '—'}
                  </td>
                  <td className="table-td">
                    <p className="text-sm text-foreground">{txn.description || '—'}</p>
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {formatDate(txn.date || txn.createdAt)}
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {txn.reference || '—'}
                  </td>
                  <td className="table-td text-right">
                    <span className={cn(
                      'font-semibold text-sm',
                      txn.type === 'income' ? 'text-green-500' : txn.type === 'expense' ? 'text-red-500' : 'text-foreground'
                    )}>
                      {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}
                      {formatCurrency(txn.amount)}
                    </span>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {page} of {pagination.pages}
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

export default TransactionsPage;
