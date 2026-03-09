import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deviceCodes } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userCode = body.user_code;

    if (!userCode) {
      return NextResponse.json(
        { error: "user_code is required" },
        { status: 400 }
      );
    }

    const results = await db
      .select()
      .from(deviceCodes)
      .where(
        and(
          eq(deviceCodes.userCode, userCode),
          eq(deviceCodes.status, "pending"),
          gt(deviceCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 404 }
      );
    }

    // Code is valid — user needs to sign up or log in
    return NextResponse.json({ needs_signup: true });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
