#!/usr/bin/env bash
# builderbio installer v0.7.3
# Usage: curl -sfL https://builderbio.dev/install.sh | bash
set -euo pipefail

VERSION="0.7.3"
BASE_URL="${BUILDERBIO_URL:-https://builderbio.dev}"
INSTALL_DIR="${HOME}/.builderbio"
SKILL_DIR="${INSTALL_DIR}/skills/builderbio"

echo ""
echo "  builderbio installer v${VERSION}"
echo "  ─────────────────────────────"
echo ""

# Create directories
mkdir -p "${SKILL_DIR}/scripts"
mkdir -p "${SKILL_DIR}/assets"
mkdir -p "${SKILL_DIR}/references"
mkdir -p "${SKILL_DIR}/evals"
mkdir -p "${SKILL_DIR}/evals/fixtures/antigravity"
mkdir -p "${SKILL_DIR}/evals/fixtures/claude/projects/demo/subagents"
mkdir -p "${SKILL_DIR}/evals/fixtures/codex/sessions/2026/03/01"
mkdir -p "${SKILL_DIR}/evals/fixtures/cursor/logs"
mkdir -p "${SKILL_DIR}/evals/fixtures/trae"
mkdir -p "${SKILL_DIR}/agents"

# Download all skill files
echo "→ Downloading skill files..."

curl -sfL "${BASE_URL}/skills/builderbio/SKILL.md" -o "${SKILL_DIR}/SKILL.md"
echo "  ✓ SKILL.md"

curl -sfL "${BASE_URL}/skills/builderbio/scripts/parse_sessions.py" -o "${SKILL_DIR}/scripts/parse_sessions.py"
chmod +x "${SKILL_DIR}/scripts/parse_sessions.py"
echo "  ✓ scripts/parse_sessions.py"

curl -sfL "${BASE_URL}/skills/builderbio/scripts/run_fixture_evals.py" -o "${SKILL_DIR}/scripts/run_fixture_evals.py"
chmod +x "${SKILL_DIR}/scripts/run_fixture_evals.py"
echo "  ✓ scripts/run_fixture_evals.py"

curl -sfL "${BASE_URL}/skills/builderbio/assets/template.html" -o "${SKILL_DIR}/assets/template.html"
echo "  ✓ assets/template.html"

curl -sfL "${BASE_URL}/skills/builderbio/references/claude-code-format.md" -o "${SKILL_DIR}/references/claude-code-format.md"
curl -sfL "${BASE_URL}/skills/builderbio/references/codex-format.md" -o "${SKILL_DIR}/references/codex-format.md"
curl -sfL "${BASE_URL}/skills/builderbio/references/benchmark-rubric.md" -o "${SKILL_DIR}/references/benchmark-rubric.md"
curl -sfL "${BASE_URL}/skills/builderbio/references/data-model.md" -o "${SKILL_DIR}/references/data-model.md"
curl -sfL "${BASE_URL}/skills/builderbio/references/profile-dimensions.md" -o "${SKILL_DIR}/references/profile-dimensions.md"
curl -sfL "${BASE_URL}/skills/builderbio/references/workflow-details.md" -o "${SKILL_DIR}/references/workflow-details.md"
echo "  ✓ references/"

curl -sfL "${BASE_URL}/skills/builderbio/evals/evals.json" -o "${SKILL_DIR}/evals/evals.json"
curl -sfL "${BASE_URL}/skills/builderbio/evals/fixtures/antigravity/sessions.json" -o "${SKILL_DIR}/evals/fixtures/antigravity/sessions.json"
curl -sfL "${BASE_URL}/skills/builderbio/evals/fixtures/claude/history.jsonl" -o "${SKILL_DIR}/evals/fixtures/claude/history.jsonl"
curl -sfL "${BASE_URL}/skills/builderbio/evals/fixtures/claude/projects/demo/main-session.jsonl" -o "${SKILL_DIR}/evals/fixtures/claude/projects/demo/main-session.jsonl"
curl -sfL "${BASE_URL}/skills/builderbio/evals/fixtures/claude/projects/demo/subagents/agent-worker.jsonl" -o "${SKILL_DIR}/evals/fixtures/claude/projects/demo/subagents/agent-worker.jsonl"
curl -sfL "${BASE_URL}/skills/builderbio/evals/fixtures/codex/sessions/2026/03/01/rollout-sample.jsonl" -o "${SKILL_DIR}/evals/fixtures/codex/sessions/2026/03/01/rollout-sample.jsonl"
curl -sfL "${BASE_URL}/skills/builderbio/evals/fixtures/cursor/composer_data.json" -o "${SKILL_DIR}/evals/fixtures/cursor/composer_data.json"
curl -sfL "${BASE_URL}/skills/builderbio/evals/fixtures/cursor/logs/cursor-session.jsonl" -o "${SKILL_DIR}/evals/fixtures/cursor/logs/cursor-session.jsonl"
curl -sfL "${BASE_URL}/skills/builderbio/evals/fixtures/cursor/tracking_rows.json" -o "${SKILL_DIR}/evals/fixtures/cursor/tracking_rows.json"
curl -sfL "${BASE_URL}/skills/builderbio/evals/fixtures/trae/itemtable_rows.json" -o "${SKILL_DIR}/evals/fixtures/trae/itemtable_rows.json"
curl -sfL "${BASE_URL}/skills/builderbio/evals/fixtures/expected.json" -o "${SKILL_DIR}/evals/fixtures/expected.json"
echo "  ✓ evals/"

