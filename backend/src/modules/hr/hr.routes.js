const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { requireTenant } = require('../../middleware/tenant.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { auditLog } = require('../../middleware/audit.middleware');
const hrController = require('./hr.controller');

router.use(authenticate, requireTenant);

// Employees
router.get('/employees', authorize('hr', 'read'), hrController.getEmployees);
router.post('/employees', authorize('hr', 'create'), auditLog('hr', 'CREATE', 'Employee'), hrController.createEmployee);
router.get('/employees/:id', authorize('hr', 'read'), hrController.getEmployee);
router.put('/employees/:id', authorize('hr', 'update'), hrController.updateEmployee);
router.delete('/employees/:id', authorize('hr', 'delete'), hrController.deleteEmployee);

// Attendance
router.get('/attendance', authorize('hr', 'read'), hrController.getAttendance);
router.post('/attendance/checkin', authorize('hr', 'create'), hrController.checkIn);
router.post('/attendance/checkout', authorize('hr', 'update'), hrController.checkOut);
router.post('/attendance/bulk', authorize('hr', 'create'), hrController.bulkMarkAttendance);
router.get('/attendance/report', authorize('hr', 'read'), hrController.getAttendanceReport);

// Leave Management
router.get('/leaves', authorize('hr', 'read'), hrController.getLeaves);
router.post('/leaves', hrController.applyLeave); // Any employee can apply
router.put('/leaves/:id/approve', authorize('hr', 'approve'), hrController.approveLeave);
router.put('/leaves/:id/reject', authorize('hr', 'reject'), hrController.rejectLeave);

// Payroll
router.get('/payroll', authorize('payroll', 'read'), hrController.getPayroll);
router.post('/payroll/generate', authorize('payroll', 'create'), auditLog('payroll', 'CREATE', 'Payroll'), hrController.generatePayroll);
router.get('/payroll/:id/slip', authorize('payroll', 'read'), hrController.downloadPayslip);

// Departments
router.get('/departments', authorize('hr', 'read'), hrController.getDepartments);
router.post('/departments', authorize('hr', 'create'), hrController.createDepartment);

// Dashboard
router.get('/dashboard', authorize('hr', 'read'), hrController.getDashboard);

module.exports = router;
