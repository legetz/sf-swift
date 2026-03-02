#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT_DIR/test-files/original"
EXPECTED_DIR="$ROOT_DIR/test-files/adjusted-meta"
OUTPUT_DIR="$ROOT_DIR/tmp/scratch-pull"
MANIFEST_DIR="$ROOT_DIR/tmp/scratch-manifest"

ALIAS="sf-swift-scratch"
WAIT_MINUTES="30"
NO_CLEANUP=false
API_VERSION="${SF_SWIFT_API_VERSION:-${SF_ORG_API_VERSION:-${SF_API_VERSION:-66.0}}}"

API_VERSION_ARGS=()
if [[ -n "$API_VERSION" ]]; then
  API_VERSION_ARGS=(--api-version "$API_VERSION")
fi

usage() {
  echo "Usage: $0 [alias] [--no-cleanup]"
}

POSITIONAL_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-cleanup)
      NO_CLEANUP=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      POSITIONAL_ARGS+=("$1")
      shift
      ;;
  esac
done

if [[ ${#POSITIONAL_ARGS[@]} -gt 0 ]]; then
  ALIAS="${POSITIONAL_ARGS[0]}"
fi

if ! command -v sf >/dev/null 2>&1; then
  echo "Salesforce CLI (sf) is required but not found on PATH."
  exit 1
fi

echo "Checking Dev Hub authentication context..."
ORG_LIST_ERR_FILE=$(mktemp)
if ! ORG_LIST_JSON=$(sf org list --all --json 2>"$ORG_LIST_ERR_FILE"); then
  echo "Failed to list Salesforce orgs via sf CLI."
  cat "$ORG_LIST_ERR_FILE"
  rm -f "$ORG_LIST_ERR_FILE"
  exit 1
fi
rm -f "$ORG_LIST_ERR_FILE"

if ! node -e 'const data = JSON.parse(require("fs").readFileSync(0, "utf8")); process.exit(data.result?.devHubs?.some((org) => org.isDefaultDevHubUsername) ? 0 : 1)'; then
  echo "Default Dev Hub is not set. Authenticate and set a default Dev Hub before running this script."
  exit 1
fi <<< "$ORG_LIST_JSON"

if ! sf org display --target-org "$ALIAS" "${API_VERSION_ARGS[@]}" >/dev/null 2>&1; then
  echo "Scratch org alias '$ALIAS' not found."
  exit 1
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source directory not found at $SOURCE_DIR"
  exit 1
fi

if [[ ! -d "$EXPECTED_DIR" ]]; then
  echo "Expected directory not found at $EXPECTED_DIR"
  exit 1
fi

cleanup() {
  if [[ "$NO_CLEANUP" == "true" ]]; then
    echo "Skipping scratch org cleanup (--no-cleanup)."
    return
  fi

  echo "Deleting scratch org '$ALIAS'..."
  if ! sf org delete scratch --target-org "$ALIAS" --no-prompt >/dev/null 2>&1; then
    echo "Warning: Failed to delete scratch org '$ALIAS'."
  fi
}

trap cleanup EXIT

rm -rf "$OUTPUT_DIR" "$MANIFEST_DIR"
mkdir -p "$OUTPUT_DIR" "$MANIFEST_DIR"

echo "Generating manifest from $SOURCE_DIR"
sf project generate manifest \
  --source-dir "$SOURCE_DIR" \
  --output-dir "$MANIFEST_DIR" \
  "${API_VERSION_ARGS[@]}"

echo "Retrieving source from $ALIAS to $OUTPUT_DIR"
sf project retrieve start \
  --manifest "$MANIFEST_DIR/package.xml" \
  --target-org "$ALIAS" \
  --output-dir "$OUTPUT_DIR" \
  --wait "$WAIT_MINUTES" \
  --ignore-conflicts \
  "${API_VERSION_ARGS[@]}"

echo "Comparing retrieved files against $EXPECTED_DIR"
set +e
diff -ru "$OUTPUT_DIR" "$EXPECTED_DIR"
DIFF_STATUS=$?
set -e

if [[ $DIFF_STATUS -ne 0 ]]; then
  echo "WARNING: Retrieved files differ from expected adjusted metadata."
  exit 1
fi

echo "No differences found."
