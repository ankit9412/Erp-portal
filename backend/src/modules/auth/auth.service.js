const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { StatusCodes } = require('http-status-codes');
const User = require('../user/user.model');
const Role = require('./role.model');
const Tenant = require('../tenant/tenant.model');
const { cache, redisClient } = require('../../config/redis');
const { sendEmail } = require('../../shared/email.service');
const { AppError, ConflictError, UnauthorizedError } = require('../../middleware/error.middleware');
const logger = require('../../config/logger');

class AuthService {
  /**
   * Generate JWT access token
   */
  generateAccessToken(userId, tenantId, roleType) {
    return jwt.sign(
      { userId, tenantId, roleType },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
    );
  }

  /**
   * Register a new tenant + owner
   */
  async register({ companyName, email, password, firstName, lastName, phone }) {
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('An account with this email already exists.');
    }

    // Create tenant
    const tenant = await Tenant.create({
      name: companyName,
      email: email.toLowerCase(),
      phone,
      status: 'trial',
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      subscription: {
        name: 'free',
        maxUsers: 5,
        maxProducts: 100,
        maxWarehouses: 1,
        maxInvoices: 50,
        features: ['inventory', 'finance', 'hr'],
      },
    });

    // Create default roles for tenant
    await this.createDefaultRoles(tenant._id);

    // Get business_owner role
    const ownerRole = await Role.findOne({ tenantId: tenant._id, type: 'business_owner' });

    // Create owner user
    const user = await User.create({
      tenantId: tenant._id,
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone,
      role: ownerRole?._id,
      roleType: 'business_owner',
      status: 'active',
      isEmailVerified: false,
    });

    // Update tenant owner
    tenant.owner = user._id;
    await tenant.save();

    // Send verification email
    try {
      const verificationToken = user.createEmailVerificationToken();
      await user.save({ validateBeforeSave: false });

      await sendEmail({
        to: email,
        subject: 'Verify your email - MSME ERP',
        template: 'emailVerification',
        data: {
          name: firstName,
          verificationUrl: `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`,
        },
      });
    } catch (emailError) {
      logger.error(`Failed to send verification email: ${emailError.message}`);
      // In development, we don't want to block registration if email fails
      if (process.env.NODE_ENV === 'production') {
        throw emailError;
      }
    }

