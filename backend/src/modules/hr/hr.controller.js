const { StatusCodes } = require('http-status-codes');
const Employee = require('./employee.model');
const Attendance = require('./attendance.model');
const Department = require('./department.model');
const Leave = require('./leave.model');
const Payroll = require('./payroll.model');
const User = require('../user/user.model');
const Role = require('../auth/role.model');
const { NotFoundError, AppError } = require('../../middleware/error.middleware');
const mongoose = require('mongoose');

class HRController {
  async getDashboard(req, res, next) {
    try {
      const tenantId = req.tenantId;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalEmployees,
        activeEmployees,
        onLeaveToday,
        presentToday,
        newJoinees,
      ] = await Promise.all([
        Employee.countDocuments({ tenantId, deletedAt: null }),
        Employee.countDocuments({ tenantId, status: 'active', deletedAt: null }),
        Attendance.countDocuments({ tenantId, date: today, status: 'on_leave' }),
        Attendance.countDocuments({ tenantId, date: today, status: 'present' }),
        Employee.countDocuments({
          tenantId,
          joiningDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalEmployees,
          activeEmployees,
          onLeaveToday,
          presentToday,
          absentToday: activeEmployees - presentToday - onLeaveToday,
          newJoinees,
          attendanceRate: activeEmployees > 0
            ? ((presentToday / activeEmployees) * 100).toFixed(1)
            : 0,
        },
      });
    } catch (error) { next(error); }
  }

