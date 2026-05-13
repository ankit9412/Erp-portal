const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['sick', 'casual', 'earned', 'unpaid', 'maternity', 'paternity', 'other'],
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  days: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvalDate: Date,
  comments: String,
  attachment: String,
}, { timestamps: true });

leaveSchema.index({ tenantId: 1, employee: 1, startDate: 1 });

module.exports = mongoose.model('Leave', leaveSchema);
