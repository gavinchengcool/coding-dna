import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deviceCodes } from "@/lib/db/schema";
import { rateLimitByIp } from "@/lib/rate-limit";
import crypto from "crypto";

function generateDeviceCode(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateUserCode(): string {
  // 6-character alphanumeric, easy to type
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code.slice(0, 3) + "-" + code.slice(3);
}

export async function POST(_req: NextRequest) {
  const limited = rateLimitByIp(
    _req.headers.get("x-forwarded-for"),
    "auth/device",
    10,
    60_000
  );
  if (limited) return limited;

  try {
    const deviceCode = generateDeviceCode();
    const userCode = generateUserCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.insert(deviceCodes).values({
      deviceCode,
      userCode,
      status: "pending",
      expiresAt,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://builderbio.dev";

    return NextResponse.json({
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: `${appUrl}/auth/device`,
      expires_in: 900,
      interval: 5,
    });
  } catch (error) {
    console.error("Device auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
