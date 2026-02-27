# Change: Add scheduled/manual scratch roundtrip workflow

## Why

The repository has helper scripts to deploy fixture metadata to a scratch org and compare retrieved metadata with expected output, but there is no GitHub Action that runs this end-to-end validation automatically. Teams need a recurring and on-demand CI guardrail to detect Salesforce metadata drift early.

## What Changes

- Add a new GitHub Actions workflow that can run on a weekly cron schedule and via manual `workflow_dispatch`.
- In the workflow, authenticate to Salesforce Dev Hub using SF CLI OAuth `client_credentials` flow before running scratch operations.
- Configure the workflow to always use the latest Salesforce API version for auth and script-driven org operations.
- Reuse existing scripts (`scripts/scratch-deploy.sh` and `scripts/scratch-pull-compare.sh`) to deploy test metadata and verify pulled metadata matches `test-files/adjusted-meta`.
- Define required GitHub secrets as only Salesforce instance URL, connected app client ID, and connected app client secret, plus workflow inputs for org alias/wait settings and optional scratch org recreation behavior.
- Document the workflow usage and required environment/secrets in README and CHANGELOG.

## Impact

- Affected specs: `scratch-roundtrip-workflow`
- Affected code: `.github/workflows/*` (new workflow), `README.md`, `CHANGELOG.md`.