    return { user, tenant };
  }

  /**
   * Login user
   */
  async login({ email, password, deviceInfo }) {
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password +mfa.secret +mfa.backupCodes +refreshTokens')
      .populate('role');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    // Check if account is locked
    if (user.isLocked) {
      throw new AppError(
        'Account temporarily locked due to too many failed attempts. Try again in 2 hours.',
        StatusCodes.TOO_MANY_REQUESTS,
        'ACCOUNT_LOCKED'
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      throw new UnauthorizedError('Invalid email or password.');
    }

    if (user.status !== 'active') {
      throw new AppError(
        `Account is ${user.status}. Please contact support.`,
        StatusCodes.FORBIDDEN,
        'ACCOUNT_INACTIVE'
      );
    }

    // Reset login attempts on success
    if (user.loginAttempts > 0) {
      await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
    }

    // Check if MFA is required
    if (user.mfa?.enabled) {
      const mfaToken = crypto.randomBytes(32).toString('hex');
      await cache.set(`mfa:${mfaToken}`, { userId: user._id.toString() }, 300); // 5 min
      return {
        requiresMFA: true,
        mfaToken,
        mfaMethod: user.mfa.method,
      };
    }

    return this.completeLogin(user, deviceInfo);
  }

  /**
   * Complete login after MFA verification
   */
  async completeLogin(user, deviceInfo = {}) {
    const accessToken = this.generateAccessToken(
      user._id,
      user.tenantId,
      user.roleType
    );
    const refreshToken = this.generateRefreshToken(user._id);

    // Store refresh token
    const deviceId = deviceInfo.deviceId || crypto.randomUUID();
    user.refreshTokens = user.refreshTokens || [];

    // Remove old tokens for same device
    user.refreshTokens = user.refreshTokens.filter((t) => t.deviceId !== deviceId);

    // Keep max 5 refresh tokens per user
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens.shift();
    }

    user.refreshTokens.push({
      token: crypto.createHash('sha256').update(refreshToken).digest('hex'),
      deviceId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Update login info
    user.lastLogin = new Date();
    user.lastLoginIp = deviceInfo.ip;
    user.loginHistory = user.loginHistory || [];
    user.loginHistory.unshift({
      ip: deviceInfo.ip,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      status: 'success',
    });
    if (user.loginHistory.length > 20) user.loginHistory = user.loginHistory.slice(0, 20);

    await user.save({ validateBeforeSave: false });

    // Invalidate user cache
    await cache.del(`user:${user._id}`);

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshTokens;
    delete userResponse.mfa;

    return { accessToken, refreshToken, user: userResponse };
  }

  /**
   * Verify MFA and complete login
   */
  async verifyMFA({ mfaToken, code, deviceInfo }) {
    const mfaData = await cache.get(`mfa:${mfaToken}`);
    if (!mfaData) {
      throw new AppError('MFA session expired. Please log in again.', StatusCodes.UNAUTHORIZED);
    }

    const user = await User.findById(mfaData.userId)
      .select('+mfa.secret +mfa.backupCodes +refreshTokens')
      .populate('role');

    if (!user) throw new UnauthorizedError('User not found.');

    let isValid = false;

    if (user.mfa.method === 'totp') {
      isValid = speakeasy.totp.verify({
        secret: user.mfa.secret,
        encoding: 'base32',
        token: code,
        window: 2,
      });
    } else if (user.mfa.method === 'email' || user.mfa.method === 'sms') {
      const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
      isValid = user.otpCode === hashedCode && user.otpExpires > Date.now();
    }

    // Check backup codes
    if (!isValid && user.mfa.backupCodes) {
      const backupIndex = user.mfa.backupCodes.indexOf(code);
      if (backupIndex !== -1) {
        isValid = true;
        user.mfa.backupCodes.splice(backupIndex, 1);
        await user.save({ validateBeforeSave: false });
      }
    }

    if (!isValid) {
      throw new AppError('Invalid MFA code.', StatusCodes.UNAUTHORIZED, 'INVALID_MFA');
    }

    await cache.del(`mfa:${mfaToken}`);
    return this.completeLogin(user, deviceInfo);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const user = await User.findOne({
        _id: decoded.userId,
        'refreshTokens.token': hashedToken,
        'refreshTokens.expiresAt': { $gt: new Date() },
      }).populate('role');

      if (!user) {
        throw new UnauthorizedError('Invalid refresh token. Please log in again.');
      }

      const accessToken = this.generateAccessToken(user._id, user.tenantId, user.roleType);
      return { accessToken };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Refresh token expired. Please log in again.');
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId, refreshToken, accessToken) {
    // Blacklist access token
    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken);
        const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 900;
        if (ttl > 0) {
          await cache.set(`blacklist:${accessToken}`, '1', ttl);
        }
      } catch {}
    }

    // Remove refresh token
    if (refreshToken) {
      const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await User.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: { token: hashedToken } },
      });
    }

    await cache.del(`user:${userId}`);
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', StatusCodes.NOT_FOUND);

    const secret = speakeasy.generateSecret({
      name: `MSME ERP (${user.email})`,
      length: 20,
    });

    // Store secret temporarily
    await cache.set(`mfa_setup:${userId}`, secret.base32, 600);

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualKey: secret.base32,
    };
  }

  /**
   * Confirm and enable MFA
   */
  async confirmMFA(userId, code) {
    const secret = await cache.get(`mfa_setup:${userId}`);
    if (!secret) {
      throw new AppError('MFA setup session expired.', StatusCodes.BAD_REQUEST);
    }

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new AppError('Invalid verification code.', StatusCodes.BAD_REQUEST);
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    await User.findByIdAndUpdate(userId, {
      'mfa.enabled': true,
      'mfa.secret': secret,
      'mfa.method': 'totp',
      'mfa.backupCodes': backupCodes,
    });

    await cache.del(`mfa_setup:${userId}`);
    await cache.del(`user:${userId}`);

    return { backupCodes };
  }

  /**
   * Create default roles for a new tenant
   */
  async createDefaultRoles(tenantId) {
    const roleTypes = [
      'business_owner', 'manager', 'hr', 'accountant',
      'inventory_staff', 'sales_executive', 'support_staff'
    ];

    const roles = roleTypes.map((type) => ({
      tenantId,
      name: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      type,
      isSystem: true,
      hierarchy: this.getRoleHierarchy(type),
      permissions: Role.schema.statics.getDefaultPermissions
        ? Role.getDefaultPermissions(type)
        : [],
    }));

    await Role.insertMany(roles, { ordered: false }).catch(() => {});
  }

  getRoleHierarchy(type) {
    const hierarchy = {
      business_owner: 100,
      manager: 80,
      hr: 60,
      accountant: 60,
      inventory_staff: 40,
      sales_executive: 40,
      support_staff: 20,
    };
    return hierarchy[type] || 0;
  }

  /**
   * Forgot password
   */
  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return;
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: email,
      subject: 'Password Reset - MSME ERP',
      template: 'passwordReset',
      data: {
        name: user.firstName,
        resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
        expiresIn: '10 minutes',
      },
    });
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token.', StatusCodes.BAD_REQUEST);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();

    await cache.del(`user:${user._id}`);
  }
}

module.exports = new AuthService();
