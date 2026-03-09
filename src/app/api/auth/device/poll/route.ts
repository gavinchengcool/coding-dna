import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deviceCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const deviceCode = req.nextUrl.searchParams.get("device_code");
  if (!deviceCode) {
    return NextResponse.json(
      { error: "device_code is required" },
      { status: 400 }
    );
  }

  try {
    const results = await db
      .select()
      .from(deviceCodes)
      .where(eq(deviceCodes.deviceCode, deviceCode))
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json({ error: "invalid_device_code" }, { status: 404 });
    }

    const record = results[0];

    if (new Date() > record.expiresAt) {
      return NextResponse.json({ error: "expired_token" }, { status: 410 });
    }

    if (record.status === "pending") {
      return NextResponse.json({ error: "authorization_pending" }, { status: 428 });
    }

    if (record.status === "authorized" && record.token && record.userId) {
      return NextResponse.json({
        access_token: record.token,
        token_type: "Bearer",
        user_id: record.userId,
      });
    }

    return NextResponse.json({ error: "authorization_pending" }, { status: 428 });
  } catch (error) {
    console.error("Poll error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
