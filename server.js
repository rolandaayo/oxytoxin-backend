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
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

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

// Connect to database and start server
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });
