const mongoose = require('mongoose');
const Tenant = require('./src/modules/tenant/tenant.model');
const User = require('./src/modules/user/user.model');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_db');
  
  const email = 'ankitkumar892744@gmail.com';
  const user = await User.findOne({ email });
  
  if (user) {
    console.log('User exists:', user.email);
    console.log('Tenant ID:', user.tenantId);
    console.log('Status:', user.status);
    console.log('IsVerified:', user.isEmailVerified);
  } else {
    console.log('User not found:', email);
  }

  await mongoose.disconnect();
}

check();
