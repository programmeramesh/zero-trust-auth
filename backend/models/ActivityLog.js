const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: ["LOGIN", "LOGOUT", "FILE_UPLOAD", "FILE_DOWNLOAD", "FILE_DELETE", "FILE_SHARE", "PASSWORD_CHANGE", "MFA_ENABLED", "MFA_DISABLED", "DEVICE_TRUSTED", "DEVICE_UNTRUSTED", "PERMISSION_CHANGE", "USER_CREATED", "USER_DELETED", "USER_UPDATED"],
  },
  resource: {
    type: String,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
  },
  success: {
    type: Boolean,
    default: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
}, { timestamps: true });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
