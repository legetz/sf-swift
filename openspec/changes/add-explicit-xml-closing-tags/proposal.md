# Change: Explicit XML closing tags for metadata elements

## Why
Some Salesforce metadata elements must use explicit open/close tags even when empty. The current formatter collapses empties into self-closing tags, which breaks expected output for list views and lookup filters.

## What Changes
- Add a formatting-rule option to mark element paths that must render as explicit open/close tags.
- Support wildcard segments in explicit closing element paths to match repeated array items.
- Seed defaults for list view shared targets and lookup filter values.
- Update config validation and default config generation to accept the new option.
- Ensure XML output preserves explicit closing tags for configured elements.

## Impact
- Affected specs: metadata-xml-formatting (new)
- Affected code: src/common/xml/sorting-rules.ts, src/common/xml/xml-helpers.ts, src/common/config/default-config.ts, src/common/config/swiftrc-config.ts
- Tests: test/common/xml and metadata adjust fixtures for list views and fields
