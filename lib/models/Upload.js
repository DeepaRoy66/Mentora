import mongoose from "mongoose";

const UploadSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  pdfUrl: { type: String, required: true },
  tags: [{ type: String }],
  category: { type: String, default: "Others" },
  commentsEnabled: { type: Boolean, default: true },
  slug: { type: String, unique: true },
  uploaderEmail: { type: String, required: true },
  isAdmin: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Upload || mongoose.model("Upload", UploadSchema);