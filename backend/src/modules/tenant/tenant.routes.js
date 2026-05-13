const express = require('express');
const router = express.Router();
const { authenticate, superAdminOnly } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { auditLog } = require('../../middleware/audit.middleware');
const Tenant = require('./tenant.model');
const User = require('../user/user.model');
const Role = require('../auth/role.model');
const { cache } = require('../../config/redis');
const { NotFoundError } = require('../../middleware/error.middleware');
const { StatusCodes } = require('http-status-codes');

// Super admin: manage all tenants
router.get('/', authenticate, superAdminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const [tenants, total] = await Promise.all([
      Tenant.find(query)
        .populate('owner', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Tenant.countDocuments(query),
    ]);

    res.json({ success: true, data: tenants, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) { next(error); }
});

// Get current tenant info
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const tenant = await Tenant.findById(req.tenantId).lean();
    if (!tenant) throw new NotFoundError('Tenant');
    res.json({ success: true, data: tenant });
  } catch (error) { next(error); }
});

// Update tenant settings
router.put('/me', authenticate, authorize('settings', 'update'), auditLog('settings', 'SETTINGS_CHANGE', 'Tenant'), async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'website', 'address', 'branding', 'settings', 'taxInfo'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const tenant = await Tenant.findByIdAndUpdate(req.tenantId, { $set: updates }, { new: true });
    await cache.del(`tenant:${req.tenantId}`);

    res.json({ success: true, data: tenant });
  } catch (error) { next(error); }
});

// Get tenant users
router.get('/me/users', authenticate, authorize('users', 'read'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, roleType } = req.query;
    const query = { tenantId: req.tenantId, deletedAt: null };
    if (status) query.status = status;
    if (roleType) query.roleType = roleType;

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('role', 'name displayName')
        .select('-password -refreshTokens -mfa')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query),
    ]);

    res.json({ success: true, data: users, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (error) { next(error); }
});

// Invite user to tenant
router.post('/me/users/invite', authenticate, authorize('users', 'create'), async (req, res, next) => {
  try {
    const { email, roleType, firstName, lastName } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase(), tenantId: req.tenantId });
    if (existing) {
      return res.status(StatusCodes.CONFLICT).json({ success: false, message: 'User already exists in this organization.' });
    }

    const role = await Role.findOne({ tenantId: req.tenantId, type: roleType });
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

    const user = await User.create({
      tenantId: req.tenantId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: tempPassword,
      role: role?._id,
      roleType,
      status: 'pending',
    });

    // Send invitation email
    const { sendEmail } = require('../../shared/email.service');
    await sendEmail({
      to: email,
      subject: `You've been invited to join ${req.tenant.name}`,
      template: 'invitation',
      data: {
        name: firstName,
        companyName: req.tenant.name,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
        tempPassword,
      },
    });

    res.status(StatusCodes.CREATED).json({ success: true, message: 'Invitation sent.', data: { userId: user._id } });
  } catch (error) { next(error); }
});

// Get roles
router.get('/me/roles', authenticate, authorize('settings', 'read'), async (req, res, next) => {
  try {
    const roles = await Role.find({ tenantId: req.tenantId, isActive: true }).lean();
    res.json({ success: true, data: roles });
  } catch (error) { next(error); }
});

// Update role permissions
router.put('/me/roles/:roleId', authenticate, authorize('settings', 'update'), auditLog('settings', 'PERMISSION_CHANGE', 'Role'), async (req, res, next) => {
  try {
    const role = await Role.findOneAndUpdate(
      { _id: req.params.roleId, tenantId: req.tenantId, isSystem: false },
      { $set: { permissions: req.body.permissions } },
      { new: true }
    );
    if (!role) throw new NotFoundError('Role');

    // Invalidate role cache
    await cache.del(`role:${req.params.roleId}`);

    res.json({ success: true, data: role });
  } catch (error) { next(error); }
});

// Super admin: suspend/activate tenant
router.put('/:id/status', authenticate, superAdminOnly, async (req, res, next) => {
  try {
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { $set: { status: req.body.status } },
      { new: true }
    );
    if (!tenant) throw new NotFoundError('Tenant');
    await cache.del(`tenant:${req.params.id}`);
    res.json({ success: true, data: tenant });
  } catch (error) { next(error); }
});

module.exports = router;
