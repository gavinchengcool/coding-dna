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
  "scanner_version": "0.8.2",
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
- `interaction_mode`
- `theme_candidates`

Examples:

```json
{
  "facts": {
    "dominant_agent": "codex",
    "secondary_agent": "claude-code",
    "command_ratio": 0.64,
    "peak_hour": 3,
    "builder_type": "Morning Builder",
    "inferred_interaction_mode": "builder",
    "chosen_interaction_mode": "builder",
    "interaction_mode": "builder",
    "interaction_mode_reason": "Stable project clusters, file-backed sessions, and high tool density make this history build-centric.",
    "inferred_style_theme": "terminal-native",
    "chosen_style_theme": "terminal-native",
    "theme_candidates": [
      {
        "theme": "terminal-native",
        "score": 0.82,
        "reason": "High shell ratio and terminal-heavy tool distribution."
      },
      {
        "theme": "product-operator",
        "score": 0.73,
        "reason": "Product and shipping arcs recur across several projects."
      }
    ],
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

Mode detection happens before theme selection.

Recommended semantics:

- `interaction_mode = builder` when projects, tools, and output artifacts dominate
- `interaction_mode = hybrid` when build activity and open-ended conversation are both central
- `interaction_mode = conversation-first` when threads of thought dominate more than project delivery

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

If `interaction_mode = conversation-first`, use a different narrative shape instead of forcing builder-only modules:

```json
{
  "narrative": {
    "interaction_thesis": "The one who uses AI as a sounding board for ideas, questions, and difficult decisions.",
    "signature_thread": {
      "thread_name": "Late-night reflection loop",
      "why_it_matters": "It shows how the user returns to AI for perspective rather than implementation.",
      "proof_points": [
        "Spans 19 sessions",
        "Low tool density, high turn depth",
        "Recurring reflection and planning prompts"
      ]
    },
    "recurring_threads": [
      {
        "label": "Perspective seeking",
        "detail": "Often returns to the same open questions from new angles."
      }
    ],
    "ai_roles": [
      {
        "agent": "openclaw",
        "role": "Thinking partner",
        "evidence": "Long reflective sessions with almost no code or file-edit traces."
      }
    ]
  }
}
```

## 5. Render Data (Published `D` and `E`)

`D` is the page’s primary story data.

`E` is the supporting evidence and chart layer.

There is also a server-derived verification layer used for trust badges.

### Presentation Fields

Persist both the system pick and the final rendered choice:

- `inferred_interaction_mode`
- `chosen_interaction_mode`
- `interaction_mode` = chosen mode for compatibility
- `inferred_style_theme`
- `chosen_style_theme`
- `style_theme` = chosen theme for compatibility

If the user never overrides anything, inferred and chosen values will match.

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
    "inferred_interaction_mode": "builder",
    "chosen_interaction_mode": "builder",
    "interaction_mode": "builder",
    "interaction_mode_reason": "Projects, tool use, and file-backed sessions dominate the history.",
    "inferred_style_theme": "product-operator",
    "chosen_style_theme": "product-operator",
    "style_theme": "product-operator",
    "style_theme_reason": "Shipping-oriented project arcs and product execution make this the clearest visual fit.",
    "date_range": { "start": "2026-01-19", "end": "2026-03-10" },
    "active_days": 34,
    "total_sessions": 230,
    "total_turns": 12711,
    "total_tool_calls": 8800,
    "total_tokens": 9990000000,
  "scanner_version": "0.8.2",
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
- `interaction_mode` should decide which middle-layer modules render:
  - `builder`: `Signature Build`, `What Actually Got Built`, `Agent Roles`
  - `conversation-first`: `Signature Thread`, `What Kept Coming Up`, `AI Roles`, `When We Talk`
  - `hybrid`: one representative build module plus one representative thread module

## Data Integrity Rule

If a narrative field exists but its supporting fact does not, prefer removing the narrative field over bluffing.
