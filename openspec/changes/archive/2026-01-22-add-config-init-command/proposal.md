# Change: Add `sf swift config init`

## Why
Teams often want a starting `.swiftrc` checked into a repo so `sf swift metadata adjust` runs with explicit, reviewable rules. Today, SF Swift supports defaults and custom configs but does not provide a guided way to materialize the default configuration into a `.swiftrc` file.

## What Changes
- Introduce a new CLI command `sf swift config init` that creates a `.swiftrc` file in the current working directory using SF Swift's built-in default configuration.
- If `.swiftrc` already exists, create a backup named `.swiftrc.backup.YYYYMMDD` before writing the new file, and inform the user via console output.
- Document the new command and its behavior (including backup behavior) in the project docs.

## Impact
- Affected specs: `config-init-command`
- Affected code: new command under `src/commands/swift/config/init.ts` and shared config helpers under `src/common/config/` (if needed).
- Affected docs: README + CHANGELOG + configuration documentation (as applicable).
