import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles, syncHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { z } from "zod/v4";

const syncPayloadSchema = z.object({
  client_version: z.string().optional(),
  sessions_analyzed: z.number().int().min(0).default(0),
  total_tokens: z.number().int().min(0).default(0),
  summary: z.string().optional(),
  portrait: z.record(z.string(), z.unknown()).optional(),
  framework_sentences: z.array(z.string()).optional(),
  activity_map: z.record(z.string(), z.unknown()).optional(),
  behavioral_fingerprint: z.record(z.string(), z.unknown()).optional(),
  search_profile: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const parsed = syncPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Build search text for full-text search
    const searchParts: string[] = [];
    if (data.summary) searchParts.push(data.summary);
    if (data.framework_sentences) searchParts.push(data.framework_sentences.join(" "));
    if (data.search_profile) {
      const sp = data.search_profile as Record<string, string[]>;
      if (sp.skills) searchParts.push(sp.skills.join(" "));
      if (sp.languages) searchParts.push(sp.languages.join(" "));
      if (sp.frameworks) searchParts.push(sp.frameworks.join(" "));
      if (sp.domains) searchParts.push(sp.domains.join(" "));
    }
    const searchText = searchParts.join(" ");

    // Upsert profile
    const existing = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, authResult.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(profiles)
        .set({
          summary: data.summary || existing[0].summary,
          portrait: data.portrait || existing[0].portrait,
          frameworkSentences: data.framework_sentences || existing[0].frameworkSentences,
          activityMap: data.activity_map || existing[0].activityMap,
          behavioralFingerprint: data.behavioral_fingerprint || existing[0].behavioralFingerprint,
          searchProfile: data.search_profile || existing[0].searchProfile,
          searchVector: searchText || existing[0].searchVector,
          sessionsAnalyzed: data.sessions_analyzed,
          totalTokens: data.total_tokens,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, authResult.id));
    } else {
      await db.insert(profiles).values({
        userId: authResult.id,
        summary: data.summary,
        portrait: data.portrait,
        frameworkSentences: data.framework_sentences,
        activityMap: data.activity_map,
        behavioralFingerprint: data.behavioral_fingerprint,
        searchProfile: data.search_profile,
        searchVector: searchText,
        sessionsAnalyzed: data.sessions_analyzed,
        totalTokens: data.total_tokens,
      });
    }

    // Record sync history
    await db.insert(syncHistory).values({
      userId: authResult.id,
      sessionsAnalyzed: data.sessions_analyzed,
      totalTokens: data.total_tokens,
      clientVersion: data.client_version,
    });

    return NextResponse.json({
      success: true,
      username: authResult.username,
    });
  } catch (error) {
    console.error("Profile sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
