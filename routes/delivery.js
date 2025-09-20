const express = require("express");
const router = express.Router();
const Delivery = require("../model/delivery");
const User = require("../model/user");
const jwt = require("jsonwebtoken");

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id; // Changed from decoded.userId to decoded.id
    req.userEmail = decoded.email;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// Save delivery information
router.post("/save", verifyToken, async (req, res) => {
  try {
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

    // Check if delivery info already exists for this user
    let deliveryInfo = await Delivery.findOne({ userId: req.userId });

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
        userId: req.userId,
        userEmail: req.userEmail,
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
    const deliveryInfo = await Delivery.findOne({ userId: req.userId });

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
router.get("/admin/all", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
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
router.get("/admin/user/:userId", verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
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

module.exports = router;
