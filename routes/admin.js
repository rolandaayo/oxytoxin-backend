const express = require("express");
const router = express.Router();
const Product = require("../model/product");
const upload = require("../lib/imageUploader");
const convertImageUrl = require("../lib/imageUrlConvert");
const User = require("../model/user");
const Gallery = require("../model/gallery");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const Order = require("../model/order");
const { checkUserActivity } = require("../lib/activityMiddleware");
const {
  generateToken,
  generateCode,
  sendVerificationEmail,
  sendVerificationCode,
  sendPaymentConfirmationToUser,
  sendPaymentNotificationToOwner,
} = require("../lib/emailService");

// Admin auth middleware with activity checking
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ status: "error", message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) {
      return res
        .status(403)
        .json({ status: "error", message: "Admin access required" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: "error", message: "Invalid token" });
  }
}

// Get all products (admin view)
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({
      status: "success",
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching products",
      error: error.message,
    });
  }
});

// Upload product images to Cloudinary
router.post("/upload", upload.array("images", 4), async (req, res) => {
  console.log("Upload request received:", {
    files: req.files ? `${req.files.length} files received` : "No files",
    body: req.body,
  });

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      status: "error",
      message: "No files uploaded",
    });
  }

  if (req.files.length > 4) {
    return res.status(400).json({
      status: "error",
      message: "Maximum 4 images allowed",
    });
  }

  try {
    // Log the first file to check its structure
    console.log("First file structure:", {
      fieldname: req.files[0].fieldname,
      mimetype: req.files[0].mimetype,
      size: req.files[0].size,
      buffer: req.files[0].buffer ? "Buffer exists" : "No buffer",
    });

    const uploadedImages = await convertImageUrl(req.files);
    console.log("Upload successful:", uploadedImages);

    res.status(200).json({
      status: "success",
      data: uploadedImages,
    });
  } catch (error) {
    console.error("Detailed upload error:", {
      message: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      status: "error",
      message: "Error uploading images",
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// Create new product with Cloudinary image URLs
router.post("/products", async (req, res) => {
  const {
    name,
    price,
    description,
    category,
    stock,
    colors,
    mainImage,
    images,
    features,
  } = req.body;

  // Validate required fields
  const requiredFields = [
    "name",
    "price",
    "description",
    "category",
    "stock",
    "mainImage",
  ];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: "error",
      message: `Missing required fields: ${missingFields.join(", ")}`,
    });
  }

  try {
    const product = await Product.create({
      name,
      price: Number(price),
      description,
      category,
      stock: Number(stock),
      colors: colors || [],
      mainImage,
      images: Array.isArray(images) ? images : images ? [images] : [],
      features: features || [],
      instock: Number(stock) > 0,
    });

    res.status(201).json({
      status: "success",
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Product creation error:", error);

    // Handle duplicate key errors
    if (error.code === 11000) {
      const handledError = Product.handleDuplicateError(error);
      return res.status(409).json({
        status: "error",
        message: handledError.message || "Duplicate product error",
      });
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        status: "error",
        message: messages.join(", "),
      });
    }

    // Handle other errors
    res.status(500).json({
      status: "error",
      message: "Error creating product",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred",
    });
  }
});

// Update product
router.patch("/products/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Remove any undefined or null values
  Object.keys(updates).forEach(
    (key) =>
      (updates[key] === undefined || updates[key] === null) &&
      delete updates[key]
  );

  // Ensure images is always an array if present
  if (updates.images && !Array.isArray(updates.images)) {
    updates.images = [updates.images];
  }

  try {
    // If stock is being updated, update instock status
    if (updates.stock !== undefined) {
      updates.instock = Number(updates.stock) > 0;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error updating product",
      error: error.message,
    });
  }
});

// Delete product
router.delete("/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error deleting product",
      error: error.message,
    });
  }
});

// Get all users (admin view)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "-password").sort({ createdAt: -1 });
    res.status(200).json({
      status: "success",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching users",
      error: error.message,
    });
  }
});

// Add new user (admin)
router.post("/users", async (req, res) => {
  try {
    const { name, email, address, password, avatar } = req.body;
    if (!name || !email || !address || !password) {
      return res.status(400).json({
        status: "error",
        message: "Name, email, address, and password are required",
      });
    }
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ status: "error", message: "Email already in use" });
    }

    // Generate verification code
    const verificationCode = generateCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Hash the provided password
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      address,
      password: hashed,
      avatar: avatar || "https://randomuser.me/api/portraits/lego/1.jpg",
      emailVerificationCode: verificationCode,
      emailVerificationCodeExpires: verificationExpires,
    });

    // Send verification code email
    const emailSent = await sendVerificationCode(email, verificationCode, name);

    res.status(201).json({
      status: "success",
      message: emailSent
        ? "User created successfully! Verification code sent."
        : "User created successfully! Verification code sent. (Email delivery may be delayed)",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error creating user",
      error: error.message,
    });
  }
});

