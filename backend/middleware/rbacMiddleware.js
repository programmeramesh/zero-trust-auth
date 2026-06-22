const User = require("../models/User");

// Role-based access control middleware
const rbacMiddleware = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: "Access denied. Insufficient permissions." 
        });
      }

      req.user.role = user.role;
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

module.exports = rbacMiddleware;
