#!/usr/bin/env node

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { neon } from "@neondatabase/serverless";

function loadEnvFromFile(filePath) {
  if (!existsSync(filePath)) return;

  const contents = readFileSync(filePath, "utf8");
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;

    const [key, ...rest] = line.split("=");
    if (!key || process.env[key] !== undefined) continue;

    let value = rest.join("=").trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

loadEnvFromFile(resolve(process.cwd(), ".env.local"));

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const apply = process.argv.includes("--apply");
const sql = neon(databaseUrl);

const brokenProfiles = await sql`
  SELECT
    p.id,
    u.username,
    u.display_name AS "displayName",
    p.sessions_analyzed AS "sessionsAnalyzed",
    p.total_tokens AS "totalTokens"
  FROM profiles p
  INNER JOIN users u ON u.id = p.user_id
  WHERE p.is_public = 1
    AND (
      p.builder_bio_data IS NULL
      OR jsonb_typeof(p.builder_bio_data) <> 'object'
      OR NOT (p.builder_bio_data ? 'D' AND p.builder_bio_data ? 'E')
    )
  ORDER BY u.username
`;

if (!apply) {
  console.log(
    JSON.stringify(
      {
        mode: "dry-run",
        count: brokenProfiles.length,
        usernames: brokenProfiles.map((profile) => ({
          username: profile.username,
          displayName: profile.displayName,
          sessionsAnalyzed: profile.sessionsAnalyzed,
          totalTokens: profile.totalTokens,
        })),
      },
      null,
      2
    )
  );
  process.exit(0);
}

const updated = [];
for (const profile of brokenProfiles) {
  await sql`
    UPDATE profiles
    SET
      is_public = 0,
      status = 'draft',
      updated_at = NOW()
    WHERE id = ${profile.id}
  `;
  updated.push(profile.username);
}

console.log(
  JSON.stringify(
    {
      mode: "apply",
      count: updated.length,
      usernames: updated,
    },
    null,
    2
  )
);
