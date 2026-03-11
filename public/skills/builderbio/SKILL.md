---
name: builderbio
version: 0.5.2
description: |
  This skill should be used when the user wants to generate a shareable "BuilderBio" — a profile page showcasing everything they built with AI coding agents (Claude Code, Codex, Trae, Antigravity, Kiro, Windsurf, OpenClaw, and more). It scans all local agent sessions, aggregates stats, clusters projects, and produces a personal portfolio. This skill should be used when the user mentions "BuilderBio", "builder bio", "builder profile", "share my builds", "coding history", "AI portfolio", "showcase", "分享", "画像", "展示", "导出", or "profile".
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

This is not a single-session report. It aggregates ALL sessions into a personal BuilderBio that answers: "What has this person been building with AI, and how?"

## Execution Mode

**Run autonomously.** When this skill is triggered (either by the install script or by the user), execute all phases in sequence without stopping for confirmation. The system generates a unique short code for each user automatically.

**When triggered by the install script output, execute immediately without waiting for additional user input. Run all phases straight through.**

The only user input is **choosing a visual style theme** (Phase 3.5). Everything else is automatic.

## Quick Start

1. Scan ALL local agent sessions (no time range limit)
2. Parse each session into lightweight summary data
3. Analyze and build the full profile data model (D + E)
4. Ask user to choose a visual style theme
5. Auto-publish to `<shortcode>.builderbio.dev`
6. Print the live URL

## Supported Agents & Log Locations

| Agent | Log Location | Format |
|-------|-------------|--------|
| Claude Code | `~/.claude/projects/**/*.jsonl` | JSONL |
| Claude Code history | `~/.claude/history.jsonl` | JSONL (summaries) |
| Codex (OpenAI) | `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` | JSONL |
| Trae (ByteDance) | `~/Library/Application Support/Trae/User/**/state.vscdb` | SQLite |
| Trae CN | `~/Library/Application Support/Trae CN/User/**/state.vscdb` | SQLite |
| Antigravity (Gemini) | `~/.antigravity_tools/proxy_logs.db` | SQLite |
| Kiro (AWS) | `~/.kiro/` | SQLite / JSON |
| Windsurf (Codeium) | `~/.windsurf/transcripts/*.jsonl` | JSONL |
| OpenClaw | `~/.openclaw/agents/<agentId>/sessions/<session-id>.jsonl` | JSONL |
| Generic import | `--import-dir` path | JSON/JSONL |

For parsing details, see [references/claude-code-format.md](references/claude-code-format.md) and [references/codex-format.md](references/codex-format.md).

**OpenClaw format**: Each `.jsonl` file contains messages with `type` (session/message), `timestamp`, `message.role` (user/assistant/toolResult), and `message.content[]` (filter `type=="text"` for human-readable content). Session metadata is in `sessions.json` in the same directory.

**Claude Code format**: Recursively scan `~/.claude/projects/**/*.jsonl`, including `subagents/agent-*.jsonl` and top-level `agent-*.jsonl`. Merge all files sharing the same `sessionId` into one logical session. Count Claude tokens as `input_tokens + cache_read_input_tokens + cache_creation_input_tokens + cached_input_tokens + output_tokens + reasoning_output_tokens` when present.

**Codex format**: Prefer `event_msg.payload.info.total_token_usage` (or `token_count_info.total_token_usage`) and take the max snapshot within a session to avoid duplicate cumulative counts. If missing, fall back to `last_token_usage`, then old `token_usage` events.

**Trae format**: Sessions live in both global storage and `workspaceStorage` `state.vscdb` files. Query `ItemTable` for keys matching `%icube-ai-chat-storage%`, `%icube-ai-ng-chat-storage%`, `%icube-ai-agent-storage%`, `%icube-ai-ng-agent-storage%`, and `chatHistoryNeedToBeMigrated-%`. Token counts remain unstable, so count sessions/turns and leave tokens at `0`.

