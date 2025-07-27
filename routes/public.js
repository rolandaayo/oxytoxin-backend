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

// Debug endpoint to check all users' cart data
router.get("/debug/carts", async (req, res) => {
  try {
    const users = await User.find({}, { email: 1, cart: 1, _id: 0 });
    res.status(200).json({
      status: "success",
      message: "All users' cart data",
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching cart debug data",
      error: error.message,
    });
  }
});

// Debug endpoint to check specific user's cart
router.get("/debug/cart/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    const user = await User.findOne(
      { email: userEmail },
      { email: 1, cart: 1, _id: 0 }
    );

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: `Cart data for ${userEmail}`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Error fetching user cart debug data",
      error: error.message,
    });
  }
});

// Debug endpoint to manually remove stubborn item
router.delete("/debug/remove-stubborn-item/:userEmail", async (req, res) => {
  try {
    const { userEmail } = req.params;
    const { cartItemId } = req.body;

    console.log(
      `[DEBUG] Manually removing stubborn item: ${cartItemId} for user: ${userEmail}`
    );

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    console.log(
      `[DEBUG] Current cart has ${user.cart ? user.cart.length : 0} items`
    );

    // Remove the specific item
    const updatedCart = user.cart.filter(
      (item) => item.cartItemId !== cartItemId
    );

    console.log(`[DEBUG] After removal, cart has ${updatedCart.length} items`);

    // Update database
    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      { $set: { cart: updatedCart } },
      { new: true }
    );

    console.log(
      `[DEBUG] Database updated. Final cart has ${
        updatedUser.cart ? updatedUser.cart.length : 0
      } items`
    );

    res.status(200).json({
      status: "success",
      message: "Stubborn item removed manually",
      data: updatedUser.cart,
    });
  } catch (error) {
    console.error("Error in debug remove stubborn item:", error);
    res.status(500).json({
      status: "error",
      message: "Error removing stubborn item",
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

    console.log(
      `[GET /cart] User: ${userEmail}, Cart items: ${
        user.cart ? user.cart.length : 0
      }`
    );
    if (user.cart && user.cart.length > 0) {
      console.log(
        `[GET /cart] Cart items:`,
        user.cart.map((item) => ({
          cartItemId: item.cartItemId,
          name: item.name,
          quantity: item.quantity,
        }))
      );
    }

    res.status(200).json({
      status: "success",
      data: user.cart || [],
    });
  } catch (error) {
    console.error("Error in GET /cart:", error);
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

    console.log(
      `[POST /cart] User: ${userEmail}, Updating cart with ${cartItems.length} items`
    );
    console.log(
      `[POST /cart] Cart items:`,
      cartItems.map((item) => ({
        cartItemId: item.cartItemId,
        name: item.name,
        quantity: item.quantity,
      }))
    );

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

    console.log(
      `[POST /cart] Cart updated successfully. New cart has ${
        user.cart ? user.cart.length : 0
      } items`
    );

    res.status(200).json({
      status: "success",
      message: "Cart updated successfully",
      data: user.cart,
    });
  } catch (error) {
    console.error("Error in POST /cart:", error);
    res.status(500).json({
      status: "error",
      message: "Error updating cart",
      error: error.message,
    });
  }
});

// Update specific item in user's cart
router.put("/cart/:cartItemId", async (req, res) => {
  try {
    const { userEmail } = req.query;
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!userEmail) {
      return res.status(400).json({
        status: "error",
        message: "User email is required",
      });
    }

    if (!cartItemId) {
      return res.status(400).json({
        status: "error",
        message: "Cart item ID is required",
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Valid quantity is required",
      });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Update the specific item in cart array
    const updatedCart = user.cart.map((item) =>
      item.cartItemId === cartItemId ? { ...item, quantity: quantity } : item
    );

    // Update user's cart in database
    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      { $set: { cart: updatedCart } },
      { new: true }
    );

    res.status(200).json({
      status: "success",
      message: "Item updated successfully",
      data: updatedUser.cart,
    });
  } catch (error) {
    console.error("Error in PUT /cart/:cartItemId:", error);
    res.status(500).json({
      status: "error",
      message: "Error updating item in cart",
      error: error.message,
    });
  }
});

// Remove specific item from user's cart
router.delete("/cart/:cartItemId", async (req, res) => {
  try {
    const { userEmail } = req.query;
    const { cartItemId } = req.params;

    console.log(
      `[DELETE /cart/:cartItemId] Attempting to remove item: ${cartItemId} for user: ${userEmail}`
    );

    if (!userEmail) {
      return res.status(400).json({
        status: "error",
        message: "User email is required",
      });
    }

    if (!cartItemId) {
      return res.status(400).json({
        status: "error",
        message: "Cart item ID is required",
      });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    console.log(
      `[DELETE /cart/:cartItemId] User found. Current cart has ${
        user.cart ? user.cart.length : 0
      } items`
    );
    if (user.cart && user.cart.length > 0) {
      console.log(
        `[DELETE /cart/:cartItemId] Current cart items:`,
        user.cart.map((item) => ({
          cartItemId: item.cartItemId,
          name: item.name,
        }))
      );
    }

    // Remove the specific item from cart array
    const updatedCart = user.cart.filter(
      (item) => item.cartItemId !== cartItemId
    );

    console.log(
      `[DELETE /cart/:cartItemId] After filtering, cart has ${updatedCart.length} items`
    );
    console.log(`[DELETE /cart/:cartItemId] Removed item: ${cartItemId}`);

    // Update user's cart in database
    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      { $set: { cart: updatedCart } },
      { new: true }
    );

    console.log(
      `[DELETE /cart/:cartItemId] Database updated successfully. New cart has ${
        updatedUser.cart ? updatedUser.cart.length : 0
      } items`
    );

    res.status(200).json({
      status: "success",
      message: "Item removed from cart successfully",
      data: updatedUser.cart,
    });
  } catch (error) {
    console.error("Error in DELETE /cart/:cartItemId:", error);
    res.status(500).json({
      status: "error",
      message: "Error removing item from cart",
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
      { $set: { cart: [] } },
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
