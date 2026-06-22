const Device = require("../models/Device");
const User = require("../models/User");
const crypto = require("crypto");

class DeviceService {
  // Generate device fingerprint from user agent and IP
  static generateFingerprint(userAgent, ipAddress) {
    const data = `${userAgent}|${ipAddress}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  static evaluateDevicePosture({ userAgent = "", os = "", browser = "", ipAddress = "" }) {
    const lowerAgent = userAgent.toLowerCase();
    const lowerBrowser = browser.toLowerCase();
    const lowerOs = os.toLowerCase();
    let riskScore = 0;
    const details = [];

    if (/headless|phantom|crawler|spider|bot|curl|wget/.test(lowerAgent)) {
      riskScore += 8;
      details.push("Headless or bot-like user agent");
    }

    if (/msie|trident|internet explorer/i.test(lowerBrowser) || /windows xp|windows 7|windows vista/.test(lowerOs)) {
      riskScore += 5;
      details.push("Old or unsupported OS/browser");
    }

    if (/chrome|firefox|safari|edge|opera/.test(lowerBrowser) === false && lowerBrowser.length > 0) {
      riskScore += 4;
      details.push("Nonstandard browser string detected");
    }

    if (/android|ios|iphone|ipad/.test(lowerOs) && /mobile/.test(lowerAgent)) {
      riskScore += 2;
      details.push("Mobile device access");
    }

    if (!browser && !os && userAgent) {
      riskScore += 3;
      details.push("Missing explicit browser/OS metadata");
    }

    if (!ipAddress || ipAddress === "::1" || ipAddress === "127.0.0.1") {
      details.push("Local network or missing IP address");
    }

    const postureStatus = riskScore >= 8 ? "poor" : riskScore >= 5 ? "moderate" : "good";

    return {
      riskScore: Math.min(10, riskScore),
      postureStatus,
      details,
    };
  }

  // Register or update device
  static async registerOrUpdateDevice(userId, userAgent, ipAddress, os, browser) {
    const fingerprint = this.generateFingerprint(userAgent, ipAddress);
    const posture = this.evaluateDevicePosture({ userAgent, os, browser, ipAddress });
    
    let device = await Device.findOne({
      userId,
      deviceFingerprint: fingerprint,
    });

    if (device) {
      // Update existing device
      device.lastLogin = new Date();
      device.lastSeen = new Date();
      device.ipAddress = ipAddress;
      device.browser = browser;
      device.os = os;
      device.postureStatus = posture.postureStatus;
      device.riskScore = posture.riskScore;
      device.postureDetails = posture.details;
      await device.save();
    } else {
      // Create new device
      device = new Device({
        userId,
        deviceFingerprint: fingerprint,
        browser,
        os,
        ipAddress,
        trusted: false,
        lastLogin: new Date(),
        lastSeen: new Date(),
        postureStatus: posture.postureStatus,
        riskScore: posture.riskScore,
        postureDetails: posture.details,
      });
      await device.save();
    }

    return device;
  }

  // Check if device is trusted
  static async isDeviceTrusted(userId, userAgent, ipAddress) {
    const fingerprint = this.generateFingerprint(userAgent, ipAddress);
    const device = await Device.findOne({
      userId,
      deviceFingerprint: fingerprint,
      trusted: true,
    });
    return !!device;
  }

  // Trust a device
  static async trustDevice(deviceId, userId) {
    const device = await Device.findOne({ _id: deviceId, userId });
    if (!device) {
      throw new Error("Device not found");
    }
    device.trusted = true;
    await device.save();

    // Add to user's trustedDevices if not already present
    const user = await User.findById(userId);
    if (user) {
      const exists = user.trustedDevices?.some(d => d.toString() === device._id.toString());
      if (!exists) {
        user.trustedDevices = user.trustedDevices || [];
        user.trustedDevices.push(device._id);
        await user.save();
      }
    }

    return device;
  }

  // Untrust a device
  static async untrustDevice(deviceId, userId) {
    const device = await Device.findOne({ _id: deviceId, userId });
    if (!device) {
      throw new Error("Device not found");
    }
    device.trusted = false;
    await device.save();

    // Remove from user's trustedDevices
    const user = await User.findById(userId);
    if (user && user.trustedDevices) {
      user.trustedDevices = user.trustedDevices.filter(d => d.toString() !== device._id.toString());
      await user.save();
    }

    return device;
  }

  // Get all devices for a user
  static async getUserDevices(userId) {
    return await Device.find({ userId }).sort({ lastSeen: -1 });
  }

  // Delete a device
  static async deleteDevice(deviceId, userId) {
    const device = await Device.findOneAndDelete({ _id: deviceId, userId });
    if (!device) {
      throw new Error("Device not found");
    }

    // Also remove from user's trustedDevices if present
    const user = await User.findById(userId);
    if (user && user.trustedDevices) {
      user.trustedDevices = user.trustedDevices.filter(d => d.toString() !== device._id.toString());
      await user.save();
    }

    return device;
  }
}

module.exports = DeviceService;
