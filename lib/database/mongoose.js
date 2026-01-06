// lib/database/mongoose.js
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in your .env.local file.");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectionToDatabase() {
  if (cached.conn) {
    console.log("✅ Using cached database connection");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log("🔄 Establishing new database connection...");
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
    console.log("✅ New database connection established successfully");
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error("❌ Database connection failed:", error.message);
    throw error;
  }
}

// Export the native MongoClient for NextAuth adapter
export async function getMongoClient() {
  const conn = await connectionToDatabase();
  return conn.connection.getClient(); // This returns the native MongoClient
}

export default connectionToDatabase;