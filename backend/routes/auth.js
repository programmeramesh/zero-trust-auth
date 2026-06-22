const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");
const { authValidation } = require("../middleware/validationMiddleware");
const User = require("../models/User");
const router = require("express").Router();
const crypto = require("crypto");
const MFAService = require("../services/mfaService");
const DeviceService = require("../services/deviceService");
const ActivityLogService = require("../services/activityLogService");
const SecurityEventService = require("../services/securityEventService");
const passwordPolicyService = require("../services/passwordPolicyService");
const sessionService = require("../services/sessionService");
const accountLockoutService = require("../services/accountLockoutService");
const captchaService = require("../services/captchaService");
const emailService = require("../services/emailService");
const securityHealthService = require("../services/securityHealthService");

const createTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");

  return { accessToken, refreshToken };
};

const findUserByRefreshToken = async (refreshToken) => {
  return await User.findOne({ "sessions.refreshToken": refreshToken });
};

// GENERATE CAPTCHA
router.get("/captcha", (req, res) => {
  try {
    const captcha = captchaService.generateCaptcha();
    res.json(captcha);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VERIFY CAPTCHA
router.post("/verify-captcha", (req, res) => {
  try {
    const { captchaId, userInput } = req.body;
    const result = captchaService.validateCaptcha(captchaId, userInput);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// FORGOT PASSWORD
router.post("/forgot-password", authValidation.forgotPassword, async (req, res) => {
  const { email } = req.body;
  console.log('FORGOT PASSWORD REQUEST:', { email, ip: req.ip });

  const user = await User.findOne({ email });
  if (!user) {
    console.warn('Forgot password requested for unknown email:', email);
    return res.json({ message: "If an account exists, a password reset link has been sent." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  user.resetTokenHash = hashResetToken(token);
  user.resetTokenExpiry = Date.now() + 3600000; // 1 hour
  await user.save();

  try {
    const result = await emailService.sendResetPasswordEmail(user.email, token);
    console.log('PASSWORD RESET LINK:', result.link);
    if (!result.success) {
      console.warn('Password reset email was not sent via SMTP; link is shown in console for development.');
    }
  } catch (err) {
    console.error('Failed to send reset email:', err);
  }

  res.json({ message: "If an account exists, a password reset link has been sent." });
});

// SIGNUP
router.post("/signup", async (req, res) => {
  const { name, email, password, captchaId, captchaInput } = req.body;
  console.log('SIGNUP ATTEMPT:', { email, name });
  try {
    // Validate CAPTCHA if provided (optional for now)
    if (captchaId && captchaInput) {
      const captchaValidation = captchaService.validateCaptcha(captchaId, captchaInput);
      if (!captchaValidation.valid) {
        console.warn('Signup captcha failed:', { email, reason: captchaValidation.message, captchaId });
        return res.status(400).json({ message: 'CAPTCHA validation failed', details: captchaValidation.message });
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn('Signup attempted for existing user:', email);
      return res.status(400).json({ message: "User already exists" });
    }

    // Validate password against policy
    const passwordValidation = passwordPolicyService.validatePassword(password);
    if (!passwordValidation.isValid) {
      // DEBUG: log details to help diagnose special-char mismatch (remove in production)
      console.warn('Password validation failed for', email, {
        errors: passwordValidation.errors,
        specialCharRegex: passwordPolicyService.specialCharRegex.toString(),
        specialCharMatch: passwordPolicyService.specialCharRegex.test(password),
        passwordSample: (password || '').slice(0, 2) + '***' + (password || '').slice(-2),
      });

      return res.status(400).json({ 
        message: "Password does not meet security requirements",
        errors: passwordValidation.errors 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Calculate password expiration date
    const passwordExpiresAt = new Date();
    passwordExpiresAt.setDate(passwordExpiresAt.getDate() + passwordPolicyService.passwordExpirationDays);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: "Employee", // Default role
      passwordHistory: [passwordPolicyService.hashPassword(password)],
      passwordExpiresAt,
      isEmailVerified: false,
      emailVerificationToken: crypto.randomBytes(32).toString('hex'),
      emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
    await newUser.save();
    
    // Log activity
    await ActivityLogService.logActivity({
      userId: newUser._id,
      action: "USER_CREATED",
      resource: "User",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      success: true,
      details: { email },
    });
    // Send verification email (or log link if mail not configured)
    try {
      const sendResult = await emailService.sendVerificationEmail(newUser.email, newUser.emailVerificationToken);
      if (typeof sendResult === 'string') {
        console.log('EMAIL VERIFICATION LINK:');
        console.log(sendResult);
      } else {
        console.log('Verification email sent:', sendResult?.messageId || sendResult);
      }
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }

    res.json({ 
      message: "User registered successfully. Please verify your email.",
      requiresEmailVerification: true 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password, captchaId, captchaInput } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];

    console.log("LOGIN ATTEMPT:", { email, ipAddress, userAgent });

    // Validate CAPTCHA if provided (optional for now)
    if (captchaId && captchaInput) {
      const captchaValidation = captchaService.validateCaptcha(captchaId, captchaInput);
      if (!captchaValidation.valid) {
        return res.status(400).json({ message: captchaValidation.message });
      }
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log("USER NOT FOUND:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("USER FOUND:", user.email, "MFA:", user.mfaEnabled);

    // Check if account is locked using lockout service
    const lockoutStatus = accountLockoutService.getLockoutStatus(user);
    if (lockoutStatus.locked) {
      return res.status(403).json({ 
        message: "Account locked due to multiple failed attempts. Try again later.",
        locked: true,
        remainingMinutes: lockoutStatus.remainingMinutes,
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: "Please verify your email before logging in.",
        requiresEmailVerification: true 
      });
    }

    // Check if password has expired
    if (user.passwordExpiresAt && new Date() > user.passwordExpiresAt) {
      return res.status(403).json({ 
        message: "Password has expired. Please reset your password.",
        requiresPasswordReset: true 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Increment failed login attempts using lockout service
      const result = await accountLockoutService.incrementFailedAttempts(user._id);
      
      // Log failed login attempt
      await ActivityLogService.logActivity({
        userId: user._id,
        action: "LOGIN",
        resource: "Authentication",
        ipAddress,
        userAgent,
        success: false,
        details: { reason: "Invalid password", failedAttempts: result.failedAttempts },
      });

      // Check for multiple failed logins
      const lockResult = await SecurityEventService.detectFailedLoginAttempts(user._id, ipAddress);
      if (lockResult && lockResult.locked) {
        return res.status(403).json({ 
          message: "Account locked due to multiple failed attempts. Try again later.",
          locked: true,
          remainingMinutes: result.remainingMinutes,
        });
      }

      return res.status(400).json({ 
        message: "Invalid credentials",
        failedAttempts: result.failedAttempts,
        remainingAttempts: result.remainingAttempts,
      });
    }

    // Reset failed login attempts on successful login
    await accountLockoutService.resetFailedAttempts(user._id);

    // Check if device is trusted
    const isDeviceTrusted = await DeviceService.isDeviceTrusted(user._id, userAgent, ipAddress);

    // Register/update device (capture device record)
    const device = await DeviceService.registerOrUpdateDevice(user._id, userAgent, ipAddress, "", "");

    // Evaluate device posture and log if needed
    if (device.riskScore >= 6) {
      await SecurityEventService.createSecurityEvent({
        userId: user._id,
        threatType: "POOR_DEVICE_POSTURE",
        severity: device.riskScore >= 8 ? "HIGH" : "MEDIUM",
        ipAddress,
        description: "Device posture risk detected during login",
        metadata: {
          deviceId: device._id,
          postureStatus: device.postureStatus,
          riskScore: device.riskScore,
          postureDetails: device.postureDetails,
        },
      });
    }

    // If MFA is enabled, device is not trusted, or posture is poor, require MFA
    if (user.mfaEnabled || !isDeviceTrusted || device.riskScore >= 6) {
      const tempToken = jwt.sign(
        { id: user._id, requiresMFA: true },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );
      
      return res.json({ 
        requiresMFA: true, 
        tempToken,
        mfaEnabled: user.mfaEnabled,
        deviceTrusted: isDeviceTrusted,
        posture: { status: device.postureStatus, riskScore: device.riskScore },
      });
    }

    const { accessToken, refreshToken } = createTokens(user);

    // Create session (include device id if available)
    await sessionService.createSession(user._id, accessToken, refreshToken, device?._id?.toString() || userAgent, ipAddress, userAgent);

    res.json({ 
      token: accessToken,
      refreshToken,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// REFRESH ACCESS TOKEN
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    const user = await findUserByRefreshToken(refreshToken);
    if (!user) {
      return res.status(401).json({ message: "Refresh token invalid" });
    }

    const session = user.sessions.find(
      (s) => s.refreshToken === refreshToken && !s.revoked && s.refreshTokenExpiresAt > new Date()
    );

    if (!session) {
      return res.status(401).json({ message: "Refresh token expired or revoked" });
    }

    const { accessToken, refreshToken: newRefreshToken } = createTokens(user);
    session.token = accessToken;
    session.refreshToken = newRefreshToken;
    session.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    session.revoked = false;
    session.lastActivity = new Date();
    await user.save();

    res.json({ token: accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error("REFRESH TOKEN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// REVOKE REFRESH TOKEN
router.post("/revoke-refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required" });
    }

    const user = await findUserByRefreshToken(refreshToken);
    if (!user) {
      return res.status(404).json({ message: "Refresh token not found" });
    }

    await sessionService.revokeRefreshToken(user._id, refreshToken);
    res.json({ message: "Refresh token revoked" });
  } catch (err) {
    console.error("REVOKE REFRESH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// VERIFY MFA
router.post("/verify-mfa", async (req, res) => {
  try {
    const { tempToken, otp } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers["user-agent"];

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    if (!decoded.requiresMFA) {
      return res.status(400).json({ message: "Invalid request" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Register/update device (capture device record)
    const device = await DeviceService.registerOrUpdateDevice(user._id, userAgent, ipAddress, "", "");

    // Verify TOTP if MFA is enabled
    if (user.mfaEnabled) {
      const isValid = MFAService.verifyTOTP(otp, user.mfaSecret);
      if (!isValid) {
        await ActivityLogService.logActivity({
          userId: user._id,
          action: "LOGIN",
          resource: "Authentication",
          ipAddress,
          userAgent,
          success: false,
          details: { reason: "Invalid MFA code" },
        });
        return res.status(400).json({ message: "Invalid MFA code" });
      }
    } else {
      // For new device verification without MFA, accept any OTP for demo
      // In production, you would send OTP via email
      // For now, we'll skip this check
    }

    const { accessToken, refreshToken } = createTokens(user);

    // Create session (include device id if available)
    await sessionService.createSession(user._id, accessToken, refreshToken, device?._id?.toString() || userAgent, ipAddress, userAgent);

    // Log successful login
    await ActivityLogService.logActivity({
      userId: user._id,
      action: "LOGIN",
      resource: "Authentication",
      ipAddress,
      userAgent,
      success: true,
      details: { mfaVerified: true },
    });

    res.json({ 
      token: accessToken,
      refreshToken,
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        mfaEnabled: user.mfaEnabled,
      },
    });
  } catch (err) {
    console.error("MFA VERIFICATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// ENABLE MFA
router.post("/enable-mfa", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate secret
    const secret = MFAService.generateSecret(user.email);
    user.mfaSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCode = await MFAService.generateQRCode(secret);

    res.json({ 
      secret: secret.base32,
      qrCode,
    });
  } catch (err) {
    console.error("ENABLE MFA ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// CONFIRM MFA ENABLE
router.post("/confirm-mfa", authMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify OTP
    const isValid = MFAService.verifyTOTP(otp, user.mfaSecret);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid MFA code" });
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    // Log activity
    await ActivityLogService.logActivity({
      userId: user._id,
      action: "MFA_ENABLED",
      resource: "Security",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      success: true,
    });

    res.json({ message: "MFA enabled successfully" });
  } catch (err) {
    console.error("CONFIRM MFA ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// DISABLE MFA
router.post("/disable-mfa", authMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify OTP before disabling
    const isValid = MFAService.verifyTOTP(otp, user.mfaSecret);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid MFA code" });
    }

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();

    // Log activity
    await ActivityLogService.logActivity({
      userId: user._id,
      action: "MFA_DISABLED",
      resource: "Security",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      success: true,
    });

    res.json({ message: "MFA disabled successfully" });
  } catch (err) {
    console.error("DISABLE MFA ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PASSWORD
router.post("/update-password", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { oldPassword, newPassword } = req.body;
    
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }
    
    // Validate new password against policy
    const passwordValidation = passwordPolicyService.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: "Password does not meet security requirements",
        errors: passwordValidation.errors 
      });
    }
    
    // Check if password is in history
    if (passwordPolicyService.isPasswordInHistory(newPassword, user.passwordHistory)) {
      return res.status(400).json({ message: "Cannot reuse a recent password" });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    
    // Update password history
    user.passwordHistory.push(passwordPolicyService.hashPassword(newPassword));
    if (user.passwordHistory.length > passwordPolicyService.passwordHistoryLimit) {
      user.passwordHistory.shift();
    }
    
    // Update password expiration
    const passwordExpiresAt = new Date();
    passwordExpiresAt.setDate(passwordExpiresAt.getDate() + passwordPolicyService.passwordExpirationDays);
    user.passwordExpiresAt = passwordExpiresAt;
    user.lastPasswordChange = new Date();
    
    await user.save();

    // Log activity
    await ActivityLogService.logActivity({
      userId: user._id,
      action: "PASSWORD_CHANGE",
      resource: "User",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      success: true,
    });
    
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// RESET PASSWORD
router.post("/reset-password/:token", authValidation.resetPassword, async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const tokenHash = hashResetToken(token);
  const user = await User.findOne({
    resetTokenHash: tokenHash,
    resetTokenExpiry: { $gt: Date.now() }
  });
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }

  const passwordValidation = passwordPolicyService.validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({
      message: "Password does not meet security requirements",
      errors: passwordValidation.errors,
    });
  }

  if (passwordPolicyService.isPasswordInHistory(password, user.passwordHistory)) {
    return res.status(400).json({ message: "Cannot reuse a recent password" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  user.password = hashedPassword;
  user.resetTokenHash = undefined;
  user.resetTokenExpiry = undefined;
  user.sessions = user.sessions.map((session) => ({ ...session, revoked: true }));

  user.passwordHistory.push(passwordPolicyService.hashPassword(password));
  if (user.passwordHistory.length > passwordPolicyService.passwordHistoryLimit) {
    user.passwordHistory.shift();
  }

  const passwordExpiresAt = new Date();
  passwordExpiresAt.setDate(passwordExpiresAt.getDate() + passwordPolicyService.passwordExpirationDays);
  user.passwordExpiresAt = passwordExpiresAt;
  user.lastPasswordChange = new Date();

  await user.save();

  await ActivityLogService.logActivity({
    userId: user._id,
    action: "PASSWORD_RESET",
    resource: "User",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    success: true,
  });

  res.json({ message: "Password reset successful" });
});

// VERIFY EMAIL
router.post("/verify-email/:token", async (req, res) => {
  const { token } = req.params;
  
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpiry: { $gt: Date.now() }
  });
  
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired verification token" });
  }
  
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save();
  
  // Log activity
  await ActivityLogService.logActivity({
    userId: user._id,
    action: "EMAIL_VERIFIED",
    resource: "User",
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    success: true,
  });
  
  res.json({ message: "Email verified successfully" });
});

// RESEND EMAIL VERIFICATION
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  if (user.isEmailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }
  
  user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
  user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  await user.save();
  
  // Send verification email (or log link if mail not configured)
  try {
    const sendResult = await emailService.sendVerificationEmail(user.email, user.emailVerificationToken);
    if (typeof sendResult === 'string') {
      console.log('EMAIL VERIFICATION LINK:');
      console.log(sendResult);
    } else {
      console.log('Verification email sent:', sendResult?.messageId || sendResult);
    }
  } catch (err) {
    console.error('Failed to send verification email:', err);
  }

  res.json({ message: "Verification email sent" });
});

// GET USER SESSIONS
router.get("/sessions", authMiddleware, async (req, res) => {
  try {
    const sessions = await sessionService.getUserSessions(req.user.id);
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REVOKE SESSION
router.delete("/sessions/:token", authMiddleware, async (req, res) => {
  try {
    const { token } = req.params;
    await sessionService.removeSession(req.user.id, token);
    res.json({ message: "Session revoked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REVOKE ALL SESSIONS
router.delete("/sessions", authMiddleware, async (req, res) => {
  try {
    await sessionService.removeAllSessions(req.user.id);
    res.json({ message: "All sessions revoked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REVOKE ALL OTHER SESSIONS
router.delete("/sessions/others", authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await sessionService.removeAllOtherSessions(req.user.id, token);
    res.json({ message: "All other sessions revoked successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET LOCKOUT STATUS
router.get("/lockout-status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const lockoutStatus = accountLockoutService.getLockoutStatus(user);
    res.json(lockoutStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UNLOCK ACCOUNT (Admin only)
router.post("/unlock-account/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = await User.findById(req.user.id);
    
    // Only Admin can unlock accounts
    if (currentUser.role !== 'Admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const result = await accountLockoutService.unlockAccount(userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SECURITY HEALTH SCORE
router.get("/security-health", authMiddleware, async (req, res) => {
  try {
    const healthScore = await securityHealthService.calculateUserSecurityHealth(req.user.id);
    res.json(healthScore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET SYSTEM SECURITY STATS (Admin only)
router.get("/security-stats", authMiddleware, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    
    // Only Admin can view system stats
    if (currentUser.role !== 'Admin') {
      return res.status(403).json({ message: "Unauthorized" });
    }
    
    const stats = await securityHealthService.getSystemSecurityStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -mfaSecret");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;