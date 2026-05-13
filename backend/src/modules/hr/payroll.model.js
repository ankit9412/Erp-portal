const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  },
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  basicSalary: {
    type: Number,
    required: true,
  },
  allowances: [{
    name: String,
    amount: Number,
  }],
  totalAllowances: {
    type: Number,
    default: 0,
  },
  deductions: [{
    name: String,
    amount: Number,
  }],
  totalDeductions: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  netPay: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed'],
    default: 'pending',
  },
  paymentDate: Date,
  paymentMethod: String,
  transactionId: String,
  notes: String,
}, { timestamps: true });

payrollSchema.index({ tenantId: 1, employee: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
