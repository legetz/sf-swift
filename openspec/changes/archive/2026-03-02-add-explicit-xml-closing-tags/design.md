## Context
The XML builder emits empty elements as self-closing tags. Some Salesforce metadata requires explicit open/close tags (e.g., list view shared targets and lookup filter values). We need a simple, configurable rule to preserve those tags without affecting unrelated elements.

## Goals / Non-Goals
- Goals:
  - Provide a per-metadata rule to force explicit closing tags for specific element paths.
  - Keep configuration easy to extend in defaults or .swiftrc.
  - Avoid changing behavior for non-targeted elements.
- Non-Goals:
  - Introduce new XML serialization dependencies.
  - Reformat non-empty elements or alter existing whitespace rules.

## Decisions
- Decision: Add an `explicitClosingElements` option to `FormattingRule` as an array of dot-separated element paths relative to the file root. Paths MAY include `*` to match any single segment (e.g., `sharedTo.*`, `lookupFilter.filterItems.*.value`).
- Decision: Apply the rule in `buildMetadataXml` by traversing the XML object before build, marking empty elements at matching paths with a sentinel attribute (e.g., `$: { __explicitClose: "true" }`) and then post-processing the output to replace `<tag __explicitClose="true"/>` with `<tag></tag>` and strip the attribute.
- Decision: Seed defaults for `listView-meta.xml` and `field-meta.xml` to cover known Salesforce expectations.

## Risks / Trade-offs
- The sentinel approach adds a post-processing step; ensure the attribute is removed in all cases to avoid leaking into output.
- Dot-path matching needs to treat arrays as repeating segments; wildcard segments increase the chance of overly broad matches, so add tests for specificity.

## Migration Plan
- Add the new option to defaults and config validation; existing configs remain valid because the field is optional.
- Provide a short config snippet in docs to show how to add more explicit-closing paths.

## Open Questions
- Should we support global explicit-closing rules in addition to file-specific rules?
