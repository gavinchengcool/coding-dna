# coding-dna-summarize

Analyze your AI coding conversations and generate your developer skill profile.

## 7-Step Flow

This skill runs a complete analysis pipeline. Follow each step in order.

### Step 1: Version Check

Check if the installed version is current:

```bash
LOCAL_VERSION=$(cat ~/.coding-dna/skills/VERSION 2>/dev/null || echo "0.0.0")
echo "Installed version: ${LOCAL_VERSION}"
```

If outdated, suggest running: `curl -sfL https://coding-dna.vercel.app/install.sh | bash`

### Step 2: Authentication

Run the device authentication flow:

```bash
bash ~/.coding-dna/skills/coding-dna-summarize/device-auth.sh
```

This will:
- Check for existing valid token
- If needed, start device auth flow and open browser
- Save token to `~/.coding-dna/config.json`

### Step 3: Discover Sessions

Scan for AI coding sessions on this machine:

```bash
bash ~/.coding-dna/skills/coding-dna-summarize/scripts/discover-sessions.sh 30
```

This scans Claude Code, Cursor, and Codex session directories from the last 30 days.
Output: `/tmp/coding-dna-sessions.json`

### Step 4: Compute Local Statistics

Run local analysis (no data leaves your machine):

```bash
python3 ~/.coding-dna/skills/coding-dna-summarize/scripts/compute-stats.py
```

This computes:
- Token estimates
- Activity heatmap (date/hour grid)
- Behavioral fingerprint (prompt patterns, question ratios, etc.)
Output: `/tmp/coding-dna-stats.json`

### Step 5: AI Analysis

Read the analysis prompt and generate insights:

1. Read `~/.coding-dna/skills/coding-dna-summarize/analysis-prompt.md`
2. Read the session files listed in `/tmp/coding-dna-sessions.json` (sample up to 20 most recent)
3. Follow the analysis prompt to generate:
   - Summary paragraph
   - Cognitive style portrait (6 axes)
   - Capability rings (skill categories with levels)
   - Framework sentences (5-8 characterizing statements)
   - Decision style analysis
4. Write output to `/tmp/coding-dna-analysis.json`

### Step 6: Assemble & Upload

Merge stats + AI analysis and upload:

```bash
python3 ~/.coding-dna/skills/coding-dna-summarize/scripts/assemble-payload.py
bash ~/.coding-dna/skills/coding-dna-summarize/scripts/post-sync.sh
```

### Step 7: Preview

The post-sync script will open your dashboard at `/me`.
Review your profile and click "Publish" to make it public.

---

## Notes

- All conversation data is analyzed locally. Only the generated summary/profile is uploaded.
- Sessions older than 30 days are excluded by default.
- Re-run this skill anytime to update your profile with new sessions.
