import connectionToDatabase from "@/lib/database/mongoose";
import PdfUpload from "@/lib/models/PdfUpload"; 
import { NextResponse } from "next/server";
import { generateCustomSlug } from "@/lib/utils";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 

export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectionToDatabase();
    const { id } = params; 
    const data = await req.json();

    const existingDoc = await PdfUpload.findById(id);
    if (!existingDoc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existingDoc.uploaderEmail !== session.user.email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // --- FIX: Fallback to existing title if data.title is undefined ---
    const titleToUse = data.title || existingDoc.title;
    const newSlug = generateCustomSlug(titleToUse, id);
    // ----------------------------------------------------

    const updateData = {};
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tags) updateData.tags = data.tags;
    if (data.category) updateData.category = data.category;
    if (data.commentsEnabled !== undefined) updateData.commentsEnabled = data.commentsEnabled;
    if (data.visibility) updateData.visibility = data.visibility;
    if (titleToUse) updateData.slug = newSlug; // Always update slug if title changes

    const updatedUpload = await PdfUpload.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json(updatedUpload);
  } catch (error) {
    console.error("EDIT API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectionToDatabase();
    const docToDelete = await PdfUpload.findById(params.id);
    if (!docToDelete) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (docToDelete.uploaderEmail !== session.user.email) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await PdfUpload.findByIdAndDelete(params.id);
    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}