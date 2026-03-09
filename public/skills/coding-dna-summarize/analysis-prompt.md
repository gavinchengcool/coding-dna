# AI Analysis Instructions for coding-dna

You are analyzing a developer's AI coding conversation history to build their skill profile.

## Input

You have access to the developer's recent AI coding sessions (JSONL/JSON files). Read them to understand:
- What they build
- How they think about problems
- Their preferred technologies and patterns
- Their interaction style with AI tools

## Output Format

Generate a JSON file at `/tmp/coding-dna-analysis.json` with this exact structure:

```json
{
  "summary": "A 2-3 sentence developer portrait. Write in third person. Example: 'A full-stack developer who favors pragmatic solutions over theoretical perfection. Gravitates toward TypeScript and React ecosystems, with a growing interest in systems programming. Approaches debugging methodically, often isolating variables before attempting fixes.'",

  "portrait": {
    "cognitive_style": {
      "explorer_vs_optimizer": 0.7,
      "big_picture_vs_detail": 0.4,
      "intuitive_vs_analytical": 0.6,
      "solo_vs_collaborative": 0.5,
      "move_fast_vs_careful": 0.65,
      "generalist_vs_specialist": 0.55
    },
    "decision_style": "Describe their decision-making approach in 1-2 sentences. How do they weigh trade-offs? Do they prefer proven patterns or experiment?"
  },

  "framework_sentences": [
    "The kind of developer who [specific behavioral pattern].",
    "Tends to [characteristic approach to problem-solving].",
    "When stuck, typically [recovery strategy].",
    "Values [principle] over [alternative], as seen in [evidence].",
    "Most productive when [condition or context]."
  ],

  "skills": ["typescript", "react", "python", "etc"],
  "languages": ["TypeScript", "Python", "Go"],
  "frameworks": ["Next.js", "FastAPI", "etc"],
  "domains": ["web-development", "devtools", "data-engineering"]
}
```

## Cognitive Style Axes (0.0 to 1.0)

Each axis is a spectrum. 0.5 is balanced. Values indicate tendency:

1. **Explorer vs Optimizer** (0=pure optimizer, 1=pure explorer): Do they try new approaches or refine existing ones?
2. **Big Picture vs Detail** (0=detail-focused, 1=big-picture): Do they zoom out to architecture or zoom into implementation?
3. **Intuitive vs Analytical** (0=analytical, 1=intuitive): Do they rely on data/logic or gut feeling/experience?
4. **Solo vs Collaborative** (0=solo, 1=collaborative): Do they work independently or seek input/discussion?
5. **Move Fast vs Careful** (0=careful, 1=move fast): Do they prioritize speed or thoroughness?
6. **Generalist vs Specialist** (0=specialist, 1=generalist): Do they go deep in one area or broad across many?

## Framework Sentences Guidelines

- Write 5-8 sentences that characterize the developer
- Each should be specific and evidence-based from their conversations
- Use patterns like "The kind of developer who...", "Tends to...", "When faced with..."
- Avoid generic statements that could apply to anyone
- Focus on distinctive behavioral patterns

## Capability Rings

Extract capability categories from the conversations. For each, estimate proficiency:
- Identify 4-8 skill areas based on actual usage, not just mentions
- Rate each 0-100 based on depth of usage observed
- Common categories: frontend, backend, devops, data, mobile, testing, architecture

## Important Rules

1. Be honest. Don't inflate skills or make unsupported claims.
2. Base everything on evidence from the conversations.
3. If there's insufficient data for a field, use reasonable defaults rather than hallucinating.
4. The summary should feel like it was written by a colleague who has observed the developer, not marketing copy.
5. Skills/languages/frameworks should only include things actually used in conversations.
