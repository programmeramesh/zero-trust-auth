const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const DeviceService = require("../services/deviceService");
const ActivityLogService = require("../services/activityLogService");

// Get all devices for current user
router.get("/", authMiddleware, async (req, res) => {
  try {
    const devices = await DeviceService.getUserDevices(req.user.id);
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trust a device
router.post("/:deviceId/trust", authMiddleware, async (req, res) => {
  try {
    const device = await DeviceService.trustDevice(req.params.deviceId, req.user.id);
    
    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "DEVICE_TRUSTED",
      resource: "Device",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      success: true,
      details: { deviceId: req.params.deviceId },
    });
    
    res.json({ message: "Device trusted successfully", device });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Untrust a device
router.post("/:deviceId/untrust", authMiddleware, async (req, res) => {
  try {
    const device = await DeviceService.untrustDevice(req.params.deviceId, req.user.id);
    
    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "DEVICE_UNTRUSTED",
      resource: "Device",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      success: true,
      details: { deviceId: req.params.deviceId },
    });
    
    res.json({ message: "Device untrusted successfully", device });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a device
router.delete("/:deviceId", authMiddleware, async (req, res) => {
  try {
    await DeviceService.deleteDevice(req.params.deviceId, req.user.id);
    
    // Log activity
    await ActivityLogService.logActivity({
      userId: req.user.id,
      action: "DEVICE_DELETED",
      resource: "Device",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      success: true,
      details: { deviceId: req.params.deviceId },
    });
    
    res.json({ message: "Device deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
