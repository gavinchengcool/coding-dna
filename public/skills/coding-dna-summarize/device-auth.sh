#!/usr/bin/env bash
# coding-dna device authentication flow
set -euo pipefail

CONFIG_DIR="${HOME}/.coding-dna"
CONFIG_FILE="${CONFIG_DIR}/config.json"
API_BASE="${CODING_DNA_API:-https://coding-dna.vercel.app}"

mkdir -p "${CONFIG_DIR}"

# Check if already authenticated
if [ -f "${CONFIG_FILE}" ]; then
  TOKEN=$(python3 -c "import json; print(json.load(open('${CONFIG_FILE}'))['token'])" 2>/dev/null || echo "")
  if [ -n "${TOKEN}" ]; then
    # Verify token is still valid
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: Bearer ${TOKEN}" \
      "${API_BASE}/api/profile/me")
    if [ "${STATUS}" = "200" ]; then
      echo "✓ Already authenticated"
      exit 0
    fi
    echo "→ Token expired, re-authenticating..."
  fi
fi

echo "→ Starting device authentication..."
echo ""

# Step 1: Request device code
RESPONSE=$(curl -s -X POST "${API_BASE}/api/auth/device")

DEVICE_CODE=$(echo "${RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin)['device_code'])")
USER_CODE=$(echo "${RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin)['user_code'])")
VERIFY_URI=$(echo "${RESPONSE}" | python3 -c "import sys,json; print(json.load(sys.stdin)['verification_uri'])")

echo "┌─────────────────────────────────────────┐"
echo "│                                         │"
echo "│   Open this URL in your browser:        │"
echo "│   ${VERIFY_URI}"
echo "│                                         │"
echo "│   Enter this code:  ${USER_CODE}            │"
echo "│                                         │"
echo "└─────────────────────────────────────────┘"
echo ""

# Try to open browser
if command -v open &>/dev/null; then
  open "${VERIFY_URI}?code=${USER_CODE}"
elif command -v xdg-open &>/dev/null; then
  xdg-open "${VERIFY_URI}?code=${USER_CODE}"
fi

# Step 2: Poll for authorization
echo "Waiting for authorization..."
POLL_INTERVAL=5
MAX_ATTEMPTS=180  # 15 minutes / 5 seconds

for i in $(seq 1 ${MAX_ATTEMPTS}); do
  sleep ${POLL_INTERVAL}

  POLL_RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${API_BASE}/api/auth/device/poll?device_code=${DEVICE_CODE}")

  HTTP_CODE=$(echo "${POLL_RESPONSE}" | tail -1)
  BODY=$(echo "${POLL_RESPONSE}" | head -1)

  if [ "${HTTP_CODE}" = "200" ]; then
    TOKEN=$(echo "${BODY}" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

    # Save config
    python3 -c "
import json
config = {'token': '${TOKEN}', 'api_base': '${API_BASE}'}
with open('${CONFIG_FILE}', 'w') as f:
    json.dump(config, f, indent=2)
"
    chmod 600 "${CONFIG_FILE}"

    echo ""
    echo "✓ Authentication successful!"
    echo "  Token saved to ${CONFIG_FILE}"
    exit 0
  fi

  if [ "${HTTP_CODE}" = "410" ]; then
    echo "✗ Code expired. Please try again."
    exit 1
  fi

  printf "."
done

echo ""
echo "✗ Timed out waiting for authorization."
exit 1
