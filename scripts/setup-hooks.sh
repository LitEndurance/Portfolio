#!/bin/bash
#
# Configure git to use the hooks in .githooks/
# Run once per project after cloning.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

if [ ! -d ".git" ]; then
  echo "Error: no .git directory found. Run 'git init' first."
  exit 1
fi

echo "Setting up git hooks..."

# Tell git to look for hooks in .githooks/ instead of .git/hooks/
git config core.hooksPath .githooks

# Make sure hooks are executable
chmod +x .githooks/*

echo "Done. Hooks are now active."
echo ""
echo "Active hooks:"
for hook in .githooks/*; do
  [ -f "$hook" ] && echo "  $(basename "$hook")"
done
