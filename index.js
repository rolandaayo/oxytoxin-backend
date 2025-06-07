const express = require("express");
const cors = require("cors");
const connectDB = require("./lib/connect");
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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
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

// Connect to database
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    console.log("Using existing database connection");
    return;
  }

  try {
    await connectDB();
    isConnected = true;
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

// Initialize database connection
connectToDatabase().catch(console.error);

// For local development
if (process.env.NODE_ENV !== "production") {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

// Export for serverless
module.exports = app;
