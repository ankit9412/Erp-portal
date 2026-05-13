const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true,
  },
  type: {
    type: String,
    enum: ['in', 'out', 'transfer', 'adjustment', 'return'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  previousStock: Number,
  newStock: Number,
  referenceType: {
    type: String,
    enum: ['purchase_order', 'sales_invoice', 'manual_adjustment', 'transfer_order'],
  },
  referenceId: mongoose.Schema.Types.ObjectId,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reason: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

stockMovementSchema.index({ timestamp: -1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
