# Email Verification & Password Reset Setup

## Overview

This guide explains how to set up email verification and password reset functionality for the Oxytoxin e-commerce platform.

## Features Implemented

### 1. Email Verification

- ✅ Automatic verification email sent on registration
- ✅ 24-hour expiration for verification tokens
- ✅ Resend verification email functionality
- ✅ Verification status tracking in user model

### 2. Password Reset

- ✅ Forgot password functionality
- ✅ 1-hour expiration for reset tokens
- ✅ Secure password reset flow
- ✅ Email-based reset links

## Environment Variables Required

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_USER=oxytoxinapparel@gmail.com
EMAIL_PASSWORD=your_gmail_app_password

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:3000
```

## Gmail Setup Instructions

### 1. Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### 2. Generate App Password

1. Go to Google Account settings
2. Navigate to Security
3. Under "2-Step Verification", click "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Name it "Oxytoxin App"
6. Copy the generated 16-character password
7. Use this password in your `EMAIL_PASSWORD` environment variable

### 3. Update Environment Variables

```env
EMAIL_USER=oxytoxinapparel@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop  # Your 16-character app password
FRONTEND_URL=https://your-domain.com  # Your frontend URL
```

## API Endpoints

### Email Verification

- `GET /api/auth/verify-email/:token` - Verify email with token
- `POST /api/auth/resend-verification` - Resend verification email

### Password Reset

- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

## Frontend Pages

### Email Verification

- `/verify-email?token=xxx` - Verify email page
- Handles success/error states
- Redirects to login after verification

### Password Reset

- `/forgot-password` - Request password reset
- `/reset-password?token=xxx` - Reset password page
- Secure password input with confirmation

## User Flow

### Registration Flow

1. User fills registration form
2. Account created with `isEmailVerified: false`
3. Verification email sent automatically
4. User clicks link in email
5. Email verified, `isEmailVerified: true`
6. User can now login

### Login Flow

1. User enters credentials
2. System checks `isEmailVerified`
3. If not verified, shows error message
4. If verified, login proceeds normally

### Password Reset Flow

1. User clicks "Forgot Password"
2. Enters email address
3. Reset email sent with 1-hour token
4. User clicks link in email
5. Sets new password
6. Can login with new password

## Security Features

- ✅ Tokens expire after specified time
- ✅ Secure token generation using crypto
- ✅ Password hashing with bcrypt
- ✅ Email validation
- ✅ Rate limiting (can be added)
- ✅ No user enumeration (forgot password)

## Testing

### Test Email Verification

1. Register a new account
2. Check email for verification link
3. Click link to verify
4. Try logging in

### Test Password Reset

1. Go to forgot password page
2. Enter email address
3. Check email for reset link
4. Set new password
5. Login with new password

## Troubleshooting

### Email Not Sending

- Check Gmail app password is correct
- Verify 2FA is enabled
- Check environment variables
- Check server logs for errors

### Verification Links Not Working

- Check `FRONTEND_URL` environment variable
- Verify token expiration (24 hours)
- Check server logs for token validation errors

### Password Reset Issues

- Check token expiration (1 hour)
- Verify email address exists
- Check server logs for errors

## Production Deployment

### Environment Variables for Production

```env
EMAIL_USER=oxytoxinapparel@gmail.com
EMAIL_PASSWORD=your_production_app_password
FRONTEND_URL=https://oxytoxin.com
NODE_ENV=production
```

### Security Considerations

- Use strong JWT secrets
- Enable HTTPS
- Set up proper CORS
- Monitor email delivery rates
- Consider email service providers (SendGrid, AWS SES) for production

## Files Modified

### Backend

- `server/model/user.js` - Added verification fields
- `server/lib/emailService.js` - Email service utility
- `server/routes/auth.js` - Auth routes with verification
- `server/routes/admin.js` - Admin user creation with verification

### Frontend

- `client/src/app/verify-email/page.js` - Email verification page
- `client/src/app/reset-password/page.js` - Password reset page
- `client/src/app/forgot-password/page.js` - Forgot password page
- `client/src/app/login/page.js` - Updated with forgot password link
- `client/src/app/signup/page.js` - Updated for verification flow
