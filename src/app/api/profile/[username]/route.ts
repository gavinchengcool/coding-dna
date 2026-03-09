import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    const results = await db
      .select({
        username: users.username,
        displayName: users.displayName,
        avatarColor: users.avatarColor,
        summary: profiles.summary,
        portrait: profiles.portrait,
        frameworkSentences: profiles.frameworkSentences,
        activityMap: profiles.activityMap,
        behavioralFingerprint: profiles.behavioralFingerprint,
        searchProfile: profiles.searchProfile,
        sessionsAnalyzed: profiles.sessionsAnalyzed,
        totalTokens: profiles.totalTokens,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(and(eq(users.username, username), eq(profiles.isPublic, 1)))
      .limit(1);

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(results[0]);
  } catch (error) {
    console.error("Public profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
