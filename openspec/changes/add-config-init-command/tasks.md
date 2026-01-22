## 1. Implementation
- [ ] 1.1 Scaffold `sf swift config init` command and wire it into the CLI topic tree.
- [ ] 1.2 Write `.swiftrc` to the current working directory using the built-in defaults (same structure as `getDefaultConfig()`).
- [ ] 1.3 If `.swiftrc` exists, create a dated backup `.swiftrc.backup.YYYYMMDD` before overwriting and print an informational message.
- [ ] 1.4 Add unit tests for new file creation and backup behavior.
- [ ] 1.5 Update README + CHANGELOG and any configuration docs to include the new command and examples.

## 2. Validation
- [ ] 2.1 Run `npm test`.
- [ ] 2.2 Run `npm run prettier`.
- [ ] 2.3 Run `openspec validate add-config-init-command --strict`.
