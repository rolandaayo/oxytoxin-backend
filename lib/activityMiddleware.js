const jwt = require("jsonwebtoken");
const User = require("../model/user");
const config = require("../config/activity");

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

/**
 * Middleware to check user activity and automatically logout inactive users
 */
const checkUserActivity = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // No token, continue without user context
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      // Check if user exists
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          status: "error",
          message: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      // Check if user has been inactive for too long
      const now = new Date();
      const lastActivity = user.lastActivity || user.createdAt;
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity > config.ACTIVITY_TIMEOUT) {
        return res.status(401).json({
          status: "error",
          message: "Session expired due to inactivity. Please login again.",
          code: "SESSION_EXPIRED",
        });
      }

      // Update user activity
      user.lastActivity = now;
      await user.save();

      next();
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return res.status(401).json({
          status: "error",
          message: "Token expired. Please login again.",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(401).json({
        status: "error",
        message: "Invalid token",
        code: "INVALID_TOKEN",
      });
    }
  } catch (error) {
    console.error("Activity middleware error:", error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error",
      code: "INTERNAL_ERROR",
    });
  }
};

/**
 * Middleware to update user activity without checking timeout
 * Only updates activity for meaningful user interactions, not background requests
 */
const updateUserActivity = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      // Only update activity for meaningful user interactions
      const meaningfulEndpoints = [
        "/api/public/profile",
        "/api/public/change-password",
        "/api/public/profile-picture",
        "/api/public/cart",
        "/api/public/orders",
        "/api/admin/products",
        "/api/admin/users",
        "/api/admin/orders",
        "/api/auth/me",
        "/api/delivery/save",
        "/api/delivery/get",
        "/api/delivery/admin/user",
        "/api/wishlist",
      ];

      const isMeaningfulRequest = meaningfulEndpoints.some(
        (endpoint) =>
          req.path.startsWith(endpoint) &&
          (req.method === "POST" ||
            req.method === "PATCH" ||
            req.method === "PUT" ||
            req.method === "DELETE")
      );

      // Also update for GET requests to user-specific data
      const isUserDataRequest =
        req.path.includes("/profile") ||
        req.path.includes("/cart") ||
        req.path.includes("/orders") ||
        req.path.includes("/me");

      if (isMeaningfulRequest || isUserDataRequest) {
        await User.findByIdAndUpdate(req.user.id, { lastActivity: new Date() });

        if (config.LOG_ACTIVITY) {
          console.log(
            `User activity updated for ${req.user.email} on ${req.method} ${req.path}`
          );
        }
      }
    }
    next();
  } catch (error) {
    console.error("Update activity error:", error);
    next(); // Continue even if activity update fails
  }
};

/**
 * Get current activity timeout configuration
 */
const getActivityConfig = (req, res) => {
  res.json({
    status: "success",
    data: {
      activityTimeout: config.ACTIVITY_TIMEOUT / 60000, // Convert to minutes
      jwtExpiration: config.JWT_EXPIRATION,
      timeoutPresets: Object.fromEntries(
        Object.entries(config.TIMEOUT_PRESETS).map(([key, value]) => [
          key,
          value / 60000,
        ])
      ),
    },
  });
};

module.exports = {
  checkUserActivity,
  updateUserActivity,
  getActivityConfig,
  ACTIVITY_TIMEOUT: config.ACTIVITY_TIMEOUT,
};
