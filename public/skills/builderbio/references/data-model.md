# BuilderBio Data Model

BuilderBio should be built in layers.

Do not jump straight from raw logs to final page copy.

## Layer Model

1. **Scan Evidence**
2. **Canonical Sessions**
3. **Derived Facts**
4. **Narrative Claims**
5. **Render Data**

The final published shape still uses `D` and `E`, but think of them as the render layer built on top of evidence and facts.

## 1. Scan Evidence

Primary parser output:

```json
{
  "scanner_version": "0.7.3",
  "scan_audit": {
    "summary": {
      "status": "partial",
      "confidence": 0.86,
      "sessions_parsed": 154,
      "sources_discovered": 21,
      "sources_parsed": 18,
      "partial_sessions": 7,
      "unknown_sources": 2,
      "recommended_action": "Re-run BuilderBio after adding support for the missing IDE-hosted logs."
    },
    "agent_sources_found": {
      "codex": 8,
      "claude-code": 4,
      "trae": 6,
      "cursor": 1
    },
    "agents": {
      "codex": {
        "sources_discovered": 8,
        "sources_parsed": 8,
        "partial_sessions": 0,
        "warnings": []
      }
    },
    "unknown_sources": [
      {
        "path": "~/Library/Application Support/VendorX/logs/chat-1.jsonl",
        "reason": "No dedicated parser yet",
        "probe_hint": "chat-like-jsonl",
        "agent_hint": "vendorx"
      }
    ]
  }
}
```

## 2. Canonical Sessions

Each parsed session should preserve provenance.

```json
{
  "agent": "codex",
  "session_id": "abc123",
  "date": "2026-03-11",
  "turns": 88,
  "tool_calls": 41,
  "tokens": 26628,
  "cwd": "~/Documents/project-x",
  "display": "Refined onboarding flow and fixed edge cases",
  "parse_mode": "complete",
  "source_refs": [
    "~/.codex/sessions/2026/03/11/rollout-abc123.jsonl"
  ],
  "partial_reasons": []
}
```

These session-level receipts are what later claims must stand on.

## 3. Derived Facts

Facts should be computed before any prose generation.

Recommended fact buckets:

- `agent_mix`
- `project_clusters`
- `time_rhythm`
- `tool_distribution`
- `evolution_stages`
- `signature_candidates`
- `highlight_candidates`

Examples:

```json
{
  "facts": {
    "dominant_agent": "codex",
    "secondary_agent": "claude-code",
    "command_ratio": 0.64,
    "peak_hour": 3,
    "builder_type": "Morning Builder",
    "signature_project_id": "openclaw",
    "eras": [
      {
        "label": "Exploration",
        "start": "2026-02-02",
        "end": "2026-02-12",
        "summary": "Many short sessions, quick iteration, broad surface area."
      },
      {
        "label": "Shipping",
        "start": "2026-02-24",
        "end": "2026-03-11",
        "summary": "Fewer projects, deeper focus, heavier execution."
      }
    ]
  }
}
```

## 4. Narrative Claims

Narrative claims are human-readable but still structured.

Recommended additions inside `D`:

```json
{
  "narrative": {
    "builder_thesis": "The builder who ships product before writing the pitch.",
    "signature_build": {
      "project_name": "BuilderBio",
      "why_it_matters": "It compresses a messy multi-agent history into a shareable identity artifact.",
      "proof_points": [
        "Spans 34 active days",
        "Touched by Claude Code, Codex, and Trae",
        "Contains the sharpest shift from exploration to shipping"
      ]
    },
    "taste_signals": [
      {
        "label": "CLI first",
        "detail": "Most decisive moments happen through commands, not long prompt essays."
      },
      {
        "label": "Multi-agent operator",
        "detail": "Different agents are used for different cognitive jobs."
      }
    ],
    "agent_roles": [
      {
        "agent": "codex",
        "role": "Fast scalpel",
        "evidence": "High session count, high Bash usage, shorter average depth."
      },
      {
        "agent": "claude-code",
        "role": "Deep workbench",
        "evidence": "Longer average sessions with more read/write cycles."
      }
    ],
    "builder_eras": [
      {
        "title": "Exploration",
        "date_range": "Early February",
        "summary": "Wide surface area, short loops, searching for leverage."
      },
      {
        "title": "Shipping",
        "date_range": "Late February to March",
        "summary": "Longer sessions, fewer threads, more irreversible output."
      }
    ]
  }
}
```

## 5. Render Data (Published `D` and `E`)

`D` is the page’s primary story data.

`E` is the supporting evidence and chart layer.

There is also a server-derived verification layer used for trust badges.

### Verification Layer

This should not be faked in local copy generation.

Recommended fields:

```json
{
  "verification": {
    "data_hash": "sha256(...)",
    "verification_key": "230|12711|9990000000|34|9",
    "unfiltered": true
  }
}
```

Semantics:

- `data_hash` should be stored with the published profile
- `verification_key` should be computed from the stable top-line counts
- `unfiltered` should be computed by the server by comparing expected hash to stored hash

`Unfiltered` is a trust badge, not a narrative claim.

`profile.lang` should store the dominant language from the builder's real local conversations with coding agents. Narrative copy inside modules should follow this language. Module titles, product badges, and the `Make your own` CTA stay English.

### Recommended `D` shape

```json
{
  "profile": {
    "display_name": "Gavin",
    "summary": "Builder shipping AI-native tools and product systems",
    "builder_thesis": "The builder who ships product before writing the pitch.",
    "lang": "en",
    "date_range": { "start": "2026-01-19", "end": "2026-03-10" },
    "active_days": 34,
    "total_sessions": 230,
    "total_turns": 12711,
    "total_tool_calls": 8800,
    "total_tokens": 9990000000,
  "scanner_version": "0.7.3",
    "scan_status": "partial",
    "scan_recommendation": "Re-run BuilderBio if you recently used an unsupported editor-hosted agent.",
    "generated_at": "2026-03-10",
    "agent_sources_found": {
      "claude-code": 4,
      "codex": 8,
      "trae": 6
    },
    "tags": ["AI Tooling", "Operator", "Morning Builder"],
    "agents_used": {
      "claude-code": { "sessions": 51, "first_session": "2026-01-19" },
      "codex": { "sessions": 179, "first_session": "2026-01-19" }
    }
  },
  "narrative": {
    "builder_thesis": "The builder who ships product before writing the pitch.",
    "signature_build": { "...": "..." },
    "taste_signals": [{ "...": "..." }],
    "agent_roles": [{ "...": "..." }],
    "builder_eras": [{ "...": "..." }]
  },
  "projects": [],
  "highlights": {},
  "heatmap": {},
  "style": {}
}
```

### Recommended `E` shape

```json
{
  "scan_audit": { "...": "..." },
  "tech": {},
  "time": {},
  "evolution": [],
  "evolution_insight": "The builder moved from broad exploration into fewer, deeper shipping arcs.",
  "comparison": {},
  "comparison_insight": "Codex handles speed loops; Claude Code handles deeper build sessions."
}
```

## Render Rules

- Public-facing listing cards should mostly consume `D.profile.summary`, `D.profile.tags`, and simple agent labels.
- Detail pages should use `D.narrative` first, then fall back to older summary fields if needed.
- Internal scanner internals belong in `E.scan_audit`, not in the public hero.

## Data Integrity Rule

If a narrative field exists but its supporting fact does not, prefer removing the narrative field over bluffing.
