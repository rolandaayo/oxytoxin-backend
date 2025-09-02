# Automatic Logout for Inactive Users

## Overview

This server now includes automatic logout functionality that will automatically log out users after a period of inactivity. This addresses the security concern where users remain logged in indefinitely even after being away from the application.

## How It Works

1. **Smart Activity Tracking**: Only meaningful user interactions update the `lastActivity` timestamp (not background requests)
2. **Timeout Checking**: When a user makes a request, the system checks if they've been inactive for too long
3. **Automatic Logout**: If inactive for longer than 20 minutes, the user is automatically logged out
4. **Session Cleanup**: Admin can manually clean up expired sessions

**Important**: Users are only logged out when they're truly inactive (like when they minimize the browser for 20+ minutes), not when they're actively using the app.

### What Counts as "Activity"

The system only updates the activity timestamp for meaningful user interactions:

**Meaningful Activities (Updates Activity):**

- Updating profile information
- Changing password
- Uploading profile picture
- Adding/removing items from cart
- Placing orders
- Viewing user-specific data (profile, cart, orders)
- Admin operations (managing products, users, orders)

**Background Activities (Does NOT Update Activity):**

- Automatic API health checks
- Background data fetching
- System monitoring requests
- Non-user-specific data requests

This ensures users are only logged out when they're truly away from the application, not when they're actively browsing or using it.

## Configuration

### Environment Variables

Add these to your `.env` file to customize the behavior:

```env
# Activity timeout in milliseconds (default: 20 minutes)
ACTIVITY_TIMEOUT=1200000

# JWT token expiration (should be longer than activity timeout)
JWT_EXPIRATION=7d

# Activity logging (optional)
LOG_ACTIVITY=true

# Cleanup interval for background tasks
CLEANUP_INTERVAL=300000
```

### Timeout Presets

The system includes predefined timeout values:

- **SHORT**: 10 minutes
- **MEDIUM**: 20 minutes (default)
- **LONG**: 30 minutes
- **EXTENDED**: 1 hour
- **DAY**: 24 hours

## API Endpoints

### New Endpoints

- `GET /api/auth/activity-config` - Get current activity configuration
- `POST /api/auth/logout` - Manual logout (clears activity timestamp)
- `POST /api/auth/cleanup-sessions` - Admin-only: Clean up expired sessions

### Updated Endpoints

- `GET /api/auth/me` - Now includes activity checking
- All admin routes now include activity tracking

## Frontend Integration

### Handling Automatic Logout

When the frontend receives a `SESSION_EXPIRED_INACTIVITY` error:

```javascript
// Example error handling
if (error.code === "SESSION_EXPIRED_INACTIVITY") {
  // Clear local storage/cookies
  localStorage.removeItem("token");

  // Redirect to login
  router.push("/login");

  // Show message
  showNotification("Session expired due to inactivity. Please login again.");
}
```

### Activity Monitoring

To keep users logged in, ensure regular API calls:

```javascript
// Update user activity every 5 minutes
setInterval(() => {
  if (isLoggedIn) {
    // Make a lightweight API call to update activity
    api.get("/auth/me");
  }
}, 5 * 60 * 1000);
```

### Logout Implementation

```javascript
const logout = async () => {
  try {
    await api.post("/auth/logout");
    localStorage.removeItem("token");
    router.push("/login");
  } catch (error) {
    console.error("Logout error:", error);
  }
};
```

## Security Features

1. **Automatic Timeout**: Users are logged out after inactivity
2. **Activity Tracking**: Every request updates the last activity timestamp
3. **Session Cleanup**: Admin can manually clean expired sessions
4. **Configurable Timeouts**: Easy to adjust based on security requirements
5. **Audit Logging**: Optional logging of user activity and logout events

## Database Changes

The `User` model now includes:

```javascript
lastActivity: { type: Date, default: Date.now }
```

This field tracks when the user was last active and is used to determine if they should be automatically logged out.

## Monitoring and Maintenance

### Check Current Configuration

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4000/api/auth/activity-config
```

### Clean Up Expired Sessions (Admin Only)

```bash
curl -X POST -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:4000/api/auth/cleanup-sessions
```

### View Inactive Users

```javascript
// In your admin panel
const inactiveUsers = await User.find({
  lastActivity: { $lt: new Date(Date.now() - ACTIVITY_TIMEOUT) },
}).select("email lastActivity lastLogin");
```

## Troubleshooting

### Users Getting Logged Out Too Quickly

1. Check the `ACTIVITY_TIMEOUT` value
2. Ensure frontend is making regular API calls
3. Verify the `lastActivity` field is being updated

### Users Not Getting Logged Out

1. Check if the activity middleware is applied to routes
2. Verify the `checkUserActivity` middleware is being used
3. Check database for `lastActivity` field updates

### Performance Issues

1. The activity check runs on every authenticated request
2. Consider using Redis for session management in production
3. Implement caching for frequently accessed user data

## Production Considerations

1. **Redis Integration**: For better performance, consider using Redis for session management
2. **Load Balancing**: Ensure activity tracking works across multiple server instances
3. **Monitoring**: Set up alerts for unusual logout patterns
4. **Backup**: Regular backups of user activity data for audit purposes

## Testing

### Test Automatic Logout

1. Login to the application
2. Wait for the configured timeout period
3. Make an API request
4. Should receive `SESSION_EXPIRED_INACTIVITY` error

### Test Activity Updates

1. Login to the application
2. Make regular API calls
3. Check database: `lastActivity` should update with each request
4. Should not be logged out while active

### Test Manual Logout

1. Login to the application
2. Call the logout endpoint
3. `lastActivity` should be cleared
4. Next request should require re-login
