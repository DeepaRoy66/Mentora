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
    collection: "appUsers", 
  }
);


const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;