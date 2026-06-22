const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const crypto = require("crypto");

class MFAService {
  // Generate a secret for TOTP (Google Authenticator)
  static generateSecret(userEmail) {
    return speakeasy.generateSecret({
      name: `ZeroTrust Security (${userEmail})`,
      issuer: "ZeroTrust Security Platform",
      length: 32,
    });
  }

  // Generate QR code for Google Authenticator
  static async generateQRCode(secret) {
    try {
      return await QRCode.toDataURL(secret.otpauth_url);
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  // Verify TOTP token (Google Authenticator)
  static verifyTOTP(token, secret) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2, // Allow 2 time steps before and after
    });
  }

  // Generate email OTP
  static generateEmailOTP() {
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    return { otp, expiry };
  }

  // Verify email OTP
  static verifyEmailOTP(otp, storedOtp, expiry) {
    if (Date.now() > expiry) {
      return { valid: false, message: "OTP expired" };
    }
    if (otp !== storedOtp) {
      return { valid: false, message: "Invalid OTP" };
    }
    return { valid: true, message: "OTP verified" };
  }
}

module.exports = MFAService;
