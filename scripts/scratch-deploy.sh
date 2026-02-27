#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRATCH_DEF="$ROOT_DIR/test-files/config/project-scratch-def.json"
SOURCE_DIR="$ROOT_DIR/test-files/original"

ALIAS="sf-swift-scratch"
DURATION_DAYS=1
WAIT_MINUTES=30
FORCE_RECREATE=false
API_VERSION="${SF_SWIFT_API_VERSION:-${SFDX_API_VERSION:-${SF_API_VERSION:-66}}}"

API_VERSION_ARGS=()
if [[ -n "$API_VERSION" ]]; then
  API_VERSION_ARGS=(--api-version "$API_VERSION")
fi

for arg in "$@"; do
  case "$arg" in
    --force)
      FORCE_RECREATE=true
      ;;
    *)
      ALIAS="$arg"
      ;;
  esac
done

if ! command -v sf >/dev/null 2>&1; then
  echo "Salesforce CLI (sf) is required but not found on PATH."
  exit 1
fi

ORG_LIST_JSON=$(sf org list --all --json "${API_VERSION_ARGS[@]}")
if ! node -e 'const data = JSON.parse(require("fs").readFileSync(0, "utf8")); process.exit(data.result?.devHubs?.some((org) => org.isDefaultDevHubUsername) ? 0 : 1)'; then
  echo "Default Dev Hub is not set. Authenticate and set a default Dev Hub before running this script."
  exit 1
fi <<< "$ORG_LIST_JSON"

if [[ ! -f "$SCRATCH_DEF" ]]; then
  echo "Scratch definition not found at $SCRATCH_DEF"
  exit 1
fi

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source directory not found at $SOURCE_DIR"
  exit 1
fi

REUSE_SCRATCH=false
if [[ "$FORCE_RECREATE" == "false" ]]; then
  ORG_STATUS=$(node -e '
    const data = JSON.parse(require("fs").readFileSync(0, "utf8"));
    const alias = process.env.ALIAS;
    const result = data.result || {};
    const scratch = result.scratchOrgs || [];
    const sandboxes = result.sandboxes || [];
    const nonScratch = result.nonScratchOrgs || [];
    const devHubs = result.devHubs || [];

    const matchByAlias = (org) => org.alias === alias || org.username === alias;

    const scratchOrg = scratch.find(matchByAlias);
    if (scratchOrg) {
      if (scratchOrg.connectedStatus && scratchOrg.connectedStatus !== "Connected") {
        console.log("disconnected");
        process.exit(0);
      }
      if (scratchOrg.expirationDate) {
        const exp = Date.parse(scratchOrg.expirationDate);
        if (!Number.isNaN(exp) && exp < Date.now()) {
          console.log("expired");
          process.exit(0);
        }
      }
      console.log("reusable");
      process.exit(0);
    }

    const other = [...sandboxes, ...nonScratch, ...devHubs].find(matchByAlias);
    if (other) {
      console.log("not_scratch");
      process.exit(0);
    }

    console.log("missing");
  ' <<< "$ORG_LIST_JSON")

  if [[ "$ORG_STATUS" == "not_scratch" ]]; then
    echo "Alias '$ALIAS' exists but is not a scratch org."
    exit 1
  fi

  if [[ "$ORG_STATUS" == "reusable" ]]; then
    REUSE_SCRATCH=true
  fi
fi

if [[ "$REUSE_SCRATCH" == "true" ]]; then
  echo "Reusing scratch org '$ALIAS'."
else
  echo "Creating scratch org '$ALIAS' for ${DURATION_DAYS} day(s)..."
  sf org create scratch \
    --definition-file "$SCRATCH_DEF" \
    --alias "$ALIAS" \
    --duration-days "$DURATION_DAYS" \
    --set-default \
    "${API_VERSION_ARGS[@]}"
fi

echo "Deploying source from $SOURCE_DIR to $ALIAS..."
sf project deploy start \
  --source-dir "$SOURCE_DIR" \
  --target-org "$ALIAS" \
  --wait "$WAIT_MINUTES" \
  "${API_VERSION_ARGS[@]}"

echo "Scratch org ready: $ALIAS"
