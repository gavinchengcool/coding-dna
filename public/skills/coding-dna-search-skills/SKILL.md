# coding-dna-search-skills

Search for specific skills and technologies across the coding-dna community.

## Usage

When the user wants to find developers with specific skills:

1. Ask what skill/technology they're looking for
2. Read the token from `~/.coding-dna/config.json`
3. Make the search request:

```bash
TOKEN=$(python3 -c "import json; print(json.load(open('$HOME/.coding-dna/config.json'))['token'])")
curl -s -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "SKILL_QUERY_HERE"}' \
  https://coding-dna.vercel.app/api/search/skills
```

4. Display results showing:
   - Developer profiles that match the skill
   - Their proficiency level in that area
   - Related skills they have
   - Framework sentences mentioning the skill

5. Offer to view profiles or connect with developers
