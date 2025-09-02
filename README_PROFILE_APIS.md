# Profile Management APIs with Logout Functionality

## Overview

This document describes all the profile management APIs available in the public routes, including the new logout functionality that ensures users are properly logged out after certain security-sensitive operations.

## API Endpoints

### 1. Get User Profile

**Endpoint:** `GET /api/public/profile`

**Query Parameters:**

- `userEmail` (required): User's email address

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "address": "123 Main St",
    "phone": "+1234567890",
    "profilePicture": "https://cloudinary.com/image.jpg",
    "lastLogin": "2024-01-01T00:00:00.000Z",
    "lastActivity": "2024-01-01T12:00:00.000Z",
    "isEmailVerified": true,
    "isAdmin": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses:**

- `400`: Missing user email
- `404`: User not found
- `500`: Internal server error

---

### 2. Update User Profile

**Endpoint:** `PATCH /api/public/profile`

**Request Body:**

```json
{
  "userEmail": "john@example.com",
  "name": "John Smith",
  "phone": "+1234567890",
  "address": "456 Oak Ave",
  "logoutAfterUpdate": false
}
```

**Parameters:**

- `userEmail` (required): User's email address
- `name` (optional): New name (2-50 characters)
- `phone` (optional): New phone number (7-15 digits, can include +, spaces, dashes, parentheses)
- `address` (optional): New address (max 500 characters)
- `logoutAfterUpdate` (optional): If `true`, user will be logged out after update

**Response (without logout):**

```json
{
  "status": "success",
  "data": {
    "id": "user_id",
    "name": "John Smith",
    "email": "john@example.com",
    "address": "456 Oak Ave",
    "phone": "+1234567890",
    "profilePicture": "https://cloudinary.com/image.jpg",
    "lastActivity": "2024-01-01T12:00:00.000Z"
  },
  "message": "Profile updated successfully"
}
```

**Response (with logout):**

```json
{
  "status": "success",
  "data": {
    "id": "user_id",
    "name": "John Smith",
    "email": "john@example.com",
    "address": "456 Oak Ave",
    "phone": "+1234567890",
    "profilePicture": "https://cloudinary.com/image.jpg"
  },
  "message": "Profile updated successfully. You have been logged out.",
  "logoutRequired": true
}
```

**Features:**

- Automatically updates `lastActivity` timestamp
- Optional logout after update
- Validates all input fields
- Preserves existing data if not provided

---

### 3. Change Password

**Endpoint:** `POST /api/public/change-password`

**Request Body:**

```json
{
  "userEmail": "john@example.com",
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Parameters:**

- `userEmail` (required): User's email address
- `currentPassword` (required): Current password
- `newPassword` (required): New password (6-128 characters)

**Response:**

```json
{
  "status": "success",
  "message": "Password changed successfully. You have been logged out for security reasons.",
  "logoutRequired": true
}
```

**Features:**

- **Automatic logout**: User is always logged out after password change for security
- Validates current password
- Ensures new password is different from current
- Updates `passwordChangedAt` timestamp
- Clears `lastActivity` to force re-login

---

### 4. Upload Profile Picture

**Endpoint:** `POST /api/public/profile-picture`

**Request Body:** `multipart/form-data`

- `profilePicture` (required): Image file (max 25MB)
- `userEmail` (required): User's email address

**Response:**

```json
{
  "status": "success",
  "data": {
    "profilePicture": {
      "url": "https://cloudinary.com/image.jpg",
      "public_id": "cloudinary_id",
      "width": 800,
      "height": 800
    }
  },
  "message": "Profile picture uploaded successfully"
}
```

**Features:**

- Supports multiple image formats
- Automatic resizing to 800x800
- Cloudinary integration
- Quality optimization

---

### 5. Delete Account

**Endpoint:** `DELETE /api/public/delete-account`

**Request Body:**

```json
{
  "userEmail": "john@example.com"
}
```

**Parameters:**

- `userEmail` (required): User's email address

**Response:**

```json
{
  "status": "success",
  "message": "Account deleted successfully. You have been logged out.",
  "logoutRequired": true
}
```

**Features:**

- **Automatic logout**: User is logged out after account deletion
- Deletes all user orders
- Completely removes user account
- Returns logout notification

---

### 6. Logout

**Endpoint:** `POST /api/public/logout`

**Request Body:**

```json
{
  "userEmail": "john@example.com"
}
```

**Parameters:**

- `userEmail` (required): User's email address

**Response:**

```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

**Features:**

- Clears `lastActivity` timestamp
- Forces user to re-login
- Works with automatic logout system

---

## Logout Functionality

### Automatic Logout Scenarios

