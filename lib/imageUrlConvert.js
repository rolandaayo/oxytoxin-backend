const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_API_KEY,
});

// Log Cloudinary config (without exposing secrets)
console.log(
  "Cloudinary initialized with cloud name:",
  process.env.CLOUDINARY_CLOUD_NAME
);

// Convert buffer to stream
const bufferToStream = (buffer) => {
  if (!buffer) {
    throw new Error("No buffer provided for image upload");
  }
  return Readable.from(buffer);
};

// Upload a single image to Cloudinary
const uploadToCloudinary = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("Invalid file object: missing buffer");
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "ecommerce_products", // Organize uploads in a folder
        transformation: [
          { width: 800, height: 800, crop: "limit" }, // Resize while maintaining aspect ratio
          { quality: "auto" }, // Optimize quality
          { fetch_format: "auto" }, // Optimize format
        ],
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else {
          console.log("Cloudinary upload success for:", result.public_id);
          resolve(result);
        }
      }
    );

    // Convert buffer to stream and pipe to Cloudinary
    const stream = bufferToStream(file.buffer);
    stream.on("error", (error) => {
      console.error("Stream error:", error);
      reject(new Error(`Stream error: ${error.message}`));
    });

    stream.pipe(uploadStream);
  });
};

// Process multiple images
const convertImageUrl = async (files) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("No files provided for upload");
  }

  try {
    console.log(`Starting upload of ${files.length} files to Cloudinary`);
    const uploadPromises = files.map((file) => uploadToCloudinary(file));
    const results = await Promise.all(uploadPromises);

    // Return array of image URLs and public IDs
    return results.map((result) => ({
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
    }));
  } catch (error) {
    console.error("Error in convertImageUrl:", error);
    throw new Error(`Failed to upload images to Cloudinary: ${error.message}`);
  }
};

module.exports = convertImageUrl;
