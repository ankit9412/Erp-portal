import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, RefreshCw, Play, X, Loader2, Download } from 'lucide-react';
import { useGetPayrollQuery, useGeneratePayrollMutation } from '../../features/hr/hrApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const GeneratePayrollModal = ({ onClose, onSuccess }) => {
  const [generatePayroll, { isLoading }] = useGeneratePayrollMutation();
  const today = new Date();
  const [form, setForm] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    paymentDate: today.toISOString().split('T')[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await generatePayroll(form).unwrap();
      toast.success(`Payroll generated for ${form.month}/${form.year}.`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Payroll generation failed.');
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
            <h2 className="text-lg font-semibold text-foreground">Generate Payroll</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-base mb-1.5 block">Month</label>
                <select value={form.month} onChange={set('month')} className="input-base">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-base mb-1.5 block">Year</label>
                <select value={form.year} onChange={set('year')} className="input-base">
                  {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label-base mb-1.5 block">Payment Date</label>
              <input type="date" value={form.paymentDate} onChange={set('paymentDate')} className="input-base" />
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-600 dark:text-yellow-400">
              This will generate payroll for all active employees for {new Date(form.year, form.month - 1).toLocaleString('default', { month: 'long' })} {form.year}.
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Generate Payroll
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

const PayrollPage = () => {
  const dispatch = useDispatch();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetPayrollQuery({ month, year });
  const payroll = data?.data || data?.payroll || [];
  const summary = data?.summary || {};

  useEffect(() => {
    dispatch(setPageTitle('Payroll'));
    dispatch(setBreadcrumbs([{ label: 'HR' }, { label: 'Payroll' }]));
  }, [dispatch]);

  const totalNetPay = payroll.reduce((sum, p) => sum + (p.netPay || 0), 0);
  const totalDeductions = payroll.reduce((sum, p) => sum + (p.totalDeductions || 0), 0);

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Payroll</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monthly payroll management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="input-base w-auto"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input-base w-auto"
          >
            {[today.getFullYear() - 1, today.getFullYear()].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={refetch} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" /> Export
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Play className="h-4 w-4" /> Generate Payroll
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: payroll.length, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Gross Payroll', value: formatCurrency(summary.totalGross || payroll.reduce((s, p) => s + (p.grossSalary || 0), 0)), icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Total Deductions', value: formatCurrency(totalDeductions), icon: DollarSign, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Net Payroll', value: formatCurrency(totalNetPay), icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((item) => (
          <div key={item.label} className="card-base p-4 flex items-center gap-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', item.bg)}>
              <item.icon className={cn('h-5 w-5', item.color)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={cn('text-lg font-bold', item.color)}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-header">
            <tr>
              <th className="table-th">Employee</th>
              <th className="table-th">Basic Salary</th>
              <th className="table-th">Allowances</th>
              <th className="table-th">Deductions</th>
              <th className="table-th">Tax</th>
              <th className="table-th">Net Pay</th>
              <th className="table-th">Payment Date</th>
              <th className="table-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="shimmer h-4 rounded w-full max-w-[100px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : payroll.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-td text-center py-16">
                  <DollarSign className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No payroll records for this period</p>
                  <button onClick={() => setShowModal(true)} className="btn-primary mt-3 text-sm">
                    Generate Payroll
                  </button>
                </td>
              </tr>
            ) : (
              payroll.map((record) => (
                <motion.tr
                  key={record._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="table-row"
                >
                  <td className="table-td">
                    <p className="text-sm font-medium text-foreground">
                      {record.employee?.firstName} {record.employee?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{record.employee?.employeeId}</p>
                  </td>
                  <td className="table-td text-sm">{formatCurrency(record.basicSalary)}</td>
                  <td className="table-td text-sm text-green-500">{formatCurrency(record.totalAllowances || 0)}</td>
                  <td className="table-td text-sm text-red-500">{formatCurrency(record.totalDeductions || 0)}</td>
                  <td className="table-td text-sm text-orange-500">{formatCurrency(record.taxAmount || 0)}</td>
                  <td className="table-td font-semibold text-sm">{formatCurrency(record.netPay)}</td>
                  <td className="table-td text-sm text-muted-foreground">{formatDate(record.paymentDate)}</td>
                  <td className="table-td">
                    {record.status === 'paid' ? (
                      <span className="badge-success">Paid</span>
                    ) : record.status === 'processing' ? (
                      <span className="badge-info">Processing</span>
                    ) : (
                      <span className="badge-warning">Pending</span>
                    )}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <GeneratePayrollModal
            onClose={() => setShowModal(false)}
            onSuccess={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default PayrollPage;
