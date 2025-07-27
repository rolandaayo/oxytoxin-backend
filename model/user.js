const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true }, // Add address field
    lastLogin: { type: Date },
    loginHistory: [{ type: Date }],
    isAdmin: { type: Boolean, default: false },
    cart: { type: Array, default: [] }, // Add cart field to store cart items
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
