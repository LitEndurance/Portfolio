#!/usr/bin/env bash
# Convenience wrapper for scripts/clean.cjs.
# Passes through any flags, e.g.:
#   ./scripts/cleanup.sh --deploy
#   ./scripts/cleanup.sh --all --init-git

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
node "${SCRIPT_DIR}/clean.cjs" "$@"