  async getEmployees(req, res, next) {
    try {
      const { page = 1, limit = 20, search, department, status } = req.query;
      const query = { tenantId: req.tenantId, deletedAt: null };
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } },
        ];
      }
      if (department) query.department = department;
      if (status) query.status = status;

      const [employees, total] = await Promise.all([
        Employee.find(query)
          .populate('department', 'name')
          .populate('reportingTo', 'firstName lastName')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .lean(),
        Employee.countDocuments(query),
      ]);

      res.json({ success: true, data: employees, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
    } catch (error) { next(error); }
  }

  async createEmployee(req, res, next) {
    try {
      const { createUser, roleType, password, ...employeeData } = req.body;
      const tenantId = req.tenantId;

      const count = await Employee.countDocuments({ tenantId });
      const employeeId = employeeData.employeeId || `EMP-${String(count + 1).padStart(4, '0')}`;

      let userId = null;
      if (createUser) {
        // Find existing user with same email
        const existingUser = await User.findOne({ tenantId, email: employeeData.email.toLowerCase() });
        if (existingUser) {
          throw new AppError('A user with this email already exists.', 409);
        }

        // Get the role for the selected type
        const role = await Role.findOne({ tenantId, type: roleType || 'support_staff' });
        
        // Create user
        const newUser = await User.create({
          tenantId,
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email.toLowerCase(),
          password,
          role: role?._id,
          roleType: roleType || 'support_staff',
          employeeId,
          status: 'active',
          isEmailVerified: true, // Manual creation by admin
        });
        userId = newUser._id;
      }

      const employee = await Employee.create({
        ...employeeData,
        tenantId,
        employeeId,
        user: userId,
      });

      res.status(StatusCodes.CREATED).json({ success: true, data: employee });
    } catch (error) { next(error); }
  }

  async getEmployee(req, res, next) {
    try {
      const employee = await Employee.findOne({ _id: req.params.id, tenantId: req.tenantId, deletedAt: null })
        .populate('department', 'name')
        .populate('reportingTo', 'firstName lastName email');
      if (!employee) throw new NotFoundError('Employee');
      res.json({ success: true, data: employee });
    } catch (error) { next(error); }
  }

  async updateEmployee(req, res, next) {
    try {
      const employee = await Employee.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!employee) throw new NotFoundError('Employee');
      res.json({ success: true, data: employee });
    } catch (error) { next(error); }
  }

  async deleteEmployee(req, res, next) {
    try {
      const employee = await Employee.findOne({ _id: req.params.id, tenantId: req.tenantId });
      if (!employee) throw new NotFoundError('Employee');
      employee.deletedAt = new Date();
      employee.status = 'inactive';
      await employee.save();
      res.json({ success: true, message: 'Employee removed.' });
    } catch (error) { next(error); }
  }

  async checkIn(req, res, next) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existing = await Attendance.findOne({
        tenantId: req.tenantId,
        employee: req.body.employeeId,
        date: today,
      });

      if (existing?.checkIn) {
        throw new AppError('Already checked in today.', 400);
      }

      const attendance = existing
        ? await Attendance.findByIdAndUpdate(existing._id, {
            checkIn: new Date(),
            status: 'present',
            checkInLocation: req.body.location,
          }, { new: true })
        : await Attendance.create({
            tenantId: req.tenantId,
            employee: req.body.employeeId,
            date: today,
            checkIn: new Date(),
            status: 'present',
            checkInLocation: req.body.location,
          });

      res.json({ success: true, data: attendance });
    } catch (error) { next(error); }
  }

  async checkOut(req, res, next) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await Attendance.findOne({
        tenantId: req.tenantId,
        employee: req.body.employeeId,
        date: today,
        checkIn: { $exists: true },
      });

      if (!attendance) throw new AppError('No check-in found for today.', 400);
      if (attendance.checkOut) throw new AppError('Already checked out today.', 400);

      const checkOut = new Date();
      const workingMinutes = Math.floor((checkOut - attendance.checkIn) / (1000 * 60));

      attendance.checkOut = checkOut;
      attendance.workingHours = workingMinutes;
      attendance.checkOutLocation = req.body.location;
      await attendance.save();

      res.json({ success: true, data: attendance });
    } catch (error) { next(error); }
  }

  async bulkMarkAttendance(req, res, next) {
    try {
      const { date, records } = req.body;
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);

      const ops = records.map((r) => ({
        updateOne: {
          filter: { tenantId: req.tenantId, employee: r.employeeId, date: attendanceDate },
          update: { $set: { status: r.status, isManualEntry: true, markedBy: req.user._id } },
          upsert: true,
        },
      }));

      await Attendance.bulkWrite(ops);
      res.json({ success: true, message: `Attendance marked for ${records.length} employees.` });
    } catch (error) { next(error); }
  }

  async getAttendance(req, res, next) {
    try {
      const { employeeId, startDate, endDate, page = 1, limit = 30 } = req.query;
      const query = { tenantId: req.tenantId };
      if (employeeId) query.employee = employeeId;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const [records, total] = await Promise.all([
        Attendance.find(query)
          .populate('employee', 'firstName lastName employeeId')
          .sort({ date: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .lean(),
        Attendance.countDocuments(query),
      ]);

      res.json({ success: true, data: records, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
    } catch (error) { next(error); }
  }

  async getAttendanceReport(req, res, next) {
    try {
      const { month, year } = req.query;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const report = await Attendance.aggregate([
        {
          $match: {
            tenantId: new mongoose.Types.ObjectId(req.tenantId),
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$employee',
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
            onLeave: { $sum: { $cond: [{ $eq: ['$status', 'on_leave'] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
            totalWorkingHours: { $sum: '$workingHours' },
            overtimeHours: { $sum: '$overtimeHours' },
          },
        },
        {
          $lookup: {
            from: 'employees',
            localField: '_id',
            foreignField: '_id',
            as: 'employee',
          },
        },
        { $unwind: '$employee' },
      ]);

      res.json({ success: true, data: report });
    } catch (error) { next(error); }
  }

  async getLeaves(req, res, next) {
    try {
      const { employeeId, status, page = 1, limit = 20 } = req.query;
      const query = { tenantId: req.tenantId };
      if (employeeId) query.employee = employeeId;
      if (status) query.status = status;

      const [leaves, total] = await Promise.all([
        Leave.find(query)
          .populate('employee', 'firstName lastName employeeId')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .lean(),
        Leave.countDocuments(query),
      ]);

      res.json({ success: true, data: leaves, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
    } catch (error) { next(error); }
  }

  async applyLeave(req, res, next) {
    try {
      const { startDate, endDate } = req.body;
      const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
      
      const leave = await Leave.create({
        ...req.body,
        tenantId: req.tenantId,
        days,
      });

      res.status(StatusCodes.CREATED).json({ success: true, data: leave });
    } catch (error) { next(error); }
  }

  async approveLeave(req, res, next) {
    try {
      const leave = await Leave.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId },
        { 
          $set: { 
            status: 'approved', 
            approvedBy: req.user._id,
            approvalDate: new Date()
          } 
        },
        { new: true }
      );
      if (!leave) throw new NotFoundError('Leave application');
      res.json({ success: true, data: leave });
    } catch (error) { next(error); }
  }

  async rejectLeave(req, res, next) {
    try {
      const leave = await Leave.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId },
        { $set: { status: 'rejected', comments: req.body.comments } },
        { new: true }
      );
      if (!leave) throw new NotFoundError('Leave application');
      res.json({ success: true, data: leave });
    } catch (error) { next(error); }
  }

  async getPayroll(req, res, next) {
    try {
      const { month, year, employeeId } = req.query;
      const query = { tenantId: req.tenantId };
      if (month) query.month = parseInt(month);
      if (year) query.year = parseInt(year);
      if (employeeId) query.employee = employeeId;

      const payroll = await Payroll.find(query)
        .populate('employee', 'firstName lastName employeeId department designation')
        .sort({ createdAt: -1 })
        .lean();

      res.json({ success: true, data: payroll });
    } catch (error) { next(error); }
  }

  async generatePayroll(req, res, next) {
    try {
      const { month, year } = req.body;
      const employees = await Employee.find({ tenantId: req.tenantId, status: 'active', deletedAt: null }).lean();

      const ops = employees.map((emp) => {
        const basicSalary = emp.salary || 0;
        const totalAllowances = 0; // Simplified
        const taxRate = 0.1; // 10% tax
        const taxAmount = basicSalary * taxRate;
        const netPay = basicSalary - taxAmount;

        return {
          updateOne: {
            filter: { tenantId: req.tenantId, employee: emp._id, month, year },
            update: {
              $set: {
                basicSalary,
                totalAllowances,
                totalDeductions: 0,
                taxAmount,
                netPay,
                status: 'pending',
              }
            },
            upsert: true,
          }
        };
      });

      await Payroll.bulkWrite(ops);
      
      const result = await Payroll.find({ tenantId: req.tenantId, month, year })
        .populate('employee', 'firstName lastName employeeId')
        .lean();

      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async downloadPayslip(req, res, next) {
    try {
      res.json({ success: true, message: 'Payslip PDF generation - implement with PDFKit' });
    } catch (error) { next(error); }
  }

  async getDepartments(req, res, next) {
    try {
      const departments = await Department.find({ tenantId: req.tenantId })
        .populate('manager', 'firstName lastName')
        .sort({ name: 1 })
        .lean();
      res.json({ success: true, data: departments });
    } catch (error) { next(error); }
  }

  async createDepartment(req, res, next) {
    try {
      const department = await Department.create({
        ...req.body,
        tenantId: req.tenantId,
      });
      res.status(StatusCodes.CREATED).json({ success: true, data: department });
    } catch (error) { next(error); }
  }
}

module.exports = new HRController();
