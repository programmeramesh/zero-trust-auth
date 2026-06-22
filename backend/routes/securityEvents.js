const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const rbacMiddleware = require("../middleware/rbacMiddleware");
const SecurityEventService = require("../services/securityEventService");
const ActivityLogService = require("../services/activityLogService");

// Get current user's security events
router.get("/my-events", authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const events = await SecurityEventService.getUserSecurityEvents(req.user.id, limit);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all security events (Admin/Analyst only)
router.get("/all", authMiddleware, rbacMiddleware(["Admin", "Security Analyst"]), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const skip = parseInt(req.query.skip) || 0;
    const events = await SecurityEventService.getAllSecurityEvents(limit, skip);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get open security events (Admin/Analyst only)
router.get("/open", authMiddleware, rbacMiddleware(["Admin", "Security Analyst"]), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const events = await SecurityEventService.getOpenSecurityEvents(limit);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get security statistics (Admin/Analyst only)
router.get("/statistics", authMiddleware, rbacMiddleware(["Admin", "Security Analyst"]), async (req, res) => {
  try {
    const stats = await SecurityEventService.getSecurityStatistics();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve a security event (Admin/Analyst only)
router.post("/:eventId/resolve", authMiddleware, rbacMiddleware(["Admin", "Security Analyst"]), async (req, res) => {
  try {
    const { status } = req.body;
    const event = await SecurityEventService.resolveSecurityEvent(
      req.params.eventId,
      req.user.id,
      status || "RESOLVED"
    );
    
    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "PERMISSION_CHANGE",
      resource: "SecurityEvent",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      success: true,
      details: { eventId: req.params.eventId, status },
    });
    
    res.json({ message: "Security event resolved", event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
