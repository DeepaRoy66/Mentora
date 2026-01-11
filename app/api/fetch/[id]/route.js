import connectionToDatabase from "@/lib/database/mongoose";
import PdfUpload from "@/lib/models/PdfUpload";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await connectionToDatabase();

    const data = await PdfUpload.findById(params.id);

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
