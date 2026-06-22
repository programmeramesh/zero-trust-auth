const User = require('../models/User');

class AccountLockoutService {
  constructor() {
    this.maxFailedAttempts = 5;
    this.lockoutDurationMinutes = 30; // Account locked for 30 minutes
  }

  /**
   * Check if account is locked
   */
  isAccountLocked(user) {
    if (!user.lockUntil) {
      return false;
    }
    return new Date() < user.lockUntil;
  }

  /**
   * Lock account
   */
  async lockAccount(userId, durationMinutes = this.lockoutDurationMinutes) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + durationMinutes);
    
    user.lockUntil = lockUntil;
    user.failedLoginAttempts = this.maxFailedAttempts;
    await user.save();

    return lockUntil;
  }

  /**
   * Unlock account
   */
  async unlockAccount(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.lockUntil = undefined;
    user.failedLoginAttempts = 0;
    await user.save();

    return { message: 'Account unlocked successfully' };
  }

  /**
   * Increment failed login attempts
   */
  async incrementFailedAttempts(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.failedLoginAttempts += 1;
    
    // Check if should lock account
    if (user.failedLoginAttempts >= this.maxFailedAttempts) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + this.lockoutDurationMinutes);
      user.lockUntil = lockUntil;
    }

    await user.save();

    return {
      failedAttempts: user.failedLoginAttempts,
      locked: !!user.lockUntil,
      lockUntil: user.lockUntil,
    };
  }

  /**
   * Reset failed login attempts
   */
  async resetFailedAttempts(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return { message: 'Failed attempts reset' };
  }

  /**
   * Auto-unlock expired accounts (should be run periodically)
   */
  async autoUnlockExpiredAccounts() {
    const now = new Date();
    const result = await User.updateMany(
      { lockUntil: { $lt: now } },
      { 
        $set: { 
          lockUntil: undefined,
          failedLoginAttempts: 0
        }
      }
    );

    return { 
      message: 'Auto-unlock completed',
      unlockedCount: result.modifiedCount 
    };
  }

  /**
   * Get lockout status
   */
  getLockoutStatus(user) {
    if (!user.lockUntil) {
      return {
        locked: false,
        failedAttempts: user.failedLoginAttempts || 0,
        remainingAttempts: this.maxFailedAttempts - (user.failedLoginAttempts || 0),
      };
    }

    const isLocked = new Date() < user.lockUntil;
    const remainingTime = user.lockUntil - new Date();

    return {
      locked: isLocked,
      failedAttempts: user.failedLoginAttempts || 0,
      remainingAttempts: isLocked ? 0 : this.maxFailedAttempts - (user.failedLoginAttempts || 0),
      lockUntil: user.lockUntil,
      remainingMinutes: isLocked ? Math.ceil(remainingTime / (1000 * 60)) : 0,
    };
  }
}

module.exports = new AccountLockoutService();
