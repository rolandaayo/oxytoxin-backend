// Activity timeout configuration
module.exports = {
  // Inactivity timeout in milliseconds
  // Default: 30 minutes (30 * 60 * 1000)
  // You can change this value based on your requirements
  ACTIVITY_TIMEOUT: process.env.ACTIVITY_TIMEOUT || 30 * 60 * 1000,
  
  // JWT token expiration (should be longer than activity timeout)
  // Default: 7 days (7 * 24 * 60 * 60 * 1000)
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || "7d",
  
  // Activity check intervals (for cleanup tasks)
  CLEANUP_INTERVAL: process.env.CLEANUP_INTERVAL || 5 * 60 * 1000, // 5 minutes
  
  // Logging options
  LOG_ACTIVITY: process.env.LOG_ACTIVITY === 'true' || false,
  
  // Timeout presets (in milliseconds)
  TIMEOUT_PRESETS: {
    SHORT: 15 * 60 * 1000,      // 15 minutes
    MEDIUM: 30 * 60 * 1000,     // 30 minutes (default)
    LONG: 60 * 60 * 1000,       // 1 hour
    EXTENDED: 2 * 60 * 60 * 1000, // 2 hours
    DAY: 24 * 60 * 60 * 1000    // 24 hours
  }
};
