const crypto = require('crypto');

class PasswordPolicyService {
  constructor() {
    this.minLength = 8;
    this.maxLength = 128;
    this.requireUppercase = true;
    this.requireLowercase = true;
    this.requireNumbers = true;
    this.requireSpecialChars = true;
    this.passwordHistoryLimit = 5; // Store last 5 passwords
    this.passwordExpirationDays = 90; // Password expires after 90 days
    this.specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    this.specialCharRegex = new RegExp(
      `[${this.escapeRegExp(this.specialChars)}]`
    );
  }

  escapeRegExp(value) {
    // Escape characters that are special in RegExp, including hyphen
    return value.replace(/[.*+?^${}()|[\]\\\-]/g, '\\$&');
  }

  /**
   * Validate password against policy
   */
  validatePassword(password) {
    const errors = [];

    if (password.length < this.minLength) {
      errors.push(`Password must be at least ${this.minLength} characters long`);
    }

    if (password.length > this.maxLength) {
      errors.push(`Password must not exceed ${this.maxLength} characters`);
    }

    if (this.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.requireSpecialChars && !this.specialCharRegex.test(password)) {
      errors.push(`Password must contain at least one special character (${this.specialChars})`);
    }

    // Check for common weak passwords
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'monkey', 'master', 'dragon', '111111', 'baseball',
      'iloveyou', 'trustno1', 'sunshine', 'princess', 'admin'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common and weak');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Hash password for history comparison
   */
  hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Check if password is in history
   */
  isPasswordInHistory(newPassword, passwordHistory) {
    const hashedNewPassword = this.hashPassword(newPassword);
    return passwordHistory?.includes(hashedNewPassword) || false;
  }

  /**
   * Check if password has expired
   */
  isPasswordExpired(lastPasswordChange) {
    if (!lastPasswordChange) return true;
    
    const expirationDate = new Date(lastPasswordChange);
    expirationDate.setDate(expirationDate.getDate() + this.passwordExpirationDays);
    
    return new Date() > expirationDate;
  }

  /**
   * Get password strength score (0-100)
   */
  getPasswordStrength(password) {
    let score = 0;

    // Length score
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Character variety
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (this.specialCharRegex.test(password)) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Get password strength label
   */
  getPasswordStrengthLabel(score) {
    if (score < 30) return 'Weak';
    if (score < 50) return 'Fair';
    if (score < 70) return 'Good';
    if (score < 90) return 'Strong';
    return 'Very Strong';
  }
}

module.exports = new PasswordPolicyService();
