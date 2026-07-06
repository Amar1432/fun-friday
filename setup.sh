#!/bin/bash

set -e

PROJECT_NAME="Fun Friday Hub"

###########################################
# Colors
###########################################

GREEN="\033[0;32m"
BLUE="\033[0;34m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"

###########################################
# Helpers
###########################################

log() {
    echo -e "${BLUE}➜${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}!${NC} $1"
}

create_dir() {
    mkdir -p "$1"
    success "Created directory: $1"
}

create_file_if_missing() {
    if [ ! -f "$1" ]; then
        touch "$1"
        success "Created file: $1"
    else
        warn "Skipped existing file: $1"
    fi
}

###########################################
# Banner
###########################################

echo ""
echo "════════════════════════════════════════════════════"
echo "🚀 Bootstrapping $PROJECT_NAME (Lean AI Monorepo)"
echo "════════════════════════════════════════════════════"
echo ""

###########################################
# Directory Structure
###########################################

DIRECTORIES=(
".github/workflows"
".github/ISSUE_TEMPLATE"
".vscode"
"apps/web"
"apps/api"
"packages/shared"
"docs"
"prompts"
"prompts/handoff"
"scripts"
)

log "Creating directory structure..."

for dir in "${DIRECTORIES[@]}"
do
    create_dir "$dir"
done

###########################################
# Root Files & Monorepo Glue
###########################################

log "Creating root files..."

ROOT_FILES=(
".env.example"
".gitignore"
"README.md"
"AI.md"
)

for file in "${ROOT_FILES[@]}"
do
    create_file_if_missing "$file"
done

# Initialize Monorepo Configuration
if [ ! -s "pnpm-workspace.yaml" ]; then
cat <<EOF > pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
EOF
success "Created pnpm-workspace.yaml"
fi

if [ ! -s "package.json" ]; then
cat <<EOF > package.json
{
  "name": "fun-friday-hub",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "scripts": {
    "dev": "pnpm -r dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  }
}
EOF
success "Created root package.json"
fi

###########################################
# Documentation & Onboarding
###########################################

log "Creating documentation files..."

DOC_FILES=(
"docs/PRD.md"
"docs/ARCHITECTURE.md"
"docs/DATABASE.md"
"docs/API.md"
"docs/ROOM_PROTOCOL.md"
"docs/ROADMAP.md"
"docs/TASKS.md"
"docs/ACTIVE_TASK.md"
"docs/HANDOFF.md"
"docs/DECISIONS.md"
"docs/CHANGELOG.md"
)

for file in "${DOC_FILES[@]}"
do
    create_file_if_missing "$file"
done

# Inject the strict onboarding flow into docs/README.md
cat <<'EOF' > docs/README.md
# Fun Friday Hub Documentation

## 🛑 STOP: Mandatory Reading Order 🛑
Whether you are a human contributor or an AI agent, you **MUST** read these documents in this exact order before modifying the codebase:

1. `PRD.md` - What we are building and why.
2. `ARCHITECTURE.md` - High-level system design.
3. `DATABASE.md` - Schema and data models.
4. `API.md` - REST endpoints and contracts.
5. `ROOM_PROTOCOL.md` - WebSocket behaviors (room lifecycle, reconnects, state).
6. `ACTIVE_TASK.md` - The specific ticket currently in progress.
7. `HANDOFF.md` - The transaction log of the last coding session.
8. `DECISIONS.md` - Context on past architectural choices.
EOF
success "Generated docs/README.md with strict AI reading order"

###########################################
# Prompt Templates
###########################################

log "Creating AI handoff prompts..."

cat <<'EOF' > prompts/handoff/claude.md
# Claude Session

Read AI.md for coding conventions.
Then, read in order:
1. docs/HANDOFF.md
2. docs/ACTIVE_TASK.md
3. docs/TASKS.md
4. docs/ARCHITECTURE.md
5. docs/ROOM_PROTOCOL.md (if working on WebSockets/Multiplayer)

Task:
<TICKET_ID>

Before finishing:
- Update HANDOFF.md
- Update ACTIVE_TASK.md
- Update TASKS.md if needed

Never leave undocumented changes.
EOF

cat <<'EOF' > prompts/handoff/codex.md
# Codex Session

Read AI.md for coding conventions.
Then, read:
- docs/HANDOFF.md
- docs/ACTIVE_TASK.md
- docs/TASKS.md

Task:
<TICKET_ID>

Before finishing:
- Update HANDOFF.md
- Update ACTIVE_TASK.md

Do not modify unrelated files.
EOF

cat <<'EOF' > prompts/handoff/antigravity.md
# Antigravity Session

Read AI.md for coding conventions.
Then, read:
- docs/HANDOFF.md
- docs/ACTIVE_TASK.md
- docs/TASKS.md
- docs/ARCHITECTURE.md

Task:
<TICKET_ID>

Before finishing:
- Update HANDOFF.md
- Update ACTIVE_TASK.md

Keep changes focused on the assigned ticket.
EOF

cat <<'EOF' > prompts/handoff/chatgpt-chat.md
# ChatGPT

Used for:
- Architecture review
- Code review
- System design
- Debugging
- Planning

Paste only the relevant files or diff. Ensure recommendations adhere to AI.md.
EOF

cat <<'EOF' > prompts/handoff/gemini-chat.md
# Gemini

Used for:
- Large implementations
- Multi-file refactoring
- Repository understanding

Paste only the required context. Ensure architecture strictly follows AI.md.
EOF

success "Created AI prompts"

###########################################
# Gitignore
###########################################

if [ ! -s ".gitignore" ]; then
cat <<EOF > .gitignore
node_modules
dist
build
coverage

.next
.turbo

.env
.env.local

.DS_Store
.idea
.vscode/settings.json
EOF
success "Generated .gitignore"
fi

###########################################
# VS Code
###########################################

create_file_if_missing ".vscode/settings.json"
create_file_if_missing ".vscode/extensions.json"

###########################################
# Summary
###########################################

echo ""
echo "════════════════════════════════════════════════════"
echo -e "${GREEN}Bootstrap Complete!${NC}"
echo "════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo "1. Define global agent rules in AI.md"
echo "2. Copy your PRD into docs/PRD.md"
echo "3. Define real-time boundaries in docs/ROOM_PROTOCOL.md"
echo "4. Assign FFH-001 in docs/ACTIVE_TASK.md"
echo ""
echo "Happy Building 🚀"