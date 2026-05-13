const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
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
    },
    date: {
      type: Date,
      required: true,
    },
    checkIn: Date,
    checkOut: Date,
    checkInLocation: {
      lat: Number,
      lng: Number,
      address: String,
    },
    checkOutLocation: {
      lat: Number,
      lng: Number,
      address: String,
    },
    workingHours: { type: Number, default: 0 }, // in minutes
    overtimeHours: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'late', 'on_leave', 'holiday', 'weekend'],
      default: 'absent',
    },
    leaveType: String,
    isManualEntry: { type: Boolean, default: false },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: String,
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
    },
    breakTime: { type: Number, default: 0 }, // in minutes
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

attendanceSchema.index({ tenantId: 1, employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, date: 1 });
attendanceSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
