const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
  },
  description: String,
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
}, { timestamps: true });

departmentSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
