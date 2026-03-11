# builderbio { }

The bio link for builders who ship with AI.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## What is this?

One command turns your AI coding agent sessions into a shareable builder profile at `yourname.builderbio.dev` — cognitive style, capability rings, activity heatmap, project gallery, and more.

All session data is analyzed **locally**. Only aggregate statistics are published.

## Quick Start

Paste this into your coding agent (Claude Code, Cursor, or Codex):

```bash
curl -sfL https://builderbio.dev/install.sh | bash
```

Your agent installs a skill file, reads your local session logs, computes stats, and publishes your profile. The only interaction is choosing a visual theme.

## How It Works

1. **Install** — The command downloads a skill file and a Python parser script into `~/.builderbio/skills/builderbio/`. It symlinks into your agent's skill directory.
2. **Analyze** — Your agent reads local session logs and computes aggregate statistics: session counts, tool usage patterns, activity timelines, and project clusters.
3. **Share** — A profile page is published at `yourname.builderbio.dev`. Drop it in your LinkedIn, GitHub, or resume.

## What Data Is Accessed

**Read:**
- Session metadata from `~/.claude/projects/`, `~/.codex/sessions/`, and `~/.openclaw/agents/`
- Specifically: message counts, tool call names, timestamps, working directories, and token usage

**NOT read:**
- File contents from your projects
- Environment variables, credentials, or API keys
- Git diffs or source code

## Privacy

- **Local analysis**: All session parsing runs on your machine. Raw session data never leaves your device.
- **Publish key**: A `device_id` is a SHA-256 hash of hostname + username + architecture. It serves as a stable publish key so the same machine always updates the same profile URL. It cannot be reversed.
- **Automatic redaction**: File paths, credentials, and API keys are stripped before the profile is built.
- **Open source**: The full source is readable at `~/.builderbio/skills/builderbio/` after install.

## Self-Hosting

```bash
git clone https://github.com/gavinchengcool/builderbio.git builderbio
cd builderbio
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

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL via Neon + Drizzle ORM
- **Styling**: Tailwind CSS v4
- **Auth**: Bearer token + SHA-256 (no cookies, CLI-native)
- **Charts**: Pure SVG components (zero dependencies)
- **Validation**: Zod v4
- **Deployment**: Vercel

## License

[MIT](LICENSE)
