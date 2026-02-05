import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // Support both DB_URL (new) and MONGO_URI (legacy) for backward compatibility
    const mongoUri = process.env.DB_URL || process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("DB_URL or MONGO_URI missing in environment variables");
    }

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("💥 MongoDB connection error:", error.message);
    process.exit(1);
  }
};
