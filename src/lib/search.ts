import { db } from "./db";
import { profiles, users } from "./db/schema";
import { eq, and, sql, ilike, or } from "drizzle-orm";

export interface SearchResult {
  username: string;
  displayName: string | null;
  avatarColor: string | null;
  summary: string | null;
  portrait: unknown;
  frameworkSentences: unknown;
  rank?: number;
}

export async function searchPeople(query: string): Promise<SearchResult[]> {
  if (!query.trim()) {
    // Return all public profiles when no query
    const results = await db
      .select({
        username: users.username,
        displayName: users.displayName,
        avatarColor: users.avatarColor,
        summary: profiles.summary,
        portrait: profiles.portrait,
        frameworkSentences: profiles.frameworkSentences,
      })
      .from(profiles)
      .innerJoin(users, eq(profiles.userId, users.id))
      .where(eq(profiles.isPublic, 1))
      .limit(50);

    return results;
  }

  const searchTerm = `%${query}%`;

  const results = await db
    .select({
      username: users.username,
      displayName: users.displayName,
      avatarColor: users.avatarColor,
      summary: profiles.summary,
      portrait: profiles.portrait,
      frameworkSentences: profiles.frameworkSentences,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(
      and(
        eq(profiles.isPublic, 1),
        or(
          ilike(users.username, searchTerm),
          ilike(users.displayName, searchTerm),
          ilike(profiles.summary, searchTerm),
          sql`${profiles.searchVector}::tsvector @@ plainto_tsquery('english', ${query})`
        )
      )
    )
    .limit(50);

  return results;
}

export async function searchSkills(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];

  const searchTerm = `%${query}%`;

  const results = await db
    .select({
      username: users.username,
      displayName: users.displayName,
      avatarColor: users.avatarColor,
      summary: profiles.summary,
      portrait: profiles.portrait,
      frameworkSentences: profiles.frameworkSentences,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(
      and(
        eq(profiles.isPublic, 1),
        or(
          sql`${profiles.searchVector}::tsvector @@ plainto_tsquery('english', ${query})`,
          sql`${profiles.frameworkSentences}::text ILIKE ${searchTerm}`,
          sql`${profiles.portrait}::text ILIKE ${searchTerm}`
        )
      )
    )
    .limit(50);

  return results;
}
