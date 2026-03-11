---
name: builderbio
version: 0.5.0
description: |
  This skill should be used when the user wants to generate a shareable "BuilderBio" — a profile page showcasing everything they built with AI coding agents (Claude Code, Codex, OpenClaw, etc.). It scans all local agent sessions, aggregates stats, clusters projects, and produces a personal portfolio. This skill should be used when the user mentions "BuilderBio", "builder bio", "builder profile", "share my builds", "coding history", "AI portfolio", "showcase", "generate my profile", "publish my profile", "update my builderbio", "分享", "画像", "展示", "导出", or "profile".
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

# BuilderBio

Generate and publish a shareable **BuilderBio** — a profile page at `<shortcode>.builderbio.dev` that shows everything a person built with AI coding agents.

This is not a single-session report. It aggregates all sessions into a personal profile that answers: "What has this person been building with AI, and how?"

## What This Does

BuilderBio reads local coding agent session logs and computes aggregate
statistics: session counts, tool usage patterns, activity timelines, and
project clusters. It then publishes a profile page summarizing the builder's
history.

**What it reads**: Session metadata from `~/.claude/projects/`, `~/.codex/sessions/`,
and `~/.openclaw/agents/`. Specifically: message counts, tool call names,
timestamps, working directories, and token usage.

**What it does NOT read**: File contents from projects, environment variables,
credentials, API keys, git diffs, or source code.

**What it sends**: A JSON payload containing aggregate stats, project names,
and style analysis to `builderbio.dev/api/profile/publish`. No raw session
content is transmitted. File paths are automatically redacted.

## Privacy & Data Handling

- **Local analysis**: All session parsing runs on the local machine. Raw session data never leaves the device.
- **Publish key**: The device_id is a SHA-256 hash of hostname + username + architecture. It serves as a stable publish key so the same machine always updates the same profile URL. It cannot be reversed.
- **Automatic redaction**: File paths, credentials, and API keys are stripped before the profile is built.
- **Open source**: The full source is readable at `~/.builderbio/skills/builderbio/`.

## Workflow

This skill runs as a single pipeline. The only user interaction is choosing
a visual theme (Phase 3.5). All other phases proceed automatically using
sensible defaults.

### Pipeline overview

1. **Discover** — Scan all local agent session files (no time range limit)
2. **Parse** — Run `scripts/parse_sessions.py` to extract session summaries
3. **Analyze** — Build the full profile data model (D + E objects). See [references/profile-dimensions.md](references/profile-dimensions.md)
4. **Theme** — Ask the user to choose a visual style (only user interaction)
5. **Hash** — Compute data_hash before any user edits (for Unfiltered badge)
6. **Publish** — POST to `builderbio.dev/api/profile/publish`, print the live URL
7. **Done** — Save config to `~/.builderbio/config.json`

For detailed phase instructions, see [references/workflow-details.md](references/workflow-details.md).

### Supported agents & log locations

| Agent | Log Location | Format |
|-------|-------------|--------|
| Claude Code | `~/.claude/projects/<project>/<session>.jsonl` | JSONL |
| Claude Code history | `~/.claude/history.jsonl` | JSONL (summaries) |
| Codex (OpenAI) | `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` | JSONL |
| OpenClaw | `~/.openclaw/agents/<agentId>/sessions/<session-id>.jsonl` | JSONL |

For parsing details, see [references/claude-code-format.md](references/claude-code-format.md) and [references/codex-format.md](references/codex-format.md).

### Key defaults

- **Time range**: All available sessions, no restriction.
- **Display name**: Use `whoami` output.
- **Language**: Auto-detect from session content. Chinese character ratio > 0.3 → `"zh"`, otherwise `"en"`. UI chrome is always English.
- **Theme**: `default` if user has no preference.
- **Redaction**: Applied automatically — file paths, credentials, and API keys are stripped.

### Visual themes

| Theme | Description |
|-------|-------------|
| `default` | Dark mode with purple-blue accent |
| `yc-orange` | Dark mode with YC orange (#FF6B35) |
| `terminal-green` | Black background, green text, monospace |
| `minimal-light` | Light mode, black and white, minimalist |
| `cyberpunk` | Dark mode with neon pink-blue gradients |

## Profile sections

The profile contains eleven sections. For full specifications, see [references/workflow-details.md](references/workflow-details.md).

1. **Builder Identity** — Hero stats: sessions, active days, turns, tool calls, tokens
2. **What I Built** — Project gallery clustered by cwd, keywords, and time
3. **Tech Stack Fingerprint** — Top 10 technologies inferred from tool calls
4. **How I Build** — Working style: prompt style, session rhythm, tool preference
5. **Collaboration Evolution** — Weekly turns volume over time
6. **Time-of-Day Distribution** — 24-hour activity chart with builder type label
7. **Prompt Keywords** — Word cloud from session first messages
8. **Agent Comparison** — Side-by-side stats per agent (skip if single agent)
9. **Activity Heatmap** — GitHub-style contribution grid with streak data
10. **Highlight Moments** — Biggest session, busiest day, fun fact comparison
11. **CTA** — Install command for sharing

Generate `summary` (one-line bio tagline) and `tags` (3-6 short tags) in `D.profile` for the taste-board listing page.

## Data model

For the full D (primary data) and E (extra data) JSON schemas, see [references/data-model.md](references/data-model.md).

Build both D and E data objects and include them in the publish API call.

## Design principles

- The profile is about the person, not individual sessions
- Cluster sessions into projects by topic — use judgment
- "How I Build" should feel like a personality assessment
- Highlight moments should be fun to share
- The tone should be celebratory — this is something people put on social media
- Include all available data with no time range restriction
- Publish directly to `<shortcode>.builderbio.dev`
- Compute data_hash before showing data to user — preserves the Unfiltered badge
