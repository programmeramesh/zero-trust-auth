const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const rbacMiddleware = require("../middleware/rbacMiddleware");
const User = require("../models/User");
const Device = require("../models/Device");
const ActivityLog = require("../models/ActivityLog");
const SecurityEvent = require("../models/SecurityEvent");

// Get dashboard statistics (Admin/Analyst only)
router.get("/statistics", authMiddleware, rbacMiddleware(["Admin", "Security Analyst"]), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalDevices = await Device.countDocuments();
    const trustedDevices = await Device.countDocuments({ trusted: true });
    const totalActivityLogs = await ActivityLog.countDocuments();
    const totalSecurityEvents = await SecurityEvent.countDocuments();
    const openSecurityEvents = await SecurityEvent.countDocuments({ status: "OPEN" });
    const criticalEvents = await SecurityEvent.countDocuments({ severity: "CRITICAL" });
    const highEvents = await SecurityEvent.countDocuments({ severity: "HIGH" });

    // Get recent activity logs
    const recentActivities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name email");

    // Get recent security events
    const recentSecurityEvents = await SecurityEvent.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "name email");

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      devices: {
        total: totalDevices,
        trusted: trustedDevices,
      },
      activityLogs: {
        total: totalActivityLogs,
      },
      securityEvents: {
        total: totalSecurityEvents,
        open: openSecurityEvents,
        bySeverity: {
          critical: criticalEvents,
          high: highEvents,
        },
      },
      recentActivities,
      recentSecurityEvents,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user dashboard data (for current user)
router.get("/my-dashboard", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -mfaSecret");
    const devices = await Device.find({ userId: req.user.id }).sort({ lastSeen: -1 });
    const recentActivities = await ActivityLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    const securityEvents = await SecurityEvent.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    const trustedDevices = devices.filter((device) => device.trusted).length;
    const devicePostureCounts = devices.reduce(
      (acc, device) => {
        const status = device.postureStatus?.toLowerCase() || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { healthy: 0, warning: 0, high: 0, unknown: 0 }
    );

    const eventStats = {
      total: securityEvents.length,
      open: securityEvents.filter((event) => event.status === 'OPEN').length,
      critical: securityEvents.filter((event) => event.severity === 'CRITICAL').length,
      high: securityEvents.filter((event) => event.severity === 'HIGH').length,
    };

    const activeSessions = (user.sessions || []).filter(
      (session) => !session.revoked && (!session.expiresAt || session.expiresAt > new Date())
    ).length;

    res.json({
      user,
      devices,
      deviceStats: {
        total: devices.length,
        trusted: trustedDevices,
        untrusted: devices.length - trustedDevices,
        posture: devicePostureCounts,
      },
      activeSessions,
      recentActivities,
      securityEvents,
      eventStats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
