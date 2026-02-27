## ADDED Requirements
### Requirement: Scratch roundtrip workflow supports weekly and manual triggers
The repository SHALL provide a GitHub Actions workflow that runs Salesforce scratch roundtrip validation both automatically on a weekly schedule and manually via `workflow_dispatch`.

#### Scenario: Weekly schedule trigger
- **GIVEN** the default branch contains the workflow
- **WHEN** the configured weekly cron time occurs
- **THEN** GitHub Actions SHALL start the workflow without user interaction.

#### Scenario: Manual trigger
- **GIVEN** a maintainer opens the Actions tab
- **WHEN** they start the workflow via `workflow_dispatch`
- **THEN** the workflow SHALL execute the same validation flow as the scheduled run.

### Requirement: Workflow authenticates to Dev Hub before scratch operations
The workflow SHALL install/configure Salesforce CLI and authenticate to a Dev Hub org via OAuth `client_credentials` before calling any script that creates, reuses, deploys to, or retrieves from a scratch org.

#### Scenario: Successful authentication
- **GIVEN** required Salesforce OAuth credentials are provided as repository secrets
- **WHEN** the workflow runs
- **THEN** it SHALL establish a Dev Hub connection with SF CLI before executing scratch scripts.

#### Scenario: Authentication fails
- **GIVEN** credentials are missing or invalid
- **WHEN** the authentication step runs
- **THEN** the workflow SHALL fail fast and SHALL NOT execute scratch deploy/compare scripts.

### Requirement: Workflow always uses the latest Salesforce API version
The workflow SHALL execute Salesforce CLI authentication and org operations using the latest available Salesforce API version at runtime, rather than a fixed API version.

#### Scenario: Workflow starts with latest API available
- **GIVEN** Salesforce exposes a newer API version than prior runs
- **WHEN** the workflow executes
- **THEN** authentication and subsequent Salesforce CLI operations SHALL target that latest API version.

#### Scenario: Latest API cannot be resolved
- **GIVEN** the workflow cannot resolve a latest API version from SF CLI
- **WHEN** the API resolution step runs
- **THEN** the workflow SHALL fail and SHALL NOT continue to deploy or retrieve metadata.

### Requirement: Workflow reuses existing scratch scripts for deployment and comparison
The workflow SHALL call `scripts/scratch-deploy.sh` and `scripts/scratch-pull-compare.sh` as the canonical implementation for deploy and roundtrip comparison.

#### Scenario: End-to-end comparison succeeds
- **GIVEN** metadata deploy and retrieve operations succeed
- **WHEN** the compare script checks retrieved files against `test-files/adjusted-meta`
- **THEN** the workflow SHALL complete successfully.

#### Scenario: Comparison detects differences
- **GIVEN** retrieved metadata differs from expected files
- **WHEN** `scripts/scratch-pull-compare.sh` exits non-zero
- **THEN** the workflow SHALL fail and expose logs indicating a metadata mismatch.

### Requirement: Workflow exposes required configuration inputs and secrets
The workflow SHALL define and document exactly three required GitHub secrets for Salesforce authentication: instance URL, connected app client ID, and connected app client secret. The workflow SHALL also support optional/manual inputs for run-time parameters such as scratch alias, wait minutes, and force recreation behavior.

#### Scenario: Manual run with custom alias and force recreation
- **GIVEN** a maintainer provides manual input values
- **WHEN** the workflow executes
- **THEN** those values SHALL be passed to the underlying scratch scripts.

#### Scenario: Scheduled run with defaults
- **GIVEN** no manual inputs are provided on scheduled execution
- **WHEN** the workflow starts
- **THEN** it SHALL use documented default values for alias and wait settings.

#### Scenario: Required secret set is incomplete
- **GIVEN** one or more required authentication secrets are missing
- **WHEN** the workflow starts
- **THEN** it SHALL fail before authentication and SHALL report missing secret configuration.
