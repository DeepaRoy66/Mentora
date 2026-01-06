import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectionToDatabase from "@/lib/database/mongoose";
import User from "@/lib/models/user";

export async function GET() {
  try {
    // 1️⃣ Get session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2️⃣ Connect DB
    await connectionToDatabase();

    // 3️⃣ Fetch latest user data
    const user = await User.findOne({ email: session.user.email })
      .select("name email image contributionPoints createdAt")
      .lean();

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // 4️⃣ Send response
    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Profile API error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
