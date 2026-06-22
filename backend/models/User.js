const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["Admin", "Security Analyst", "Employee"],
    default: "Employee",
  },
  mfaEnabled: {
    type: Boolean,
    default: false,
  },
  mfaSecret: {
    type: String,
  },
  trustedDevices: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
  }],
  refreshTokens: [
    {
      token: String,
      device: String,
      ipAddress: String,
      userAgent: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      expiresAt: Date,
      revoked: {
        type: Boolean,
        default: false,
      },
    },
  ],
  resetTokenHash: String,
  resetTokenExpiry: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  // Password policy fields
  passwordHistory: [{
    type: String, // Hashed passwords
  }],
  lastPasswordChange: {
    type: Date,
    default: Date.now,
  },
  passwordExpiresAt: {
    type: Date,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  emailVerificationExpiry: Date,
  // Session management
  sessions: [{
    token: String,
    refreshToken: String,
    refreshTokenExpiresAt: Date,
    revoked: {
      type: Boolean,
      default: false,
    },
    device: String,
    ipAddress: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  }],
}, { timestamps: true });


module.exports = mongoose.model("User", userSchema);
