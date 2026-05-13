const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      pool: true,
      maxConnections: 5,
    });
  }
  return transporter;
};

// Email templates (inline for simplicity - in production use template files)
const templates = {
  emailVerification: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Verify Your Email</h2>
      <p>Hi ${data.name},</p>
      <p>Please verify your email address by clicking the button below:</p>
      <a href="${data.verificationUrl}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
    </div>
  `,
  passwordReset: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Reset Your Password</h2>
      <p>Hi ${data.name},</p>
      <p>Click the button below to reset your password. This link expires in ${data.expiresIn}.</p>
      <a href="${data.resetUrl}" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Reset Password
      </a>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `,
  invitation: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>You've been invited to ${data.companyName}</h2>
      <p>Hi ${data.name},</p>
      <p>You've been invited to join ${data.companyName} on MSME ERP.</p>
      <p><strong>Temporary Password:</strong> ${data.tempPassword}</p>
      <a href="${data.loginUrl}" style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
        Login Now
      </a>
      <p>Please change your password after first login.</p>
    </div>
  `,
  invoice: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Invoice ${data.invoiceNumber}</h2>
      <p>Dear ${data.customerName},</p>
      <p>Please find attached invoice ${data.invoiceNumber} from ${data.companyName}.</p>
      <p><strong>Amount:</strong> ${data.totalAmount}</p>
      <p><strong>Due Date:</strong> ${data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'N/A'}</p>
    </div>
  `,
  invoiceReminder: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Payment Reminder</h2>
      <p>Invoice ${data.invoiceNumber} is overdue.</p>
      <p><strong>Outstanding Amount:</strong> ${data.amount}</p>
      <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
    </div>
  `,
  notification: (data) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${data.title}</h2>
      <p>Hi ${data.name},</p>
      <p>${data.message}</p>
      ${data.link ? `<a href="${data.link}" style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Details</a>` : ''}
    </div>
  `,
};

/**
 * Send email
 */
const sendEmail = async ({ to, subject, template, data, html, text, attachments = [] }) => {
  try {
    const emailHtml = html || (template && templates[template] ? templates[template](data) : '');

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'MSME ERP'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html: emailHtml,
      text: text || emailHtml.replace(/<[^>]*>/g, ''),
      attachments,
    };

    const info = await getTransporter().sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    logger.error(`Email send failed to ${to}: ${error.message}`);
    throw error;
  }
};

module.exports = { sendEmail };
