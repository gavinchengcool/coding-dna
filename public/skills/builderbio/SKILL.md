# builderbio

Generate and publish your AI coding profile to builderbio.dev — one command, no login.

## What This Does

Scans your local AI coding sessions (Claude Code, Cursor, Codex), analyzes them to build a developer profile, and publishes it to `username.builderbio.dev`. All analysis happens locally — only the generated profile is sent to the server.

---

## Step 1: Discover Sessions

Scan for AI coding session files on this machine. Look in these directories for files modified in the last 30 days, skipping files smaller than 100 bytes:

**Claude Code:**
```
~/.claude/projects/**/*.jsonl
```

**Cursor (macOS):**
```
~/Library/Application Support/Cursor/User/workspaceStorage/**/ai-chat/*.json
```

**Cursor (Linux):**
```
~/.config/Cursor/User/workspaceStorage/**/ai-chat/*.json
```

**Codex:**
```
~/.codex/sessions/**/*.jsonl
```

Use `find` or glob to locate files. Collect the paths and sort by modification time (newest first). Keep up to 20 session files for analysis.

Tell the user how many sessions you found and from which tools.

If zero sessions are found, stop and explain that you need AI coding session history to generate a profile.

---

## Step 2: Analyze Sessions

Read the session files you discovered. For each file:
- JSONL files: each line is a JSON object with conversation turns
- JSON files: may contain an array of messages or a chat object

From these sessions, generate the following profile data:

### Summary (required)
A 2-3 sentence developer portrait in third person. Example:
> "A full-stack developer who favors pragmatic solutions over theoretical perfection. Gravitates toward TypeScript and React ecosystems, with a growing interest in systems programming. Approaches debugging methodically, often isolating variables before attempting fixes."

Be honest. Write like a colleague who has observed the developer, not marketing copy.

### Portrait
```json
{
  "cognitive_style": {
    "explorer_vs_optimizer": 0.7,
    "big_picture_vs_detail": 0.4,
    "intuitive_vs_analytical": 0.6,
    "solo_vs_collaborative": 0.5,
    "move_fast_vs_careful": 0.65,
    "generalist_vs_specialist": 0.55
  },
  "decision_style": "1-2 sentences on how they weigh trade-offs."
}
```

Each cognitive style axis is a 0.0–1.0 spectrum:
1. **Explorer vs Optimizer** (0=optimizer, 1=explorer): New approaches vs refining existing ones?
2. **Big Picture vs Detail** (0=detail, 1=big-picture): Architecture vs implementation focus?
3. **Intuitive vs Analytical** (0=analytical, 1=intuitive): Data-driven vs experience-driven?
4. **Solo vs Collaborative** (0=solo, 1=collaborative): Independent vs seeking input?
5. **Move Fast vs Careful** (0=careful, 1=fast): Speed vs thoroughness?
6. **Generalist vs Specialist** (0=specialist, 1=generalist): Deep in one area vs broad?

### Framework Sentences
5-8 sentences that characterize the developer. Each should be specific and evidence-based:
- "The kind of developer who [specific behavioral pattern]."
- "Tends to [characteristic approach]."
- "When stuck, typically [recovery strategy]."
- "Values [principle] over [alternative], as seen in [evidence]."

Avoid generic statements that could apply to anyone.

### Activity Map
A heatmap of coding activity by day-of-week and hour. Format:
```json
{
  "Mon": {"9": 3, "10": 5, "14": 2},
  "Tue": {"11": 4, "15": 7}
}
```
Count the number of conversation turns per hour from timestamps in the session files. Use the user's local timezone.

### Behavioral Fingerprint
Patterns extracted from conversation data:
```json
{
  "avg_prompt_length": 150,
  "question_ratio": 0.35,
  "iteration_depth": 3.2,
  "languages_used": ["TypeScript", "Python"],
  "most_active_hour": 14,
  "most_active_day": "Wed",
  "session_count": 15,
  "avg_session_length_turns": 12
}
```

### Search Profile
Skills, languages, frameworks, and domains actually used in conversations:
```json
{
  "skills": ["debugging", "refactoring", "api-design"],
  "languages": ["TypeScript", "Python", "Go"],
  "frameworks": ["Next.js", "FastAPI", "React"],
  "domains": ["web-development", "devtools", "data-engineering"]
}
```

Only include things actually observed in conversations. Don't inflate.

### Stats
- `sessions_analyzed`: number of session files read
- `total_tokens`: estimate total tokens across all sessions (rough: 4 chars ≈ 1 token, count all text in conversations)

---

## Step 3: Choose Username

Ask the user what username they want for their profile URL. Rules:
- 3-30 characters
- Lowercase letters, numbers, and hyphens only
- Must start with a letter
- Must end with a letter or number
- No consecutive hyphens
- Reserved words not allowed: api, www, admin, auth, me, club, app, dashboard, login, signup, settings, profile, search, help, about, blog, docs, status, support, billing

The profile will be published at `https://username.builderbio.dev`

---

## Step 4: Publish

Check for an existing publish token:
```bash
cat ~/.builderbio/config.json 2>/dev/null
```

If the file exists and contains a `publish_token`, include it in the request.

Send the profile to the builderbio API:

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "username": "USERNAME",
    "publish_token": "TOKEN_IF_EXISTS",
    "profile": {
      "summary": "...",
      "portrait": {...},
      "framework_sentences": [...],
      "activity_map": {...},
      "behavioral_fingerprint": {...},
      "search_profile": {...},
      "sessions_analyzed": N,
      "total_tokens": N
    }
  }' \
  https://builderbio.dev/api/profile/publish
```

### Handle the response:

**Success (new profile):** Response includes `publish_token`. Save it:
```bash
mkdir -p ~/.builderbio
cat > ~/.builderbio/config.json << 'CONF'
{
  "publish_token": "THE_TOKEN_FROM_RESPONSE",
  "username": "USERNAME",
  "url": "https://username.builderbio.dev"
}
CONF
```

Tell the user:
- Their profile is live at `https://username.builderbio.dev`
- The publish token has been saved — they can re-run this skill to update their profile
- **Important:** Back up `~/.builderbio/config.json` — the token proves ownership of the username

**Success (update):** No new token returned. Tell the user their profile has been updated.

**Username taken (409):** The API returns a suggestion. Tell the user and ask them to pick a different username, then retry.

**Rate limited (429):** Tell the user to wait and try again.

**Other errors:** Show the error message from the API response.

---

## Notes

- All conversation data is analyzed locally. Only the generated summary and profile metadata are sent to the server.
- Re-run this skill anytime to update your profile with new sessions.
- Your publish token is your proof of username ownership — keep `~/.builderbio/config.json` safe.
- No account, no password, no browser needed.
