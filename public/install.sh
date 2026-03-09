#!/usr/bin/env bash
# coding-dna installer
# Usage: curl -sfL https://coding-dna.vercel.app/install.sh | bash
set -euo pipefail

VERSION="0.1.0"
BASE_URL="${CODING_DNA_URL:-https://coding-dna.vercel.app}"
INSTALL_DIR="${HOME}/.coding-dna"
SKILLS_DIR="${INSTALL_DIR}/skills"

echo ""
echo "  coding-dna installer v${VERSION}"
echo "  ─────────────────────────────"
echo ""

# Create directories
mkdir -p "${INSTALL_DIR}"
mkdir -p "${SKILLS_DIR}"

# Download skills
echo "→ Downloading skills..."

SKILL_DIRS=(
  "coding-dna-summarize"
  "coding-dna-search-people"
  "coding-dna-search-skills"
  "coding-dna-logout"
)

for SKILL in "${SKILL_DIRS[@]}"; do
  mkdir -p "${SKILLS_DIR}/${SKILL}"

  if [ "${SKILL}" = "coding-dna-summarize" ]; then
    mkdir -p "${SKILLS_DIR}/${SKILL}/scripts"

    for FILE in SKILL.md analysis-prompt.md device-auth.sh; do
      curl -sfL "${BASE_URL}/skills/${SKILL}/${FILE}" -o "${SKILLS_DIR}/${SKILL}/${FILE}"
    done

    for SCRIPT in discover-sessions.sh compute-stats.py assemble-payload.py post-sync.sh; do
      curl -sfL "${BASE_URL}/skills/${SKILL}/scripts/${SCRIPT}" -o "${SKILLS_DIR}/${SKILL}/scripts/${SCRIPT}"
    done

    chmod +x "${SKILLS_DIR}/${SKILL}/device-auth.sh"
    chmod +x "${SKILLS_DIR}/${SKILL}/scripts/discover-sessions.sh"
    chmod +x "${SKILLS_DIR}/${SKILL}/scripts/post-sync.sh"
  else
    curl -sfL "${BASE_URL}/skills/${SKILL}/SKILL.md" -o "${SKILLS_DIR}/${SKILL}/SKILL.md"
  fi
done

# Download VERSION file
curl -sfL "${BASE_URL}/skills/VERSION" -o "${SKILLS_DIR}/VERSION"

echo "  ✓ Skills downloaded"

# Create symlinks to Claude Code
CLAUDE_SKILLS_DIR="${HOME}/.claude/skills"
if [ -d "${HOME}/.claude" ]; then
  mkdir -p "${CLAUDE_SKILLS_DIR}"
  for SKILL in "${SKILL_DIRS[@]}"; do
    ln -sf "${SKILLS_DIR}/${SKILL}" "${CLAUDE_SKILLS_DIR}/${SKILL}" 2>/dev/null || true
  done
  echo "  ✓ Linked to Claude Code (~/.claude/skills/)"
fi

# Create symlinks to Cursor
CURSOR_RULES_DIR="${HOME}/.cursor/rules"
if [ -d "${HOME}/.cursor" ]; then
  mkdir -p "${CURSOR_RULES_DIR}"
  for SKILL in "${SKILL_DIRS[@]}"; do
    ln -sf "${SKILLS_DIR}/${SKILL}/SKILL.md" "${CURSOR_RULES_DIR}/${SKILL}.md" 2>/dev/null || true
  done
  echo "  ✓ Linked to Cursor (~/.cursor/rules/)"
fi

echo ""
echo "  ┌──────────────────────────────────────────────────┐"
echo "  │  coding-dna installed successfully!              │"
echo "  │                                                  │"
echo "  │  Next steps:                                     │"
echo "  │  1. Open Claude Code or Cursor                   │"
echo "  │  2. Run /coding-dna-summarize                    │"
echo "  │  3. Follow the prompts to analyze your sessions  │"
echo "  └──────────────────────────────────────────────────┘"
echo ""
