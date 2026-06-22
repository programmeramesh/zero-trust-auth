const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deviceFingerprint: {
    type: String,
    required: true,
  },
  browser: {
    type: String,
  },
  os: {
    type: String,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  trusted: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  postureStatus: {
    type: String,
    default: "unknown",
  },
  riskScore: {
    type: Number,
    default: 0,
  },
  postureDetails: {
    type: Object,
    default: {},
  },
}, { timestamps: true });

module.exports = mongoose.model("Device", deviceSchema);
