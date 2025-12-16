# Oxytoxin Backend — API Reference

Base URL: `/api` (mounted in `index.js`)

**Notes**: This document lists the server endpoints grouped by route module. For each endpoint: **Method**, **Path**, **Description**, **Auth/Middleware**, and **Key request fields** are provided. Responses shown are the common success codes observed in the code.

**Authentication (`/api/auth`)**
- **POST /api/auth/register**: Register (stores user temporarily, sends verification code). Auth: No. Body: `name`, `email`, `password`, `confirmPassword`, `address`, optional `isAdmin` + `adminSecret`.
- **POST /api/auth/login**: Login and receive JWT. Auth: No. Body: `email`, `password`. Returns: `token`, `user`.
- **POST /api/auth/verify-email-code**: Verify registration code and create account. Auth: No. Body: `email`, `code`. Returns: `token`, `user` (201/200).
- **GET /api/auth/verify-email/:token**: Legacy verify by token. Auth: No.
- **POST /api/auth/resend-verification-code**: Resend short verification code. Auth: No. Body: `email`.
- **POST /api/auth/resend-verification**: Legacy - resend verification email (token). Auth: No. Body: `email`.
- **POST /api/auth/forgot-password**: Request password reset code. Auth: No. Body: `email`.
- **POST /api/auth/reset-password-code**: Reset password using code. Auth: No. Body: `email`, `code`, `newPassword`, `confirmPassword`.
- **POST /api/auth/reset-password**: Legacy reset with token. Auth: No. Body: `token`, `newPassword`, `confirmPassword`.
- **POST /api/auth/logout**: Logout (clears lastActivity). Auth: Yes (Bearer token). Body: none for protected logout; public logout exists on `/api/public/logout`.
- **GET /api/auth/me**: Get current user. Auth: Yes (uses `checkUserActivity`).
- **GET /api/auth/activity-config**: Returns activity config (no auth required in code).
- **POST /api/auth/cleanup-sessions**: Admin-only: cleans expired sessions. Auth: Yes (token + isAdmin check). Body: none.
- **POST /api/auth/test-email**: Debug endpoint to send a verification code to an email. Auth: No. Body: `email`.

**Public (`/api/public`)**
- **GET /api/public/products**: List products with filters. Auth: No. Query: `category`, `minPrice`, `maxPrice`, `inStock=true`, `search`.
- **GET /api/public/products/:id**: Get single product by id. Auth: No.
- **GET /api/public/products/category/:category**: Products by category. Auth: No.
- **GET /api/public/categories**: List unique categories. Auth: No.
- **Debug endpoints** (internal):
  - **GET /api/public/debug/carts**: Get all users' cart data.
  - **GET /api/public/debug/cart/:userEmail**: Get a user's cart.
  - **DELETE /api/public/debug/remove-stubborn-item/:userEmail**: Remove a cart item (body: `cartItemId`).
- **POST /api/public/orders**: Create order (status `pending`). Auth: No. Body: `userEmail`, `items`, `totalAmount`, optional `deliveryInfo`.
- **POST /api/public/verify-payment**: Verify payment and update order status. Auth: No. Body: `orderId`, `status`, optional `paymentRef`.
- **Cart management**:
  - **GET /api/public/cart?userEmail=...**: Get user's cart. Auth: No. Query: `userEmail`.
  - **POST /api/public/cart**: Replace/update cart. Body: `userEmail`, `cartItems` (array).
  - **PUT /api/public/cart/:cartItemId?userEmail=...**: Update a specific cart item (body: `quantity`).
  - **DELETE /api/public/cart/:cartItemId?userEmail=...**: Remove item from cart.
  - **DELETE /api/public/cart?userEmail=...**: Clear user's cart.
- **User profile**:
  - **GET /api/public/profile?userEmail=...**: Get profile. Auth: No.
  - **PATCH /api/public/profile**: Update profile. Body: `userEmail`, optional `name`, `phone`, `address`, `logoutAfterUpdate`.
  - **POST /api/public/change-password**: Change password. Body: `userEmail`, `currentPassword`, `newPassword`.
  - **POST /api/public/logout**: Logout by email (clears lastActivity). Body: `userEmail`.
  - **POST /api/public/profile-picture**: Upload profile picture (multipart form). Body/form-data: `profilePicture` file + `userEmail`.
  - **DELETE /api/public/delete-account**: Delete account. Body: `userEmail`.
