# coding-dna

Analyze your AI coding conversations. Discover your developer DNA. Connect with the community.

## What is this?

coding-dna analyzes your conversations with AI coding tools (Claude Code, Cursor, Codex) and generates a developer skill profile — cognitive style radar, capability rings, activity heatmap, and behavioral fingerprint.

All conversation data is analyzed **locally**. Only the generated summary/profile is uploaded.

## Quick Start

### For developers (end users)

```bash
curl -sfL https://coding-dna.vercel.app/install.sh | bash
```

Then in Claude Code or Cursor:

```
/coding-dna-summarize
```

### For contributors (self-hosting)

```bash
git clone <repo-url> coding-dna
cd coding-dna
npm install
```

Create `.env.local`:

```
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Set up the database and run:

```bash
npm run db:push    # Create tables
npm run dev        # Start dev server
```

## Architecture

```
Client (CLI)                        Server (Next.js on Vercel)
─────────────                       ──────────────────────────
install.sh                          /api/auth/device     → device auth flow
device-auth.sh                      /api/auth/logout     → revoke token
discover-sessions.sh                /api/profile/sync    → store profile
compute-stats.py (local)            /api/profile/me      → get own profile
analysis-prompt.md (AI)             /api/profile/:user   → public profile
assemble-payload.py                 /api/search/people   → search developers
post-sync.sh                        /api/search/skills   → search by skill
                                    /api/connections     → social connections
                                    /api/admin/stats     → admin dashboard
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with install instructions |
| `/me` | Authenticated dashboard with full profile |
| `/u/[username]` | Public profile view |
| `/club` | Developer directory with search |
| `/auth/device` | Device code authentication |
| `/admin` | Admin dashboard (admin role only) |

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Neon + Drizzle ORM
- **Styling**: Tailwind CSS v4, dark terminal theme
- **Auth**: Bearer token + SHA-256 (no cookies, CLI-native)
- **Charts**: Pure SVG components (zero dependencies)
- **Validation**: Zod v4
- **Search**: PostgreSQL full-text search (tsvector)
- **Deployment**: Vercel

## Client Skills

| Skill | Description |
|-------|-------------|
| `coding-dna-summarize` | 7-step analysis pipeline |
| `coding-dna-search-people` | Search developers from CLI |
| `coding-dna-search-skills` | Search by technology/skill |
| `coding-dna-logout` | Revoke token and log out |

## Database

6 tables: `users`, `auth_tokens`, `device_codes`, `profiles`, `connections`, `sync_history`.

Run `npm run db:push` to create tables, or `npm run db:generate` to generate migration SQL.

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint
npm run db:push      # Push schema to database
npm run db:generate  # Generate migration files
npm run db:studio    # Drizzle Studio (DB browser)
```

## License

MIT
