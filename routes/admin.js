const express = require("express");
const router = express.Router();
const Product = require("../model/product"); // Assuming you have a Product model defined
const upload = require("../lib/imageUploader"); // Assuming you have an image uploader defined
const convertImageUrl = require("../lib/imageUrlConvert"); // Assuming you have a function to convert image URLs

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

// Export the router to be used in the main server file
module.exports = router;
// This code defines a simple Express router for admin-related routes.
// It includes routes for getting the admin dashboard, creating, updating, and deleting admin users.
// The router is then exported to be used in the main server file, allowing for modular route management.
