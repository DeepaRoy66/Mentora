// /app/api/all-uploads/route.js

import connectionToDatabase from "@/lib/database/mongoose";
import PdfUpload from "@/lib/models/PdfUpload"; 
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectionToDatabase();

    const data = await PdfUpload.find()
      .sort({ createdAt: -1 }); // newest first

    return NextResponse.json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
