const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },
    stock: {
      type: Number,
      required: [true, "Product stock is required"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    instock: {
      type: Boolean,
      default: true,
    },
    colors: {
      type: [String],
      default: [],
    },
    image: {
      type: [String], // Array of Cloudinary image URLs
      required: [true, "At least one product image is required"],
    },
    features: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Compound index for name and category to prevent duplicates within same category
productSchema.index({ name: 1, category: 1 }, { unique: true });

// Text index for search
productSchema.index({ name: "text", description: "text" });

// Pre-save middleware to handle duplicate key errors
productSchema.pre("save", async function (next) {
  try {
    // Check if this is a new product or an update
    if (this.isNew) {
      const existingProduct = await this.constructor.findOne({
        $or: [
          { name: this.name },
          { name: this.name, category: this.category },
        ],
      });

      if (existingProduct) {
        const error = new Error("A product with this name already exists");
        error.code = 11000; // MongoDB duplicate key error code
        return next(error);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to handle duplicate errors in a user-friendly way
productSchema.statics.handleDuplicateError = function (error) {
  if (!error || !error.code) {
    return new Error("An unexpected error occurred");
  }

  // Handle MongoDB duplicate key errors
  if (error.code === 11000) {
    // Check if it's a compound index error (name + category)
    if (
      error.keyPattern &&
      error.keyPattern.name &&
      error.keyPattern.category
    ) {
      return new Error(
        "A product with this name already exists in this category"
      );
    }
    // Check if it's just a name duplicate
    if (error.keyPattern && error.keyPattern.name) {
      return new Error("A product with this name already exists");
    }
  }

  // Handle validation errors
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return new Error(messages.join(", "));
  }

  // Return the original error if we can't handle it
  return error;
};

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
