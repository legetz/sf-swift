# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- 🧩 **Explicit Closing Rule**: Added `metadata.adjust.formatting[].explicitClosingElements` to force selected empty XML nodes to render as `<tag></tag>`.
- ✳️ **Wildcard Path Support**: `explicitClosingElements` now supports `*` for single-segment path matching (for example, `lookupFilter.filterItems.*.value`).

### Changed

- ⚙️ **Explicit Closing Defaults**: When `explicitClosingElements` is omitted in a matching formatting rule, built-in defaults are applied; setting `explicitClosingElements: []` disables those defaults.
- 🧹 **Scratch Compare Cleanup Control**: `scripts/scratch-pull-compare.sh` now supports `--no-cleanup` to skip `sf org delete scratch` on exit.

### Fixed

- 🧭 **Pattern Whitelist Precision**: Metadata adjust now applies `*.PATTERN` matching consistently for include/exclude/whitelist checks, so `page-meta.xml` no longer matches `flexipage-meta.xml`.

## [1.2.2] - 2026-02-27

### Fixed

- 🎯 **Formatting Pattern Matching**: `filePattern` matching now uses `*.PATTERN` filename semantics, so `page-meta.xml` matches `*.page-meta.xml` but not `*.flexipage-meta.xml`.

## [1.2.1] - 2026-02-27

### Added

- 🔁 **Scratch Roundtrip Workflow**: Added `.github/workflows/scratch-roundtrip.yml` to run scratch deploy/retrieve comparison weekly and on manual trigger using existing helper scripts.
- 🧩 **Custom Permission Coverage**: Added support and fixtures for `customPermission-meta.xml` processing.

### Changed

- 🔐 **Scratch Workflow Authentication**: Scratch roundtrip automation now uses OAuth `client_credentials`
- 🧱 **Metadata Baseline Updates**: Updated metadata test fixtures and compatibility behavior to align with API version `66` and scratch org roundtrip outputs.
- 📋 **Sorting Defaults**: Refined metadata sorting rules and added record type-specific formatting behavior.
- ♻️ **Integrity Scope**: Removed Flexipage handling from integrity scanning paths.

### Fixed

- 🧩 **Root XML Closing Tag**: Metadata adjust now normalizes self-closing root metadata tags (for example, `CustomObject`) into explicit opening/closing tags.
- 🧾 **Object Metadata Empty Tag Formatting**: `object-meta.xml` now preserves empty `<searchLayouts></searchLayouts>` (not self-closing) for Salesforce compatibility.
- 🛡️ **Scratch Script Reliability**: Improved scratch helper error handling and access token/environment handling for stable local and CI execution.

## [1.2.0] - 2026-02-26

### Added

- 🧭 **Integrity Config**: `.swiftrc` now supports `metadata.integrity` rules to control which removed types and surfaces are scanned.
- 🧰 **Integrity Config Flag**: Added `--config` / `-c` to `sf swift metadata integrity` to load a specific YAML file.
- 🪄 **Config Init Defaults**: `sf swift config init` now writes built-in metadata integrity defaults into `.swiftrc`.
- 🧪 **Scratch Org Helpers**: Added scripts to deploy and compare scratch org metadata, plus support to reuse an existing scratch org.
- 🧩 **Default Config Template**: Added a baseline config file to align generated defaults with current metadata rules.

### Changed

- 🧱 **Metadata Sorting Defaults**: Updated Profile and PermissionSet sorting rules to match the latest formatting defaults.
- ⚙️ **Workflow Gatekeeping**: Disabled the check-adjust step in PR workflows when it is not required.
- 📦 **Dependencies**: Upgraded project dependencies.

### Fixed

- 🧭 **Integrity Scope Handling**: Integrity scans now honor configuration that targets Profile and PermissionSet checks independently.

### Documentation

- 📚 **Markdown Improvements**: Refined docs structure and examples across README updates.

## [1.1.0] - 2026-01-22

### Added

- 🧰 **Config Init Command**: Added `sf swift config init` to generate a default `.swiftrc` and create dated backups when one already exists.
- 🔧 **Formatting Configuration Options**: New `.swiftrc` configuration options for fine-grained control over XML formatting:
  - `elementPriority` - specify which keys appear first within each object (applies recursively at all levels)
  - `sortedByElements` - specify which child keys to use for sorting array elements
  - `condensedElements` - format specified elements on single lines for cleaner git diffs
  - `unsortedArrays` - preserve original order for arrays where position matters (e.g., filters with booleanFilter)
