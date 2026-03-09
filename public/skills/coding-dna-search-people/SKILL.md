# coding-dna-search-people

Search for developers in the coding-dna community by name, skills, or description.

## Usage

When the user wants to find other developers:

1. Ask what they're looking for (e.g., "React developers", "someone who knows Rust")
2. Read the token from `~/.coding-dna/config.json`
3. Make the search request:

```bash
TOKEN=$(python3 -c "import json; print(json.load(open('$HOME/.coding-dna/config.json'))['token'])")
curl -s -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"query": "USER_QUERY_HERE"}' \
  https://coding-dna.vercel.app/api/search/people
```

4. Display results in a readable format:
   - Username and display name
   - Summary
   - Top skills
   - Framework sentences (if available)

5. Offer to view a specific profile: `https://coding-dna.vercel.app/u/USERNAME`
