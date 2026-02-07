# Configuration Reference

This document provides a complete reference for the `.swiftrc` configuration file used by SF Swift's metadata adjust and metadata integrity commands.

## Table of Contents

- [Configuration Reference](#configuration-reference)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Getting Started](#getting-started)
  - [Configuration Structure](#configuration-structure)
  - [Formatting Options](#formatting-options)
    - [elementPriority](#elementpriority)
      - [Example Configuration](#example-configuration)
      - [Before (original)](#before-original)
      - [After (adjusted)](#after-adjusted)
      - [Multi-level Priority (Nested Elements)](#multi-level-priority-nested-elements)
        - [Example Configuration](#example-configuration-1)
        - [Before (original)](#before-original-1)
        - [After (adjusted)](#after-adjusted-1)
    - [sortedByElements](#sortedbyelements)
      - [Example Configuration](#example-configuration-2)
    - [unsortedArrays](#unsortedarrays)
      - [Example Configuration](#example-configuration-3)
      - [Before (original)](#before-original-2)
      - [After (adjusted)](#after-adjusted-2)
    - [condensedElements](#condensedelements)
      - [Example Configuration](#example-configuration-4)
      - [Before (original)](#before-original-3)
      - [After (adjusted)](#after-adjusted-3)
  - [Cleanup Rules](#cleanup-rules)
    - [Example Configuration](#example-configuration-5)
  - [Always Excluded](#always-excluded)
  - [Tips](#tips)

## Overview

The `.swiftrc` file is a YAML configuration file placed in your project root. It controls how SF Swift formats and processes Salesforce metadata XML files.

**Key behaviors:**
- **Built-in defaults**: If no `.swiftrc` exists, the tool uses built-in defaults (no file is created)
- **Custom config path**: Use `--config path/to/file.yaml` to specify a custom configuration file (supported by metadata adjust and metadata integrity)
- **Implicit whitelist**: Only files matching a `metadata.adjust.formatting[].filePattern` are processed
- **No merging**: Your configuration is used exactly as-is (no merging with defaults)

## Getting Started

To customize the configuration, create a `.swiftrc` file in your project root. Copy this sample configuration:

You can also generate the default configuration automatically:

```bash
sf swift config init
```

If a `.swiftrc` already exists, the command creates a dated backup named `.swiftrc.backup.YYYYMMDD` before writing the new file.

```yaml
# .swiftrc - SF Swift Configuration File
# Copy this file to your project root to customize formatting rules.

metadata:
  adjust:
    formatting:
      - filePattern: "field-meta.xml"
        elementPriority:
          - fullName
      - filePattern: "permissionset-meta.xml"
        elementPriority:
          - label
          - description
          - editable
          - readable
      - filePattern: "profile-meta.xml"
        elementPriority:
          - editable
          - readable
      - filePattern: "listView-meta.xml"
        elementPriority:
          - fullName
        unsortedArrays:
          - filters
      - filePattern: "validationRule-meta.xml"
        elementPriority:
          - fullName
      - filePattern: "labels-meta.xml"
        elementPriority:
          - fullName
      - filePattern: "globalValueSet-meta.xml"
        elementPriority:
          - fullName
        unsortedArrays:
          - customValue
      - filePattern: "cls-meta.xml"
      - filePattern: "object-meta.xml"
      - filePattern: "settings-meta.xml"
      - filePattern: "trigger-meta.xml"
      - filePattern: "FileUploadAndDownloadSecurity.settings-meta.xml"
        unsortedArrays:
          - dispositions

    # Optional: cleanup rules for removing default/empty values
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

    # Files that are never processed
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

You can also use a custom configuration file with the `--config` flag:

```bash
sf swift metadata adjust --config ./my-custom-config.yaml
```

## Configuration Structure

```yaml
metadata:
  adjust:
    # Formatting rules for XML processing
    formatting:
      - filePattern: "field-meta.xml"
        elementPriority: [fullName]

    # Cleanup rules for removing default/empty values
    cleanup:
      field-meta.xml:
        - elementName: description
          removeValues: [""]

    # Files that are never processed
    alwaysExcluded:
      - flow-meta.xml

  integrity:
    # Defines metadata types where integrity is checked
    removedTypes: [ApexClass, CustomField, VisualforcePage]
    rules:
      # Defines rule per type, defines surfaces where to look broken references
      - removedType: ApexClass
        surfaces: [profile, permissionSet, lwc, aura, flow, apexSource]
      - removedType: CustomField
        surfaces: [profile, permissionSet, flow, formulaField, layout, validationRule, fieldSet, recordType, compactLayout]
      - removedType: VisualforcePage
        surfaces: [profile, permissionSet]
```

---

## Formatting Options

Each formatting rule targets a specific file pattern and can include four optional formatting directives.

### elementPriority

**Purpose**: Specifies which XML element keys should appear first (at the top) within each object, in the order specified. Remaining keys are sorted alphabetically.

**Use case**: Ensures important identifying fields like `fullName` appear at the top of metadata files for quick identification.

#### Example Configuration

```yaml
metadata:
  adjust:
    formatting:
      - filePattern: "field-meta.xml"
        elementPriority:
          - fullName
```

#### Before (original)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <caseSensitive>false</caseSensitive>
    <externalId>true</externalId>
            <fullName>ExternalId__c</fullName>


    <label>External Id</label>
    <length>
    20</length>
    <required>false</required>
    <type>Text</type>
    <unique>true</unique>
</CustomField>
```

#### After (adjusted)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CustomField xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>ExternalId__c</fullName>
    <caseSensitive>false</caseSensitive>
    <externalId>true</externalId>
    <label>External Id</label>
    <length>20</length>
    <required>false</required>
    <type>Text</type>
    <unique>true</unique>
</CustomField>
```

**Result**: `fullName` is moved to the top, whitespace is normalized, and remaining keys are sorted alphabetically.

#### Multi-level Priority (Nested Elements)

`elementPriority` applies recursively at all levels of the XML structure. This is useful for metadata types like Permission Sets where you want to control ordering both at the root level and within nested elements.

##### Example Configuration

```yaml
metadata:
  adjust:
    formatting:
      - filePattern: "permissionset-meta.xml"
        elementPriority:
          - label
          - description
          - editable
          - readable
        condensedElements:
          - fieldPermissions
          - objectPermissions
```

##### Before (original)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <fieldPermissions>
        <field>Account.AccountNumber</field>
        <readable>true</readable>
        <editable>false</editable>
    </fieldPermissions>
    <fieldPermissions>
        <field>Account.AccountSource</field>
        <readable>true</readable>
        <editable>false</editable>
    </fieldPermissions>
    <description>CRM-36: Grants read permission to Account object</description>
    <label>Account - Read</label>
</PermissionSet>
```

##### After (adjusted)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <label>Account - Read</label>
    <description>CRM-36: Grants read permission to Account object</description>
    <fieldPermissions><editable>false</editable><readable>true</readable><field>Account.AccountNumber</field></fieldPermissions>
    <fieldPermissions><editable>false</editable><readable>true</readable><field>Account.AccountSource</field></fieldPermissions>
</PermissionSet>
```

**Result**:
- At root level: `label` and `description` appear first
- Inside each `fieldPermissions`: `editable` and `readable` appear before `field`
- Combined with `condensedElements`, each permission entry is on a single line for cleaner diffs

---

### sortedByElements

**Purpose**: Specifies which child element keys to use for sorting array elements. The first matching key is used to determine sort order.

**Use case**: Override the default sorting behavior for specific file types. By default, arrays are sorted using global rules (e.g., `fieldPermissions` sorted by `field`, `classAccesses` sorted by `apexClass`), but you can customize this per file pattern.

#### Example Configuration

```yaml
metadata:
  adjust:
    formatting:
      - filePattern: "customLabels-meta.xml"
        sortedByElements:
          - fullName
          - shortDescription
```

**Behavior**: Array elements will be sorted by the first key found in each element. In the example above, elements are sorted by `fullName` if present, otherwise by `shortDescription`.

**Note**: If not specified, global defaults are used for known array types (e.g., `fieldPermissions` sorted by `field`). Unknown arrays fall back to auto-detection using common keys like `name`, `fullName`, or `field`.

---

### unsortedArrays

**Purpose**: Specifies which array elements should preserve their original order instead of being sorted. This is critical for elements where order has semantic meaning.

**Use case**: List view filters reference each other by position (e.g., `booleanFilter: "1 OR 2"`), so reordering would break the logic.

#### Example Configuration

```yaml
metadata:
  adjust:
    formatting:
      - filePattern: "listView-meta.xml"
        elementPriority:
          - fullName
        unsortedArrays:
          - filters
```

#### Before (original)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ListView xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Last30Days</fullName>
    <columns>NAME</columns>
    <columns>CREATED_DATE</columns>
    <filterScope>Everything</filterScope>
    <filters>
        <field>CREATED_DATE</field>
        <operation>equals</operation>
        <value>LAST_N_DAYS:30</value>
    </filters>
    <filters>
        <field>CREATED_DATE</field>
        <operation>equals</operation>
        <value>TODAY</value>
    </filters>
    <booleanFilter>1 OR 2</booleanFilter>
    <label>Last 30 Days</label>
</ListView>
```

#### After (adjusted)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<ListView xmlns="http://soap.sforce.com/2006/04/metadata">
    <fullName>Last30Days</fullName>
    <booleanFilter>1 OR 2</booleanFilter>
    <columns>NAME</columns>
    <columns>CREATED_DATE</columns>
    <filterScope>Everything</filterScope>
    <filters>
        <field>CREATED_DATE</field>
        <operation>equals</operation>
        <value>LAST_N_DAYS:30</value>
    </filters>
    <filters>
        <field>CREATED_DATE</field>
        <operation>equals</operation>
        <value>TODAY</value>
    </filters>
    <label>Last 30 Days</label>
</ListView>
```

**Result**: `fullName` moves to top, other elements are sorted alphabetically, but `<filters>` elements maintain their original order so `booleanFilter: "1 OR 2"` remains valid.

---

### condensedElements

**Purpose**: Formats specified array elements on a single line each, improving diff readability for files with many repetitive entries.

**Use case**: Permission sets often have hundreds of `fieldPermissions` and `objectPermissions` entries. Condensed format makes git diffs cleaner and reduces file size.

#### Example Configuration

```yaml
metadata:
  adjust:
    formatting:
      - filePattern: "permissionset-meta.xml"
        condensedElements:
          - fieldPermissions
          - objectPermissions
```

#### Before (original)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <fieldPermissions>
        <editable>true</editable>
        <field>Account.AccountNumber</field>
        <readable>true</readable>
    </fieldPermissions>
    <fieldPermissions>
        <editable>true</editable>
        <field>Account.Name</field>
        <readable>true</readable>
    </fieldPermissions>
    <objectPermissions>
        <allowCreate>true</allowCreate>
        <allowDelete>true</allowDelete>
        <allowEdit>true</allowEdit>
        <allowRead>true</allowRead>
        <modifyAllRecords>true</modifyAllRecords>
        <object>Account</object>
        <viewAllFields>false</viewAllFields>
        <viewAllRecords>true</viewAllRecords>
    </objectPermissions>
    <label>Admin permissions</label>
</PermissionSet>
```

#### After (adjusted)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet xmlns="http://soap.sforce.com/2006/04/metadata">
    <fieldPermissions><editable>true</editable><field>Account.AccountNumber</field><readable>true</readable></fieldPermissions>
    <fieldPermissions><editable>true</editable><field>Account.Name</field><readable>true</readable></fieldPermissions>
    <objectPermissions><allowCreate>true</allowCreate><allowDelete>true</allowDelete><allowEdit>true</allowEdit><allowRead>true</allowRead><modifyAllRecords>true</modifyAllRecords><object>Account</object><viewAllFields>false</viewAllFields><viewAllRecords>true</viewAllRecords></objectPermissions>
    <label>Admin permissions</label>
</PermissionSet>
```

**Result**: Each `fieldPermissions` and `objectPermissions` entry is on a single line. Adding or removing a field permission now shows as a single-line change in git diffs.

---

## Cleanup Rules

**Purpose**: Remove elements with default or empty values to reduce noise in metadata files.

**Structure**:
```yaml
metadata:
  adjust:
    cleanup:
      <filePattern>:
        - elementName: <element to check>
          removeValues: [<values that trigger removal>]
          conditions:  # optional
            - elementName: <sibling element>
              values: [<required values>]
```

#### Example Configuration

```yaml
metadata:
  adjust:
    cleanup:
      field-meta.xml:
        - elementName: externalId
          removeValues: ["false"]
          conditions:
            - elementName: type
              values: ["Picklist"]
        - elementName: description
          removeValues: [""]
```

**Behavior**:
- `externalId` with value `"false"` is removed only when `type` is `"Picklist"`
- Empty `description` elements are always removed

---

## Always Excluded

**Purpose**: Specify file types that should never be processed, regardless of other settings.

```yaml
metadata:
  adjust:
    alwaysExcluded:
      - flow-meta.xml
```

**Use case**: Flow metadata has complex ordering requirements that standard sorting would break.

---

## Tips

1. **Copy the sample config**: Copy the sample configuration from the [Getting Started](#getting-started) section to your project root as `.swiftrc`, then customize as needed.

2. **Add new file types**: To process additional metadata types, add a formatting rule even if no special options are needed:
   ```yaml
   formatting:
     - filePattern: "customMetadata-meta.xml"
   ```

3. **Use custom config path**: Use `--config` flag to use a configuration file from a different location:
   ```bash
   sf swift metadata adjust --config ./configs/my-rules.yaml
   ```

4. **Test changes carefully**: Use `--backup` flag when experimenting with new configuration to preserve originals.

5. **Check git diffs**: After adjusting files, review the git diff to ensure the formatting meets your expectations.