**Antigravity format**: API requests in `proxy_logs.db` SQLite. Grouped into sessions by 30-min time gaps. Tokens from `input_tokens`/`output_tokens` columns.

**Kiro format**: Schema discovery on `.db` files under `~/.kiro/`. Also parses JSON exports from `/chat save`.

**Windsurf format**: JSONL transcripts with event types: `user_input`, `planner_response`, `code_action`, `command_action`, `search_action`.

**Generic import**: Place `.json` (pre-formatted session dicts) or `.jsonl` (role-based messages) in a directory and pass via `--import-dir`.

## Workflow

### Phase 1: Discover & Scan

**Do not ask the user about time range. Default to ALL available sessions.**

Auto-detect:
- **Which agents**: Scan all known paths. Use whatever exists.
- **Display name**: Run `whoami` as default. Do NOT prompt the user — use the system username.
- **Language**: Detect from session history. Scan `display` text — if Chinese character ratio > 0.3, set `lang` to `"zh"`, otherwise `"en"`. **Important**: All UI chrome (section headers, stat labels, status badges, tooltips, CTA, footer) is always rendered in English regardless of `lang`. The `lang` setting only affects user-generated content.

Scan for sessions:

```bash
# Claude Code — recursively list root sessions and sidechains
find ~/.claude/projects -name '*.jsonl' 2>/dev/null | head -200

# Codex — list all session files
ls -lt ~/.codex/sessions/*/*/*/*.jsonl 2>/dev/null | head -100

# Trae
find ~/Library/Application\ Support/Trae/User -name state.vscdb 2>/dev/null | head -50
find ~/Library/Application\ Support/Trae\ CN/User -name state.vscdb 2>/dev/null | head -50

# Antigravity
ls -la ~/.antigravity_tools/proxy_logs.db 2>/dev/null

# Kiro
ls -la ~/.kiro/*.db 2>/dev/null

# Windsurf
ls -lt ~/.windsurf/transcripts/*.jsonl 2>/dev/null | head -100

# OpenClaw — list all session files
ls -lt ~/.openclaw/agents/*/sessions/*.jsonl 2>/dev/null | head -100
```

Read `~/.claude/history.jsonl` to get human-readable display text per session.

### Phase 2: Parse All Sessions

Run the parser on ALL session files to extract session summaries:

```bash
python <skill-path>/scripts/parse_sessions.py \
  --claude-dir ~/.claude \
  --codex-dir ~/.codex \
  --trae-dir "~/Library/Application Support/Trae" \
  --antigravity-dir ~/.antigravity_tools \
  --kiro-dir ~/.kiro \
  --windsurf-dir ~/.windsurf \
  --openclaw-dir ~/.openclaw \
  --days 0 \
  --output /tmp/builder_profile_data.json
```

Use `--days 0` to include ALL sessions with no time limit. The parser treats `--days <= 0` as full-history scan, merges Claude sidechains by `sessionId`, and prefers Codex cumulative token snapshots over duplicate per-turn additions. Only include flags for agents with detected data. The script skips missing directories gracefully.

If the script fails, fall back to manual parsing: read each JSONL file and extract the fields documented in the format references.

### Phase 3: Analyze & Build Profile

This is the core intellectual work. Read the parsed data and produce the full BuilderBio analysis. Build both the **D** (primary data) and **E** (extra data) objects. Refer to [references/profile-dimensions.md](references/profile-dimensions.md) for the full rubric.

The eleven sections:

#### 1. Builder Identity (hero stats)
- Total sessions, active days, total turns, total tool calls, tokens
- Agent badges showing which tools the person uses, including `first_session` date (earliest session date per agent)
- Date range covered

#### 2. What I Built (project gallery)
- Cluster sessions into **projects** by cwd, keyword overlap, temporal proximity
- Each project card: name, one-line description, tech stack tags, session count, total turns, status
- This is the most important section — it answers "what did you ship?"

#### 3. Tech Stack Fingerprint
- Infer technologies from tool calls (file types) and prompt keywords
- Horizontal bar chart, 0-100 scale, top 10 tech areas

