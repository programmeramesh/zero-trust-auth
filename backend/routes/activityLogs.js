const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const rbacMiddleware = require("../middleware/rbacMiddleware");
const ActivityLogService = require("../services/activityLogService");

// Get current user's activity logs
router.get("/my-logs", authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await ActivityLogService.getUserActivityLogs(req.user.id, limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all activity logs (Admin/Analyst only)
router.get("/all", authMiddleware, rbacMiddleware(["Admin", "Security Analyst"]), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;
    const logs = await ActivityLogService.getAllActivityLogs(limit, skip);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get failed activities (Admin/Analyst only)
router.get("/failed", authMiddleware, rbacMiddleware(["Admin", "Security Analyst"]), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await ActivityLogService.getFailedActivities(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get activity logs by action type (Admin/Analyst only)
router.get("/action/:action", authMiddleware, rbacMiddleware(["Admin", "Security Analyst"]), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await ActivityLogService.getActivityLogsByAction(req.params.action, limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
