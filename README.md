# SF Swift ⚡

A fast and powerful Salesforce CLI plugin with utilities for metadata formatting, sorting, integrity checks and more 🎯

## Contents

- [Quickstart](#quickstart)
- [Installation](#installation)
- [Commands](#commands)
- [Configuration](#configuration-file-swiftrc)
- [Performance tips](#performance-tips)
- [Integration examples](#integration-examples)

## Quickstart

### 1. Install

```bash
sf plugins install sf-swift
```

### 2. Format your metadata

```bash
# Optional: Init .swiftrc config for controlling metadata rules
sf swift config init

# Format all metadata in current SF project directory (uses .swiftrc or defaults)
sf swift metadata adjust

# Format only files changed in last 5 commits
sf swift metadata adjust --git-depth 5
```

---

## Commands
- [`sf swift config init`](#command-sf-swift-config-init)
- [`sf swift metadata adjust`](#command-sf-swift-metadata-adjust)
- [`sf swift metadata integrity`](#command-sf-swift-metadata-integrity)
- [`sf swift detect git conflicts`](#command-sf-swift-detect-git-conflicts)
- [`sf swift detect file`](#command-sf-swift-detect-file)

## Installation

### Salesforce CLI Plugin

```bash
# Install from npm
sf plugins install sf-swift
```

- Make sure that you have SF CLI: `sf -v`
- Install SF CLI if missing or outdated: `npm install @salesforce/cli -g`

## Command: `sf swift metadata adjust`

Sorts and normalizes Salesforce metadata XML files with type-aware rules, entity preservation, and optional CI/CD optimized efficiency. ⚡

- 🎯 **Smart Metadata Sorting** - Understands PermissionSet, Profile, and other metadata structures
- 💾 **Automatic Backups** - Creates timestamped backups before processing (opt-in)
- 📊 **Detailed Reporting** - Shows which files were modified vs already okay
- 🔄 **Recursive Processing** - Handles nested directory structures
- 🔍 **CI/CD optimization** - Process only files changed in recent commits
- 🛡️ **Safety Whitelist** - Only processes safe metadata types by default (can be bypassed with `--all`)
- ⏭️ **Exclude Filter** - Skip specific metadata types (e.g., `--exclude field,object`)
- 🎯 **Include Filter** - Target only specific metadata types (e.g., `--include permissionset,profile`)
- 🧹 **Clean Formatting** - Consistent indentation and XML formatting
- ⏱️ **Execution Timer** - Shows how long processing took overall

### Quick start

```bash
# Process current directory
sf swift metadata adjust

# Process specific directory  
sf swift metadata adjust ./force-app/main/default

# Process with backup (disabled by default)
sf swift metadata adjust --backup

# Process only files changed in last 3 commits
sf swift metadata adjust --git-depth 3

# Process only files changed in last 5 commits with backup
sf swift metadata adjust --git-depth 5 --backup

# Process only PermissionSet files
sf swift metadata adjust --include permissionset

# Process only PermissionSet and Profile files
sf swift metadata adjust --include permissionset,profile

# Combine with git-depth to process only specific types from recent commits
sf swift metadata adjust --git-depth 3 --include permissionset

# Exclude specific types (overrides defaults)
sf swift metadata adjust --exclude profile,permissionset

# Include with custom exclusions
sf swift metadata adjust --include permissionset,field --exclude profile

# Process ALL metadata types (bypass safety whitelist)
sf swift metadata adjust --all

# Process ALL types with backup
sf swift metadata adjust --all --backup

# Process ALL types changed in last 5 commits
sf swift metadata adjust --all --git-depth 5

# Get help
sf swift metadata adjust --help
```
### Arguments
- `PATH` - Path to the SF project directory containing metadata files to process

### Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--target-dir` | `-d` | Target directory to process | `.` (current) |
| `--config` | `-c` | Path to custom config file | `.swiftrc` or built-in |
| `--git-depth` | `-g` | Process only N commits | `0` (all files) |
| `--include` | `-i` | Only process specific types | All whitelisted types |
| `--exclude` | `-e` | Exclude specific types | `reportType,flexipage,layout` |
| `--all` | `-a` | Process ALL types (bypass whitelist) | Disabled |
| `--backup` | - | Create backup before processing | Disabled |
| `--help` | `-h` | Show help information | - |

### Sample output
```
🎯 Including only: permissionset, profile, translation
🔍 Found 371 changed *-meta.xml files in last 100 commits
📋 Processing 25 specific metadata files
🔤 Processing specified metadata files...

✏️  Modified: permissionsets/Admin.permissionset-meta.xml
✏️  Modified: profiles/Admin.profile-meta.xml
...

============================================================
📊 ADJUSTMENT SUMMARY
============================================================
📁 Total files checked: 25 files
✏️ Modified: 23 files
✅ Already good: 2 files
⏭️ Skipped: 346 files
⚠️ Errors encountered: 0 files

🎉 Successfully adjusted 23 metadata files!

⏱️  Completed in 3.10 seconds
```

### Exclude filter

By default, the tool excludes certain Salesforce metadata file types that should not be sorted:

- `reportType-meta.xml` - Report Type metadata files
- `flexipage-meta.xml` - Lightning Page (FlexiPage) metadata files
- `layout-meta.xml` - Page Layout metadata files

You can override these defaults with the `--exclude` flag:

```bash
# Only exclude profiles (process everything else including layouts, flexipages, etc.)
sf swift metadata adjust --exclude profile

# Exclude nothing (process all files)
sf swift metadata adjust --exclude ""

# Custom exclusions
sf swift metadata adjust --exclude labels,field
```

These files are counted in the summary statistics but never modified.

### Safety whitelist

By default, the tool uses a **safety whitelist** to only process metadata types that are known to be safe for XML sorting. This prevents potential issues with complex metadata types that may have specific ordering requirements.

#### Whitelisted types (safe by default)

The following metadata types are whitelisted and will be processed by default:

- `cls-meta.xml` - Apex classes
- `field-meta.xml` - Fields
- `globalValueSet-meta.xml` - Global Value Sets
- `labels-meta.xml` - Labels
- `listView-meta.xml` - List views
- `object-meta.xml` - Standard Objects
- `permissionset-meta.xml` - Permission Sets
- `profile-meta.xml` - User Profiles
- `settings-meta.xml` - Org Settings (various types)
- `trigger-meta.xml` - Triggers
- `validationRule-meta.xml` - Validation Rules

#### Always excluded types

Some types are **always excluded** due to special handling requirements:

- `flow-meta.xml` - Flows (require special key ordering logic)

#### Using the whitelist

```bash
# Default: Only process whitelisted types
sf swift metadata adjust

# Specific whitelisted types only
sf swift metadata adjust --include permissionset,profile

# Error: reportType is not whitelisted
sf swift metadata adjust --include reportType
# ❌ Invalid configuration: The following types are not in the allowed whitelist: reportType-meta.xml
# Use --all flag to process all metadata types without whitelist restrictions.
```

#### Bypassing the whitelist

Use the `--all` flag to process any metadata type, bypassing whitelist restrictions:

```bash
# Process ALL metadata types (use with caution)
sf swift metadata adjust --all

# Process specific non-whitelisted types
sf swift metadata adjust --all --include reportType,customField

# Process ALL types from recent commits
sf swift metadata adjust --all --git-depth 10

# Process ALL with backup (recommended when experimenting)
sf swift metadata adjust --all --backup
```

⚠️ **Important**: When using `--all`, be aware that some complex metadata types may have specific ordering requirements that standard alphabetical sorting doesn't preserve. Always:
- Test in a non-production environment first
- Use `--backup` flag for safety
- Review changes carefully before committing
- Check that metadata still deploys correctly

### Configuration file ([.swiftrc](.swiftrc))

Metadata adjust and integrity commands  will support YAML configuration file (`.swiftrc`) in your project root. This allows you to customize behavior without command-line flags.

#### Default behavior

- If no `.swiftrc` file exists, the tool uses **built-in defaults**
- If a `.swiftrc` file is found in your project root, it is loaded and used
- Use `--config path/to/file.yaml` to specify a custom configuration file for `metadata adjust` or `metadata integrity`

To customize the configuration, run `sf swift config init` in your project root and adjust `.swiftrc` file.

#### Configuration structure

```yaml
# .swiftrc - SF Swift Configuration File

metadata:
  adjust:
    # Formatting rules define how XML elements should be sorted for each file type
    # Files are whitelisted implicitly by having a formatting rule
    formatting:
      - filePattern: "field-meta.xml"
        elementPriority:
          - fullName
      - filePattern: "listView-meta.xml"
        elementPriority:
          - fullName
        unsortedArrays:
          - filters
      - filePattern: "permissionset-meta.xml"
      - filePattern: "profile-meta.xml"

    # Element cleanup rules for removing default/empty values
    cleanup:
      field-meta.xml:
        - elementName: externalId
          removeValues:
            - "false"
          conditions:
            - elementName: type
              values:
                - Picklist
        - elementName: description
          removeValues:
            - ""

    # File types that are always excluded (cannot be processed)
    alwaysExcluded:
      - flow-meta.xml

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

#### Configuration options

| Section | Description |
|---------|-------------|
| `metadata.adjust.formatting` | Array of rules defining how to sort XML elements per file type |
| `metadata.adjust.formatting[].filePattern` | File suffix to match (e.g., `field-meta.xml`) |
| `metadata.adjust.formatting[].elementPriority` | Keys that appear first within each object, in order |
| `metadata.adjust.formatting[].sortedByElements` | Keys to use for sorting array elements (first match wins) |
| `metadata.adjust.formatting[].unsortedArrays` | Array keys that preserve original order |
| `metadata.adjust.formatting[].condensedElements` | Elements formatted on a single line for better diffs |
| `metadata.adjust.cleanup` | Rules for removing default/empty values per metadata type |
| `metadata.adjust.alwaysExcluded` | File types that can never be processed |
| `metadata.integrity.removedTypes` | Which removed metadata types to consider (ApexClass, CustomField, VisualforcePage) |
| `metadata.integrity.rules` | Per-removed-type surface rules for integrity scans |
| `metadata.integrity.rules[].removedType` | Removed metadata type for the rule |
| `metadata.integrity.rules[].surfaces` | Reference surfaces to scan (e.g., profile, permissionSet, flow, layout) |

#### Implicit whitelist

Files are **whitelisted implicitly** by having a `metadata.adjust.formatting` rule. Only files matching a `metadata.adjust.formatting[].filePattern` will be processed (unless `--all` flag is used).

#### No merging

User configuration is used exactly as-is with **no merging** with defaults. This ensures predictable behavior—what you configure is exactly what you get.

#### Full configuration reference

For detailed documentation with before/after examples for each formatting option and integrity config, see [CONFIGURATION.md](./CONFIGURATION.md).

#### Project root detection

The `.swiftrc` file is searched for by walking up the directory tree from the target directory, checking for:

1. `.swiftrc` file (highest priority)
2. `.git` directory
3. `package.json` file

This allows the config to work from any subdirectory in your project.

### Performance tips

1. **Use git-depth for large repos**: Only process changed files
2. **Backup disabled by default**: Already optimized for CI/CD
3. **Run before commit**: Catch issues early with git-depth 1
4. **Ignore backup folders**: Add `.backup-*` to `.gitignore` (when using --backup)

## Command: `sf swift config init`

Creates a `.swiftrc` file in the current directory using the built-in default configuration. If a `.swiftrc` already exists, it is backed up as `.swiftrc.backup.YYYYMMDD` before being overwritten.

### Quick start

```bash
# Create a .swiftrc file in the current directory
sf swift config init
```

### Output

When a backup is created, the command prints the backup filename before confirming the new file was written.

## Command: `sf swift detect git conflicts`

Scans your repository for pending `.rej` files generated by Git merges

### Quick start

```bash
# Scan current directory for reject files
sf swift detect git conflicts

# Emit machine-readable JSON output
sf swift detect git conflicts --json

# Check a specific directory
sf swift detect git conflicts --target-dir force-app/main/default
```

### Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--target-dir` | `-d` | Directory to scan for `.rej` files | `.` (current) |
| `--json` | - | Return machine-readable output | Disabled |

### Output

Default output is human-readable and includes a summary plus any `.rej` file paths. Use `--json` to integrate with automation (e.g., GitHub Actions).

```json
{
   "status": 1,
   "result": {
      "count": 2,
      "conflictFiles": [
         "force-app/main/default/classes/Foo.cls-meta.xml.rej",
         "force-app/main/default/objects/Bar__c.object-meta.xml.rej"
      ]
   },
   "warnings": []
}
```

### When to use it

- Fail CI checks whenever metadata merges leave behind `.rej` files
- Provide actionable feedback in PR comments (see workflows below)
- Run locally before committing to ensure no conflict leftovers are staged

## Command: `sf swift detect file`

Scans any directory tree for arbitrary file suffixes (e.g., `.rej`, `.log`, `.tmp`) so CI workflows can halt when unwanted artifacts slip into pull requests.

### Quick start

```bash
# Look for reject and log files in the current directory
sf swift detect file --type .rej --type .log

# Scan a subdirectory and stop after the first match
sf swift detect file ./force-app --type .tmp --max 1

# Emit machine-readable JSON output
sf swift detect file --type .rej --json
```

### Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--target-dir` | `-d` | Directory to scan when no positional path is supplied | `.` (current) |
| `--type` | `-t` | Repeatable suffix filter (e.g., `.rej`, `.log`). Required. | – |
| `--max` | – | Stop the scan once this many matches have been collected | unlimited |
| `--json` | – | Return machine-readable output | Disabled |

### Output

The human-readable output mirrors the git conflict detector: emoji headings, elapsed time, and a numbered list of matching files relative to the scan root. Use `--json` to integrate with automation.

```json
{
   "status": 1,
   "result": {
      "count": 3,
      "types": [".rej", ".log"],
      "files": [
         "force-app/main/default/classes/Foo.cls-meta.xml.rej",
         "scripts/tmp/apex.log",
         "scripts/tmp/trace.log"
      ]
   },
   "warnings": []
}
```

### When to use it

- Reuse the same detector for `.rej`, `.tmp`, `.log`, or any other unwanted artifacts
- Speed up scans in large repos with `--max 1` when you only need to know a file exists
- Augment GitHub Actions by feeding the JSON payload into custom comment bots or gating logic

## Command: `sf swift metadata integrity`

Cross-checks recent Git history for deleted metadata (Apex classes, Visualforce pages, custom fields) and reports lingering references across Profiles, Permission Sets, source code, flows, formulas, layouts, and more.

➡️ For a detailed coverage matrix, CLI tips, and CI examples see [METADATA-INTEGRITY.md](./METADATA-INTEGRITY.md).

### Quick start

```bash
# Analyze the latest 5 commits (default depth)
sf swift metadata integrity

# Target a specific package directory with deeper history
sf swift metadata integrity ./force-app/main/default --git-depth 10

# Emit machine-readable results
sf swift metadata integrity --json

# Use a specific config file
sf swift metadata integrity --config ./ci/swift.yaml
```

### Flags

| Flag | Short | Description | Default |
|------|-------|-------------|---------|
| `--target-dir` | `-d` | Directory to analyze when no positional path is given | `.` (current) |
| `--config` | `-c` | Path to YAML config file (skips .swiftrc discovery) | - |
| `--git-depth` | `-g` | Number of commits to inspect for deletions (clamped to history) | `5` |
| `--test-with-class` | - | Treat provided Apex class names as removed metadata (repeatable). Useful when testing class-related rules without deleting code. | Disabled |
| `--test-with-field` | - | Treat provided field API names (`Object.Field__c`) as removed metadata (repeatable). Useful for auditing field access without Git changes. | Disabled |
- Temporarily simulate deletions with `--test-with-class` or `--test-with-field` to audit specific classes or fields without modifying Git history

### Output

Returns a summary of deleted metadata and outstanding references. Use `--json` to integrate with CI or PR bots.

```json
{
   "status": 1,
   "result": {
      "gitDepthUsed": 5,
      "removedItems": [
         {
            "type": "ApexClass",
            "name": "ObsoleteService",
            "referenceKey": "ObsoleteService",
            "sourceFile": "force-app/main/default/classes/ObsoleteService.cls"
         }
      ],
      "issues": [
         {
            "type": "MissingApexClassReference",
            "missingItem": "ObsoleteService",
            "referencingFile": "profiles/Admin.profile-meta.xml",
            "detail": "Class access still enabled for removed Apex class 'ObsoleteService'"
         }
      ]
   },
   "warnings": []
}
```

### What it checks

- Deleted Apex classes that are still granted access via `classAccesses`
- Deleted custom fields that remain in `fieldPermissions`
- Deleted Visualforce pages that remain enabled via `pageAccesses`
- Apex classes and triggers that reference removed Apex classes
- Lightning Web Components (`lwc/*`) and Aura components (`aura/*`) that import or declare removed Apex classes
- Visualforce pages and components (`*.page`, `*.component`) whose controllers or markup reference removed Apex classes
- Flow definitions (`*.flow-meta.xml`) that invoke removed Apex classes or reference removed custom fields
- Formula fields (`*.field-meta.xml`) whose formulas reference removed custom fields
- Field sets (`*.fieldSet-meta.xml`) that list removed custom fields
- Layouts (`*.layout-meta.xml`) that still list removed custom fields
- Compact layouts (`*.compactLayout-meta.xml`) that display removed custom fields
- Record types (`*.recordType-meta.xml`) that reference removed custom fields in picklists or field selections
- Validation rules in object metadata (`*.object-meta.xml`) that reference removed custom fields
- Profiles and Permission Sets located anywhere within the target directory

### When to use it

- Clean up dangling permissions after deleting code or fields
- Block deployments or merges that would leave broken references in user access metadata
- Audit refactors to ensure no obsolete classes or fields linger in security artifacts

## Integration Examples

### GitHub Actions

This plugin ships with ready-to-use workflows:

- `.github/workflows/pr-metadata-adjust.yml` adjusts metadata files in pull requests
- `.github/workflows/pr-detect-issues.yml` fails the PR when `.rej` files are found and comments with the list
- `.github/workflows/pr-check-adjust.yml` gates formatting jobs by running conflict and metadata-integrity checks up front
- `.github/workflows/pr-code-adjust.yml` runs Prettier-based Apex formatting and auto-commits the results

`pr-check-adjust.yml` overview:

- **check-rej-files**: runs `sf swift detect git conflicts`, comments with a reject-file list, and fails on leftover `.rej` files.
- **check-integrity**: inspects every commit in the PR with `sf swift metadata integrity`, comments on detected issues, and blocks subsequent jobs when problems remain.
- **adjust-code** / **adjust-metadata**: formatting stages that only run after both guard jobs succeed, ensuring they never hide metadata issues under auto-fixes.

`pr-code-adjust.yml` overview:

- **adjust**: calculates the PR commit count, executes `prettier-fix-delta.sh <commit_count>` to reformat Apex classes and triggers with Prettier, commits updated `.cls`/`.trigger` files when changes occur, retries the push up to three times, and posts a summary comment on the pull request.

#### Metadata adjust workflow (`.github/workflows/pr-metadata-adjust.yml`)

This workflow automatically adjusts metadata files on pull requests and commits the changes back to the PR branch.

##### Setup

1. The workflow file is already included: `.github/workflows/pr-metadata-adjust.yml`
2. Configure which metadata types to process by editing the `INCLUDED_TYPES` environment variable:

```yaml
env:
  # Process all whitelisted types
  INCLUDED_TYPES: ''

  # Process only defined types
  INCLUDED_TYPES: 'profile,permissionset'
  
  # Only process files changed in PR (recommended)
  ADJUST_DELTA_ONLY: 'true'
  
  # Or process all files in directory
  ADJUST_DELTA_ONLY: 'false'
```

##### Features

- ✅ **Automatic Triggering** - Runs when metadata files change in PRs
- 🤖 **Auto-Commit** - Commits formatting changes back to PR branch
- 💬 **PR Comments** - Notifies about formatting status
- 🎯 **Configurable** - Choose which metadata types to process
- ⚡ **Delta Mode** - Optionally process only files changed in the PR

##### Workflow behavior

1. **Triggered** when a PR is opened, synchronized, or reopened with metadata file changes
2. **Delta Mode** (when `ADJUST_DELTA_ONLY: 'true'`):
   - Automatically calculates the number of commits in the PR
   - Uses `--git-depth <commit_count>` to process only files changed in the PR
   - PR comment indicates: "Changed files only (X commits)"
3. **Full Mode** (when `ADJUST_DELTA_ONLY: 'false'` or unset):
   - Processes all metadata files in the configured directory
   - PR comment indicates: "All files in directory"
4. **Formats** metadata files based on `INCLUDED_TYPES` configuration
5. **Commits** changes automatically if any files were modified
6. **Comments** on the PR with the formatting status and scope


##### Customization

Edit `.github/workflows/pr-metadata-adjust.yml` to:
- Change `INCLUDED_TYPES` to process different metadata types
- Set `ADJUST_DELTA_ONLY: 'true'` for PR-only processing (recommended)
- Set `ADJUST_DELTA_ONLY: 'false'` to process all files in directory
- Adjust commit message format
- Adjust PR comment templates
- Change trigger conditions

#### Detect issues workflow (`.github/workflows/pr-detect-issues.yml`)

This workflow installs the plugin, runs `sf swift detect git conflicts --json`, and fails the PR when `.rej` files are present. It also comments on the pull request with the full list of conflict files so authors can resolve them quickly.

**Key points**

- Requires no configuration—runs on every pull request
- Comment body includes a code block listing each `.rej` file returned by the command
- Failing step signals reviewers that conflicts must be addressed before merging

## Troubleshooting

### "No metadata files found"
- Check you're in the right directory
- Verify files end with `-meta.xml`

### "Git operation failed"
- Ensure you're in a Git repository
- Check git-depth doesn't exceed commit count

### "Not in the allowed whitelist"
- You're trying to include a non-whitelisted metadata type
- Use `--all` flag to bypass whitelist restrictions
- Review the whitelisted types in the error message
- Example: `sf swift metadata adjust --all --include reportType`

### "Permission denied"
- Check file permissions
- Use `--backup` to preserve originals if needed

### Too many backup folders
- Only created when using `--backup` flag
- Add `.backup-*` to `.gitignore`
- Clean old backups: `rm -rf .backup-*`

## Best Practices

✅ **DO**:
- Run before committing code
- Use git-depth for incremental checks
- Review modified files in summary
- Add to pre-commit hooks
- Use `--backup` when testing major changes
- Stick to whitelisted metadata types for safety
- Test with `--all` flag in non-production first
- Use `--all --backup` when processing new metadata types

❌ **DON'T**:
- Process backup folders (add to gitignore)
- Ignore errors in CI/CD
- Forget to commit adjusted files
- Use `--all` flag in production without thorough testing
- Process complex metadata types without understanding their structure

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable  
5. Submit a pull request

## License

This project is licensed under the ISC License.