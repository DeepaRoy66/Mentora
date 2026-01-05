import connectionToDatabase from "@/lib/database/mongoose";
import Category from "@/lib/models/Category";
import { NextResponse } from "next/server";

const slugify = (text) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

export async function PUT(req, { params }) {
  try {
    await connectionToDatabase();
    const { name } = await req.json();
    const slug = slugify(name);
    const updated = await Category.findByIdAndUpdate(
      params.id, 
      { name, slug }, 
      { new: true }
    );
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}