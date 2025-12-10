## ADDED Requirements
### Requirement: Detect file command accepts multi-type searches
The CLI SHALL expose `sf swift detect file` which scans for files matching one or more suffix `--type` arguments within the provided path (argument) or `--target-dir`. Types MUST accept strings like `.rej` and `.tmp`, and the command SHALL error when no `--type` values are supplied. The command SHALL default to the current working directory when neither a path argument nor `--target-dir` is passed.

#### Scenario: Multiple suffixes across nested directories
- **GIVEN** a repo with `.rej` and `.log` files under nested folders
- **WHEN** the user runs `sf swift detect file ./repo --type .rej --type .log`
- **THEN** the command SHALL list every matching file relative to the scan root
- **AND** the JSON output SHALL include both suffix sets with their combined count.

### Requirement: Detect file command mirrors conflict detector reporting
`sf swift detect file` SHALL reuse the conflict detector summary style: emoji-prefixed headings, elapsed time, and per-file listings. It SHALL exit with code `1` when matches exist unless `--json` is set, in which case it MUST return status `0` with structured data. The output schema SHALL include `count`, `files`, and `types` arrays so GitHub Actions can consume the payload. When no files match, it SHALL state the directory is clean and exit `0`.

#### Scenario: Matches found without JSON flag
- **GIVEN** at least one file matches the supplied suffix
- **WHEN** the user omits `--json`
- **THEN** the command SHALL print the summary, list the files, and exit with status `1`.

#### Scenario: Matches found with JSON flag
- **GIVEN** at least one file matches
- **WHEN** the user passes `--json`
- **THEN** the command SHALL emit JSON containing `count`, `types`, and `files`
- **AND** exit with status `0` so automation can parse the payload without failing immediately.

### Requirement: Detect file command supports capture limits
The command SHALL accept an integer `--max` flag that caps how many matches are collected across all suffixes. When `--max` is provided, scanning MUST stop as soon as the combined match count reaches the limit, and the summary/JSON output SHALL note only the files discovered before the cap. When `--max` is omitted, the command SHALL consider the whole directory tree. Passing values below `1` SHALL produce a validation error.

#### Scenario: Early exit after first match
- **GIVEN** a repo contains multiple `.rej` files
- **WHEN** the user runs `sf swift detect file --type .rej --max 1`
- **THEN** the command SHALL stop scanning after locating the first `.rej`
- **AND** exit using the standard reporting that lists only that file.

#### Scenario: Limit reached after multiple suffixes
- **GIVEN** a repo contains `.rej` and `.log` files
- **WHEN** the user runs `sf swift detect file --type .rej --type .log --max 10`
- **THEN** the command SHALL stop after collecting ten combined matches regardless of suffix order
- **AND** the JSON output SHALL report `count: 10` along with filenames gathered before scanning stopped.
