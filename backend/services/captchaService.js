const svgCaptcha = require('svg-captcha');

class CaptchaService {
  constructor() {
    this.captchaStore = new Map(); // Store captchas in memory (in production, use Redis)
    this.captchaExpiryMinutes = 5; // Captcha expires after 5 minutes
  }

  /**
   * Generate a new CAPTCHA
   */
  generateCaptcha() {
    const captcha = svgCaptcha.create({
      size: 6, // Length of captcha
      ignoreChars: '0o1iIl', // Characters to ignore
      noise: 3, // Number of noise lines
      color: true, // Colored captcha
      background: '#f0f0f0',
    });

    const captchaId = this.generateCaptchaId();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.captchaExpiryMinutes);

    this.captchaStore.set(captchaId, {
      text: captcha.text.toLowerCase(),
      expiresAt,
    });

    // Clean up expired captchas periodically
    this.cleanupExpiredCaptchas();

    return {
      captchaId,
      svg: captcha.data,
      expiresAt,
    };
  }

  /**
   * Validate a CAPTCHA
   */
  validateCaptcha(captchaId, userInput) {
    const storedCaptcha = this.captchaStore.get(captchaId);
    
    if (!storedCaptcha) {
      return { valid: false, message: 'CAPTCHA not found or expired' };
    }

    if (new Date() > storedCaptcha.expiresAt) {
      this.captchaStore.delete(captchaId);
      return { valid: false, message: 'CAPTCHA expired' };
    }

    if (storedCaptcha.text !== userInput.toLowerCase()) {
      return { valid: false, message: 'Invalid CAPTCHA' };
    }

    // Remove used captcha
    this.captchaStore.delete(captchaId);
    return { valid: true, message: 'CAPTCHA validated successfully' };
  }

  /**
   * Generate a unique CAPTCHA ID
   */
  generateCaptchaId() {
    return `captcha_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up expired captchas
   */
  cleanupExpiredCaptchas() {
    const now = new Date();
    for (const [id, captcha] of this.captchaStore.entries()) {
      if (now > captcha.expiresAt) {
        this.captchaStore.delete(id);
      }
    }
  }

  /**
   * Get CAPTCHA statistics
   */
  getStats() {
    return {
      activeCaptchas: this.captchaStore.size,
      expiryMinutes: this.captchaExpiryMinutes,
    };
  }
}

module.exports = new CaptchaService();
