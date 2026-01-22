## 1. Implementation
- [ ] 1.1 Extend `.swiftrc` config types to include `metadata.integrity`.
- [ ] 1.2 Add built-in default integrity config derived from `METADATA_INTEGRITY_RULES`.
- [ ] 1.3 Update config validation to accept optional `metadata.integrity` and validate removed types + surfaces.
- [ ] 1.4 Load `.swiftrc` in `sf swift metadata integrity` and apply config to determine checks.
- [ ] 1.5 Add tests covering defaults, overrides, and validation errors.
- [ ] 1.6 Ensure `sf swift config init` writes integrity defaults into the generated `.swiftrc`.
- [ ] 1.7 Add `--config` / `-c` flag to `sf swift metadata integrity` matching config resolution of `metadata adjust`.
- [ ] 1.8 Update README + METADATA-INTEGRITY.md + CHANGELOG with `.swiftrc` integrity examples.

## 2. Validation
- [ ] 2.1 Run `npm test`.
- [ ] 2.2 Run `npm run prettier`.
