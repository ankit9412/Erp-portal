const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name: String, // e.g., "Red - XL"
  sku: String,
  barcode: String,
  attributes: [{ key: String, value: String }],
  price: Number,
  costPrice: Number,
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  images: [String],
  isActive: { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 200,
    },
    description: String,
    shortDescription: String,
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
    },
    barcode: String,
    qrCode: String,
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    brand: String,
    unit: {
      type: String,
      enum: ['pcs', 'kg', 'g', 'ltr', 'ml', 'mtr', 'cm', 'box', 'pack', 'dozen', 'pair'],
      default: 'pcs',
    },
    type: {
      type: String,
      enum: ['physical', 'digital', 'service', 'bundle'],
      default: 'physical',
    },
    images: [String],
    thumbnail: String,

    // Pricing
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    costPrice: { type: Number, min: 0 },
    mrp: Number,
    taxRate: { type: Number, default: 0 }, // GST/VAT percentage
    taxType: { type: String, enum: ['inclusive', 'exclusive'], default: 'exclusive' },
    hsnCode: String, // HSN/SAC code for GST

    // Stock
    stock: { type: Number, default: 0 },
    reservedStock: { type: Number, default: 0 },
    minStockLevel: { type: Number, default: 0 },
    maxStockLevel: Number,
    reorderPoint: { type: Number, default: 0 },
    reorderQuantity: { type: Number, default: 0 },

    // Tracking
    trackBatch: { type: Boolean, default: false },
    trackSerial: { type: Boolean, default: false },
    trackExpiry: { type: Boolean, default: false },

    // Variants
    hasVariants: { type: Boolean, default: false },
    variants: [variantSchema],
    variantAttributes: [{ name: String, values: [String] }],

    // Supplier
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    supplierSku: String,
    leadTime: Number, // days

    // Physical attributes
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'cm' },
    },

    // Status
    status: {
      type: String,
      enum: ['active', 'inactive', 'discontinued', 'draft'],
      default: 'active',
    },
    isPublished: { type: Boolean, default: true },

    // Analytics
    totalSold: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    tags: [String],
    notes: String,
    metadata: mongoose.Schema.Types.Mixed,
    deletedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
productSchema.index({ tenantId: 1, name: 'text', description: 'text' });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, status: 1 });
productSchema.index({ tenantId: 1, stock: 1 });
productSchema.index({ barcode: 1 });

// Virtual: availableStock
productSchema.virtual('availableStock').get(function () {
  return this.stock - this.reservedStock;
});

// Virtual: isLowStock
productSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.minStockLevel;
});

// Virtual: profitMargin
productSchema.virtual('profitMargin').get(function () {
  if (!this.costPrice || this.costPrice === 0) return null;
  return (((this.price - this.costPrice) / this.costPrice) * 100).toFixed(2);
});

module.exports = mongoose.model('Product', productSchema);
