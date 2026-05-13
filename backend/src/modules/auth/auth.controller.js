const { StatusCodes } = require('http-status-codes');
const authService = require('./auth.service');
const logger = require('../../config/logger');

class AuthController {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { user, tenant } = await authService.register(req.body);

      res.status(StatusCodes.CREATED).json({
        success: true,
        message: 'Registration successful. Please verify your email.',
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          tenant: {
            id: tenant._id,
            name: tenant.name,
            slug: tenant.slug,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const deviceInfo = {
        ip: req.ip,
        device: req.headers['user-agent'],
        browser: req.headers['user-agent'],
        deviceId: req.headers['x-device-id'],
      };

      const result = await authService.login({ ...req.body, deviceInfo });

      if (result.requiresMFA) {
        return res.status(StatusCodes.OK).json({
          success: true,
          requiresMFA: true,
          mfaToken: result.mfaToken,
          mfaMethod: result.mfaMethod,
          message: 'MFA verification required.',
        });
      }

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Login successful.',
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/verify-mfa
   */
  async verifyMFA(req, res, next) {
    try {
      const deviceInfo = {
        ip: req.ip,
        device: req.headers['user-agent'],
        deviceId: req.headers['x-device-id'],
      };

      const result = await authService.verifyMFA({ ...req.body, deviceInfo });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'MFA verified successfully.',
        data: {
          accessToken: result.accessToken,
          user: result.user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Refresh token required.',
        });
      }

      const { accessToken } = await authService.refreshToken(refreshToken);

      res.status(StatusCodes.OK).json({
        success: true,
        data: { accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      const accessToken = req.headers.authorization?.split(' ')[1];

      await authService.logout(req.user._id, refreshToken, accessToken);

      res.clearCookie('refreshToken');
      res.clearCookie('accessToken');

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Logged out successfully.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      await authService.forgotPassword(req.body.email);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      await authService.resetPassword(req.body.token, req.body.password);

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Password reset successfully. Please log in.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   */
  async getMe(req, res) {
    res.status(StatusCodes.OK).json({
      success: true,
      data: { user: req.user },
    });
  }

  /**
   * POST /api/auth/mfa/setup
   */
  async setupMFA(req, res, next) {
    try {
      const result = await authService.setupMFA(req.user._id);
      res.status(StatusCodes.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/mfa/confirm
   */
  async confirmMFA(req, res, next) {
    try {
      const { backupCodes } = await authService.confirmMFA(req.user._id, req.body.code);
      res.status(StatusCodes.OK).json({
        success: true,
        message: 'MFA enabled successfully. Save your backup codes.',
        data: { backupCodes },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
