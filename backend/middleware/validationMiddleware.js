const { body, validationResult, param, query } = require('express-validator');

// Validation middleware factory
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

// Common validation rules
const validationRules = {
  email: body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email too long'),

  password: body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters'),

  name: body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),

  userId: param('userId')
    .trim()
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid User ID format'),

  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
      .toInt(),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
  ],

  // Sanitization helpers
  sanitizeString: (value) => {
    if (typeof value === 'string') {
      return value.trim().replace(/[<>]/g, '');
    }
    return value;
  },

  sanitizeObject: (obj) => {
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          sanitized[key] = validationRules.sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
          sanitized[key] = validationRules.sanitizeObject(obj[key]);
        } else {
          sanitized[key] = obj[key];
        }
      }
      return sanitized;
    }
    return obj;
  },
};

// Route-specific validation rules
const authValidation = {
  signup: [
    validationRules.name,
    validationRules.email,
    validationRules.password,
    validate,
  ],

  login: [
    validationRules.email,
    validationRules.password,
    validate,
  ],

  forgotPassword: [
    validationRules.email,
    validate,
  ],

  resetPassword: [
    param('token')
      .trim()
      .notEmpty()
      .withMessage('Reset token is required')
      .isLength({ min: 32, max: 64 })
      .withMessage('Invalid reset token'),
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters'),
    validate,
  ],

  updatePassword: [
    body('oldPassword')
      .trim()
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .trim()
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters'),
    validate,
  ],
};

const deviceValidation = {
  deviceId: [
    param('deviceId')
      .trim()
      .notEmpty()
      .withMessage('Device ID is required')
      .isMongoId()
      .withMessage('Invalid Device ID format'),
    validate,
  ],
};

const fileValidation = {
  upload: [
    body('filename')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Filename too long'),
    validate,
  ],
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    req.body = validationRules.sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = validationRules.sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = validationRules.sanitizeObject(req.params);
  }
  next();
};

// XSS protection middleware
const xssProtection = (req, res, next) => {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<[^>]*on\w+\s*=.*?>/gi,
  ];

  const checkXSS = (obj) => {
    if (typeof obj === 'string') {
      for (const pattern of xssPatterns) {
        if (pattern.test(obj)) {
          return true;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (checkXSS(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkXSS(req.body) || checkXSS(req.query) || checkXSS(req.params)) {
    return res.status(400).json({
      success: false,
      error: 'Potentially malicious input detected',
    });
  }

  next();
};

// SQL injection prevention (for MongoDB, this is NoSQL injection)
const noSQLInjectionProtection = (req, res, next) => {
  const noSQLPatterns = [
    /\$where/i,
    /\$ne/i,
    /\$gt/i,
    /\$lt/i,
    /\$in/i,
    /\$nin/i,
    /\$or/i,
    /\$and/i,
    /\$not/i,
    /\$exists/i,
    /\$regex/i,
    /\{.*\$.*\}/,
  ];

  const checkNoSQL = (obj) => {
    if (typeof obj === 'string') {
      for (const pattern of noSQLPatterns) {
        if (pattern.test(obj)) {
          return true;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (key.startsWith('$') || checkNoSQL(obj[key])) {
          return true;
        }
      }
    }
    return false;
  };

  if (checkNoSQL(req.body) || checkNoSQL(req.query)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query syntax detected',
    });
  }

  next();
};

module.exports = {
  validate,
  validationRules,
  authValidation,
  deviceValidation,
  fileValidation,
  sanitizeInput,
  xssProtection,
  noSQLInjectionProtection,
};
