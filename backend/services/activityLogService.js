const ActivityLog = require("../models/ActivityLog");
const SIEMService = require("./siemService");

class ActivityLogService {
  // Log an activity
  static async logActivity({
    userId,
    action,
    resource,
    ipAddress,
    userAgent,
    success = true,
    details = {},
  }) {
    try {
      const log = new ActivityLog({
        userId,
        action,
        resource,
        ipAddress,
        userAgent,
        success,
        details,
      });
      await log.save();

      await SIEMService.logEvent({
        userId,
        action,
        resource,
        ipAddress,
        userAgent,
        success,
        details,
      });

      return log;
    } catch (error) {
      console.error("Error logging activity:", error);
      // Don't throw error - logging shouldn't break the main flow
    }
  }

  // Get activity logs for a user
  static async getUserActivityLogs(userId, limit = 50) {
    return await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email");
  }

  // Get all activity logs (for admin)
  static async getAllActivityLogs(limit = 100, skip = 0) {
    return await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("userId", "name email");
  }

  // Get activity logs by action type
  static async getActivityLogsByAction(action, limit = 50) {
    return await ActivityLog.find({ action })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email");
  }

  // Get failed activities
  static async getFailedActivities(limit = 50) {
    return await ActivityLog.find({ success: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "name email");
  }
}

module.exports = ActivityLogService;
