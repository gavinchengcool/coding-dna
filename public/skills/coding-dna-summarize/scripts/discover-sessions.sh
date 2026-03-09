#!/usr/bin/env bash
# Discover AI coding session files from various tools
# Outputs JSON array of session file paths
set -euo pipefail

DAYS="${1:-30}"
OUTPUT_FILE="${2:-/tmp/coding-dna-sessions.json}"
CUTOFF_DATE=$(date -v-${DAYS}d +%Y-%m-%d 2>/dev/null || date -d "${DAYS} days ago" +%Y-%m-%d)

echo "→ Scanning for sessions from the last ${DAYS} days..."

SESSIONS="[]"

# Claude Code sessions
CLAUDE_DIR="${HOME}/.claude/projects"
if [ -d "${CLAUDE_DIR}" ]; then
  COUNT=0
  while IFS= read -r -d '' file; do
    SESSIONS=$(echo "${SESSIONS}" | python3 -c "
import sys, json
sessions = json.load(sys.stdin)
sessions.append({'tool': 'claude-code', 'path': '${file}', 'type': 'jsonl'})
json.dump(sessions, sys.stdout)
")
    COUNT=$((COUNT + 1))
  done < <(find "${CLAUDE_DIR}" -name "*.jsonl" -newer "/tmp/coding-dna-cutoff" -print0 2>/dev/null || true)
  echo "  Claude Code: ${COUNT} sessions"
fi

# Cursor sessions
CURSOR_DIR="${HOME}/Library/Application Support/Cursor/User/workspaceStorage"
if [ -d "${CURSOR_DIR}" ]; then
  COUNT=0
  while IFS= read -r -d '' file; do
    SESSIONS=$(echo "${SESSIONS}" | python3 -c "
import sys, json
sessions = json.load(sys.stdin)
sessions.append({'tool': 'cursor', 'path': '${file}', 'type': 'json'})
json.dump(sessions, sys.stdout)
")
    COUNT=$((COUNT + 1))
  done < <(find "${CURSOR_DIR}" -name "*.json" -path "*/ai-chat/*" -newer "/tmp/coding-dna-cutoff" -print0 2>/dev/null || true)
  echo "  Cursor: ${COUNT} sessions"
fi

# Codex sessions
CODEX_DIR="${HOME}/.codex/sessions"
if [ -d "${CODEX_DIR}" ]; then
  COUNT=0
  while IFS= read -r -d '' file; do
    SESSIONS=$(echo "${SESSIONS}" | python3 -c "
import sys, json
sessions = json.load(sys.stdin)
sessions.append({'tool': 'codex', 'path': '${file}', 'type': 'jsonl'})
json.dump(sessions, sys.stdout)
")
    COUNT=$((COUNT + 1))
  done < <(find "${CODEX_DIR}" -name "*.jsonl" -newer "/tmp/coding-dna-cutoff" -print0 2>/dev/null || true)
  echo "  Codex: ${COUNT} sessions"
fi

# Write output
echo "${SESSIONS}" | python3 -c "
import sys, json
sessions = json.load(sys.stdin)
with open('${OUTPUT_FILE}', 'w') as f:
    json.dump(sessions, f, indent=2)
print(f'  Total: {len(sessions)} sessions found')
"
