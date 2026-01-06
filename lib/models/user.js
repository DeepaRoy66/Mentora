// lib/models/user.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, unique: true, required: true },
    image: { type: String },
    contributionPoints: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: "appUsers", // ← This prevents conflict with NextAuth's "users"
  }
);

// Model name is "User" → Mongoose would normally make collection "users"
// But we override it above to "appUsers"
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;