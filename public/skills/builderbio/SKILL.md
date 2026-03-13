---
name: builderbio
version: 0.8.2
description: |
  Use this skill when the user wants a BuilderBio, builder recap, builder profile, AI build history, annual-review style coding recap, or a shareable page about how they build with AI agents. It scans local coding-agent logs across Claude Code, Codex, Trae, Cursor, OpenClaw, Antigravity, Gemini-hosted Antigravity fallbacks, Kiro, Windsurf, and other discovered sources; produces a scan audit; derives evidence-backed builder narratives; and publishes a shareable BuilderBio.
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

BuilderBio is not a single-session summary.

It is a local-first **builder recap system** that should help the user say two things:

1. "I didn’t realize I had already built this much with AI."
2. "This actually sounds like me. I want to share it."

Treat the skill as a product with three benchmark axes:

- **Coverage**: discover as many relevant agent logs as possible
- **Truth**: never make unsupported claims; never silently drop missing coverage
- **Delight**: turn the evidence into a memorable, screenshotable recap

Before doing anything else, read:

- [references/workflow-details.md](references/workflow-details.md) for the exact execution flow
- [references/profile-dimensions.md](references/profile-dimensions.md) for the recap information architecture
- [references/data-model.md](references/data-model.md) for the layered evidence/facts/narrative model
- [references/benchmark-rubric.md](references/benchmark-rubric.md) for pass/fail criteria
- [references/visual-archetypes.md](references/visual-archetypes.md) for interaction modes and the theme system

Only read format-specific references when needed:

- [references/claude-code-format.md](references/claude-code-format.md)
- [references/codex-format.md](references/codex-format.md)

## Product Standard

These rules are non-negotiable.

### 1. Never silently drop data

If a source is found but not fully parsed:

- include it in the audit
- mark the profile `partial` if needed
- explain what was found vs. what was recovered

The failure mode is not "miss a source." The failure mode is "miss a source and pretend the recap is complete."

### 2. Coverage beats convenience

Always attempt:

- strong-path discovery for supported agents
- weak discovery for additional chat/session logs
- generic fallback parsing for chat-like JSON/JSONL when a dedicated parser is absent

If the user says they used an agent and the scan does not show it, run a second-pass discovery before publishing.

### 3. Evidence before narrative

Do not jump directly from raw sessions to catchy copy.

Build in this order:

1. scan evidence
2. canonical sessions
3. derived facts
4. narrative claims
5. render data

Every interesting sentence on the page should be explainable from the evidence.

Do not write meta-copy about the page itself.

Avoid lines that talk about:

- what "this page" should feel like
- what people "should remember" in the abstract
- product philosophy or design intent
- narrative instructions that are not about the user

Write about the builder, their work, their agent usage, and their trajectory.

### 3.1 Language contract is part of truth

BuilderBio has two language layers:

- **UI chrome stays English**: module titles, product badges, and the bottom `Make your own` CTA
- **Narrative copy follows the builder**: the descriptive copy inside modules should use the builder's dominant language from their local agent conversations

The local agent must infer the dominant language from the user's real session text and write it into `D.profile.lang` as a stable language code such as `en` or `zh`.

Do not randomly switch languages across sections.

### 4. Build for aha, not for dashboard completeness

A good BuilderBio is not "11 equal charts."

Prioritize:

- who this builder is
- what defines their taste
- what they actually shipped
- how their relationship with AI changed over time

Charts are supporting evidence, not the main character.

### 5. Publish with honesty

Before publish, show the user a concise audit summary:

- agents found
- sources discovered
- unknown or partial sources
- confidence / rescan recommendation

If the audit is partial, do not hide that fact.

## Default Execution Mode

Run autonomously from scan through publish.

The normal path should require **no mandatory design decision from the user**.

The agent should:

- infer the user's dominant interaction mode
- infer a default visual archetype
- explain the default briefly
- allow override only after a strong default has been proposed

Everything else should be discovered, inferred, or recovered automatically.

If the user explicitly asks to stop before publish, stop.

## Workflow Overview

Follow the detailed procedure in [references/workflow-details.md](references/workflow-details.md).

High-level flow:

1. **Discover** all strong-path and weak-path sources
2. **Parse** and emit a scan audit
3. **Verify** coverage against what the machine and user reality imply
4. **Recover** partial/unknown sources where possible
5. **Derive facts** from canonical sessions
6. **Narrate** the builder recap
7. **Infer mode and default visual archetype**
8. **Publish** with scan metadata attached

