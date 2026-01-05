import connectionToDatabase from "@/lib/database/mongoose";
import Upload from "@/lib/models/Upload";
import { NextResponse } from "next/server";
import { generateCustomSlug, isAllowedUser } from "@/lib/utils";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import Category from "@/lib/models/Category";
// Import your auth options (adjust path to where your [...nextauth] is)
 import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 

export async function POST(req) {
  try {
    const session = await getServerSession(); // Add authOptions inside () if using NextAuth
    
    // 1. Permission & Auth Check
    if (!session || !isAllowedUser(session.user?.email)) {
      return NextResponse.json({ error: "Unauthorized: Access Denied" }, { status: 403 });
    }

    await connectionToDatabase();
    const data = await req.json();

    // 2. Validation
    if (!data.title || !data.pdfUrl) {
      return NextResponse.json({ error: "Title and PDF are required" }, { status: 400 });
    }

    const tempId = new mongoose.Types.ObjectId();
    
    // 3. Slug Generation (Uses Title + ID + Random)
    const slug = generateCustomSlug(data.title, tempId.toString());

    const newUpload = await Upload.create({
      title: data.title,
      description: data.desc || "",
      pdfUrl: data.pdfUrl,
      tags: Array.isArray(data.tags) ? data.tags : [], 
      category: data.category || "Others",
      commentsEnabled: data.comments ?? true,
      slug: slug,
      uploaderEmail: session.user.email,
      isAdmin: true,
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
    await connectionToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const cat = searchParams.get("category");

    let query = {};
    if (cat && cat !== "All") query.category = cat;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }

    const data = await Upload.find(query).sort({ createdAt: -1 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}