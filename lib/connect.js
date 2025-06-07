const mongoose = require("mongoose");

// Cache the connection
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  try {
    // If we have a cached connection, return it
    if (cached.conn) {
      console.log("Using cached database connection");
      return cached.conn;
    }

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not defined in environment variables");
    }

    // Configure mongoose for serverless environment
    mongoose.set("bufferCommands", false); // Disable command buffering
    mongoose.set("strictQuery", true); // Enable strict query mode

    // If we have a pending connection promise, return it
    if (cached.promise) {
      console.log("Using pending connection promise");
      return cached.promise;
    }

    // Create new connection promise
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 3000, // Reduce timeout to 3 seconds
        socketTimeoutMS: 20000, // Close sockets after 20s of inactivity
        connectTimeoutMS: 5000, // Give up initial connection after 5 seconds
        maxPoolSize: 5, // Reduce pool size for serverless
        minPoolSize: 1, // Minimum pool size
        maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
        retryWrites: true,
        retryReads: true,
        heartbeatFrequencyMS: 2000, // Check server status every 2 seconds
        family: 4, // Use IPv4, skip trying IPv6
      })
      .then((conn) => {
        console.log("New database connection established");
        cached.conn = conn;
        return conn;
      });

    // Wait for the connection
    const conn = await cached.promise;
    return conn;
  } catch (error) {
    // Clear the cached promise on error
    cached.promise = null;
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
};

// Handle connection errors after initial connection
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
  cached.conn = null;
  cached.promise = null;
});

// Handle process termination
process.on("SIGINT", async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB connection closed through app termination");
    process.exit(0);
  } catch (err) {
    console.error("Error closing MongoDB connection:", err);
    process.exit(1);
  }
});

module.exports = connectDB;
