const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
    },
    uploadedBy: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
gallerySchema.index({ title: "text", description: "text" });

const Gallery = mongoose.model("Gallery", gallerySchema);

module.exports = Gallery; 