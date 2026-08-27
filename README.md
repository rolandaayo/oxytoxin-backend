# Oxytoxin API

Backend API for the Oxytoxin fashion and lifestyle store. The service is built with Express 5, MongoDB/Mongoose, JWT authentication, Cloudinary image uploads, and Gmail SMTP email notifications.

## Features

- Product catalog browsing, filtering, search, and categories
- User registration with email verification, login, password reset, and session activity tracking
- Shopping cart and order creation/payment status updates
- Wishlist management
- Delivery information management
- Admin management for products, users, orders, and gallery images
- Customer support conversations and admin replies
- Cloudinary image processing and email notifications

## Requirements

- Node.js 18 or newer
- MongoDB database
- Cloudinary account for product/gallery uploads
- Gmail account with an app password for email features

## Installation

```bash
npm install
cp .env.example .env
```

This repository does not currently include an `.env.example` file. Create `.env` manually using the variables below, then start the server:

```bash
npm run dev
# or
npm start
```

The local server listens on `http://localhost:4000` by default. Set `PORT` to use another port.

## Environment Variables

Required for normal operation:

| Variable | Description |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_SECRET_API_KEY` | Cloudinary API secret |
| `EMAIL_USER` | Gmail address used to send email |
| `EMAIL_PASS` | Gmail app password |
| `FRONTEND_URL` | Frontend origin used in verification and password-reset links |

Optional configuration:

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `4000` | Local HTTP port |
| `NODE_ENV` | unset | Use `production` to disable the local listener |
| `ADMIN_SECRET` | unset | Secret required to request an admin account during registration |
| `ACTIVITY_TIMEOUT` | `1200000` ms | Inactivity timeout, defaulting to 20 minutes |
| `JWT_EXPIRATION` | `7d` | Activity configuration value for JWT lifetime |
| `CLEANUP_INTERVAL` | `300000` ms | Session cleanup configuration value |
| `LOG_ACTIVITY` | `false` | Enable activity update logging with `true` |

Never commit `.env` or expose `JWT_SECRET`, database credentials, Cloudinary secrets, or email credentials.

## API

All endpoints are prefixed with `http://localhost:4000` in local development. JSON endpoints use `Content-Type: application/json`. Protected endpoints expect:

```http
Authorization: Bearer <jwt>
```

### Health and authentication

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | API welcome response and route groups |
| `POST` | `/api/auth/register` | Register a user and send a verification code |
| `POST` | `/api/auth/login` | Log in and receive a 7-day JWT |
| `POST` | `/api/auth/verify-email-code` | Verify a registration code and log in |
| `GET` | `/api/auth/verify-email/:token` | Verify an email token |
| `POST` | `/api/auth/resend-verification-code` | Resend a verification code |
| `POST` | `/api/auth/resend-verification` | Resend a verification email |
| `POST` | `/api/auth/forgot-password` | Request a password reset code |
| `POST` | `/api/auth/reset-password-code` | Reset a password with a code |
| `POST` | `/api/auth/reset-password` | Reset a password with a token |
| `GET` | `/api/auth/me` | Get the current authenticated user |
| `POST` | `/api/auth/logout` | Log out an authenticated user |
| `GET` | `/api/auth/activity-config` | Read session activity configuration |
| `POST` | `/api/auth/cleanup-sessions` | Clean up expired sessions |

