const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['main', 'branch', 'transit', 'virtual', 'damaged'],
      default: 'main',
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    contact: {
      phone: String,
      email: String,
    },
    capacity: {
      total: Number,
      used: { type: Number, default: 0 },
      unit: { type: String, default: 'sqft' },
    },
    isDefault: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    zones: [
      {
        name: String,
        code: String,
        description: String,
        capacity: Number,
      },
    ],
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

warehouseSchema.index({ tenantId: 1, code: 1 }, { unique: true });
warehouseSchema.index({ tenantId: 1, isDefault: 1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);
