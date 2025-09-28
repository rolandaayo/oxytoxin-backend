const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const { checkUserActivity } = require("../lib/activityMiddleware");
const {
  generateToken,
  generateCode,
  sendVerificationEmail,
  sendVerificationCode,
  sendPasswordResetEmail,
  sendPasswordResetCode,
} = require("../lib/emailService");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// Cleanup expired temporary users every 10 minutes
setInterval(() => {
  if (global.tempUsers) {
    const now = Date.now();
    for (const [email, userData] of global.tempUsers.entries()) {
      if (userData.verificationExpires < now) {
        global.tempUsers.delete(email);
        console.log(`Cleaned up expired temporary user: ${email}`);
      }
    }
  }
}, 10 * 60 * 1000); // 10 minutes

// Register - Store temporarily, don't save to database yet
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      address,
      isAdmin,
      adminSecret,
    } = req.body;
    if (!name || !email || !password || !address) {
      return res
        .status(400)
        .json({ status: "error", message: "All fields are required" });
    }
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res
        .status(400)
        .json({ status: "error", message: "Passwords do not match" });
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

    // Only allow isAdmin if adminSecret matches env var
    let adminFlag = false;
    if (isAdmin && adminSecret === process.env.ADMIN_SECRET) {
      adminFlag = true;
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Store user data temporarily (in memory or temporary storage)
    // We'll use a simple in-memory store for now, but in production you might want Redis
    const tempUserData = {
      name,
      email,
      password: hashed,
      address,
      isAdmin: adminFlag,
      verificationCode,
      verificationExpires,
      createdAt: new Date(),
    };

    // Store in temporary storage (you could use Redis or a temporary collection)
    // For now, we'll use a global variable - in production use Redis
    if (!global.tempUsers) {
      global.tempUsers = new Map();
    }
    global.tempUsers.set(email, tempUserData);

    // Send verification code email
    console.log(
      "Attempting to send verification email for registration:",
      email
    );
    const emailSent = await sendVerificationCode(email, verificationCode, name);
    console.log("Email send result:", emailSent);

    res.json({
      status: "success",
      message: emailSent
        ? "Registration successful! Please check your email for the verification code to complete your registration."
        : "Registration successful! Please check your email for the verification code to complete your registration. (Email delivery may be delayed)",
      user: {
        name: tempUserData.name,
        email: tempUserData.email,
        address: tempUserData.address,
        isAdmin: tempUserData.isAdmin,
        isEmailVerified: false,
      },
      emailSent, // Include this for debugging
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

    // Check if email is verified (optional - you can make this required)
    if (!user.isEmailVerified) {
      return res.status(400).json({
        status: "error",
        message:
          "Please verify your email address before logging in. Check your inbox for a verification link.",
        needsVerification: true,
      });
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
        address: user.address,
        isAdmin: user.isAdmin,
        isEmailVerified: user.isEmailVerified,
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

// Verify email with code - Save to database only after verification
router.post("/verify-email-code", async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        status: "error",
        message: "Email and verification code are required",
      });
    }

    // Check if user exists in database (already verified)
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        return res.status(400).json({
          status: "error",
          message: "Email is already verified",
        });
      }
      // If user exists but not verified, check the code
      if (
        existingUser.emailVerificationCode === code &&
        existingUser.emailVerificationCodeExpires > Date.now()
      ) {
        // Mark email as verified and clear code
        existingUser.isEmailVerified = true;
        existingUser.emailVerificationCode = undefined;
        existingUser.emailVerificationCodeExpires = undefined;

        // Update lastLogin
        existingUser.lastLogin = new Date();
        existingUser.loginHistory = existingUser.loginHistory || [];
        existingUser.loginHistory.push(new Date());
        await existingUser.save();

        // Generate JWT token for automatic login
        const token = jwt.sign(
          {
            id: existingUser._id,
            email: existingUser.email,
            isAdmin: existingUser.isAdmin,
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        return res.json({
          status: "success",
          message: "Welcome to Oxytoxin! Your account has been successfully!",
          token,
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            address: existingUser.address,
            isAdmin: existingUser.isAdmin,
            isEmailVerified: true,
          },
        });
      }
    }

    // Check temporary storage for new registrations
    if (!global.tempUsers || !global.tempUsers.has(email)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification code",
      });
    }

    const tempUserData = global.tempUsers.get(email);

    // Check if code matches and is not expired
    if (
      tempUserData.verificationCode !== code ||
      tempUserData.verificationExpires < Date.now()
    ) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification code",
      });
    }

    // Code is valid! Create user in database
    const user = await User.create({
      name: tempUserData.name,
      email: tempUserData.email,
      password: tempUserData.password,
      address: tempUserData.address,
      isAdmin: tempUserData.isAdmin,
      isEmailVerified: true, // Mark as verified immediately
      lastLogin: new Date(),
      loginHistory: [new Date()],
    });

    // Remove from temporary storage
    global.tempUsers.delete(email);

    // Generate JWT token for automatic login
    const token = jwt.sign(
      { id: user._id, email: user.email, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      status: "success",
      message: "Welcome to Oxytoxin! Your account has been successfully!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        address: user.address,
        isAdmin: user.isAdmin,
        isEmailVerified: true,
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Verify email (legacy - keeping for backward compatibility)
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification token",
      });
    }

    // Mark email as verified and clear token
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      status: "success",
      message:
        "Email verified successfully! You can now log in to your account.",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Resend verification code