1. **Password Change**: Always logs out user for security
2. **Account Deletion**: Always logs out user
3. **Profile Update**: Optional logout via `logoutAfterUpdate` parameter
4. **Inactivity**: Automatic logout after configured timeout (30 minutes default)

### How It Works

1. **Activity Tracking**: Every profile update updates `lastActivity` timestamp
2. **Logout Trigger**: Setting `lastActivity` to `null` forces re-login
3. **Frontend Handling**: Check for `logoutRequired: true` in responses
4. **Session Cleanup**: Clears user session data

### Frontend Integration

```javascript
// Example: Update profile with optional logout
const updateProfile = async (profileData, logoutAfter = false) => {
  try {
    const response = await api.patch("/api/public/profile", {
      ...profileData,
      logoutAfterUpdate: logoutAfter,
    });

    if (response.data.logoutRequired) {
      // Handle logout
      localStorage.removeItem("token");
      router.push("/login");
      showNotification("Profile updated. Please login again.");
    } else {
      // Profile updated successfully
      showNotification("Profile updated successfully!");
    }
  } catch (error) {
    handleError(error);
  }
};

// Example: Change password (always logs out)
const changePassword = async (passwordData) => {
  try {
    const response = await api.post(
      "/api/public/change-password",
      passwordData
    );

    if (response.data.logoutRequired) {
      // Always logout after password change
      localStorage.removeItem("token");
      router.push("/login");
      showNotification(
        "Password changed. Please login with your new password."
      );
    }
  } catch (error) {
    handleError(error);
  }
};

// Example: Manual logout
const logout = async () => {
  try {
    await api.post("/api/public/logout", { userEmail: currentUser.email });
    localStorage.removeItem("token");
    router.push("/login");
    showNotification("Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    // Still clear local data even if API fails
    localStorage.removeItem("token");
    router.push("/login");
  }
};
```

## Security Features

### 1. Input Validation

- Email format validation
- Name length limits (2-50 characters)
- Phone number format validation
- Address length limits (max 500 characters)
- Password strength requirements (6-128 characters)

### 2. Authentication

- All endpoints require valid user email
- Password change requires current password verification
- Automatic logout after security-sensitive operations

### 3. Data Protection

- Passwords are hashed with bcrypt
- Sensitive fields are excluded from responses
- Input sanitization and validation

### 4. Session Management

- Activity tracking for automatic logout
- Configurable inactivity timeout
- Secure logout mechanisms

## Error Handling

### Common Error Codes

- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `404`: Not Found (user not found)
- `413`: Payload Too Large (file size exceeded)
- `500`: Internal Server Error

### Error Response Format

```json
{
  "status": "error",
  "message": "Human readable error message",
  "error": "Technical error details (development only)"
}
```

## Testing

### Test Cases

1. **Profile Update**

   - Update with valid data
   - Update with invalid data
   - Update with logout flag

2. **Password Change**

   - Change with correct current password
   - Change with incorrect current password
   - Verify automatic logout

3. **Profile Picture Upload**

   - Upload valid image
   - Upload oversized image
   - Upload invalid file type

4. **Account Deletion**
   - Delete existing account
   - Delete non-existent account
   - Verify logout after deletion

### Test Commands

```bash
# Test profile update
curl -X PATCH http://localhost:4000/api/public/profile \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"test@example.com","name":"New Name"}'

# Test password change
curl -X POST http://localhost:4000/api/public/change-password \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"test@example.com","currentPassword":"old","newPassword":"new"}'

# Test logout
curl -X POST http://localhost:4000/api/public/logout \
  -H "Content-Type: application/json" \
  -d '{"userEmail":"test@example.com"}'
```

## Best Practices

### 1. Frontend Implementation

- Always check for `logoutRequired` flag
- Implement proper error handling
- Use loading states for async operations
- Validate input before sending to API

### 2. Security

- Never store passwords in plain text
- Implement rate limiting for sensitive operations
- Log security events
- Regular security audits

### 3. User Experience

- Clear feedback for all operations
- Confirm destructive actions (delete account)
- Smooth logout transitions
- Helpful error messages

## Troubleshooting

### Common Issues

1. **Profile not updating**

   - Check email format
   - Verify user exists
   - Check validation errors

2. **Password change failing**

   - Verify current password
   - Check password requirements
   - Ensure passwords are different

3. **Logout not working**

   - Check user email
   - Verify API endpoint
   - Check network connectivity

4. **Image upload issues**
   - Check file size (max 25MB)
   - Verify file format
   - Check Cloudinary configuration

### Debug Steps

1. Check server logs for errors
2. Verify request payload format
3. Test with Postman/curl
4. Check database for user data
5. Verify environment variables
