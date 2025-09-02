const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String },
    profilePicture: { type: String },
    lastLogin: { type: Date },
    lastActivity: { type: Date, default: Date.now }, // Track last activity
    loginHistory: [{ type: Date }],
    passwordChangedAt: { type: Date },
    isAdmin: { type: Boolean, default: false },
    cart: { type: Array, default: [] },
    // Email verification fields
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    // Email verification code fields
    emailVerificationCode: { type: String },
    emailVerificationCodeExpires: { type: Date },
    // Password reset fields
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    // Password reset code fields
    passwordResetCode: { type: String },
    passwordResetCodeExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
