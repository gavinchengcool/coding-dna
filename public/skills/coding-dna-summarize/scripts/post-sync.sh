#!/usr/bin/env bash
# Upload profile and open preview
set -euo pipefail

CONFIG_FILE="${HOME}/.coding-dna/config.json"
PAYLOAD_FILE="${1:-/tmp/coding-dna-payload.json}"
API_BASE="${CODING_DNA_API:-https://coding-dna.vercel.app}"

# Read token from config
if [ ! -f "${CONFIG_FILE}" ]; then
  echo "✗ Not authenticated. Run device-auth.sh first."
  exit 1
fi

TOKEN=$(python3 -c "import json; print(json.load(open('${CONFIG_FILE}'))['token'])")

if [ ! -f "${PAYLOAD_FILE}" ]; then
  echo "✗ Payload file not found: ${PAYLOAD_FILE}"
  exit 1
fi

echo "→ Uploading profile..."

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @"${PAYLOAD_FILE}" \
  "${API_BASE}/api/profile/sync")

HTTP_CODE=$(echo "${RESPONSE}" | tail -1)
BODY=$(echo "${RESPONSE}" | head -1)

if [ "${HTTP_CODE}" = "200" ]; then
  echo "✓ Profile synced successfully"

  USERNAME=$(echo "${BODY}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('username',''))" 2>/dev/null || echo "")

  echo ""
  echo "  Preview: ${API_BASE}/me"
  echo "  Public:  ${API_BASE}/u/${USERNAME}"

  # Open preview
  if command -v open &>/dev/null; then
    open "${API_BASE}/me"
  elif command -v xdg-open &>/dev/null; then
    xdg-open "${API_BASE}/me"
  fi
else
  echo "✗ Upload failed (HTTP ${HTTP_CODE})"
  echo "  ${BODY}"
  exit 1
fi
