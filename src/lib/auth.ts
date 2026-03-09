import { NextRequest, NextResponse } from "next/server";
import { db } from "./db";
import { authTokens, users } from "./db/schema";
import { eq, and, isNull } from "drizzle-orm";

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type AuthUser = {
  id: string;
  username: string;
  role: string;
  tokenId: string;
};

export async function authenticateRequest(
  req: NextRequest
): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const tokenHash = await sha256(token);

  const results = await db
    .select({
      tokenId: authTokens.id,
      userId: users.id,
      username: users.username,
      role: users.role,
    })
    .from(authTokens)
    .innerJoin(users, eq(authTokens.userId, users.id))
    .where(and(eq(authTokens.tokenHash, tokenHash), isNull(authTokens.revokedAt)))
    .limit(1);

  if (results.length === 0) return null;

  const row = results[0];

  // Update last_used_at
  await db
    .update(authTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(authTokens.id, row.tokenId));

  return {
    id: row.userId,
    username: row.username,
    role: row.role,
    tokenId: row.tokenId,
  };
}

export async function requireAuth(
  req: NextRequest
): Promise<AuthUser | NextResponse> {
  const user = await authenticateRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

export async function requireAdmin(
  req: NextRequest
): Promise<AuthUser | NextResponse> {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) return result;
  if (result.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return result;
}

export { sha256 };
