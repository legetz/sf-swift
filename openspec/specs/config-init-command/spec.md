# config-init-command Specification

## Purpose
TBD - created by archiving change add-config-init-command. Update Purpose after archive.
## Requirements
### Requirement: Config init command creates a default `.swiftrc`
The CLI SHALL expose `sf swift config init` which creates a `.swiftrc` file in the current working directory. The generated `.swiftrc` content SHALL be the YAML representation of SF Swift's built-in default configuration (i.e., the same configuration used when `sf swift metadata adjust` runs without a `.swiftrc`).

#### Scenario: Create `.swiftrc` in an empty directory
- **GIVEN** the current working directory does not contain a `.swiftrc`
- **WHEN** the user runs `sf swift config init`
- **THEN** the command SHALL create `.swiftrc` in the current working directory
- **AND** the command SHALL print a success message indicating `.swiftrc` was created.

### Requirement: Config init command backs up an existing `.swiftrc`
If `.swiftrc` exists in the current working directory, `sf swift config init` SHALL create a backup before overwriting it. The backup filename SHALL be `.swiftrc.backup.YYYYMMDD`, where `YYYYMMDD` is derived from the local calendar date at the time the command runs.

The command SHALL inform the user via console output that:
- A backup was created
- The backup filename used

#### Scenario: Backup and overwrite existing `.swiftrc`
- **GIVEN** the current working directory already contains a `.swiftrc`
- **WHEN** the user runs `sf swift config init`
- **THEN** the command SHALL create a backup named `.swiftrc.backup.YYYYMMDD`
- **AND** the command SHALL overwrite `.swiftrc` with the default configuration
- **AND** the command SHALL print an informational message referencing the backup filename.

### Requirement: Config init command does not overwrite an existing backup
If the backup filename `.swiftrc.backup.YYYYMMDD` already exists in the current working directory, the command SHALL exit with a non-zero status and SHALL NOT modify `.swiftrc`.

#### Scenario: Backup name collision
- **GIVEN** `.swiftrc` exists
- **AND** `.swiftrc.backup.YYYYMMDD` already exists for the current date
- **WHEN** the user runs `sf swift config init`
- **THEN** the command SHALL exit with a non-zero status
- **AND** the command SHALL print an error message describing the backup collision
- **AND** `.swiftrc` SHALL remain unchanged.

