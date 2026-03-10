#!/usr/bin/env bash
# builderbio installer v0.2.0
# Usage: curl -sfL https://builderbio.dev/install.sh | bash
set -euo pipefail

VERSION="0.2.0"
BASE_URL="${BUILDERBIO_URL:-https://builderbio.dev}"
INSTALL_DIR="${HOME}/.builderbio"
SKILL_DIR="${INSTALL_DIR}/skills/builderbio"

echo ""
echo "  builderbio installer v${VERSION}"
echo "  ─────────────────────────────"
echo ""

# Create directory
mkdir -p "${SKILL_DIR}"

# Download the single skill file
echo "→ Downloading skill..."
curl -sfL "${BASE_URL}/skills/builderbio/SKILL.md" -o "${SKILL_DIR}/SKILL.md"
echo "  ✓ Skill downloaded"

# Link to Claude Code
if [ -d "${HOME}/.claude" ]; then
  mkdir -p "${HOME}/.claude/skills"
  ln -sf "${SKILL_DIR}" "${HOME}/.claude/skills/builderbio" 2>/dev/null || true
  echo "  ✓ Linked to Claude Code (~/.claude/skills/builderbio/)"
fi

# Link to Cursor
if [ -d "${HOME}/.cursor" ]; then
  mkdir -p "${HOME}/.cursor/rules"
  ln -sf "${SKILL_DIR}/SKILL.md" "${HOME}/.cursor/rules/builderbio.md" 2>/dev/null || true
  echo "  ✓ Linked to Cursor (~/.cursor/rules/builderbio.md)"
fi

# Link to Codex
if [ -d "${HOME}/.codex" ]; then
  mkdir -p "${HOME}/.codex/skills/builderbio"
  ln -sf "${SKILL_DIR}/SKILL.md" "${HOME}/.codex/skills/builderbio/SKILL.md" 2>/dev/null || true
  echo "  ✓ Linked to Codex (~/.codex/skills/builderbio/)"
fi

# Clean up old skill folders from v0.1.x
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
echo "  │  builderbio installed!                           │"
echo "  │                                                  │"
echo "  │  Next: open Claude Code, Cursor, or Codex and    │"
echo "  │  run /builderbio to generate your profile.       │"
echo "  │                                                  │"
echo "  │  No login needed. No browser. Just run it.       │"
echo "  └──────────────────────────────────────────────────┘"
echo ""
