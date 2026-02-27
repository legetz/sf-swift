## 1. Implementation

- [x] 1.1 Add a new workflow file under `.github/workflows/` with both `workflow_dispatch` and weekly `schedule` triggers.
- [x] 1.2 Configure Node + Salesforce CLI setup in the workflow and authenticate to Dev Hub via OAuth `client_credentials`.
- [x] 1.3 Ensure workflow commands always target the latest Salesforce API version.
- [x] 1.4 Execute `scripts/scratch-deploy.sh` followed by `scripts/scratch-pull-compare.sh` with consistent alias/wait arguments.
- [x] 1.5 Ensure workflow fails when metadata comparison detects differences and surfaces clear logs/artifacts for diagnosis.
- [x] 1.6 Document required secrets (`SF_INSTANCE_URL`, `SF_CLIENT_ID`, `SF_CLIENT_SECRET`), schedule behavior, and manual run instructions in README and CHANGELOG.

## 2. Validation

- [x] 2.1 Validate workflow YAML syntax and command wiring.
- [x] 2.2 Run formatting/docs checks required by repository conventions.
