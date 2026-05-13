require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../modules/user/user.model');
const Role = require('../modules/auth/role.model');
const Tenant = require('../modules/tenant/tenant.model');
const logger = require('./logger');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB for seeding');

    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@erp.com';
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      logger.info('Admin user already exists');
      process.exit(0);
    }

    // Create a system tenant if it doesn't exist
    let tenant = await Tenant.findOne({ slug: 'system' });
    if (!tenant) {
      tenant = await Tenant.create({
        name: 'System Admin',
        slug: 'system',
        email: adminEmail,
        status: 'active',
        subscription: {
          name: 'enterprise',
          maxUsers: 999,
          maxProducts: 99999,
          maxWarehouses: 99,
          maxInvoices: 999999,
          features: ['inventory', 'finance', 'hr', 'analytics'],
        },
      });
      logger.info('System tenant created');
    }

    // Create business_owner role for system tenant
    let role = await Role.findOne({ tenantId: tenant._id, type: 'business_owner' });
    if (!role) {
      role = await Role.create({
        tenantId: tenant._id,
        name: 'Super Admin',
        type: 'business_owner',
        isSystem: true,
        hierarchy: 100,
        permissions: Role.getDefaultPermissions('business_owner'),
      });
      logger.info('Super Admin role created');
    }

    // Create the admin user
    const admin = await User.create({
      tenantId: tenant._id,
      firstName: 'Super',
      lastName: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: role._id,
      roleType: 'business_owner',
      status: 'active',
      isEmailVerified: true,
    });

    tenant.owner = admin._id;
    await tenant.save();

    logger.info('Super Admin user created successfully');
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedAdmin();
