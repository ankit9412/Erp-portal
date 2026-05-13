const mongoose = require('mongoose');
const Tenant = require('./src/modules/tenant/tenant.model');
const User = require('./src/modules/user/user.model');
require('dotenv').config();

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_db');
  console.log('Connected to DB');

  const slug = 'relearn-camp-pvt-ltd';
  const tenant = await Tenant.findOne({ slug });
  
  if (tenant) {
    console.log('Found tenant:', tenant.name);
    const users = await User.find({ tenantId: tenant._id });
    console.log(`Found ${users.length} users for this tenant`);
    
    if (users.length === 0) {
      console.log('Deleting orphaned tenant...');
      await Tenant.deleteOne({ _id: tenant._id });
      console.log('Deleted successfully');
    } else {
      console.log('Tenant has users, not deleting.');
    }
  } else {
    console.log('No tenant found with slug:', slug);
  }

  await mongoose.disconnect();
}

cleanup();
