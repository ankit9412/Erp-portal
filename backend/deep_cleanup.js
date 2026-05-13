const mongoose = require('mongoose');
const Tenant = require('./src/modules/tenant/tenant.model');
const User = require('./src/modules/user/user.model');
const Role = require('./src/modules/auth/role.model');
require('dotenv').config();

async function deepCleanup() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_db');
  console.log('Connected to DB');

  const email = 'ankitkumar892744@gmail.com';
  const slug = 'relearn-camp-pvt-ltd';

  const user = await User.findOne({ email });
  if (user) {
    console.log('Deleting user:', user.email);
    await User.deleteOne({ _id: user._id });
  }

  const tenant = await Tenant.findOne({ slug });
  if (tenant) {
    console.log('Deleting tenant roles...');
    await Role.deleteMany({ tenantId: tenant._id });
    console.log('Deleting tenant:', tenant.name);
    await Tenant.deleteOne({ _id: tenant._id });
  }

  console.log('Cleanup complete. System is ready for a fresh registration.');
  await mongoose.disconnect();
}

deepCleanup();