- **Orders**:
  - **GET /api/public/user-orders?userEmail=...**: User's orders.
  - **GET /api/public/orders/:id**: Get single order by ID.
- **Gallery**:
  - **GET /api/public/gallery**: Get gallery images.

**Admin (`/api/admin`)**
- **GET /api/admin/products**: Get all products (admin view). Auth: Typically admin (middleware in file checks token if used externally).
- **POST /api/admin/upload**: Upload product images. Middleware: `upload.array("images", 4)`. Form-data: `images` (up to 4). Returns uploaded URLs.
- **POST /api/admin/products**: Create product. Body: `name`, `price`, `description`, `category`, `stock`, `mainImage`, optional `images`, `colors`, `features`.
- **PATCH /api/admin/products/:id**: Update product. Body: updated fields.
- **DELETE /api/admin/products/:id**: Delete product.
- **GET /api/admin/users**: List users (admin view).
- **POST /api/admin/users**: Create user as admin. Body: `name`, `email`, `address`, `password`, optional `avatar`.
- **PATCH /api/admin/users/:id**: Update user (admin).
- **DELETE /api/admin/users/:id**: Delete user.
- **GET /api/admin/orders**: Get all orders (admin).
- **PATCH /api/admin/orders/:id**: Update order (e.g., mark `successful`). Body: `status`, optional `paymentRef`.
- **DELETE /api/admin/orders/:id**: Delete order.
- **Gallery management (admin)**:
  - **GET /api/admin/gallery**: List gallery images.
  - **POST /api/admin/gallery**: Upload single image. Middleware: `upload.single("image")`.
  - **DELETE /api/admin/gallery/:id**: Delete gallery image.
- **POST /api/admin/test-email**: Debug email send. Body: `email`.

**Delivery (`/api/delivery`)**
- **POST /api/delivery/save**: Save or update delivery info for current user. Auth: Yes (JWT via `verifyToken` middleware). Body: `fullName`, `phoneNumber`, `address`, `city`, `state`, optional `postalCode`, `landmark`.
- **GET /api/delivery/get**: Get delivery info for current user. Auth: Yes.
- **GET /api/delivery/admin/all**: Admin-only: get all delivery info. Auth: `checkUserActivity` + admin check.
- **GET /api/delivery/admin/user/:userId**: Admin-only: get delivery info for specific user.
- **PUT /api/delivery/admin/user/:userId**: Admin-only: update delivery info for user.

**Wishlist (`/api/wishlist`)**
- **GET /api/wishlist/**: Get current user's wishlist. Auth: Yes (`checkUserActivity`).
- **POST /api/wishlist/add**: Add item to wishlist. Auth: Yes. Body: `productId`.
- **DELETE /api/wishlist/remove/:productId**: Remove by product id. Auth: Yes.
- **DELETE /api/wishlist/clear**: Clear wishlist. Auth: Yes.
- **GET /api/wishlist/check/:productId**: Check if product is in wishlist. Auth: Yes.

**Messages (`/api/messages`)**
- **GET /api/messages/conversation?userEmail=...**: Get or create conversation for user. Auth: No (uses `userEmail`).
- **POST /api/messages/send**: Send message from user. Body: `userEmail`, `message`.
- **POST /api/messages/admin/reply**: Send admin reply. Body: `userEmail`, `message`.
- **GET /api/messages/admin/conversations?status=...**: Admin: list conversations, optional `status` filter.
- **PATCH /api/messages/mark-read**: Mark messages as read. Body: `userEmail`, `sender`.
- **PATCH /api/messages/admin/close**: Close conversation. Body: `userEmail`.
- **GET /api/messages/unread-count?userEmail=...**: Get unread count for user.

**Appendix & Next Steps**
- **Auth**: Most protected endpoints expect a Bearer JWT in `Authorization: Bearer <token>`; some routes use `checkUserActivity` which validates token and session activity.
- **File uploads**: Use `multipart/form-data` for endpoints that accept files (`/api/admin/upload`, `/api/admin/gallery`, `/api/public/profile-picture`).
- **Improvements**: Add example request/response bodies, authentication examples, and a Postman/Insomnia collection for easier testing.

If you want, I can:
- generate an OpenAPI/Swagger spec from this listing,
- create a Postman collection, or
- add example request/response snippets for chosen endpoints.
