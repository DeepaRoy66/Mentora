import mongoose from "mongoose";

const PdfUploadSchema = new mongoose.Schema(
  {
    uploaderEmail: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    pdfUrl: { type: String, required: true },
    tags: [{ type: String }],
    category: { type: String, default: "Others" },
    commentsEnabled: { type: Boolean, default: true },
    visibility: { type: String, enum: ['Public', 'Private', 'Unlisted'], default: 'Public' }, // NEW
    slug: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

export default mongoose.models.PdfUpload || mongoose.model("PdfUpload", PdfUploadSchema);