import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, profiles, syncHistory, connections } from "@/lib/db/schema";
import { eq, sql, desc, gte } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Total counts
    const [userCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const [profileCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(profiles);

    const [publicCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(profiles)
      .where(eq(profiles.isPublic, 1));

    const [connectionCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(connections);

    // Recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSignups = await db
      .select({
        date: sql<string>`date(${users.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo))
      .groupBy(sql`date(${users.createdAt})`)
      .orderBy(sql`date(${users.createdAt})`);

    // Recent syncs (last 30 days)
    const recentSyncs = await db
      .select({
        date: sql<string>`date(${syncHistory.createdAt})`,
        count: sql<number>`count(*)`,
      })
      .from(syncHistory)
      .where(gte(syncHistory.createdAt, thirtyDaysAgo))
      .groupBy(sql`date(${syncHistory.createdAt})`)
      .orderBy(sql`date(${syncHistory.createdAt})`);

    // Recent users
    const recentUsers = await db
      .select({
        id: users.id,
        username: users.username,
        displayName: users.displayName,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(20);

    return NextResponse.json({
      kpi: {
        totalUsers: userCount.count,
        totalProfiles: profileCount.count,
        publicProfiles: publicCount.count,
        totalConnections: connectionCount.count,
      },
      charts: {
        signups: recentSignups,
        syncs: recentSyncs,
      },
      recentUsers,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
