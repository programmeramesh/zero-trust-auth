const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: (process.env.SMTP_SECURE === 'true') || false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendMail(options) {
    if (!this.transporter) {
      // Transporter not configured; skip sending
      return false;
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      ...options,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (err) {
      console.error('Email send error:', err);
      return false;
    }
  }

  async sendVerificationEmail(toEmail, token) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const link = `${frontendUrl.replace(/\/$/, '')}/verify-email/${token}`;

    const subject = 'Please verify your email';
    const html = `<p>Please verify your email by clicking the link below:</p><p><a href="${link}">${link}</a></p>`;

    const result = await this.sendMail({ to: toEmail, subject, html });
    return result || link; // return link when sending not configured
  }
}

module.exports = new EmailService();
