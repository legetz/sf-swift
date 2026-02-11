#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRATCH_DEF="$ROOT_DIR/test-files/config/project-scratch-def.json"
SOURCE_DIR="$ROOT_DIR/test-files/original"

ALIAS="${1:-sf-swift-scratch}"
DURATION_DAYS="${2:-1}"
WAIT_MINUTES="${3:-30}"

if [[ ! "$DURATION_DAYS" =~ ^[0-9]+$ ]]; then
  echo "Duration days must be a number (max 1)."
  exit 1
fi

if [[ "$DURATION_DAYS" -gt 1 ]]; then
  echo "Duration days must be 1 or less."
  exit 1
fi

if ! command -v sf >/dev/null 2>&1; then
  echo "Salesforce CLI (sf) is required but not found on PATH."
  exit 1
fi

if ! sf org list --all --json | node -e 'const data = JSON.parse(require("fs").readFileSync(0, "utf8")); process.exit(data.result?.devHubs?.some((org) => org.isDefaultDevHubUsername) ? 0 : 1)'; then
  echo "Default Dev Hub is not set. Authenticate and set a default Dev Hub before running this script."
  exit 1
fi

if [[ ! -f "$SCRATCH_DEF" ]]; then
  echo "Scratch definition not found at $SCRATCH_DEF"
  exit 1
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source directory not found at $SOURCE_DIR"
  exit 1
fi

echo "Creating scratch org '$ALIAS' for ${DURATION_DAYS} day(s)..."
sf org create scratch \
  --definition-file "$SCRATCH_DEF" \
  --alias "$ALIAS" \
  --duration-days "$DURATION_DAYS" \
  --set-default

echo "Deploying source from $SOURCE_DIR to $ALIAS..."
sf project deploy start \
  --source-dir "$SOURCE_DIR" \
  --target-org "$ALIAS" \
  --wait "$WAIT_MINUTES"

echo "Scratch org ready: $ALIAS"