curl -sfL "${BASE_URL}/skills/builderbio/agents/openai.yaml" -o "${SKILL_DIR}/agents/openai.yaml"
echo "  ✓ agents/openai.yaml"

echo "  ✓ All files downloaded"

# Generate device_id if not already set
CONFIG_FILE="${INSTALL_DIR}/config.json"
if [ -f "$CONFIG_FILE" ] && python3 -c "import json; c=json.load(open('$CONFIG_FILE')); assert c.get('device_id')" 2>/dev/null; then
  echo "  ✓ Existing device identity found"
else
  DEVICE_ID=$(echo "$(hostname)-$(whoami)-$(uname -m)" | shasum -a 256 | cut -c1-64)
  mkdir -p "${INSTALL_DIR}"
  if [ -f "$CONFIG_FILE" ]; then
    # Preserve existing config, just add device_id
    python3 -c "
import json
c = json.load(open('$CONFIG_FILE'))
c['device_id'] = '$DEVICE_ID'
json.dump(c, open('$CONFIG_FILE', 'w'))
" 2>/dev/null || echo "{\"device_id\":\"$DEVICE_ID\"}" > "$CONFIG_FILE"
  else
    echo "{\"device_id\":\"$DEVICE_ID\"}" > "$CONFIG_FILE"
  fi
  echo "  ✓ Device identity generated"
fi

# Link to Claude Code
if [ -d "${HOME}/.claude" ]; then
  mkdir -p "${HOME}/.claude/skills"
  ln -sfn "${SKILL_DIR}" "${HOME}/.claude/skills/builderbio" 2>/dev/null || true
  echo "  ✓ Linked to Claude Code (~/.claude/skills/builderbio/)"
fi

# Link to Cursor
if [ -d "${HOME}/.cursor" ]; then
  mkdir -p "${HOME}/.cursor/rules"
  ln -sfn "${SKILL_DIR}/SKILL.md" "${HOME}/.cursor/rules/builderbio.md" 2>/dev/null || true
  echo "  ✓ Linked to Cursor (~/.cursor/rules/builderbio.md)"
fi

# Link to Codex
if [ -d "${HOME}/.codex" ]; then
  mkdir -p "${HOME}/.codex/skills/builderbio"
  ln -sfn "${SKILL_DIR}/SKILL.md" "${HOME}/.codex/skills/builderbio/SKILL.md" 2>/dev/null || true
  echo "  ✓ Linked to Codex (~/.codex/skills/builderbio/)"
fi

# Clean up old skill folders from v0.1.x / v0.2.x
OLD_SKILLS=(
  "builderbio-summarize"
  "builderbio-search-people"
  "builderbio-search-skills"
  "builderbio-logout"
)

for OLD in "${OLD_SKILLS[@]}"; do
  rm -rf "${INSTALL_DIR}/skills/${OLD}" 2>/dev/null || true
  rm -f "${HOME}/.claude/skills/${OLD}" 2>/dev/null || true
  rm -f "${HOME}/.cursor/rules/${OLD}.md" 2>/dev/null || true
done
rm -f "${INSTALL_DIR}/skills/VERSION" 2>/dev/null || true

echo ""
echo "  ┌──────────────────────────────────────────────────┐"
echo "  │  builderbio v${VERSION} installed                │"
echo "  │                                                  │"
echo "  │  Installed skill: ~/.claude/skills/builderbio/   │"
echo "  │  Source code:     SKILL.md, scripts/parse_sessions.py"
echo "  │                                                  │"
echo "  │  Ready to generate your builder profile.         │"
echo "  │  See SKILL.md for workflow details.              │"
echo "  └──────────────────────────────────────────────────┘"
echo ""