#### 4. How I Build (working style)
- **Prompt style**: Architect / Conversationalist / Delegator / Explorer
- **Session rhythm**: Sprinter / Marathoner / Balanced
- **Tool preference**: Explorer / Builder / Commander / Balanced
- **Agent loyalty**: Monogamous / Multi-agent / Experimenter
- Tool distribution bar with legend

#### 5. Collaboration Evolution Curve
- Weekly bar chart showing turns volume over time
- Trend insight text describing the pattern (exploration → deep building)

#### 6. Time-of-Day Distribution
- 24-column bar chart, colored by time period
- Period summary cards (deep night / morning / afternoon / evening)
- Builder type label (e.g., "Morning Builder")

#### 7. Prompt Keywords
- Word cloud extracted from all session first messages
- Font size proportional to frequency, top 20-30 keywords

#### 8. Agent Comparison Panel
- Side-by-side cards for each agent used (skip if single agent)
- Stats: sessions, turns, avg turns, tool calls, top tools, session length distribution
- Usage insight text summarizing differences

#### 9. Activity Heatmap
- GitHub-style contribution grid
- Streak data: longest streak, current streak, active days ratio

#### 10. Highlight Moments
- Biggest session, busiest day, longest streak, fun fact comparison
- Featured prompt in a styled quote block

#### 11. CTA (Call-to-Action)
- "Show the world your taste" with install command
- "Send this to your coding agent — get your bio link"

**Summary & Tags (for taste-board cards)**:
Generate these fields in `D.profile` — they will be displayed on the taste-board listing page:
- `summary`: A one-line description of the builder (e.g., "Full-stack builder shipping AI tools and dev infrastructure"). Should read like a bio tagline, not a stat dump.
- `tags`: An array of 3-6 short tags that describe this builder (e.g., `["AI Tooling", "Full-Stack", "Open Source", "Night Builder"]`). Mix technical domains with personality/style traits.

**Privacy**: Automatically redact all file paths to generic placeholders. Strip any credentials or API keys found in session content. Do NOT ask the user about privacy — just redact by default.

### Phase 3.5: Choose Visual Style

**This is the only step that requires user input.**

Ask the user to choose a visual theme for their BuilderBio page. Present these 5 options:

| Theme | Description |
|-------|-------------|
| `default` | Dark mode with purple-blue accent — clean and professional |
| `yc-orange` | Dark mode with YC orange (#FF6B35) — for builders and founders |
| `terminal-green` | Black background, green text, monospace font — hacker aesthetic |
| `minimal-light` | Light mode, black and white, lots of whitespace — minimalist |
| `cyberpunk` | Dark mode with neon pink-blue gradients and glow effects — futuristic |

If the user doesn't have a preference or wants to skip, default to `default`.

Store the chosen theme name as `style_theme` for the publish API call.

### Phase 3.6: Compute Data Hash (for Unfiltered badge)

After building D and E data, compute a verification hash. This hash allows the server to verify that the data was not manually modified. Profiles with a valid hash get an "Unfiltered" badge displayed next to the name — a mark of authenticity.

**IMPORTANT: Compute this hash BEFORE any user modifications. Do NOT recompute after the user makes changes.**

```bash
# The hash is SHA-256 of: total_sessions|total_turns|total_tokens|active_days|project_count
DATA_HASH=$(echo -n "${TOTAL_SESSIONS}|${TOTAL_TURNS}|${TOTAL_TOKENS}|${ACTIVE_DAYS}|${PROJECT_COUNT}" | shasum -a 256 | cut -c1-64)
```

The hash covers these exact fields from D.profile and D.projects:
- `D.profile.total_sessions`
- `D.profile.total_turns`
- `D.profile.total_tokens`
- `D.profile.active_days`
- Length of `D.projects` array

Send the hash as `data_hash` in the publish API call.

### Phase 4: Publish to builderbio.dev

**This step is fully automatic. No user input needed.**

The system uses a **device_id** (a stable local machine identifier) to tie each machine to a unique short code. The same device always gets the same `<shortcode>.builderbio.dev` URL, even across reinstalls.

1. **Read or generate device_id**: Check `~/.builderbio/config.json` for an existing `device_id` and `publish_token`. If no config exists, generate a new device_id:

```bash
# Generate a stable device_id from machine identity
DEVICE_ID=$(echo "$(hostname)-$(whoami)-$(uname -m)" | shasum -a 256 | cut -c1-64)

# Check for existing config
CONFIG_FILE=~/.builderbio/config.json
PUBLISH_TOKEN=""
if [ -f "$CONFIG_FILE" ]; then
  DEVICE_ID=$(python3 -c "import json; c=json.load(open('$CONFIG_FILE')); print(c.get('device_id',''))" 2>/dev/null || echo "$DEVICE_ID")
  PUBLISH_TOKEN=$(python3 -c "import json; c=json.load(open('$CONFIG_FILE')); print(c.get('publish_token',''))" 2>/dev/null || echo "")
fi
```

2. **Publish**: Send the profile data with device_id to the publish endpoint. The server generates a unique 8-character short code automatically:

```bash
curl -s -X POST https://builderbio.dev/api/profile/publish \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "DEVICE_ID_VALUE",
    "publish_token": "TOKEN_OR_EMPTY_STRING",
    "data_hash": "SHA256_HASH_FROM_PHASE_3_6",
    "style_theme": "default",
    "profile": {
      "summary": "ONE_LINE_SUMMARY",
      "display_name": "DISPLAY_NAME",
      "sessions_analyzed": N,
      "total_tokens": N
    },
    "builderbio": {
      "D": { ... full D data object ... },
      "E": { ... full E data object ... }
    }
  }'
```

The response will contain:
```json
{
  "success": true,
  "url": "https://abc12xyz.builderbio.dev",
  "slug": "abc12xyz",
  "publish_token": "TOKEN (only on first publish or token refresh)"
}
```

3. **Save config**: On success, save the device_id, slug, and publish_token to `~/.builderbio/config.json`:
```bash
mkdir -p ~/.builderbio
cat > ~/.builderbio/config.json << 'ENDCONFIG'
{"device_id":"DEVICE_ID","slug":"SLUG_FROM_RESPONSE","publish_token":"TOKEN_FROM_RESPONSE"}
ENDCONFIG
```

4. **Handle errors**: If the API returns an error, show it and retry once.

5. **Done!** Print the live URL clearly:
```
Your BuilderBio is live at: https://abc12xyz.builderbio.dev
```

The user can re-run this skill anytime to update their profile. The same device always publishes to the same URL (tied to the device_id).

### Phase 5: Review (Optional)

After publishing, briefly mention:
- "Your BuilderBio is live. You can re-run this anytime to update it."
- "To change your profile, just say 'update my builderbio' and I'll re-scan and re-publish."

Do NOT prompt for feedback unprompted. Keep it clean — the aha moment is the published URL.

## Data Model & Page Structure

For the full D (primary data) and E (extra data) JSON schemas, and the 11-section page structure table, see [references/data-model.md](references/data-model.md).

Build both D and E data objects and inject into the publish API call.

## Important Notes

- The profile page is about the PERSON, not individual sessions
- Project clustering requires judgment — sessions about the same topic should be grouped
- The "How I Build" section should feel like a personality assessment, not a dry report
- Highlight moments should be written in a way that's fun to share ("You talked to AI more than most people talk to their coworkers")
- The tone should be celebratory — this is something people share on social media
- **Run autonomously** — only user interaction is choosing a visual theme
- **Default to ALL data** — never ask about time ranges
- **Publish directly** — no local HTML file needed, go straight to `<shortcode>.builderbio.dev`
- **Compute data_hash BEFORE showing data to user** — this preserves the Unfiltered badge
- **Generate good summary and tags** — these show up on the taste-board listing page