- 📚 **Configuration Guide**: New `CONFIGURATION.md` with detailed documentation for all formatting options including before/after examples
- 🚀 **Quickstart Guide**: Added quickstart section to README

### Changed

- 🧱 **Swiftrc Layout**: Moved metadata adjust settings under `metadata.adjust` in `.swiftrc` so future commands can share the same config file.

## [1.0.18] - 2025-12-17

### Fixed

- 🧾 **Global Value Sets**: Preserve `customValue` ordering and prioritize `fullName` inside entries so boolean semantics remain intact while keeping key order consistent.

## [1.0.17] - 2025-12-10

### Added

- 🧭 **File Detector Command**: Introduced `sf swift detect file` with repeatable `--type` filters, optional `--max` limits, and JSON output so CI can block any unwanted file suffix.

### Changed

- ⚙️ **File Finder Helper**: Core suffix scanner now supports multi-suffix traversal and early exits, enabling the new detector while keeping existing commands fast.

## [1.0.15] - 2025-11-25

### Fixed

- 🔢 **List View Filters**: Metadata adjust now keeps `<filters>` arrays unsorted inside `listView-meta.xml` files so `booleanFilter` expressions continue to reference the correct clauses.

## [1.0.14] - 2025-11-17

### Added

- 🧾 **Workflow Documentation**: Expanded the README GitHub Actions section with coverage for `pr-check-adjust.yml` and `pr-code-adjust.yml` so teams understand when each automation runs.

### Changed

- 💬 **Integrity Workflow Messaging**: Updated PR comments from `pr-check-adjust.yml` to wrap file paths in inline code for clearer formatting.

## [1.0.13] - 2025-11-13

### Added

- 🧭 **Metadata Integrity Command**: Added `sf swift metadata integrity` to flag lingering profile and permission set references to deleted Apex classes or custom fields.
- 🧩 **Metadata Integrity Helper**: Shared analyzer for detecting class and field permission issues with coverage tests.
- 🧮 **Integrity Ruleset**: Centralized metadata integrity rules covering Visualforce pages, flows, layouts, validation rules, field sets, record types, and compact layouts.
- 🧪 **Manual Integrity Simulation**: Added `--test-with-class` and `--test-with-field` flags to emulate deleted Apex classes or custom fields during integrity scans.
- 📘 **Metadata Integrity Guide**: Comprehensive documentation in `METADATA-INTEGRITY.md`, linked from the README.

### Changed

- 🔍 **Integrity Coverage**: The metadata integrity scan now inspects Apex source, Visualforce pages, LWC/Aura components, Flow definitions, formula fields, layouts, validation rules, field sets, record types, and compact layouts for lingering references to deleted Apex classes, Visualforce pages, and custom fields.
- ♻️ **Flexipage Scanning**: Removed Flexipage coverage from metadata integrity checks because Lightning pages do not expose a reliable object context.
- 🎯 **Integrity Precision**: Object-aware scanning now reduces false positives across flows, layouts, field sets, record types, compact layouts, and validation rules by matching references to their owning objects.
- 🕵️ **PR Integrity Checks**: CI now runs `sf swift metadata integrity` during pull requests and blocks automated formatting when issues are detected.

### Fixed

- 🧷 **Case-Insensitive Flow Detection**: Flow audits now match field references regardless of casing, catching `account.externalid__c` alongside canonical `Account.ExternalId__c` values.

## [1.0.12] - 2025-11-11

### Changed

- 🚀 **GitHub Actions**: Bumped workflow runtime to Node.js 24 for metadata adjustment and conflict detection jobs.
- 📦 **Workflow Polish**: Tightened `.github/workflows/pr-detect-issues.yml` so comments only post when conflicts exist and improved the Markdown summary.
- 📚 **Documentation**: Streamlined README introduction to highlight both `metadata adjust` and `detect git conflicts` commands.

## [1.0.11] - 2025-11-11

### Added

- 🤖 **GitHub Workflow**: `.github/workflows/pr-detect-issues.yml` - Automatically detects git conflict files in pull requests
- 📋 **JSON Output**: `--json` flag support for `sf swift detect git conflicts` command
- 💬 **PR Comments**: Workflow comments on PRs with list of detected `.rej` files when conflicts are found

## [1.0.10] - 2025-11-10

### Added

- 📚 **Documentation**: Documented usage, flags, and behavior for the `sf swift detect git conflicts` command in the README.

### Fixed

- 🧮 **Git Conflict Detection**: Correctly reports the number of `.rej` files discovered during scans.

## [1.0.5] - 2025-11-04

### Features

