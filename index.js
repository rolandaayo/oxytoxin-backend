const express = require("express");
const cors = require("cors");
const connectDB = require("./lib/connect");
const { updateUserActivity } = require("./lib/activityMiddleware");
require("dotenv").config();

// Debug log - REMOVE THIS AFTER TESTING
console.log("Cloudinary Config:", {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? "exists" : "missing",
  api_secret: process.env.CLOUDINARY_SECRET_API_KEY ? "exists" : "missing",
});

// Import routes
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");
const authRoutes = require("./routes/auth");
const deliveryRoutes = require("./routes/delivery");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Activity tracking middleware - updates user activity for all requests
app.use(updateUserActivity);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({
      status: "error",
      message: "Database connection error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Welcome route
app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Welcome to the E-commerce API",
    endpoints: {
      public: "/api/public",
      admin: "/api/admin",
    },
  });
});

// API Routes
app.use("/api/public", publicRoutes); // Public routes for the store frontend
app.use("/api/admin", adminRoutes); // Admin routes for product management
app.use("/api/auth", authRoutes); // Auth routes
app.use("/api/delivery", deliveryRoutes); // Delivery information routes

// For local development
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

// Export for serverless
module.exports = app;
