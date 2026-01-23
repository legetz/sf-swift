# swiftrc-config Specification

## Purpose
TBD - created by archiving change add-swiftrc-config. Update Purpose after archive.
## Requirements
### Requirement: `.swiftrc` can configure metadata integrity checks
The system SHALL support configuring `sf swift metadata integrity` via `.swiftrc` using a `metadata.integrity` section.

The schema SHALL support the following structure:

```yaml
metadata:
  integrity:
    removedTypes: [ApexClass, CustomField, VisualforcePage]
    rules:
      - removedType: ApexClass
        surfaces: [profile, permissionSet, lwc, aura, flow, apexSource]
      - removedType: CustomField
        surfaces: [profile, permissionSet, flow, formulaField, layout, validationRule, fieldSet, recordType, compactLayout]
      - removedType: VisualforcePage
        surfaces: [profile, permissionSet]
```

#### Scenario: Integrity config is not present
- **GIVEN** a `.swiftrc` that does not define `metadata.integrity`
- **WHEN** the user runs `sf swift metadata integrity`
- **THEN** the command SHALL use built-in integrity defaults.

### Requirement: Built-in defaults are used when integrity rules are unspecified
If `.swiftrc` is absent OR if `.swiftrc` does not define `metadata.integrity.rules`, the system SHALL use the built-in defaults equivalent to the current `METADATA_INTEGRITY_RULES` mapping.

#### Scenario: Config only restricts removed types
- **GIVEN** a `.swiftrc` with `metadata.integrity.removedTypes: [ApexClass]`
- **AND** `metadata.integrity.rules` is not specified
- **WHEN** the user runs `sf swift metadata integrity`
- **THEN** only Apex class removals SHALL be considered
- **AND** the reference surfaces checked for Apex classes SHALL follow the built-in defaults.

### Requirement: Removed metadata types are configurable
The `.swiftrc` setting `metadata.integrity.removedTypes` SHALL allow selecting which removed metadata types are considered during integrity scans.

Allowed values:
- `ApexClass`
- `CustomField`
- `VisualforcePage`

When `metadata.integrity.removedTypes` is omitted, the system SHALL default to all supported removed metadata types.

#### Scenario: Restrict to field removals only
- **GIVEN** `.swiftrc` defines `metadata.integrity.removedTypes: [CustomField]`
- **WHEN** the command finds recent deletions that include an Apex class and a custom field
- **THEN** the Apex class deletion SHALL be ignored for integrity scanning
- **AND** the custom field deletion SHALL be scanned for references.

### Requirement: Reference surfaces are configurable per removed type
The `.swiftrc` setting `metadata.integrity.rules` SHALL allow overriding which reference surfaces are scanned per removed metadata type.

Each rule object SHALL have:
- `removedType`: one of `ApexClass|CustomField|VisualforcePage`
- `surfaces`: a non-empty array of surface identifiers

Allowed `surfaces` values:
- `profile`
- `permissionSet`
- `apexSource`
- `lwc`
- `aura`
- `flow`
- `formulaField`
- `layout`
- `validationRule`
- `fieldSet`
- `recordType`
- `compactLayout`

#### Scenario: Limit Apex class scanning to access control only
- **GIVEN** `.swiftrc` defines a rule for `removedType: ApexClass` with `surfaces: [profile, permissionSet]`
- **WHEN** a removed Apex class is detected
- **THEN** the command SHALL scan Profiles and Permission Sets for `classAccesses`
- **AND** it SHALL NOT scan source files, flows, lwc, or aura surfaces for that removed class.

### Requirement: Manual test inputs respect configured removed types
When users provide `--test-with-class` or `--test-with-field`, the command SHALL treat those inputs as removed items only if the corresponding removed type is enabled by `metadata.integrity.removedTypes`.

If a manual test input is provided for a disabled type, the command SHOULD warn and ignore the input.

#### Scenario: Manual class test ignored when ApexClass checks disabled
- **GIVEN** `.swiftrc` defines `metadata.integrity.removedTypes: [CustomField]`
- **WHEN** the user runs `sf swift metadata integrity --test-with-class LegacyService`
- **THEN** the command SHOULD warn that Apex class checks are disabled
- **AND** it SHALL NOT include `LegacyService` in removed items.

### Requirement: Integrity config validation rejects unknown values
The system SHALL validate `.swiftrc` integrity configuration and MUST fail fast with a clear error when:
- `metadata.integrity.removedTypes` contains an unknown value
- `metadata.integrity.rules[].removedType` contains an unknown value
- `metadata.integrity.rules[].surfaces` contains an unknown surface
- `metadata.integrity.rules[].surfaces` is empty

#### Scenario: Unknown surface fails validation
- **GIVEN** `.swiftrc` defines `metadata.integrity.rules` with a surface `profiles` (typo)
- **WHEN** the config is loaded
- **THEN** the command SHALL exit with a validation error mentioning the invalid surface value.

### Requirement: `sf swift config init` includes integrity defaults
When the user runs `sf swift config init`, the generated `.swiftrc` SHALL include a `metadata.integrity` section populated with the built-in defaults.

Built-in defaults for `metadata.integrity` SHALL be equivalent to the current `METADATA_INTEGRITY_RULES` mapping (and the default removed types supported by the command).

#### Scenario: New `.swiftrc` includes integrity defaults
- **GIVEN** a directory without an existing `.swiftrc`
- **WHEN** the user runs `sf swift config init`
- **THEN** the created `.swiftrc` SHALL contain a `metadata.integrity` section
- **AND** that section SHALL define defaults for removed types and surfaces consistent with the built-in rule set.

#### Scenario: Overwriting an existing `.swiftrc` preserves backup behavior
- **GIVEN** a directory with an existing `.swiftrc`
- **WHEN** the user runs `sf swift config init`
- **THEN** the command SHALL create a backup file before overwriting
- **AND** the new `.swiftrc` SHALL include the integrity defaults.

### Requirement: Metadata integrity command accepts `--config` flag
The CLI SHALL support a `--config` (short `-c`) flag for `sf swift metadata integrity` that points to a YAML configuration file to load.

When `--config` is provided, the command SHALL load configuration from that file path.

#### Scenario: Explicit config file is used
- **GIVEN** the user has a YAML config file at `./ci/swift.yaml`
- **WHEN** the user runs `sf swift metadata integrity --config ./ci/swift.yaml`
- **THEN** the command SHALL load config from `./ci/swift.yaml`
- **AND** it SHALL NOT search for `.swiftrc`.

### Requirement: Integrity config resolution mirrors metadata adjust
When `--config` is not provided, `sf swift metadata integrity` SHALL attempt to locate and load `.swiftrc` using the same project-root discovery rules as `sf swift metadata adjust`.

If no `.swiftrc` is found, the command SHALL fall back to built-in defaults.

#### Scenario: Config flag omitted and `.swiftrc` is found
- **GIVEN** the user runs the command from a nested directory
- **AND** the repo root contains a `.swiftrc`
- **WHEN** the user runs `sf swift metadata integrity`
- **THEN** the command SHALL load the repo root `.swiftrc`.

#### Scenario: No config file exists anywhere
- **GIVEN** there is no `.swiftrc` in the directory tree
- **WHEN** the user runs `sf swift metadata integrity`
- **THEN** the command SHALL use built-in defaults.

