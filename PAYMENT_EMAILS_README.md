# Payment Verification Email System

## Overview

This system automatically sends thank you emails to both customers and the store owner when a payment is successfully verified.

## Email Templates

### 1. Customer Thank You Email

- **Recipient**: Customer who made the purchase
- **Subject**: "Thank You for Your Purchase - Oxytoxin"
- **Content**:
  - Success confirmation with checkmark icon
  - Complete order summary with product images
  - Order ID and payment reference
  - Total amount paid
  - Delivery information (if provided)
  - Link to view order status
  - Matches the existing Oxytoxin email theme

### 2. Owner Notification Email

- **Recipient**: Store owner (EMAIL_USER from .env)
- **Subject**: "New Order Received - $XX.XX"
- **Content**:
  - New order notification
  - Customer information
  - Complete order details with product images
  - Order ID and payment reference
  - Shipping address
  - Link to admin dashboard
  - Matches the existing Oxytoxin email theme

## Implementation

### Functions Added to `server/lib/emailService.js`

1. **`sendPaymentConfirmationToUser(email, name, orderDetails, paymentRef)`**

   - Sends thank you email to customer
   - Parameters:
     - `email`: Customer's email address
     - `name`: Customer's name
     - `orderDetails`: Complete order object from database
     - `paymentRef`: Payment reference number (optional)

2. **`sendPaymentNotificationToOwner(orderDetails, paymentRef)`**
   - Sends notification email to store owner
   - Parameters:
     - `orderDetails`: Complete order object from database
     - `paymentRef`: Payment reference number (optional)

### Endpoints That Trigger Emails

#### 1. Admin Route: `PATCH /admin/orders/:id`

**File**: `server/routes/admin.js`

When an admin updates an order status to "successful", emails are automatically sent.

**Example Request**:

```javascript
PATCH /admin/orders/673123abc456def789
Headers: {
  Authorization: "Bearer <admin-token>"
}
Body: {
  "status": "successful",
  "paymentRef": "PAY-123456789"
}
```

#### 2. Public Route: `POST /public/verify-payment`

**File**: `server/routes/public.js`

This endpoint can be called after payment gateway verification (e.g., Stripe, PayPal callback).

**Example Request**:

```javascript
POST /public/verify-payment
Body: {
  "orderId": "673123abc456def789",
  "status": "successful",
  "paymentRef": "PAY-123456789"
}
```

## Email Theme Consistency

Both email templates follow the same design pattern as existing Oxytoxin emails:

- Black gradient header with OXYTOXIN branding
- Clean, modern layout with rounded corners
- Consistent color scheme (black, white, grays)
- Professional typography
- Responsive design
- Footer with copyright information

## Error Handling

- Email sending errors are logged but don't fail the payment verification
- If emails fail to send, the order status is still updated successfully
- Errors are logged to console for debugging

## Testing

To test the email system:

1. **Create a test order**:

```javascript
POST /public/orders
Body: {
  "userEmail": "test@example.com",
  "items": [...],
  "totalAmount": 99.99,
  "deliveryInfo": {...}
}
```

2. **Verify payment** (triggers emails):

```javascript
POST /public/verify-payment
Body: {
  "orderId": "<order-id-from-step-1>",
  "status": "successful",
  "paymentRef": "TEST-PAY-123"
}
```

3. **Check email inbox** for both customer and owner emails

## Environment Variables Required

Make sure these are set in `server/.env`:

- `EMAIL_USER`: Gmail address for sending emails
- `EMAIL_PASS`: Gmail app password
- `FRONTEND_URL`: Your frontend URL (for links in emails)

## Notes

- Emails are sent asynchronously and won't block the API response
- The owner receives notifications at the same email address used for sending (EMAIL_USER)
- Payment reference is optional but recommended for tracking
- All email templates are mobile-responsive
