# Change: Add `sf swift detect file`

## Why
The existing `sf swift detect git conflicts` command only scans for `.rej` files. Teams need a more flexible detector that can search for any file suffix (e.g., `.rej`, `.log`, `.tmp`) so CI jobs can guard against other unwanted artifacts without building bespoke scripts.

## What Changes
- Introduce a new CLI command `sf swift detect file` that accepts 1..n `--type` values (file suffixes) and reports matching files.
- Reuse the listing/reporting semantics from `detect git conflicts`, including JSON output, summaries, and non-zero exits when matches are found (unless `--json`).
- Keep `detect git conflicts` as a convenience wrapper around the new command for `.rej` so existing automations keep working.
- Update README + CHANGELOG to document the new command and clarify workflow usage.

## Impact
- Affected specs: `detect-file-command`
- Affected code: `src/commands/swift/detect/file.ts`, `src/commands/swift/detect/git/conflicts.ts`, shared helpers under `src/common/helper/`, README, CHANGELOG, GitHub workflow docs.
