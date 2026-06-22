

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "FRONTEND_URL"];
const missingEnvVars = requiredEnvVars.filter((name) => !process.env[name]);
if (missingEnvVars.length) {
  console.warn(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

console.log("🚀 Server starting...");

const authRoutes          = require("./routes/auth");
const fileRoutes          = require("./routes/files");
const shareRoutes         = require("./routes/share");
const chatRoutes          = require("./routes/chat");
const authMiddleware      = require("./middleware/authMiddleware");
const insightsRoutes      = require("./routes/insights");
const deviceRoutes        = require("./routes/devices");
const activityLogRoutes   = require("./routes/activityLogs");
const securityEventRoutes = require("./routes/securityEvents");
const dashboardRoutes     = require("./routes/dashboard");
const ipPolicyRoutes      = require("./routes/ipPolicy");
const { generalLimiter, authLimiter, passwordResetLimiter, mfaLimiter } = require("./middleware/rateLimiter");

const app = express();

// Security headers with enhanced configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https://api.openai.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  xframe: { action: 'deny' },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

// CORS configuration - Restrict to specific origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL?.split(',') 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// Body parser with size limits
app.use(express.json({ 
  limit: "10mb",
  strict: true,
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  limit: "10mb", 
  extended: true,
  parameterLimit: 100
}));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent']?.substring(0, 100),
    };
    
    if (res.statusCode >= 400) {
      console.error('🔴 Request Error:', logData);
    } else if (req.url.startsWith('/api/auth')) {
      console.log('🔐 Auth Request:', logData);
    }
  });
  
  next();
});

// Apply rate limiting
app.use(generalLimiter);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// Apply stricter rate limiting to auth routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth/reset-password", passwordResetLimiter);
app.use("/api/auth/verify-mfa", mfaLimiter);

app.use("/api/auth",           authRoutes);
app.use("/api/files",          fileRoutes);
app.use("/api/share",          shareRoutes);
app.use("/api/ai",             chatRoutes);
app.use("/api/devices",        deviceRoutes);
app.use("/api/activity-logs",   activityLogRoutes);
app.use("/api/security-events", securityEventRoutes);
app.use("/api/dashboard",      dashboardRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/ip-policy",      ipPolicyRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An error occurred' 
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ message: "Protected route works!", userId: req.user.id });
});

app.get("/", (req, res) => res.send("SecureVault Backend Running ✅"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));