# Project Context

## Purpose
`sf-swift` is a Salesforce CLI plugin focused on high-signal metadata hygiene. It ships three primary commands:
- `sf swift metadata adjust` — deterministic XML sorting/cleanup for deployable metadata.
- `sf swift metadata integrity` — scans Git history for removed Apex classes, fields, or Visualforce pages that still have downstream references.
- `sf swift detect git conflicts` — locates leftover `.rej` files so PRs fail fast when merges go wrong.
The goal is to keep repos deploy-ready by automating formatting, catching regressions before review, and documenting CI guardrails.

## Tech Stack
- TypeScript (ES modules, compiled with `tsc` targeting Node 18+/24)
- Node.js runtime with the Salesforce CLI (`sf`) and oclif plugin framework
- `xml2js` for parsing/serializing metadata files
- Testing via Mocha + Chai with NYC coverage
- Prettier (plus `prettier-plugin-apex`) for formatting TypeScript and Apex snippets
- GitHub Actions workflows running on `ubuntu-latest`

## Project Conventions

### Code Style
- Prettier-enforced formatting with double quotes, semicolons, and 4-space indentation.
- ASCII-only source files unless an existing file already uses extended characters.
- Strict ES module syntax (`import`/`export`) and TypeScript typing everywhere.
- Minimal but meaningful inline comments; prefer helper functions inside `src/common` over large blocks.
- Always run `npm run prettier` before publishing changes.

### Architecture Patterns
- Commands live under `src/commands/swift/**` and map 1:1 with CLI topics.
- Shared logic sits in `src/common/**` (e.g., `metadata`, `xml`, `git` helpers) so new commands reuse the same analyzers.
- Static text (help, errors) belongs in `messages/*.md` to leverage oclif localization.
- XML processing flows through `xml2js` → in-memory transforms → deterministic sorting via `src/common/xml/sorter.ts` using rules from `sorting-rules.ts`.
- Tests mirror the source structure inside `test/common/**` and synthetic metadata fixtures live under `test-files/`.

### Testing Strategy
- Unit tests use Mocha + Chai (`npm test`) with NYC for coverage (`npm run test:coverage`).
- Any new sorting or analyzer logic must include regression tests in the matching `test/common/**` suite plus sample fixtures when practical.
- Workflow or CLI behavior changes require README + CHANGELOG updates along with tests that cover failure paths.
- Prefer fast, deterministic tests; avoid network or org calls by relying on local fixtures and Git history stubs.

### Git Workflow
- Main branch tracks the latest release; version bumps follow Semantic Versioning and every change logs into `CHANGELOG.md` (Keep a Changelog format).
- Pull requests trigger four GitHub Actions workflows: `pr-check-adjust` (integrity + conflict gates), `pr-metadata-adjust` (auto-format metadata), `pr-detect-issues` (reject file watcher), and `pr-code-adjust` (Prettier on Apex classes/triggers).
- Contributors run `npm run prettier` and `npm test` locally before opening PRs. CI must stay green before merging.
- Releases happen by bumping `package.json`, updating release notes, tagging (`vX.Y.Z`), and letting npm publish off the tag.

## Domain Context
- Operates on Salesforce metadata XML (profiles, permission sets, list views, flows, etc.) and Apex/Visualforce source files.
- `metadata adjust` honors whitelists and exclusion rules so risky metadata (e.g., flows, flexipages) stays untouched unless explicitly requested.
- `metadata integrity` inspects recent Git deletions to ensure dependent assets (profiles, formulas, flows, record types) no longer reference removed classes/fields.
- `detect git conflicts` treats `.rej` artifacts as hard failures, surfacing them through PR comments to keep CI pipelines clean.
- GitHub Actions documentation in the README is the authoritative source for how automation behaves.

## Important Constraints
- Maintain ASCII-only files; introduce Unicode only when a file already relies on it.
- Follow `src/common/metadata/metadata-rules.ts` when adding new metadata types; ensure unsorted arrays (e.g., list view `<filters>`, file upload dispositions) stay preserved.
- Prettier is the single source of truth for formatting; do not hand-format TypeScript.
- Workflows target Node.js 24 and assume `sf` CLI availability—avoid features requiring newer runtimes without updating CI docs.
- Each feature must include README + CHANGELOG updates and tests before merging.

## External Dependencies
- Salesforce CLI (`sf`) + oclif runtime for command execution.
- GitHub Actions runners (with `GITHUB_TOKEN`) pushing auto-format commits back to PR branches.
- Prettier + `prettier-plugin-apex` for Apex reformatting scripts (`prettier-fix-delta.sh`).
- `xml2js` for XML parsing/serialization and `@salesforce/*` libraries for CLI integration.
- Git as the source of truth for detecting deleted metadata via commit history.
