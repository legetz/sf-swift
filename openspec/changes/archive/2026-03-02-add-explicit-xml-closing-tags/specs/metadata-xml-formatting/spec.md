## ADDED Requirements
### Requirement: Explicit closing tags can be configured per metadata type
The system SHALL allow formatting rules to define `explicitClosingElements` as dot-separated element paths relative to the file root. Paths MAY include `*` to match any single segment. When an element at a configured path is empty, the formatter SHALL output an explicit open/close tag instead of a self-closing tag.

#### Scenario: List view shared target keeps explicit closing tag
- **GIVEN** a list view metadata file with an empty `sharedTo.allInternalUsers` element
- **AND** the formatting rule for `listView-meta.xml` includes `explicitClosingElements: ["sharedTo.allInternalUsers"]`
- **WHEN** the metadata is formatted
- **THEN** the output SHALL include `<allInternalUsers></allInternalUsers>`
- **AND** it SHALL NOT include `<allInternalUsers />` or `<allInternalUsers/>`.

#### Scenario: Lookup filter value keeps explicit closing tag
- **GIVEN** a field metadata file with an empty `lookupFilter.filterItems.value` element
- **AND** the formatting rule for `field-meta.xml` includes `explicitClosingElements: ["lookupFilter.filterItems.value"]`
- **WHEN** the metadata is formatted
- **THEN** the output SHALL include `<value></value>`
- **AND** it SHALL NOT include `<value />` or `<value/>`.

#### Scenario: Wildcard path matches repeated segments
- **GIVEN** a field metadata file with an empty `lookupFilter.filterItems.value` element
- **AND** the formatting rule for `field-meta.xml` includes `explicitClosingElements: ["lookupFilter.filterItems.*.value"]`
- **WHEN** the metadata is formatted
- **THEN** the output SHALL include `<value></value>`
- **AND** it SHALL NOT include `<value />` or `<value/>`.

### Requirement: Defaults include explicit closing elements for known metadata
The built-in formatting defaults SHALL include explicit-closing paths for known Salesforce requirements.

#### Scenario: Default list view formatting preserves shared target closing tag
- **GIVEN** default formatting rules
- **WHEN** formatting a list view with an empty `sharedTo.allInternalUsers`
- **THEN** the output SHALL include `<allInternalUsers></allInternalUsers>`.

#### Scenario: Default field formatting preserves lookup filter value closing tag
- **GIVEN** default formatting rules
- **WHEN** formatting a field with an empty `lookupFilter.filterItems.*.value`
- **THEN** the output SHALL include `<value></value>`.

### Requirement: Configuration validation accepts explicit closing paths
The `.swiftrc` schema SHALL accept `explicitClosingElements` as an array of strings in each formatting rule.

#### Scenario: Config with explicit closing elements is valid
- **GIVEN** a `.swiftrc` file that defines `metadata.adjust.formatting[0].explicitClosingElements` as an array of strings
- **WHEN** the config is loaded
- **THEN** the configuration SHALL be accepted without validation errors.

### Requirement: Explicit closing defaults are used only when unspecified
When a formatting rule omits `explicitClosingElements`, the system SHALL use the built-in explicit-closing defaults for that metadata type. When `explicitClosingElements` is present as an empty array, the system SHALL use no explicit-closing defaults for that metadata type.

#### Scenario: Defaults apply when explicitClosingElements is omitted
- **GIVEN** a `.swiftrc` rule for `listView-meta.xml` that does not define `explicitClosingElements`
- **WHEN** formatting a list view with an empty `sharedTo.allInternalUsers`
- **THEN** the output SHALL include `<allInternalUsers></allInternalUsers>` using the built-in defaults.

#### Scenario: Empty explicitClosingElements disables defaults
- **GIVEN** a `.swiftrc` rule for `listView-meta.xml` that defines `explicitClosingElements: []`
- **WHEN** formatting a list view with an empty `sharedTo.allInternalUsers`
- **THEN** the output SHALL include a self-closing `<allInternalUsers/>` (or `<allInternalUsers />`) because defaults are not applied.
