import connectionToDatabase from "@/lib/database/mongoose";
import Category from "@/lib/models/Category";
import { NextResponse } from "next/server";

const slugify = (text) => text.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

export async function GET() {
  await connectionToDatabase();
  const categories = await Category.find({}).sort({ createdAt: -1 });
  return NextResponse.json(categories);
}

export async function POST(req) {
  try {
    await connectionToDatabase();
    const { name } = await req.json();
    const slug = slugify(name);
    const newCategory = await Category.create({ name, slug });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Category already exists or invalid data" }, { status: 400 });
  }
}