// Update user (admin)
router.patch("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    // Only allow updating name, email, address, avatar
    const allowed = {};
    if (updates.name) allowed.name = updates.name;
    if (updates.email) allowed.email = updates.email;
    if (updates.address) allowed.address = updates.address;
    if (updates.avatar) allowed.avatar = updates.avatar;
    const user = await User.findByIdAndUpdate(
      id,
      { $set: allowed },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    res.status(200).json({ status: "success", data: user });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error updating user",
      error: error.message,
    });
  }
});

// Delete user (admin)
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    res.status(200).json({ status: "success", message: "User deleted" });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error deleting user",
      error: error.message,
    });
  }
});

// Get all orders (admin view)
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({
      status: "success",
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching orders",
      error: error.message,
    });
  }
});

// Update order status (e.g., mark as successful)
router.patch("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentRef } = req.body;
    const order = await Order.findByIdAndUpdate(
      id,
      { status, ...(paymentRef && { paymentRef }) },
      { new: true }
    ).populate("userId", "name email");

    if (!order) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }

    // Send emails when order status is updated to "successful"
    if (status === "successful") {
      try {
        // Get user details
        const user = await User.findOne({ email: order.userEmail });
        const userName = user ? user.name : "Customer";

        // Send confirmation email to user
        await sendPaymentConfirmationToUser(
          order.userEmail,
          userName,
          order,
          paymentRef
        );

        // Send notification email to owner
        await sendPaymentNotificationToOwner(order, paymentRef);

        console.log(`Payment confirmation emails sent for order ${order._id}`);
      } catch (emailError) {
        console.error("Error sending payment emails:", emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({ status: "success", data: order });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error updating order",
      error: error.message,
    });
  }
});

// Delete order
router.delete("/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res
        .status(404)
        .json({ status: "error", message: "Order not found" });
    }
    res.status(200).json({ status: "success", message: "Order deleted" });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error deleting order",
      error: error.message,
    });
  }
});

// Get all gallery images (admin)
router.get("/gallery", async (req, res) => {
  try {
    const images = await Gallery.find().sort({ createdAt: -1 });

    res.status(200).json({
      status: "success",
      data: images,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching gallery images",
      error: error.message,
    });
  }
});

// Upload gallery image
router.post("/gallery", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No image file uploaded",
      });
    }

    // Upload to Cloudinary
    const uploadedImage = await convertImageUrl([req.file]);
    const imageUrl = uploadedImage[0];

    // Create gallery entry
    const galleryImage = new Gallery({
      title: req.body.title || "",
      description: req.body.description || "",
      imageUrl: imageUrl,
      uploadedBy: "admin",
    });

    await galleryImage.save();

    res.status(201).json({
      status: "success",
      data: galleryImage,
      message: "Gallery image uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading gallery image:", error);
    res.status(500).json({
      status: "error",
      message: "Error uploading gallery image",
      error: error.message,
    });
  }
});

// Delete gallery image
router.delete("/gallery/:id", async (req, res) => {
  try {
    const image = await Gallery.findByIdAndDelete(req.params.id);

    if (!image) {
      return res.status(404).json({
        status: "error",
        message: "Gallery image not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Gallery image deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error deleting gallery image",
      error: error.message,
    });
  }
});

// Test email endpoint (for debugging)
router.post("/test-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    console.log("Testing email with config:", {
      EMAIL_USER: process.env.EMAIL_USER ? "exists" : "missing",
      EMAIL_PASS: process.env.EMAIL_PASS ? "exists" : "missing",
    });

    const testCode = "123456";
    const emailSent = await sendVerificationCode(email, testCode, "Test User");

    res.json({
      status: "success",
      message: emailSent
        ? "Test email sent successfully!"
        : "Email sending failed",
      emailSent,
    });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({
      status: "error",
      message: "Error sending test email",
      error: error.message,
    });
  }
});

// Export the router to be used in the main server file
module.exports = router;
// This code defines a simple Express router for admin-related routes.
// It includes routes for getting the admin dashboard, creating, updating, and deleting admin users then also for uploading products.
// The router is then exported to be used in the main server file, allowing for modular route management.