router.post("/resend-verification-code", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    // Check if user exists in database
    const user = await User.findOne({ email });

    if (user) {
      if (user.isEmailVerified) {
        return res.status(400).json({
          status: "error",
          message: "Email is already verified",
        });
      }

      // Generate new verification code
      const verificationCode = generateCode();
      const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.emailVerificationCode = verificationCode;
      user.emailVerificationCodeExpires = verificationExpires;
      await user.save();

      // Send verification code email
      const emailSent = await sendVerificationCode(
        email,
        verificationCode,
        user.name
      );

      return res.json({
        status: "success",
        message: emailSent
          ? "Verification code sent successfully! Please check your inbox."
          : "Verification code sent! Please check your inbox. (Email delivery may be delayed)",
      });
    }

    // Check temporary storage for new registrations
    if (!global.tempUsers || !global.tempUsers.has(email)) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const tempUserData = global.tempUsers.get(email);

    // Generate new verification code
    const verificationCode = generateCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update temporary user data
    tempUserData.verificationCode = verificationCode;
    tempUserData.verificationExpires = verificationExpires;
    global.tempUsers.set(email, tempUserData);

    // Send verification code email
    const emailSent = await sendVerificationCode(
      email,
      verificationCode,
      tempUserData.name
    );

    res.json({
      status: "success",
      message: emailSent
        ? "Verification code sent successfully! Please check your inbox."
        : "Verification code sent! Please check your inbox. (Email delivery may be delayed)",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Resend verification email (legacy - keeping for backward compatibility)
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        status: "error",
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = generateToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(
      email,
      verificationToken,
      user.name
    );

    res.json({
      status: "success",
      message: emailSent
        ? "Verification email sent successfully! Please check your inbox."
        : "Verification email sent! Please check your inbox. (Email delivery may be delayed)",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Request password reset code
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "error",
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        status: "success",
        message:
          "If an account with that email exists, a password reset code has been sent.",
      });
    }

    // Generate reset code
    const resetCode = generateCode();
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.passwordResetCode = resetCode;
    user.passwordResetCodeExpires = resetExpires;
    await user.save();

    // Send reset code email
    const emailSent = await sendPasswordResetCode(email, resetCode, user.name);

    res.json({
      status: "success",
      message: emailSent
        ? "Password reset code sent successfully! Please check your inbox."
        : "Password reset code sent! Please check your inbox. (Email delivery may be delayed)",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Reset password with code
router.post("/reset-password-code", async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: "error",
        message: "Email, code, new password, and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "error",
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findOne({
      email,
      passwordResetCode: code,
      passwordResetCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired reset code",
      });
    }

    // Hash new password and clear reset code
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    await user.save();

    res.json({
      status: "success",
      message:
        "Password reset successfully! You can now log in with your new password.",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Reset password (legacy - keeping for backward compatibility)
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: "error",
        message: "Token, new password, and confirm password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: "error",
        message: "Passwords do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired reset token",
      });
    }

    // Hash new password and clear reset token
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      status: "success",
      message:
        "Password reset successfully! You can now log in with your new password.",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Logout endpoint
router.post("/logout", auth, async (req, res) => {
  try {
    // Clear last activity to force re-login
    await User.findByIdAndUpdate(req.user.id, {
      lastActivity: null,
    });

    res.json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Get current user with activity checking
router.get("/me", checkUserActivity, async (req, res) => {
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

// Get activity configuration
router.get("/activity-config", (req, res) => {
  const { getActivityConfig } = require("../lib/activityMiddleware");
  getActivityConfig(req, res);
});

// Cleanup expired sessions (admin only)
router.post("/cleanup-sessions", auth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "Admin access required",
      });
    }

    const { ACTIVITY_TIMEOUT } = require("../lib/activityMiddleware");
    const cutoffTime = new Date(Date.now() - ACTIVITY_TIMEOUT);

    // Find users who haven't been active for the timeout period
    const inactiveUsers = await User.find({
      lastActivity: { $lt: cutoffTime },
    }).select("email lastActivity lastLogin");

    // Clear lastActivity for inactive users (force re-login)
    const result = await User.updateMany(
      { lastActivity: { $lt: cutoffTime } },
      { $unset: { lastActivity: 1 } }
    );

    res.json({
      status: "success",
      message: `Cleaned up ${result.modifiedCount} inactive sessions`,
      data: {
        inactiveUsers: inactiveUsers.length,
        modifiedCount: result.modifiedCount,
        cutoffTime: cutoffTime.toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Test email endpoint (for debugging)
router.post("/test-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ status: "error", message: "Email is required" });
    }

    console.log("=== EMAIL TEST DEBUG ===");
    console.log("Testing email send to:", email);
    console.log("Environment variables check:");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);
    console.log(
      "EMAIL_PASS length:",
      process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
    );

    const testCode = "123456";
    const emailSent = await sendVerificationCode(email, testCode, "Test User");

    console.log("Email send result:", emailSent);
    console.log("=== END EMAIL TEST DEBUG ===");

    res.json({
      status: "success",
      message: emailSent
        ? "Test email sent successfully!"
        : "Test email failed to send",
      emailSent,
      debug: {
        emailUser: process.env.EMAIL_USER,
        emailPassExists: !!process.env.EMAIL_PASS,
        emailPassLength: process.env.EMAIL_PASS
          ? process.env.EMAIL_PASS.length
          : 0,
      },
    });
  } catch (error) {
    console.error("Test email error:", error);
    res.status(500).json({
      status: "error",
      message: "Test email failed",
      error: error.message,
    });
  }
});

module.exports = router;
