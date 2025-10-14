const express = require("express");
const router = express.Router();
const Delivery = require("../model/delivery");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const { checkUserActivity } = require("../lib/activityMiddleware");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  console.log("=== DELIVERY TOKEN VERIFICATION DEBUG ===");
  console.log("Headers:", req.headers.authorization);

  const token = req.headers.authorization?.split(" ")[1];
  console.log(
    "Extracted token:",
    token ? `${token.substring(0, 20)}...` : "No token"
  );

  if (!token) {
    console.log("No token provided");
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded successfully:", {
      id: decoded.id,
      email: decoded.email,
    });
    req.userId = decoded.id; // Changed from decoded.userId to decoded.id
    req.userEmail = decoded.email;
    req.user = decoded; // Add this for compatibility with existing code
    console.log("Token verification successful, proceeding...");
    next();
  } catch (error) {
    console.log("Token verification failed:", error.message);
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Save delivery information
router.post("/save", verifyToken, async (req, res) => {
  try {
    console.log("=== DELIVERY SAVE DEBUG ===");
    console.log("User ID:", req.user.id);
    console.log("User Email:", req.user.email);
    console.log("Request body:", req.body);

    const {
      fullName,
      phoneNumber,
      address,
      city,
      state,
      postalCode,
      landmark,
    } = req.body;

    // Validate required fields
    if (!fullName || !phoneNumber || !address || !city || !state) {
      console.log("Validation failed - missing required fields");
      return res.status(400).json({
        message:
          "Missing required fields: fullName, phoneNumber, address, city, state",
      });
    }

    // Check if delivery info already exists for this user
    let deliveryInfo = await Delivery.findOne({ userId: req.user.id });

    if (deliveryInfo) {
      // Update existing delivery info
      deliveryInfo.fullName = fullName;
      deliveryInfo.phoneNumber = phoneNumber;
      deliveryInfo.address = address;
      deliveryInfo.city = city;
      deliveryInfo.state = state;
      deliveryInfo.postalCode = postalCode || "";
      deliveryInfo.landmark = landmark || "";
      deliveryInfo.updatedAt = new Date();

      await deliveryInfo.save();
      res.status(200).json({
        message: "Delivery information updated successfully",
        deliveryInfo,
      });
    } else {
      // Create new delivery info
      deliveryInfo = new Delivery({
        userId: req.user.id,
        userEmail: req.user.email,
        fullName,
        phoneNumber,
        address,
        city,
        state,
        postalCode: postalCode || "",
        landmark: landmark || "",
      });

      await deliveryInfo.save();
      res.status(201).json({
        message: "Delivery information saved successfully",
        deliveryInfo,
      });
    }
  } catch (error) {
    console.error("Error saving delivery information:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get delivery information for current user
router.get("/get", verifyToken, async (req, res) => {
  try {
    const deliveryInfo = await Delivery.findOne({ userId: req.user.id });

    if (!deliveryInfo) {
      return res.status(404).json({ message: "No delivery information found" });
    }

    res.status(200).json({ deliveryInfo });
  } catch (error) {
    console.error("Error fetching delivery information:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all delivery information (admin only)
router.get("/admin/all", checkUserActivity, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Admin required." });
    }

    const deliveryInfoList = await Delivery.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ deliveryInfoList });
  } catch (error) {
    console.error("Error fetching all delivery information:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get delivery information for specific user (admin only)
router.get("/admin/user/:userId", checkUserActivity, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Admin required." });
    }

    const deliveryInfo = await Delivery.findOne({
      userId: req.params.userId,
    }).populate("userId", "name email");

    if (!deliveryInfo) {
      return res
        .status(404)
        .json({ message: "No delivery information found for this user" });
    }

    res.status(200).json({ deliveryInfo });
  } catch (error) {
    console.error("Error fetching user delivery information:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update delivery information for specific user (admin only)
router.put("/admin/user/:userId", checkUserActivity, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Admin required." });
    }

    const {
      fullName,
      phoneNumber,
      address,
      city,
      state,
      postalCode,
      landmark,
    } = req.body;

    // Validate required fields
    if (!fullName || !phoneNumber || !address || !city || !state) {
      return res.status(400).json({
        message:
          "Missing required fields: fullName, phoneNumber, address, city, state",
      });
    }

    // Find and update delivery info
    const deliveryInfo = await Delivery.findOne({ userId: req.params.userId });

    if (!deliveryInfo) {
      return res
        .status(404)
        .json({ message: "No delivery information found for this user" });
    }

    // Update delivery info
    deliveryInfo.fullName = fullName;
    deliveryInfo.phoneNumber = phoneNumber;
    deliveryInfo.address = address;
    deliveryInfo.city = city;
    deliveryInfo.state = state;
    deliveryInfo.postalCode = postalCode || "";
    deliveryInfo.landmark = landmark || "";
    deliveryInfo.updatedAt = new Date();

    await deliveryInfo.save();

    res.status(200).json({
      message: "Delivery information updated successfully",
      deliveryInfo,
    });
  } catch (error) {
    console.error("Error updating user delivery information:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
