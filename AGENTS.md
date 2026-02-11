<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# SF Swift Agent Guide

This file is the entry point for agentic coding assistants working in this repo.
Keep it concise, factual, and aligned to existing tooling.

## Quick Start

- Repo type: TypeScript ESM CLI plugin (Oclif, Salesforce CLI)
- Runtime: Node.js (see workflows under `.github/workflows/` for version)
- Source: `src/`
- Tests: `test/` (Mocha + Chai)
- Build output: `dist/`

## Commands

### Install

```bash
npm install
```

### Build

```bash
npm run build
```

### Clean

```bash
npm run clean
```

### Test (all)

```bash
npm test
```

### Test with coverage

```bash
npm run test:coverage
```

### Test watch

```bash
npm run test:watch
```

### Run a single test file

```bash
npx mocha test/common/metadata/metadata-adjust.test.ts
```

### Run a single test by name

```bash
npx mocha --grep "metadata-adjust" test/common/metadata/metadata-adjust.test.ts
```

### Formatting

```bash
npm run prettier
```

### Formatting (check only)

```bash
npm run prettier:verify
```

### Local plugin install

```bash
npm run plugin:install
```

## Linting

- There is no ESLint config in this repo.
- Use `npm run prettier:verify` for formatting checks.
- `lint-staged` runs Prettier on `*.ts` in pre-commit (via Husky).

## Code Style

### TypeScript and Modules

- ESM only (`"type": "module"`); use `import`/`export` everywhere.
- Keep `.js` extension in relative imports (compiled ESM expects it).
- Prefer explicit types on public APIs; internal helpers can rely on inference.
- `tsconfig` is strict ESM, but `noImplicitAny` and `noImplicitThis` are disabled.
- `skipLibCheck` is enabled; do not silence real type errors in local code.

### Imports

- Group imports by source: Node built-ins first, then external packages, then local modules.
- Use `import * as fs from "fs"` and `import * as path from "path"` for Node built-ins.
- Avoid deep relative paths when a nearby module exists; prefer local module boundaries.

### Formatting

- Prettier is the source of truth.
- `printWidth`: 120, `trailingComma`: none.
- Prettier Apex plugin is enabled for Salesforce formats.
- Do not add custom formatting rules; update `.prettierrc` if absolutely needed.

### Naming

- Classes: `PascalCase` (e.g., `SfMetadataAdjuster`).
- Functions and variables: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` when truly constant and module-scoped.
- File names: `kebab-case` for docs, `camelCase` or `kebab-case` for TS as used.

### Error Handling

- Throw `Error` with clear, user-facing messages for invalid CLI usage.
- Log warnings and non-fatal issues, but keep CI/CLI output minimal.
- For long operations, return status and summary counts (see metadata adjust/integrity).
- Avoid swallowing exceptions; include context in errors when possible.

### Testing

- Mocha + Chai. Use `describe`/`it` with concise, behavior-based names.
- Prefer fixtures under `test-files/` for metadata XML behavior.
- Clean up temp files in `afterEach`.

## Repo-Specific Behaviors

- Metadata adjust uses config from `.swiftrc` or defaults.
- Integrity scans rely on config rules; preserve behavior and JSON output format.
- Keep CLI output emojis and structure consistent with existing commands.

## Documentation Expectations (from Copilot instructions)

- Workflow configuration lives under `.github/workflows/`.
- Any additions should document new environment variables in `README.md`.
- Update `README.md` and `CHANGELOG.md` alongside feature work.
- Follow Keep a Changelog format for version entries and include release links.
- Provide examples or configuration snippets when introducing new CLI flags or workflow options.

## OpenSpec Workflow

- Follow the OpenSpec instructions above when a request mentions planning, proposals,
  new capabilities, breaking changes, architecture shifts, or large perf/security work.
- Open `openspec/AGENTS.md` when those triggers are present.
- Do not implement changes before proposal approval when OpenSpec applies.

## Safety & Hygiene

- Do not rewrite history or use destructive git commands unless explicitly requested.
- Avoid committing secrets or generated files (`dist/`, `node_modules/`).
- Keep changes scoped; do not reformat unrelated files.
