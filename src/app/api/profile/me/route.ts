import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const results = await db
      .select({
        username: users.username,
        displayName: users.displayName,
        avatarColor: users.avatarColor,
        email: users.email,
        summary: profiles.summary,
        portrait: profiles.portrait,
        frameworkSentences: profiles.frameworkSentences,
        activityMap: profiles.activityMap,
        behavioralFingerprint: profiles.behavioralFingerprint,
        searchProfile: profiles.searchProfile,
        sessionsAnalyzed: profiles.sessionsAnalyzed,
        totalTokens: profiles.totalTokens,
        isPublic: profiles.isPublic,
        status: profiles.status,
        updatedAt: profiles.updatedAt,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, authResult.id))
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(results[0]);
  } catch (error) {
    console.error("Profile me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
