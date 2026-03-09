import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { z } from "zod/v4";

const updateSchema = z.object({
  is_public: z.boolean().optional(),
  status: z.enum(["draft", "published"]).optional(),
  display_name: z.string().max(100).optional(),
});

export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (parsed.data.is_public !== undefined) {
      updates.isPublic = parsed.data.is_public ? 1 : 0;
    }
    if (parsed.data.status !== undefined) {
      updates.status = parsed.data.status;
    }

    await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.userId, authResult.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
