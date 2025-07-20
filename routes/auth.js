const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/user");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword, isAdmin, adminSecret } =
      req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "All fields are required" });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res
        .status(400)
        .json({ status: "error", message: "Passwords do not match" });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ status: "error", message: "Email already in use" });
    }
    const hashed = await bcrypt.hash(password, 10);
    // Only allow isAdmin if adminSecret matches env var
    let adminFlag = false;
    if (isAdmin && adminSecret === process.env.ADMIN_SECRET) {
      adminFlag = true;
    }
    const user = await User.create({
      name,
      email,
      password: hashed,
      isAdmin: adminFlag,
    });
    res.json({
      status: "success",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Email and password required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid credentials" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid credentials" });
    }
    // Update lastLogin and loginHistory
    user.lastLogin = new Date();
    user.loginHistory = user.loginHistory || [];
    user.loginHistory.push(new Date());
    await user.save();
    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );
    res.json({
      status: "success",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ status: "error", message: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: "error", message: "Invalid token" });
  }
}

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    res.json({ status: "success", user });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

module.exports = router;
