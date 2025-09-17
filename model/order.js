const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "successful",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    paymentRef: { type: String },
    // Delivery Information
    deliveryInfo: {
      fullName: { type: String },
      phoneNumber: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      landmark: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
