import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { users, profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://builderbio.dev";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/taste-board`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // Dynamic user profile pages
  try {
    const publicProfiles = await db
      .select({ username: users.username, updatedAt: profiles.updatedAt })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(profiles.isPublic, 1));

    // Exclude static profiles from dynamic list to avoid duplicates
    const staticUsernames = new Set(["gavin"]);
    const profilePages: MetadataRoute.Sitemap = publicProfiles
      .filter((p) => !staticUsernames.has(p.username))
      .map((p) => ({
        url: `https://${p.username}.builderbio.dev`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));

    // Gavin's static profile
    const gavinPage: MetadataRoute.Sitemap = [
      {
        url: "https://gavin.builderbio.dev",
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      },
    ];

    return [...staticPages, ...gavinPage, ...profilePages];
  } catch {
    return staticPages;
  }
}
