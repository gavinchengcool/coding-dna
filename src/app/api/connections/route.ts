import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { connections, users } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { requireAuth } from "@/lib/auth";
import { z } from "zod/v4";

const createSchema = z.object({
  recipient_username: z.string().min(1),
  message: z.string().max(500).optional(),
});

const updateSchema = z.object({
  connection_id: z.string().uuid(),
  action: z.enum(["accept", "reject"]),
});

// GET - List connections
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Get all connections involving this user
    const results = await db
      .select()
      .from(connections)
      .where(
        or(
          eq(connections.requesterId, authResult.id),
          eq(connections.recipientId, authResult.id)
        )
      );

    // Enrich with usernames
    const enriched = await Promise.all(
      results.map(async (conn) => {
        const otherId =
          conn.requesterId === authResult.id
            ? conn.recipientId
            : conn.requesterId;

        const userResults = await db
          .select({ username: users.username, displayName: users.displayName })
          .from(users)
          .where(eq(users.id, otherId))
          .limit(1);

        return {
          id: conn.id,
          status: conn.status,
          message: conn.message,
          direction:
            conn.requesterId === authResult.id ? "outgoing" : "incoming",
          otherUser: userResults[0] || null,
          createdAt: conn.createdAt,
        };
      })
    );

    return NextResponse.json({ connections: enriched });
  } catch (error) {
    console.error("Get connections error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create connection request
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Find recipient
    const recipientResults = await db
      .select()
      .from(users)
      .where(eq(users.username, parsed.data.recipient_username))
      .limit(1);

    if (recipientResults.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const recipientId = recipientResults[0].id;

    if (recipientId === authResult.id) {
      return NextResponse.json(
        { error: "Cannot connect with yourself" },
        { status: 400 }
      );
    }

    // Check for existing connection
    const existing = await db
      .select()
      .from(connections)
      .where(
        or(
          and(
            eq(connections.requesterId, authResult.id),
            eq(connections.recipientId, recipientId)
          ),
          and(
            eq(connections.requesterId, recipientId),
            eq(connections.recipientId, authResult.id)
          )
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Connection already exists" },
        { status: 409 }
      );
    }

    await db.insert(connections).values({
      requesterId: authResult.id,
      recipientId,
      message: parsed.data.message,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create connection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Accept/reject connection
export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Verify the connection belongs to this user as recipient
    const connResults = await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.id, parsed.data.connection_id),
          eq(connections.recipientId, authResult.id),
          eq(connections.status, "pending")
        )
      )
      .limit(1);

    if (connResults.length === 0) {
      return NextResponse.json(
        { error: "Connection request not found" },
        { status: 404 }
      );
    }

    const newStatus = parsed.data.action === "accept" ? "accepted" : "rejected";

    await db
      .update(connections)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(connections.id, parsed.data.connection_id));

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error) {
    console.error("Update connection error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