## What the Final BuilderBio Must Communicate

The finished profile should answer these questions quickly:

- What kind of builder is this person?
- What did they actually build?
- Which agents do they use, and for what roles?
- What changed from early exploration to later shipping?
- What makes their taste distinct?

The page should feel closer to a great annual recap than a control panel.

If the user's AI history is primarily conversational rather than build-centric, adapt the page so it answers the parallel questions instead:

- How do they think or talk with AI?
- What threads keep returning?
- What roles does AI play in their life or work?
- What makes their interaction style recognizable?

## Required Narrative Outputs

Use the rubric in [references/profile-dimensions.md](references/profile-dimensions.md). The final recap must contain, either explicitly or through derived fields:

- **Builder thesis**: one sentence that feels like identity, not statistics
- **Trust badge handling**: preserve verification integrity so badges such as `Unfiltered` remain meaningful
- **Signature build**: the project or arc that best represents this builder
- **Taste signals**: compact, memorable cues about habits and preferences
- **Builder eras**: stages such as exploration, compounding, shipping, refinement
- **Agent roles**: what each agent is actually used for
- **Evidence layer**: receipts that make the recap feel trustworthy

If the scan data is thin, say less and stay specific. Do not inflate weak evidence into a confident persona.

Narrative copy must read like a user recap, not a product deck:

- good: "On 2026-03-06 they opened 13 sessions and pushed the work into a visible new phase"
- bad: "These are the moments people will remember"
- good: "Claude Code handles the deep sessions while Codex handles fast execution"
- bad: "The speed-depth split should be visible"

If the inferred mode is `conversation-first`, do not force builder-centric language such as:

- "what they shipped"
- "their tech stack"
- "signature build"

Use the conversation-first structure from [references/visual-archetypes.md](references/visual-archetypes.md) and [references/profile-dimensions.md](references/profile-dimensions.md) instead.

## Scan Audit Contract

The parser output must flow through to the published profile.

Carry through:

- `scanner_version`
- `scan_audit.summary`
- `scan_audit.agent_sources_found`
- `D.profile.lang`
- `D.profile.inferred_interaction_mode`
- `D.profile.chosen_interaction_mode`
- `D.profile.interaction_mode`
- `D.profile.interaction_mode_reason`
- `D.profile.inferred_style_theme`
- `D.profile.chosen_style_theme`
- `D.profile.style_theme`
- `D.profile.style_theme_reason`
- `D.profile.theme_candidates`

Do not rely on server-side backfill for these presentation fields.

The local scan-and-publish flow should emit them directly so the first published page already carries the correct mode/theme contract.
- per-session provenance fields such as `source_refs`, `parse_mode`, `partial_reasons`
- stable top-line counts required for verification hashes

If the parser returns `partial`, the final BuilderBio should still be useful and shareable, but the agent must mention the limitation before publish.

## Presentation Choice

Do not ask the user to pick a theme from a blank slate.

First infer:

- `interaction_mode`: `builder`, `hybrid`, or `conversation-first`
- `style_theme`: a best-fit visual archetype

Persist both:

- inferred values: what the system picked from evidence
- chosen values: what will actually render after optional user override

Compatibility rule:

- `interaction_mode` should mirror `chosen_interaction_mode`
- `style_theme` should mirror `chosen_style_theme`

Supported archetypes:

- `product-operator`
- `terminal-native`
- `editorial-maker`
- `night-shift`
- `research-forge`
- `calm-craft`
- `companion-journal`
- `idea-salon`

Legacy themes remain valid for compatibility:

- `default`
- `yc-orange`
- `terminal-green`
- `minimal-light`
- `cyberpunk`

If the user has no preference, keep the inferred default.

Only after proposing the default may the agent offer an override.

If the user overrides, do not throw away the inferred result. Persist both the inferred and chosen values.

## Publish Contract

Required payload keys:

- `interaction_mode`
- `style_theme`
- `style_theme_reason`
- `scanner_version`
- `scan_audit`
- `builderbio: { D, E }`

Use the same device identity and publish token flow so republishing updates the same URL.

If the publish response succeeds but the audit is still partial, say both things:

- publish succeeded
- coverage may still be incomplete

## Regression Safety

Before calling the work done, run:

```bash
python <skill-path>/scripts/run_fixture_evals.py
```

That fixture suite is the minimum regression bar for scan coverage and provenance handling.

Also review [evals/evals.json](evals/evals.json) before changing the skill contract so the benchmark assertions still match the behavior you expect from the local agent.
