import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { deviceCodes, users, authTokens } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sha256 } from "@/lib/auth";
import { rateLimitByIp } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const limited = rateLimitByIp(
    req.headers.get("x-forwarded-for"),
    "auth/complete",
    10,
    60_000
  );
  if (limited) return limited;

  try {
    const body = await req.json();
    const { user_code, username, email, display_name } = body;

    if (!user_code || !username) {
      return NextResponse.json(
        { error: "user_code and username are required" },
        { status: 400 }
      );
    }

    // Validate username format
    if (!/^[a-z0-9_-]{2,40}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 2-40 chars, lowercase alphanumeric, hyphens, underscores" },
        { status: 400 }
      );
    }

    // Find the pending device code
    const codeResults = await db
      .select()
      .from(deviceCodes)
      .where(
        and(
          eq(deviceCodes.userCode, user_code),
          eq(deviceCodes.status, "pending"),
          gt(deviceCodes.expiresAt, new Date())
        )
      )
      .limit(1);

    if (codeResults.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 404 }
      );
    }

    const deviceCodeRecord = codeResults[0];

    // Check if username is taken
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    let userId: string;

    if (existingUser.length > 0) {
      userId = existingUser[0].id;
    } else {
      // Create new user
      const colors = ["#00D084", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"];
      const avatarColor = colors[Math.floor(Math.random() * colors.length)];

      const newUsers = await db
        .insert(users)
        .values({
          username,
          email: email || null,
          displayName: display_name || username,
          avatarColor,
        })
        .returning();

      userId = newUsers[0].id;
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await sha256(token);

    // Store token
    await db.insert(authTokens).values({
      userId,
      tokenHash,
      deviceName: "CLI",
    });

    // Update device code
    await db
      .update(deviceCodes)
      .set({
        status: "authorized",
        userId,
        token,
      })
      .where(eq(deviceCodes.id, deviceCodeRecord.id));

    return NextResponse.json({ success: true, username });
  } catch (error) {
    console.error("Complete auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
