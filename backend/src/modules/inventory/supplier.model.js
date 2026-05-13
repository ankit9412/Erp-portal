const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    code: {
      type: String,
      uppercase: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: String,
    alternatePhone: String,
    website: String,
    contactPerson: {
      name: String,
      email: String,
      phone: String,
      designation: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    taxInfo: {
      gstNumber: String,
      panNumber: String,
      vatNumber: String,
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      swiftCode: String,
      accountHolderName: String,
    },
    paymentTerms: {
      type: String,
      enum: ['immediate', 'net15', 'net30', 'net45', 'net60', 'net90'],
      default: 'net30',
    },
    creditLimit: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    category: {
      type: String,
      enum: ['manufacturer', 'distributor', 'wholesaler', 'retailer', 'service'],
      default: 'distributor',
    },
    rating: { type: Number, min: 1, max: 5, default: 3 },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blacklisted'],
      default: 'active',
    },
    documents: [
      {
        name: String,
        type: String,
        url: String,
        uploadedAt: Date,
      },
    ],
    performance: {
      totalOrders: { type: Number, default: 0 },
      onTimeDelivery: { type: Number, default: 0 }, // percentage
      qualityScore: { type: Number, default: 0 },
      responseTime: { type: Number, default: 0 }, // hours
      lastOrderDate: Date,
    },
    notes: String,
    tags: [String],
    metadata: mongoose.Schema.Types.Mixed,
    deletedAt: Date,
  },
  { timestamps: true }
);

supplierSchema.index({ tenantId: 1, code: 1 }, { unique: true, sparse: true });
supplierSchema.index({ tenantId: 1, name: 'text' });
supplierSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
