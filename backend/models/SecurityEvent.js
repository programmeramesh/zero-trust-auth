const mongoose = require("mongoose");

const securityEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  threatType: {
    type: String,
    required: true,
    enum: ["MULTIPLE_FAILED_LOGINS", "UNUSUAL_LOCATION", "ACCESS_OUTSIDE_HOURS", "PRIVILEGE_ESCALATION_ATTEMPT", "BRUTE_FORCE_ATTACK", "CREDENTIAL_STUFFING", "SESSION_HIJACKING", "UNAUTHORIZED_ACCESS", "SUSPICIOUS_ACTIVITY", "MALWARE_DETECTED", "DATA_EXFILTRATION", "ACCOUNT_TAKEOVER"],
  },
  severity: {
    type: String,
    required: true,
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
  },
  status: {
    type: String,
    required: true,
    enum: ["OPEN", "INVESTIGATING", "RESOLVED", "FALSE_POSITIVE"],
    default: "OPEN",
  },
  ipAddress: {
    type: String,
  },
  description: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  resolvedAt: {
    type: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model("SecurityEvent", securityEventSchema);
