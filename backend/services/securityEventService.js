const SecurityEvent = require("../models/SecurityEvent");
const User = require("../models/User");
const SIEMService = require("./siemService");

class SecurityEventService {
  // Create a security event
  static async createSecurityEvent({
    userId,
    threatType,
    severity,
    ipAddress,
    description,
    metadata = {},
  }) {
    try {
      const event = new SecurityEvent({
        userId,
        threatType,
        severity,
        ipAddress,
        description,
        metadata,
        status: "OPEN",
      });
      await event.save();
      await SIEMService.logEvent({
        userId,
        threatType,
        severity,
        ipAddress,
        description,
        metadata,
      });
      return event;
    } catch (error) {
      console.error("Error creating security event:", error);
      throw error;
    }
  }

  // Detect multiple failed login attempts
  static async detectFailedLoginAttempts(userId, ipAddress) {
    const user = await User.findById(userId);
    if (!user) return null;

    if (user.failedLoginAttempts >= 5) {
      // Lock account
      user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
      await user.save();

      // Create security event
      await this.createSecurityEvent({
        userId,
        threatType: "MULTIPLE_FAILED_LOGINS",
        severity: "HIGH",
        ipAddress,
        description: `Account locked due to ${user.failedLoginAttempts} failed login attempts`,
        metadata: { failedAttempts: user.failedLoginAttempts },
      });

      return { locked: true, lockUntil: user.lockUntil };
    }

    return { locked: false };
  }

  // Detect unusual location (simplified - in production, use GeoIP)
  static async detectUnusualLocation(userId, ipAddress) {
    // This is a simplified version
    // In production, you would use GeoIP services to detect unusual locations
    // For now, we'll just log the event if it's from a new IP
    const user = await User.findById(userId);
    if (!user) return null;

    // Check if this IP has been used before
    const ActivityLog = require("../models/ActivityLog");
    const previousLogins = await ActivityLog.find({
      userId,
      action: "LOGIN",
      success: true,
      ipAddress,
    }).limit(1);

    if (previousLogins.length === 0) {
      // New IP address - create a low severity event
      await this.createSecurityEvent({
        userId,
        threatType: "UNUSUAL_LOCATION",
        severity: "LOW",
        ipAddress,
        description: "Login from new IP address detected",
        metadata: { newIp: ipAddress },
      });
    }

    return null;
  }

  // Detect access outside business hours
  static async detectAccessOutsideHours(userId, ipAddress) {
    const hour = new Date().getHours();
    // Business hours: 9 AM - 6 PM (Monday-Friday)
    const day = new Date().getDay();
    const isWeekend = day === 0 || day === 6;
    const isBusinessHours = hour >= 9 && hour <= 18 && !isWeekend;

    if (!isBusinessHours) {
      await this.createSecurityEvent({
        userId,
        threatType: "ACCESS_OUTSIDE_HOURS",
        severity: "MEDIUM",
        ipAddress,
        description: "Access detected outside business hours",
        metadata: { hour, day, isWeekend },
      });
    }
  }

  // Get all security events
  static async getAllSecurityEvents(limit = 100, skip = 0) {
    return await SecurityEvent.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("userId", "name email")
      .populate("resolvedBy", "name email");
  }

  // Get security events for a user
  static async getUserSecurityEvents(userId, limit = 50) {
    return await SecurityEvent.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("resolvedBy", "name email");
  }

  // Get open security events
  static async getOpenSecurityEvents(limit = 50) {
    return await SecurityEvent.find({ status: "OPEN" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email");
  }

  // Resolve a security event
  static async resolveSecurityEvent(eventId, resolvedBy, status = "RESOLVED") {
    const event = await SecurityEvent.findById(eventId);
    if (!event) {
      throw new Error("Security event not found");
    }

    event.status = status;
    event.resolvedBy = resolvedBy;
    event.resolvedAt = new Date();
    await event.save();

    return event;
  }

  // Get security statistics
  static async getSecurityStatistics() {
    const total = await SecurityEvent.countDocuments();
    const open = await SecurityEvent.countDocuments({ status: "OPEN" });
    const investigating = await SecurityEvent.countDocuments({ status: "INVESTIGATING" });
    const resolved = await SecurityEvent.countDocuments({ status: "RESOLVED" });
    const critical = await SecurityEvent.countDocuments({ severity: "CRITICAL" });
    const high = await SecurityEvent.countDocuments({ severity: "HIGH" });
    const medium = await SecurityEvent.countDocuments({ severity: "MEDIUM" });
    const low = await SecurityEvent.countDocuments({ severity: "LOW" });

    return {
      total,
      open,
      investigating,
      resolved,
      bySeverity: { critical, high, medium, low },
    };
  }
}

module.exports = SecurityEventService;
