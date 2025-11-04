const express = require("express");
const router = express.Router();
const Wishlist = require("../model/wishlist");
const Product = require("../model/product");
const { checkUserActivity } = require("../lib/activityMiddleware");

// Get user's wishlist
router.get("/", checkUserActivity, async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    const wishlist = await Wishlist.findOne({ userId: req.user.id }).populate(
      "items.productId"
    );

    if (!wishlist) {
      return res.status(200).json({
        status: "success",
        data: { items: [] },
        message: "Wishlist is empty",
      });
    }

    res.status(200).json({
      status: "success",
      data: { items: wishlist.items },
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch wishlist",
    });
  }
});

// Add item to wishlist
router.post("/add", checkUserActivity, async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        status: "error",
        message: "Product ID is required",
      });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: "error",
        message: "Product not found",
      });
    }

    // Find or create wishlist
    let wishlist = await Wishlist.findOne({ userId: req.user.id });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.user.id,
        userEmail: req.user.email,
        items: [],
      });
    }

    // Check if item already exists
    const existingItem = wishlist.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      return res.status(400).json({
        status: "error",
        message: "Item already in wishlist",
      });
    }

    // Add item to wishlist
    wishlist.items.push({
      productId: product._id,
      name: product.name,
      price: product.price,
      mainImage: product.mainImage,
      description: product.description,
      category: product.category,
      instock: product.instock,
    });

    await wishlist.save();

    res.status(200).json({
      status: "success",
      message: "Item added to wishlist",
      data: { item: wishlist.items[wishlist.items.length - 1] },
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to add item to wishlist",
    });
  }
});

// Remove item from wishlist
router.delete("/remove/:productId", checkUserActivity, async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user.id });

    if (!wishlist) {
      return res.status(404).json({
        status: "error",
        message: "Wishlist not found",
      });
    }

    // Remove item from wishlist
    wishlist.items = wishlist.items.filter(
      (item) => item.productId.toString() !== productId
    );

    await wishlist.save();

    res.status(200).json({
      status: "success",
      message: "Item removed from wishlist",
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to remove item from wishlist",
    });
  }
});

// Clear entire wishlist
router.delete("/clear", checkUserActivity, async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    const wishlist = await Wishlist.findOne({ userId: req.user.id });

    if (!wishlist) {
      return res.status(404).json({
        status: "error",
        message: "Wishlist not found",
      });
    }

    wishlist.items = [];
    await wishlist.save();

    res.status(200).json({
      status: "success",
      message: "Wishlist cleared",
    });
  } catch (error) {
    console.error("Error clearing wishlist:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to clear wishlist",
    });
  }
});

// Check if item is in wishlist
router.get("/check/:productId", checkUserActivity, async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: "error",
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user.id });

    if (!wishlist) {
      return res.status(200).json({
        status: "success",
        data: { isInWishlist: false },
      });
    }

    const isInWishlist = wishlist.items.some(
      (item) => item.productId.toString() === productId
    );

    res.status(200).json({
      status: "success",
      data: { isInWishlist },
    });
  } catch (error) {
    console.error("Error checking wishlist:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to check wishlist",
    });
  }
});

module.exports = router;
