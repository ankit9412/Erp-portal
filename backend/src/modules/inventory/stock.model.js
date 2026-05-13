const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
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
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    variant: mongoose.Schema.Types.ObjectId,
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
    },
    batchNumber: String,
    serialNumber: String,
    expiryDate: Date,
    manufactureDate: Date,
    location: {
      zone: String,
      rack: String,
      bin: String,
    },
    condition: {
      type: String,
      enum: ['good', 'damaged', 'expired', 'returned'],
      default: 'good',
    },
    costPrice: Number,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

// Compound indexes
stockSchema.index({ tenantId: 1, product: 1, warehouse: 1 });
stockSchema.index({ tenantId: 1, warehouse: 1 });
stockSchema.index({ batchNumber: 1 });
stockSchema.index({ serialNumber: 1 });
stockSchema.index({ expiryDate: 1 });

// Virtual: availableQuantity
stockSchema.virtual('availableQuantity').get(function () {
  return this.quantity - this.reservedQuantity;
});

module.exports = mongoose.model('Stock', stockSchema);
