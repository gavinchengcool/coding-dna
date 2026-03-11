# BuilderBio Data Model

The profile consists of two data objects: **D** (primary data) and **E** (extra/chart data).

## D (Primary Data)

```json
{
  "profile": {
    "display_name": "...",
    "lang": "en",
    "date_range": { "start": "2026-01-01", "end": "2026-03-10" },
    "active_days": 18,
    "total_sessions": 25,
    "total_turns": 4200,
    "total_tool_calls": 2100,
    "total_tokens": 850000,
    "summary": "Full-stack builder shipping AI tools and dev infrastructure",
    "tags": ["AI Tooling", "Full-Stack", "Night Builder"],
    "agents_used": {
      "claude-code": { "sessions": 20 },
      "codex": { "sessions": 5 }
    }
  },
  "projects": [
    {
      "name": "...",
      "description": "...",
      "sessions": ["session-id-1", "session-id-2"],
      "tags": ["TypeScript", "Next.js"],
      "total_turns": 1300,
      "total_tool_calls": 620,
      "date_range": { "start": "2026-01-15", "end": "2026-02-20" },
      "status": "shipped"
    }
  ],
  "heatmap": {
    "2026-03-01": 0,
    "2026-03-02": 45,
    "2026-03-03": 120
  },
  "style": {
    "avg_session_turns": 55,
    "session_length_distribution": { "short": 10, "medium": 8, "long": 7 },
    "exploration_ratio": 0.07,
    "build_ratio": 0.07,
    "command_ratio": 0.31,
    "style_label": "Delegator x Sprinter",
    "style_sub": "Drives AI with short commands, frequent brief sessions",
    "prompt_type_label": "Delegator",
    "prompt_type_desc": "Short commands, trusts AI to execute autonomously",
    "rhythm_label": "Sprinter",
    "tool_pref_label": "Commander",
    "loyalty_label": "Polygamous",
    "loyalty_desc": "Uses both Claude Code and Codex",
    "tool_totals": { "Bash": 500, "Read": 300, "Write": 200, "Edit": 150 }
  },
  "highlights": {
    "biggest_session": { "turns": 200, "display": "Rebuilt auth system from scratch" },
    "busiest_day": { "date": "2026-02-15", "sessions": 8, "turns": 450 },
    "longest_streak": 7,
    "current_streak": 2,
    "favorite_prompt": "Help me build a real-time dashboard..."
  }
}
```

## E (Extra Data — Charts & Analysis)

```json
{
  "time": {
    "hour_distribution": { "0": 2, "1": 0, "10": 30, "14": 25, "22": 15 },
    "period_data": {
      "deep_night": { "sessions": 5, "turns": 200 },
      "morning": { "sessions": 30, "turns": 1500 },
      "afternoon": { "sessions": 20, "turns": 1000 },
      "evening": { "sessions": 15, "turns": 800 }
    },
    "builder_type": "Morning Builder",
    "peak_hour": 10,
    "peak_text": "10 AM is my peak hour",
    "peak_detail": "Most active: 9-11 AM, 69 sessions"
  },
  "tech": {
    "Shell / CLI": 100,
    "HTML / CSS": 31,
    "TypeScript": 85,
    "Python": 45
  },
  "keywords": [
    ["Agent", 30],
    ["Claude Code", 19],
    ["deploy", 15],
    ["build", 12]
  ],
  "evolution": [
    { "week": "2026-01-19", "sessions": 50, "turns": 1584, "avg_turns": 32 },
    { "week": "2026-01-26", "sessions": 30, "turns": 900, "avg_turns": 30 }
  ],
  "evolution_insight": "Started with frequent short sessions, shifted to deep building.",
  "comparison": {
    "claude-code": {
      "sessions": 20,
      "total_turns": 3000,
      "avg_turns": 150,
      "total_tool_calls": 1500,
      "top_tools": [["Bash", 500], ["Read", 300]],
      "distribution": { "short": 5, "medium": 8, "long": 7 }
    }
  },
  "comparison_insight": "Uses Claude Code for deep building, Codex for quick explorations."
}
```

## Page Structure

| # | Section | Content | Key Visual |
|---|---------|---------|-----------|
| 1 | Hero | Builder Identity — total stats, agents, date range | Big numbers + agent badges |
| 2 | Projects | What I Built — project gallery | Cards with tags and stats |
| 3 | Tech Stack | Tech Stack Fingerprint | Horizontal bar chart |
| 4 | Style | How I Build — working style | Style label + trait cards + tool bar |
| 5 | Evolution | Collaboration Evolution Curve | Weekly bar chart + trend insight |
| 6 | Time | Time-of-Day Distribution | 24h bar chart + period cards |
| 7 | Keywords | Prompt Keywords | Word cloud / tag cloud |
| 8 | Agent Cmp | Agent Comparison Panel | Side-by-side stat cards |
| 9 | Heatmap | Activity Heatmap | GitHub-style green grid |
| 10 | Highlights | Highlight Moments | Superlative cards + quote |
| 11 | CTA | Call-to-Action | Install command + invitation |
