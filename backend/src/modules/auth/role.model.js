const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  module: {
    type: String,
    required: true,
    enum: [
      'dashboard', 'inventory', 'finance', 'hr', 'sales',
      'purchase', 'reports', 'settings', 'users', 'tenants',
      'notifications', 'audit', 'analytics', 'payroll', 'crm'
    ],
  },
  actions: {
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    export: { type: Boolean, default: false },
    import: { type: Boolean, default: false },
    approve: { type: Boolean, default: false },
    reject: { type: Boolean, default: false },
  },
});

const roleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Role name is required'],
      trim: true,
    },
    displayName: String,
    description: String,
    type: {
      type: String,
      enum: [
        'super_admin', 'business_owner', 'manager', 'hr',
        'accountant', 'inventory_staff', 'sales_executive',
        'support_staff', 'custom'
      ],
      default: 'custom',
    },
    permissions: [permissionSchema],
    isSystem: { type: Boolean, default: false }, // System roles cannot be deleted
    isActive: { type: Boolean, default: true },
    hierarchy: { type: Number, default: 0 }, // Higher = more authority
    parentRole: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

roleSchema.index({ tenantId: 1, name: 1 }, { unique: true });
roleSchema.index({ tenantId: 1, type: 1 });

// Method: check if role has permission
roleSchema.methods.hasPermission = function (module, action) {
  const perm = this.permissions.find((p) => p.module === module);
  if (!perm) return false;
  return perm.actions[action] === true;
};

// Static: get default permissions for role type
roleSchema.statics.getDefaultPermissions = function (roleType) {
  const allModules = [
    'dashboard', 'inventory', 'finance', 'hr', 'sales',
    'purchase', 'reports', 'settings', 'users', 'tenants',
    'notifications', 'audit', 'analytics', 'payroll', 'crm'
  ];

  const fullAccess = allModules.map((module) => ({
    module,
    actions: {
      create: true, read: true, update: true, delete: true,
      export: true, import: true, approve: true, reject: true,
    },
  }));

  const readOnly = allModules.map((module) => ({
    module,
    actions: {
      create: false, read: true, update: false, delete: false,
      export: true, import: false, approve: false, reject: false,
    },
  }));

  const permissionMap = {
    super_admin: fullAccess,
    business_owner: fullAccess,
    manager: allModules.map((module) => ({
      module,
      actions: {
        create: true, read: true, update: true, delete: false,
        export: true, import: true, approve: true, reject: true,
      },
    })),
    hr: [
      { module: 'hr', actions: { create: true, read: true, update: true, delete: false, export: true, import: true, approve: true, reject: true } },
      { module: 'payroll', actions: { create: true, read: true, update: true, delete: false, export: true, import: false, approve: false, reject: false } },
      { module: 'dashboard', actions: { create: false, read: true, update: false, delete: false, export: false, import: false, approve: false, reject: false } },
      { module: 'reports', actions: { create: false, read: true, update: false, delete: false, export: true, import: false, approve: false, reject: false } },
    ],
    accountant: [
      { module: 'finance', actions: { create: true, read: true, update: true, delete: false, export: true, import: true, approve: true, reject: true } },
      { module: 'payroll', actions: { create: true, read: true, update: true, delete: false, export: true, import: false, approve: false, reject: false } },
      { module: 'reports', actions: { create: true, read: true, update: false, delete: false, export: true, import: false, approve: false, reject: false } },
      { module: 'dashboard', actions: { create: false, read: true, update: false, delete: false, export: false, import: false, approve: false, reject: false } },
    ],
    inventory_staff: [
      { module: 'inventory', actions: { create: true, read: true, update: true, delete: false, export: true, import: true, approve: false, reject: false } },
      { module: 'purchase', actions: { create: true, read: true, update: true, delete: false, export: true, import: false, approve: false, reject: false } },
      { module: 'dashboard', actions: { create: false, read: true, update: false, delete: false, export: false, import: false, approve: false, reject: false } },
    ],
    sales_executive: [
      { module: 'sales', actions: { create: true, read: true, update: true, delete: false, export: true, import: false, approve: false, reject: false } },
      { module: 'crm', actions: { create: true, read: true, update: true, delete: false, export: true, import: false, approve: false, reject: false } },
      { module: 'inventory', actions: { create: false, read: true, update: false, delete: false, export: false, import: false, approve: false, reject: false } },
      { module: 'dashboard', actions: { create: false, read: true, update: false, delete: false, export: false, import: false, approve: false, reject: false } },
    ],
    support_staff: readOnly,
  };

  return permissionMap[roleType] || readOnly;
};

module.exports = mongoose.model('Role', roleSchema);
