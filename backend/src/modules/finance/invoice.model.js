const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: String,
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  hsnCode: String,
  totalAmount: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['invoice', 'proforma', 'credit_note', 'debit_note', 'quotation', 'estimate'],
      default: 'invoice',
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerDetails: {
      name: String,
      email: String,
      phone: String,
      address: String,
      gstNumber: String,
      panNumber: String,
    },
    salesOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SalesOrder',
    },
    items: [invoiceItemSchema],
    invoiceDate: { type: Date, default: Date.now },
    dueDate: Date,
    paymentTerms: {
      type: String,
      enum: ['immediate', 'net15', 'net30', 'net45', 'net60', 'net90', 'custom'],
      default: 'net30',
    },
    subtotal: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    shippingAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    exchangeRate: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ['draft', 'sent', 'viewed', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'],
      default: 'draft',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partial', 'paid', 'refunded'],
      default: 'unpaid',
    },
    payments: [
      {
        amount: Number,
        method: {
          type: String,
          enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'online'],
        },
        reference: String,
        date: Date,
        notes: String,
        recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    notes: String,
    termsAndConditions: String,
    signature: String,
    pdfUrl: String,
    qrCode: String,
    emailSentAt: Date,
    viewedAt: Date,
    reminderSentAt: [Date],
    isRecurring: { type: Boolean, default: false },
    recurringConfig: {
      frequency: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'] },
      nextDate: Date,
      endDate: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    metadata: mongoose.Schema.Types.Mixed,
    deletedAt: Date,
  },
  { timestamps: true }
);

invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ tenantId: 1, status: 1 });
invoiceSchema.index({ tenantId: 1, customer: 1 });
invoiceSchema.index({ tenantId: 1, invoiceDate: -1 });
invoiceSchema.index({ tenantId: 1, dueDate: 1 });
invoiceSchema.index({ tenantId: 1, paymentStatus: 1 });

// Virtual: isOverdue
invoiceSchema.virtual('isOverdue').get(function () {
  return (
    this.dueDate &&
    new Date() > this.dueDate &&
    this.paymentStatus !== 'paid'
  );
});

module.exports = mongoose.model('Invoice', invoiceSchema);