- **Workflow**: `.github/workflows/pr-metadata-adjust.yml` - Automatic PR formatting
- **Delta Mode**: Process only files changed in PR when `ADJUST_DELTA_ONLY: 'true'`
- **Full Mode**: Process all metadata files when `ADJUST_DELTA_ONLY: 'false'`
- **Auto-Commit**: Automatically commits formatting changes back to PR branch
- **PR Notifications**: Comments on PR with processing results and file counts

## [1.0.4] - 2025-11-02

### Added

- 🛡️ **Safety Whitelist System** - Only processes safe metadata types by default (profiles, permissionsets, etc.)
- 🌐 **--all Flag** - Bypass whitelist to process any metadata type (use with caution)
- ✅ **Whitelist Validation** - Prevents processing non-whitelisted types unless --all is specified
- 🔍 **Git Conflict Detection** - New `sf swift detect git conflicts` command to find .rej files
- 📊 **Enhanced Logging** - Improved console output with emojis for better readability
- 🚫 **Always-Excluded Types** - Flow files permanently excluded due to special handling requirements
- 🔐 **XML Entity Preservation** - Maintains XML entities like &apos; during processing
- 🎯 **Automatic Root Element Detection** - Extracts root element from XML without hardcoded mappings
- ⚡ **Performance Improvements** - Skips node_modules and .git directories during scanning

### Changed

- 📝 **Improved Error Messages** - Clearer validation errors with helpful suggestions
- 🔧 **Parser Configuration** - Enhanced XML parsing settings for better entity handling
- 📋 **Updated Documentation** - Comprehensive README updates for whitelist feature

### Fixed

- 🐛 **XML Entity Encoding** - Fixed issue where &apos; was converted to literal apostrophe
- 🔑 **Root Element Extraction** - Resolved issue with $ key appearing instead of actual root element name
- 📦 **Type Normalization** - Improved handling of -meta.xml suffix in include/exclude flags

### Security

- 🛡️ **Safe-by-Default** - Whitelist prevents accidental processing of complex metadata types

## [1.0.0] - 2025-10-28

### Added

- 🎯 **Smart Salesforce Metadata Sorting** - Understands PermissionSet, Profile, and other metadata structures
- 💾 **Automatic Backups** - Creates timestamped backups before processing (opt-in with `--backup` flag)
- 📊 **Detailed Reporting** - Shows which files were modified vs already properly formatted
- 🔄 **Recursive Processing** - Handles nested directory structures automatically
- 🔍 **Git Integration** - Process only files changed in recent commits with `--git-depth` flag
- ⏭️ **Exclude Filter** - Skip specific metadata types (defaults: reportType, flexipage, layout)
- 🎯 **Include Filter** - Target only specific metadata types with `--include` flag
- ✅ **Error Handling** - Continues processing even if individual files fail
- 🧹 **Clean Formatting** - Consistent indentation and XML formatting
- ⚡ **Performance Optimization** - Skips files that are already properly sorted
- ⏱️ **Execution Timer** - Shows how long processing took overall
- 📦 **Salesforce CLI Plugin** - Install as `sf` CLI plugin for seamless integration
- 🚀 **GitHub Actions** - Automated publishing to npm on version tag push

### Features

- **Command**: `sf swift metadata adjust` - Main command for sorting metadata files

[Unreleased]: https://github.com/legetz/sf-swift/compare/v1.2.2...HEAD
[1.2.2]: https://github.com/legetz/sf-swift/releases/tag/v1.2.2
[1.2.1]: https://github.com/legetz/sf-swift/releases/tag/v1.2.1
[1.2.0]: https://github.com/legetz/sf-swift/releases/tag/v1.2.0
[1.1.0]: https://github.com/legetz/sf-swift/releases/tag/v1.1.0
[1.0.18]: https://github.com/legetz/sf-swift/releases/tag/v1.0.18
[1.0.15]: https://github.com/legetz/sf-swift/releases/tag/v1.0.15
[1.0.14]: https://github.com/legetz/sf-swift/releases/tag/v1.0.14
[1.0.13]: https://github.com/legetz/sf-swift/releases/tag/v1.0.13
[1.0.12]: https://github.com/legetz/sf-swift/releases/tag/v1.0.12
[1.0.11]: https://github.com/legetz/sf-swift/releases/tag/v1.0.11
[1.0.10]: https://github.com/legetz/sf-swift/releases/tag/v1.0.10
[1.0.5]: https://github.com/legetz/sf-swift/releases/tag/v1.0.5
[1.0.4]: https://github.com/legetz/sf-swift/releases/tag/v1.0.4
[1.0.0]: https://github.com/legetz/sf-swift/releases/tag/v1.0.0
