# Change: Extend `.swiftrc` to configure `sf swift metadata integrity`

## Why
Teams need to control which metadata integrity checks run (and where references are searched) without adding bespoke wrapper scripts. A repo-local `.swiftrc` configuration keeps integrity enforcement consistent across developers and CI.

## What Changes
- Extend `.swiftrc` YAML schema to support `metadata.integrity` configuration.
- Allow configuring which removed metadata types are considered (Apex classes, custom fields, Visualforce pages).
- Allow configuring which reference “surfaces” are scanned per removed type (profiles, permission sets, flows, layouts, etc.).
- Use built-in defaults when `.swiftrc` does not specify integrity rules.
- Ensure `sf swift config init` generates a `.swiftrc` that includes the built-in integrity defaults.
- Add a `--config` / `-c` flag to `sf swift metadata integrity` matching the behavior of `sf swift metadata adjust`.

## Impact
- Affected specs: `swiftrc-config`
- Affected code (future implementation): `src/common/config/default-config.ts`, `src/common/config/swiftrc-config.ts`, `src/commands/swift/metadata/integrity.ts`, and `src/common/metadata/metadata-integrity-rules.ts` (as the default source of truth).
- Docs (future implementation): README and METADATA-INTEGRITY.md should include examples of `.swiftrc` integrity configuration.
