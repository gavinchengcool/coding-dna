import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;

  try {
    await db
      .update(authTokens)
      .set({ revokedAt: new Date() })
      .where(eq(authTokens.id, result.tokenId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
