import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sha256 } from "@/lib/auth";
import { rateLimitByIp } from "@/lib/rate-limit";
import { z } from "zod/v4";

const RESERVED_USERNAMES = new Set([
  "api",
  "www",
  "admin",
  "auth",
  "me",
  "club",
  "app",
  "dashboard",
  "login",
  "signup",
  "settings",
  "profile",
  "search",
  "help",
  "about",
  "blog",
  "docs",
  "status",
  "support",
  "billing",
  "static",
  "assets",
  "public",
  "u",
]);

const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(
    /^[a-z][a-z0-9-]*[a-z0-9]$/,
    "Must start with a letter, end with letter/number, and contain only lowercase letters, numbers, and hyphens"
  )
  .refine((s) => !s.includes("--"), "No consecutive hyphens")
  .refine((s) => !RESERVED_USERNAMES.has(s), "Username is reserved");

const publishSchema = z.object({
  username: usernameSchema,
  publish_token: z.string().optional(),
  profile: z.object({
    summary: z.string().optional(),
    portrait: z.record(z.string(), z.unknown()).optional(),
    framework_sentences: z.array(z.string()).optional(),
    activity_map: z.record(z.string(), z.unknown()).optional(),
    behavioral_fingerprint: z.record(z.string(), z.unknown()).optional(),
    search_profile: z.record(z.string(), z.unknown()).optional(),
    sessions_analyzed: z.number().int().min(0).default(0),
    total_tokens: z.number().int().min(0).default(0),
  }),
});

function buildSearchVector(profile: z.infer<typeof publishSchema>["profile"]): string {
  const parts: string[] = [];
  if (profile.summary) parts.push(profile.summary);
  if (profile.framework_sentences) parts.push(profile.framework_sentences.join(" "));
  if (profile.search_profile) {
    const sp = profile.search_profile as Record<string, string[]>;
    if (sp.skills) parts.push(sp.skills.join(" "));
    if (sp.languages) parts.push(sp.languages.join(" "));
    if (sp.frameworks) parts.push(sp.frameworks.join(" "));
    if (sp.domains) parts.push(sp.domains.join(" "));
  }
  return parts.join(" ");
}

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 req/min per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const limited = rateLimitByIp(ip, "publish", 5);
  if (limited) return limited;

  try {
    const body = await req.json();
    const parsed = publishSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { username, publish_token, profile } = parsed.data;
    const searchVector = buildSearchVector(profile);

    // Check if username exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (existing.length > 0) {
      const user = existing[0];

      // Username exists — need valid publish_token
      if (!publish_token) {
        return NextResponse.json(
          {
            error: "username_taken",
            message: "This username is already taken. Provide publish_token to update.",
            suggestion: `${username}-${Math.floor(Math.random() * 1000)}`,
          },
          { status: 409 }
        );
      }

      const tokenHash = await sha256(publish_token);
      if (tokenHash !== user.publishTokenHash) {
        return NextResponse.json(
          {
            error: "username_taken",
            message: "Invalid publish token for this username.",
            suggestion: `${username}-${Math.floor(Math.random() * 1000)}`,
          },
          { status: 409 }
        );
      }

      // Valid token — update profile
      await db
        .update(profiles)
        .set({
          summary: profile.summary,
          portrait: profile.portrait,
          frameworkSentences: profile.framework_sentences,
          activityMap: profile.activity_map,
          behavioralFingerprint: profile.behavioral_fingerprint,
          searchProfile: profile.search_profile,
          searchVector,
          sessionsAnalyzed: profile.sessions_analyzed,
          totalTokens: profile.total_tokens,
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, user.id));

      const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "builderbio.dev";
      return NextResponse.json({
        success: true,
        url: `https://${username}.${baseDomain}`,
      });
    }

    // New username — create user + profile in transaction
    const publishToken = generateToken();
    const publishTokenHash = await sha256(publishToken);

    // Neon serverless doesn't support traditional transactions,
    // so we do sequential inserts with error handling
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        publishTokenHash,
      })
      .returning({ id: users.id });

    await db.insert(profiles).values({
      userId: newUser.id,
      status: "published",
      isPublic: 1,
      summary: profile.summary,
      portrait: profile.portrait,
      frameworkSentences: profile.framework_sentences,
      activityMap: profile.activity_map,
      behavioralFingerprint: profile.behavioral_fingerprint,
      searchProfile: profile.search_profile,
      searchVector,
      sessionsAnalyzed: profile.sessions_analyzed,
      totalTokens: profile.total_tokens,
    });

    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "builderbio.dev";
    return NextResponse.json({
      success: true,
      url: `https://${username}.${baseDomain}`,
      publish_token: publishToken,
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
