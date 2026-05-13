const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    employeeId: {
      type: String,
      required: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    phone: String,
    alternatePhone: String,
    avatar: String,
    dateOfBirth: Date,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: String,
    maritalStatus: { type: String, enum: ['single', 'married', 'divorced', 'widowed'] },
    nationality: String,
    address: {
      current: {
        street: String, city: String, state: String,
        country: String, zipCode: String,
      },
      permanent: {
        street: String, city: String, state: String,
        country: String, zipCode: String,
      },
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    designation: String,
    reportingTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'intern', 'consultant'],
      default: 'full_time',
    },
    joiningDate: { type: Date, required: true },
    confirmationDate: Date,
    probationEndDate: Date,
    exitDate: Date,
    exitReason: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'on_leave', 'terminated', 'resigned', 'probation'],
      default: 'probation',
    },
    // Salary
    salary: {
      basic: { type: Number, default: 0 },
      hra: { type: Number, default: 0 },
      da: { type: Number, default: 0 },
      ta: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      otherAllowances: { type: Number, default: 0 },
      grossSalary: { type: Number, default: 0 },
      pf: { type: Number, default: 0 },
      esi: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      otherDeductions: { type: Number, default: 0 },
      netSalary: { type: Number, default: 0 },
      currency: { type: String, default: 'INR' },
      paymentMode: {
        type: String,
        enum: ['bank_transfer', 'cash', 'cheque'],
        default: 'bank_transfer',
      },
    },
    bankDetails: {
      bankName: String,
      accountNumber: String,
      ifscCode: String,
      accountHolderName: String,
    },
    documents: {
      aadhar: String,
      pan: String,
      passport: String,
      drivingLicense: String,
      offerLetter: String,
      appointmentLetter: String,
      relievingLetter: String,
      experienceLetter: String,
      educationCertificates: [String],
      other: [{ name: String, url: String }],
    },
    education: [
      {
        degree: String,
        institution: String,
        year: Number,
        percentage: Number,
      },
    ],
    experience: [
      {
        company: String,
        designation: String,
        from: Date,
        to: Date,
        description: String,
      },
    ],
    skills: [String],
    leaveBalance: {
      casual: { type: Number, default: 12 },
      sick: { type: Number, default: 12 },
      earned: { type: Number, default: 15 },
      maternity: { type: Number, default: 0 },
      paternity: { type: Number, default: 0 },
      unpaid: { type: Number, default: 0 },
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
    },
    performanceRating: { type: Number, min: 1, max: 5 },
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

employeeSchema.index({ tenantId: 1, employeeId: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, email: 1 });
employeeSchema.index({ tenantId: 1, department: 1 });
employeeSchema.index({ tenantId: 1, status: 1 });

employeeSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

employeeSchema.virtual('yearsOfService').get(function () {
  if (!this.joiningDate) return 0;
  const diff = new Date() - new Date(this.joiningDate);
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
});

module.exports = mongoose.model('Employee', employeeSchema);
