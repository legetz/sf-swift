## 1. Implementation
- [x] 1.1 Scaffold `sf swift detect file` command, parsing `--type` (repeatable) plus path/target-dir inputs.
- [x] 1.2 Extract reusable file-scanning helper so both `detect file` and `detect git conflicts` share filtering, JSON output, and summary code.
- [x] 1.3 Update `sf swift detect git conflicts` to call the helper with `.rej` types and keep parity with current behavior/flags.
- [x] 1.4 Add unit tests covering multi-type scans, duplicate handling, and exit behavior.
- [x] 1.5 Document the new command in README + CHANGELOG and adjust workflow guidance if applicable.

## 2. Validation
- [x] 2.1 Run `npm test` and add new coverage for helper + command logic.
- [x] 2.2 Run `npm run prettier` to ensure formatting.
