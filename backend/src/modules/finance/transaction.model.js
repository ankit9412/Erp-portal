const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    transactionNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense', 'transfer', 'refund', 'adjustment'],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'sales', 'purchase', 'salary', 'rent', 'utilities',
        'marketing', 'travel', 'maintenance', 'tax', 'loan',
        'investment', 'dividend', 'other'
      ],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, default: 1 },
    amountInBaseCurrency: Number,
    description: String,
    reference: String,
    referenceModel: String,
    referenceId: mongoose.Schema.Types.ObjectId,
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'online', 'other'],
    },
    paymentReference: String,
    date: { type: Date, default: Date.now },
    dueDate: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'reconciled'],
      default: 'completed',
    },
    tags: [String],
    attachments: [String],
    notes: String,
    isReconciled: { type: Boolean, default: false },
    reconciledAt: Date,
    reconciledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Double-entry bookkeeping
    journalEntries: [
      {
        account: String,
        debit: Number,
        credit: Number,
        description: String,
      },
    ],
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

transactionSchema.index({ tenantId: 1, transactionNumber: 1 }, { unique: true });
transactionSchema.index({ tenantId: 1, type: 1, date: -1 });
transactionSchema.index({ tenantId: 1, date: -1 });
transactionSchema.index({ tenantId: 1, status: 1 });
transactionSchema.index({ tenantId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