### Storefront

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/public/products` | List products; supports `category`, `minPrice`, `maxPrice`, `inStock`, and `search` query parameters |
| `GET` | `/api/public/products/:id` | Get one product |
| `GET` | `/api/public/products/category/:category` | List products in a category |
| `GET` | `/api/public/categories` | List unique categories |
| `GET` | `/api/public/gallery` | List gallery images |
| `GET` | `/api/public/cart?userEmail=` | Get a user's cart |
| `POST` | `/api/public/cart` | Add an item to a cart |
| `PUT` | `/api/public/cart/:cartItemId` | Update cart item quantity/details |
| `DELETE` | `/api/public/cart/:cartItemId` | Remove a cart item |
| `DELETE` | `/api/public/cart?userEmail=` | Clear a cart |
| `POST` | `/api/public/orders` | Create a pending order |
| `POST` | `/api/public/verify-payment` | Update an order after payment verification |
| `GET` | `/api/public/user-orders?userEmail=` | List a user's orders |
| `GET` | `/api/public/orders/:id` | Get one order |
| `GET` | `/api/public/profile` | Get a profile |
| `PATCH` | `/api/public/profile` | Update profile data |
| `POST` | `/api/public/change-password` | Change a password |
| `POST` | `/api/public/logout` | Storefront logout handler |
| `DELETE` | `/api/public/delete-account` | Delete an account |

### Wishlist and delivery

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/wishlist` | Get the authenticated user's wishlist |
| `POST` | `/api/wishlist/add` | Add a product; body requires `productId` |
| `DELETE` | `/api/wishlist/remove/:productId` | Remove a product |
| `DELETE` | `/api/wishlist/clear` | Clear the wishlist |
| `GET` | `/api/wishlist/check/:productId` | Check wishlist membership |
| `POST` | `/api/delivery/save` | Create or update the authenticated user's delivery information |
| `GET` | `/api/delivery/get` | Get the authenticated user's delivery information |
| `GET` | `/api/delivery/admin/all` | List all delivery records for admins |
| `GET` | `/api/delivery/admin/user/:userId` | Get one user's delivery record for admins |
| `PUT` | `/api/delivery/admin/user/:userId` | Update one user's delivery record for admins |

### Admin

Admin endpoints are intended for a JWT whose `isAdmin` claim is `true`. The current `routes/admin.js` module defines an `adminAuth` middleware but does not attach it to the routes, so these endpoints should be protected before public deployment.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/products` | List products for administration |
| `POST` | `/api/admin/upload` | Upload up to 4 images as multipart field `images` |
| `POST` | `/api/admin/products` | Create a product |
| `PATCH` | `/api/admin/products/:id` | Update a product |
| `DELETE` | `/api/admin/products/:id` | Delete a product |
| `GET` | `/api/admin/users` | List users without passwords |
| `POST` | `/api/admin/users` | Create a user |
| `PATCH` | `/api/admin/users/:id` | Update name, email, address, or avatar |
| `DELETE` | `/api/admin/users/:id` | Delete a user |
| `GET` | `/api/admin/orders` | List orders |
| `PATCH` | `/api/admin/orders/:id` | Update an order |
| `DELETE` | `/api/admin/orders/:id` | Delete an order |
| `GET` | `/api/admin/gallery` | List gallery images |
| `POST` | `/api/admin/gallery` | Upload a gallery image as multipart field `image` |
| `DELETE` | `/api/admin/gallery/:id` | Delete a gallery image |

### Support messaging

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/messages/conversation?userEmail=` | Get or create a conversation |
| `POST` | `/api/messages/send` | Send a user message; body requires `userEmail` and `message` |
| `POST` | `/api/messages/admin/reply` | Send an admin reply |
| `GET` | `/api/messages/admin/conversations` | List conversations; optional `status` filter |
| `PATCH` | `/api/messages/mark-read` | Mark messages from a sender as read |
| `PATCH` | `/api/messages/admin/close` | Close a conversation |
| `GET` | `/api/messages/unread-count?userEmail=` | Get a user's unread message count |

## Data Models

The MongoDB collections are represented by these Mongoose models:

- `User`: account details, authentication state, cart, verification/reset fields, and activity history
- `Product`: name, price, description, category, stock, colors, images, and features
- `Order`: user, line items, totals, status, payment reference, and delivery snapshot
- `Wishlist`: a user's saved products
- `Delivery`: saved delivery information for a user
- `Gallery`: Cloudinary-backed gallery images
- `Message`: support conversations and message read state

Order statuses are `pending`, `successful`, `processing`, `shipped`, `delivered`, and `cancelled`.

## Deployment

The included `vercel.json` deploys `index.js` with `@vercel/node`. In production, configure all required environment variables in Vercel and set `NODE_ENV=production`. The exported Express app is used as the serverless handler; the local `app.listen` block is skipped in production.

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the API with Node |
| `npm run dev` | Start with Nodemon and watch server files |
| `npm run vercel-build` | Vercel build hook |

## Notes for Maintainers

- MongoDB is connected lazily through middleware before every request and the connection is cached for reuse.
- Registration stores pending users in process memory until email verification; pending registrations are lost when the process restarts or scales across instances.
- Some legacy storefront, messaging, and debug endpoints accept `userEmail` rather than enforcing JWT ownership. Review these endpoints before exposing the API publicly.
- Debug cart endpoints and email test endpoints are present in the source and should be restricted or removed before production use.