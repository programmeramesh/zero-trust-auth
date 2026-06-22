const User = require('../models/User');
const Device = require('../models/Device');
const ActivityLog = require('../models/ActivityLog');
const SecurityEvent = require('../models/SecurityEvent');
const passwordPolicyService = require('./passwordPolicyService');

class SecurityHealthService {
  /**
   * Calculate overall security health score for a user
   */
  async calculateUserSecurityHealth(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const scores = {
      mfaEnabled: user.mfaEnabled ? 20 : 0,
      emailVerified: user.isEmailVerified ? 15 : 0,
      passwordStrength: this.getPasswordHealthScore(user),
      deviceSecurity: await this.getDeviceSecurityScore(userId),
      activityHealth: await this.getActivityHealthScore(userId),
      securityEventHealth: await this.getSecurityEventHealthScore(userId),
    };

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const maxScore = 100;

    return {
      totalScore,
      maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
      breakdown: scores,
      recommendations: this.getRecommendations(scores, user),
    };
  }

  /**
   * Calculate password health score
   */
  getPasswordHealthScore(user) {
    let score = 0;

    // Check if password is expired
    if (user.passwordExpiresAt && new Date() > user.passwordExpiresAt) {
      return 0; // Password expired - critical issue
    }

    // Check password age (newer is better)
    if (user.lastPasswordChange) {
      const daysSinceChange = (new Date() - new Date(user.lastPasswordChange)) / (1000 * 60 * 60 * 24);
      if (daysSinceChange < 30) score += 10;
      else if (daysSinceChange < 60) score += 7;
      else if (daysSinceChange < 90) score += 5;
    }

    // Check password history (more history = better)
    if (user.passwordHistory && user.passwordHistory.length >= 3) {
      score += 5;
    }

    return score;
  }

  /**
   * Calculate device security score
   */
  async getDeviceSecurityScore(userId) {
    const devices = await Device.find({ userId });
    let score = 0;

    if (devices.length === 0) {
      return 5; // No devices - minimal score
    }

    const trustedDevices = devices.filter(d => d.isTrusted);
    const trustRatio = trustedDevices.length / devices.length;

    if (trustRatio >= 0.8) score += 15;
    else if (trustRatio >= 0.5) score += 10;
    else if (trustRatio >= 0.3) score += 5;

    return score;
  }

  /**
   * Calculate activity health score
   */
  async getActivityHealthScore(userId) {
    const recentActivities = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    let score = 20; // Base score

    const failedActivities = recentActivities.filter(a => !a.success);
    const failureRate = failedActivities.length / recentActivities.length;

    if (failureRate > 0.3) score -= 10;
    else if (failureRate > 0.1) score -= 5;

    return Math.max(0, score);
  }

  /**
   * Calculate security event health score
   */
  async getSecurityEventHealthScore(userId) {
    const recentEvents = await SecurityEvent.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20);

    let score = 10; // Base score

    const openEvents = recentEvents.filter(e => e.status === 'OPEN');
    const criticalEvents = recentEvents.filter(e => e.severity === 'CRITICAL' || e.severity === 'HIGH');

    if (openEvents.length > 5) score -= 5;
    if (criticalEvents.length > 3) score -= 5;

    return Math.max(0, score);
  }

  /**
   * Get security recommendations based on scores
   */
  getRecommendations(scores, user) {
    const recommendations = [];

    if (scores.mfaEnabled === 0) {
      recommendations.push({
        priority: 'high',
        message: 'Enable Multi-Factor Authentication (MFA) to significantly improve account security',
      });
    }

    if (scores.emailVerified === 0) {
      recommendations.push({
        priority: 'high',
        message: 'Verify your email address to secure your account',
      });
    }

    if (scores.passwordStrength < 10) {
      recommendations.push({
        priority: 'high',
        message: 'Your password may be weak or expired. Consider changing it to a stronger password',
      });
    }

    if (scores.deviceSecurity < 10) {
      recommendations.push({
        priority: 'medium',
        message: 'Review your trusted devices and remove any unrecognized devices',
      });
    }

    if (scores.activityHealth < 10) {
      recommendations.push({
        priority: 'medium',
        message: 'Review your recent activity logs for any suspicious behavior',
      });
    }

    if (scores.securityEventHealth < 5) {
      recommendations.push({
        priority: 'high',
        message: 'You have unresolved security events. Review and address them immediately',
      });
    }

    return recommendations;
  }

  /**
   * Get overall system security statistics (Admin only)
   */
  async getSystemSecurityStats() {
    const totalUsers = await User.countDocuments();
    const mfaEnabledUsers = await User.countDocuments({ mfaEnabled: true });
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    const lockedAccounts = await User.countDocuments({ lockUntil: { $gt: new Date() } });
    const totalDevices = await Device.countDocuments();
    const trustedDevices = await Device.countDocuments({ isTrusted: true });
    const openSecurityEvents = await SecurityEvent.countDocuments({ status: 'OPEN' });
    const criticalEvents = await SecurityEvent.countDocuments({ 
      status: 'OPEN', 
      severity: { $in: ['CRITICAL', 'HIGH'] } 
    });

    return {
      users: {
        total: totalUsers,
        mfaEnabled: mfaEnabledUsers,
        mfaEnabledPercentage: totalUsers ? Math.round((mfaEnabledUsers / totalUsers) * 100) : 0,
        emailVerified: verifiedUsers,
        emailVerifiedPercentage: totalUsers ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
        lockedAccounts,
      },
      devices: {
        total: totalDevices,
        trusted: trustedDevices,
        trustedPercentage: totalDevices ? Math.round((trustedDevices / totalDevices) * 100) : 0,
      },
      securityEvents: {
        open: openSecurityEvents,
        critical: criticalEvents,
      },
    };
  }
}

module.exports = new SecurityHealthService();
