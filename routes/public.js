const express = require("express");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const User = require("../model/user"); // Added User model import

// Get all products with optional filtering
router.get("/products", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, inStock, search } = req.query;
    let query = {};

    // Apply filters if they exist
    if (category) query.category = category;
    if (inStock === "true") query.instock = true;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query);
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

// Get a single product by ID
router.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }
    res.status(200).json({
      status: "success",
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching product",
      error: error.message,
    });
  }
});

// Get products by category
router.get("/products/category/:category", async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.category });
    res.status(200).json({
      status: "success",
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching products by category",
      error: error.message,
    });
  }
});

// Get all unique product categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category");
    res.status(200).json({ status: "success", data: categories });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching categories",
      error: error.message,
    });
  }
});

// Create a new order (pending) when user proceeds to payment
router.post("/orders", async (req, res) => {
  try {
    const { userEmail, items, totalAmount } = req.body;
    if (!userEmail || !items || !totalAmount) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing order details" });
    }
    const order = await Order.create({
      userEmail,
      items,
      totalAmount,
      status: "pending",
    });
    res.status(201).json({ status: "success", data: order });
  } catch (error) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Get user's cart
router.get("/cart", async (req, res) => {
  try {
    const { userEmail } = req.query;
    if (!userEmail) {
      return res.status(400).json({
        status: "error",
        message: "User email is required",
      });
    }

    // Find user's cart or create one
    let user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: user.cart || [],
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching cart",
      error: error.message,
    });
  }
});

// Update user's cart
router.post("/cart", async (req, res) => {
  try {
    const { userEmail, cartItems } = req.body;
    if (!userEmail || !cartItems) {
      return res.status(400).json({
        status: "error",
        message: "User email and cart items are required",
      });
    }

    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { $set: { cart: cartItems } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Cart updated successfully",
      data: user.cart,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error updating cart",
      error: error.message,
    });
  }
});

// Clear user's cart
router.delete("/cart", async (req, res) => {
  try {
    const { userEmail } = req.query;
    if (!userEmail) {
      return res.status(400).json({
        status: "error",
        message: "User email is required",
      });
    }

    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { $unset: { cart: 1 } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Cart cleared successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error clearing cart",
      error: error.message,
    });
  }
});

module.exports = router;
