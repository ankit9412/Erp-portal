const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise'],
    default: 'free',
  },
  maxUsers: { type: Number, default: 5 },
  maxProducts: { type: Number, default: 100 },
  maxWarehouses: { type: Number, default: 1 },
  maxInvoices: { type: Number, default: 50 },
  features: [String],
  price: { type: Number, default: 0 },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  startDate: Date,
  endDate: Date,
  isActive: { type: Boolean, default: true },
});

const brandingSchema = new mongoose.Schema({
  logo: String,
  favicon: String,
  primaryColor: { type: String, default: '#3B82F6' },
  secondaryColor: { type: String, default: '#1E40AF' },
  accentColor: { type: String, default: '#10B981' },
  companyTagline: String,
  emailHeader: String,
  emailFooter: String,
  invoiceTemplate: { type: String, default: 'default' },
});

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  zipCode: String,
  phone: String,
});

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      maxlength: [100, 'Company name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Company email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: String,
    website: String,
    industry: {
      type: String,
      enum: [
        'retail', 'manufacturing', 'services', 'technology',
        'healthcare', 'education', 'food', 'logistics', 'other'
      ],
      default: 'other',
    },
    size: {
      type: String,
      enum: ['micro', 'small', 'medium'],
      default: 'small',
    },
    address: addressSchema,
    branding: brandingSchema,
    subscription: subscriptionPlanSchema,
    taxInfo: {
      gstNumber: String,
      panNumber: String,
      vatNumber: String,
      taxId: String,
    },
    settings: {
      currency: { type: String, default: 'INR' },
      timezone: { type: String, default: 'Asia/Kolkata' },
      dateFormat: { type: String, default: 'DD/MM/YYYY' },
      language: { type: String, default: 'en' },
      fiscalYearStart: { type: String, default: '04-01' }, // MM-DD
      invoicePrefix: { type: String, default: 'INV' },
      poPrefix: { type: String, default: 'PO' },
      enableMFA: { type: Boolean, default: false },
      allowedDomains: [String],
      maxLoginAttempts: { type: Number, default: 5 },
      sessionTimeout: { type: Number, default: 30 }, // minutes
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'trial', 'pending'],
      default: 'trial',
    },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 0 },
    trialEndsAt: Date,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    usageStats: {
      totalUsers: { type: Number, default: 0 },
      totalProducts: { type: Number, default: 0 },
      totalInvoices: { type: Number, default: 0 },
      storageUsed: { type: Number, default: 0 }, // in bytes
      lastActivity: Date,
    },
    integrations: {
      stripe: { customerId: String, subscriptionId: String },
      razorpay: { customerId: String },
      slack: { webhookUrl: String },
      zapier: { apiKey: String },
    },
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
tenantSchema.index({ slug: 1 });
tenantSchema.index({ email: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ 'subscription.name': 1 });
tenantSchema.index({ createdAt: -1 });

// Virtual: isTrialExpired
tenantSchema.virtual('isTrialExpired').get(function () {
  if (this.status === 'trial' && this.trialEndsAt) {
    return new Date() > this.trialEndsAt;
  }
  return false;
});

// Pre-save: generate slug
tenantSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Soft delete
tenantSchema.methods.softDelete = function () {
  this.deletedAt = new Date();
  this.status = 'inactive';
  return this.save();
};

// Check feature access
tenantSchema.methods.hasFeature = function (feature) {
  return this.subscription.features.includes(feature);
};

// Check usage limits
tenantSchema.methods.canAddUser = function () {
  return this.usageStats.totalUsers < this.subscription.maxUsers;
};

tenantSchema.methods.canAddProduct = function () {
  return this.usageStats.totalProducts < this.subscription.maxProducts;
};

module.exports = mongoose.model('Tenant', tenantSchema);
