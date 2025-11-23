const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true },
    userName: { type: String, required: true },
    messages: [
      {
        sender: {
          type: String,
          enum: ["user", "admin"],
          required: true,
        },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        read: { type: Boolean, default: false },
      },
    ],
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for faster queries
messageSchema.index({ userEmail: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ lastMessageAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
