# Workflow Details

Detailed phase-by-phase reference for the BuilderBio skill pipeline.

## Phase 1: Discover & Scan

Include all sessions with no time range restriction.

Auto-detect:
- **Which agents**: Scan all known paths. Use whatever exists.
- **Display name**: Use `whoami` as default.
- **Language**: Detect from session history. Scan `display` text — if Chinese character ratio > 0.3, set `lang` to `"zh"`, otherwise `"en"`. All UI chrome (section headers, stat labels, status badges, tooltips, CTA, footer) is always rendered in English regardless of `lang`. The `lang` setting only affects user-generated content.

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

## Phase 2: Parse All Sessions

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

Use `--days 0` to include ALL sessions with no time limit. The parser treats `--days <= 0` as full-history scan, merges Claude sidechains by `sessionId`, prefers Codex `total_token_usage` max snapshots, and scans Trae `workspaceStorage` `state.vscdb` files in addition to global storage. Only include flags for agents with detected data. The script skips missing directories gracefully.

If the script fails, fall back to manual parsing: read each JSONL file and extract the fields documented in the format references.

## Phase 3: Analyze & Build Profile

Read the parsed data and produce the full BuilderBio analysis. Build both the **D** (primary data) and **E** (extra data) objects. Refer to [profile-dimensions.md](profile-dimensions.md) for the full rubric.

The eleven sections:

### 1. Builder Identity (hero stats)
- Total sessions, active days, total turns, total tool calls, tokens
- Agent badges showing which tools the person uses, including `first_session` date (earliest session date per agent)
- Date range covered

### 2. What I Built (project gallery)
- Cluster sessions into **projects** by cwd, keyword overlap, temporal proximity
- Each project card: name, one-line description, tech stack tags, session count, total turns, status
- This is the most important section — it answers "what did you ship?"

### 3. Tech Stack Fingerprint
- Infer technologies from tool calls (file types) and prompt keywords
- Horizontal bar chart, 0-100 scale, top 10 tech areas

### 4. How I Build (working style)
- **Prompt style**: Architect / Conversationalist / Delegator / Explorer
- **Session rhythm**: Sprinter / Marathoner / Balanced
- **Tool preference**: Explorer / Builder / Commander / Balanced
- **Agent loyalty**: Monogamous / Multi-agent / Experimenter
- Tool distribution bar with legend

### 5. Collaboration Evolution Curve
- Weekly bar chart showing turns volume over time
- Trend insight text describing the pattern (exploration → deep building)

### 6. Time-of-Day Distribution
- 24-column bar chart, colored by time period
- Period summary cards (deep night / morning / afternoon / evening)
- Builder type label (e.g., "Morning Builder")

### 7. Prompt Keywords
- Word cloud extracted from all session first messages
- Font size proportional to frequency, top 20-30 keywords

### 8. Agent Comparison Panel
- Side-by-side cards for each agent used (skip if single agent)
- Stats: sessions, turns, avg turns, tool calls, top tools, session length distribution
- Usage insight text summarizing differences

### 9. Activity Heatmap
- GitHub-style contribution grid
- Streak data: longest streak, current streak, active days ratio

### 10. Highlight Moments
- Biggest session, busiest day, longest streak, fun fact comparison
- Featured prompt in a styled quote block

### 11. CTA (Call-to-Action)
- "Show the world your taste" with install command
- "Send this to your coding agent — get your bio link"

### Summary & Tags (for taste-board cards)

Generate these fields in `D.profile` for the taste-board listing page:
- `summary`: A one-line bio tagline (e.g., "Full-stack builder shipping AI tools and dev infrastructure").
- `tags`: An array of 3-6 short tags (e.g., `["AI Tooling", "Full-Stack", "Open Source", "Night Builder"]`). Mix technical domains with personality/style traits.

### Privacy in analysis

Redact all file paths to generic placeholders. Strip any credentials or API keys found in session content. Redaction is applied by default.

## Phase 3.5: Choose Visual Style

This is the only step that requires user input.

Ask the user to choose a visual theme:

| Theme | Description |
|-------|-------------|
| `default` | Dark mode with purple-blue accent — clean and professional |
| `yc-orange` | Dark mode with YC orange (#FF6B35) — for builders and founders |
| `terminal-green` | Black background, green text, monospace font — hacker aesthetic |
| `minimal-light` | Light mode, black and white, lots of whitespace — minimalist |
| `cyberpunk` | Dark mode with neon pink-blue gradients and glow effects — futuristic |

If the user has no preference, default to `default`. Store the chosen theme name as `style_theme`.

## Phase 3.6: Compute Data Hash (for Unfiltered badge)

After building D and E data, compute a verification hash. Profiles with a valid hash get an "Unfiltered" badge — a mark of authenticity.

Compute this hash BEFORE any user modifications. Do not recompute after user changes.

```bash
# SHA-256 of: total_sessions|total_turns|total_tokens|active_days|project_count
DATA_HASH=$(echo -n "${TOTAL_SESSIONS}|${TOTAL_TURNS}|${TOTAL_TOKENS}|${ACTIVE_DAYS}|${PROJECT_COUNT}" | shasum -a 256 | cut -c1-64)
```

The hash covers:
- `D.profile.total_sessions`
- `D.profile.total_turns`
- `D.profile.total_tokens`
- `D.profile.active_days`
- Length of `D.projects` array

Send as `data_hash` in the publish API call.

## Phase 4: Publish to builderbio.dev

The system uses a **device_id** (a stable local machine identifier) to tie each machine to a unique short code. The same device always gets the same `<shortcode>.builderbio.dev` URL, even across reinstalls.

### Step 1: Read or generate device_id

Check `~/.builderbio/config.json` for an existing `device_id` and `publish_token`. If no config exists, generate a new device_id:

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

### Step 2: Publish

Send the profile data with device_id to the publish endpoint. The server generates a unique 8-character short code automatically.

**Required payload keys** (use these exact names):
- `style_theme` (not `theme`)
- `builderbio` containing `{ D, E }` (not `extra`, not top-level `D`/`E`)

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

Response:
```json
{
  "success": true,
  "url": "https://abc12xyz.builderbio.dev",
  "slug": "abc12xyz",
  "publish_token": "TOKEN (only on first publish or token refresh)"
}
```

### Step 3: Save config

On success, save the device_id, slug, and publish_token to `~/.builderbio/config.json`:
```bash
mkdir -p ~/.builderbio
cat > ~/.builderbio/config.json << 'ENDCONFIG'
{"device_id":"DEVICE_ID","slug":"SLUG_FROM_RESPONSE","publish_token":"TOKEN_FROM_RESPONSE"}
ENDCONFIG
```

### Step 4: Handle errors

If the API returns an error, show it and retry once.

### Step 5: Done

Print the live URL:
```
Your BuilderBio is live at: https://abc12xyz.builderbio.dev
```

The user can re-run this skill anytime to update their profile. The same device always publishes to the same URL (tied to the device_id).

## Phase 5: Review (Optional)

After publishing, briefly mention:
- "Your BuilderBio is live. You can re-run this anytime to update it."
- "To change your profile, just say 'update my builderbio' and I'll re-scan and re-publish."

Keep it clean — the aha moment is the published URL.
