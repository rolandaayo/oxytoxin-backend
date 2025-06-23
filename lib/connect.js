const mongoose = require("mongoose");

// Cache the connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  try {
    // If we have a cached connection, use it
    if (cached.conn) {
      console.log("Using cached database connection");
      return cached.conn;
    }

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // If we don't have a connection promise, create one
    if (!cached.promise) {
      const opts = {
        bufferCommands: false, // Disable mongoose buffering
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      };

      cached.promise = mongoose
        .connect(process.env.MONGODB_URI, opts)
        .then((mongoose) => {
          console.log("New database connection established");
          return mongoose;
        });
    }

    // Wait for the connection promise to resolve
    cached.conn = await cached.promise;

    // Handle connection errors after initial connection
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      // Clear the cached connection on error
      cached.conn = null;
      cached.promise = null;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
      // Clear the cached connection on disconnect
      cached.conn = null;
      cached.promise = null;
    });

    return cached.conn;
  } catch (error) {
    // Clear the cached connection on error
    cached.conn = null;
    cached.promise = null;
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
};

module.exports = connectDB;
