# coding-dna-logout

Log out from coding-dna and revoke the current token.

## Usage

```bash
CONFIG_FILE="${HOME}/.coding-dna/config.json"

if [ ! -f "${CONFIG_FILE}" ]; then
  echo "Not logged in."
  exit 0
fi

TOKEN=$(python3 -c "import json; print(json.load(open('${CONFIG_FILE}'))['token'])")

curl -s -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  https://coding-dna.vercel.app/api/auth/logout

rm -f "${CONFIG_FILE}"
echo "✓ Logged out successfully"
```
