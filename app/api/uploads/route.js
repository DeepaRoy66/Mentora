import connectionToDatabase from "@/lib/database/mongoose";
import PdfUpload from "@/lib/models/PdfUpload"; 
import { NextResponse } from "next/server";
import { generateCustomSlug } from "@/lib/utils";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectionToDatabase();
    const data = await req.json();

    // Validation
    if (!data.title || !data.pdfUrl) {
      return NextResponse.json({ error: "Title and PDF are required" }, { status: 400 });
    }

    // Tag Limit Check
    const tagsArray = Array.isArray(data.tags) ? data.tags : [];
    if (tagsArray.join('').length > 500) {
      return NextResponse.json({ error: "Tags exceed 500 characters" }, { status: 400 });
    }

    const tempId = new mongoose.Types.ObjectId();
    const slug = generateCustomSlug(data.title, tempId.toString());

    const newUpload = await PdfUpload.create({
      title: data.title,
      description: data.description || "", 
      pdfUrl: data.pdfUrl,
      tags: tagsArray, 
      category: data.category || "Others",
      commentsEnabled: data.commentsEnabled,
      visibility: data.visibility || 'Public', // Save Visibility
      slug: slug,
      uploaderEmail: session.user.email, 
      _id: tempId
    });

    return NextResponse.json(newUpload, { status: 201 });
  } catch (error) {
    console.error("CRITICAL POST ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectionToDatabase();
    const { searchParams } = new URL(req.url);
    
    // Pagination Params
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = 30; // Fixed Limit as requested
    const skip = (page - 1) * limit;

    const search = searchParams.get("search");
    const cat = searchParams.get("category");

    // Base Query
    let query = { uploaderEmail: session.user.email };

    // Filters
    if (cat && cat !== "All") query.category = cat;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }

    // Fetch Data & Count Total (for pagination)
    const data = await PdfUpload.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(limit);

    const totalItems = await PdfUpload.countDocuments(query);
    const totalPages = Math.ceil(totalItems / limit);
    
    return NextResponse.json({ 
      uploads: data, 
      currentPage: page,
      totalPages: totalPages 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}