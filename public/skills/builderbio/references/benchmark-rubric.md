# BuilderBio Benchmark Rubric

BuilderBio should be evaluated on three axes:

1. **Coverage**
2. **Truth**
3. **Delight**

If any axis clearly fails, the skill is not done.

## 1. Coverage

### Goal

Find as much relevant local coding-agent history as reasonably possible.

### Pass Signals

- Strong-path discovery runs across all supported agent roots
- Editor-hosted logs such as Cursor `state.vscdb` and Gemini-hosted Antigravity conversations are covered before weaker fallbacks
- Weak discovery probes common app-support/config roots
- Unknown sources are surfaced in the audit
- If the user claims to use an agent, the skill attempts a second-pass check before giving up
- Generic fallback parsing is attempted for chat-like JSON/JSONL sources

### Failure Signals

- Only one agent is reported even though multiple relevant roots exist
- A source is discovered but omitted from the audit
- The skill publishes a "complete" profile while unsupported candidates were skipped
- The skill stops at the first supported agent and ignores the rest

### Review Questions

- Did we maximize recall before analysis?
- Did we avoid silent drops?
- Would a missing agent be obvious from the audit?

## 2. Truth

### Goal

Produce a recap that is defensible from evidence.

### Pass Signals

- Claims map back to facts and session evidence
- Project clustering is plausible
- Agent roles are consistent with tool usage and session depth
- Scanner metadata flows through to the published result
- `D.profile.lang` is set and used consistently so narrative copy follows the builder's dominant session language while UI/module titles stay English
- Redaction is applied by default

### Failure Signals

- Confident personality copy with thin evidence
- Meta-copy about the page, product philosophy, or design intent instead of the builder
- The page mixes arbitrary Chinese and English because no dominant language was inferred
- Project arrays are empty or nonsense while session volume is large
- Metrics are obviously inconsistent across sections
- Paths or secrets leak into the output

### Review Questions

- Could we explain each major claim from the evidence layer?
- Did we trade honesty for prettiness anywhere?
- If coverage is partial, does the copy overstate certainty?

## 3. Delight

### Goal

Make the user feel seen and make the page worth sharing.

### Pass Signals

- The page has a strong builder thesis
- The signature build feels representative, not random
- Taste signals are memorable and screenshotable
- Builder eras tell a believable arc
- The listing card feels like a person, not just stats

### Failure Signals

- The page reads like a dashboard with no identity
- Summary text is generic ("full-stack builder", "AI developer")
- Summary text talks about "the page" instead of the builder
- All charts are equally weighted and nothing stands out
- A stranger cannot tell why the builder is interesting

### Review Questions

- Is there at least one line the user would want to quote?
- Does the page have a point of view?
- Does the recap say something interesting even without charts?

## Minimum Benchmark Bar

Before shipping a skill update, BuilderBio should satisfy:

- **Coverage**: no silent-drop behavior on known fixture cases
- **Truth**: fixture evals pass and redaction rules remain intact
- **Delight**: eval prompts still instruct the agent to produce identity, signature build, and builder-arc outputs

## Regression Tools

- `scripts/run_fixture_evals.py`
- `evals/evals.json`

Fixture evals guard the coverage/truth floor.

The eval prompts guard the product and narrative contract.
