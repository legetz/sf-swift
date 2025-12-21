/**
 * Configuration rules and constants for metadata file processing
 */

/**
 * Whitelist of allowed metadata file types for safe processing
 * Only these types will be processed unless --all flag is used
 */
export const ALLOWED_METADATA_TYPES: readonly string[] = Object.freeze([
  "cls-meta.xml",
  "field-meta.xml",
  "labels-meta.xml",
  "globalValueSet-meta.xml",
  "listView-meta.xml",
  "object-meta.xml",
  "permissionset-meta.xml",
  "profile-meta.xml",
  "settings-meta.xml",
  "trigger-meta.xml",
  "validationRule-meta.xml"
]);

/**
 * Default exclusions (used when --exclude is not specified)
 */
export const DEFAULT_EXCLUSIONS: readonly string[] = Object.freeze([
  "reportType-meta.xml",
  "flexipage-meta.xml",
  "layout-meta.xml"
]);

/**
 * Always excluded types that cannot be included (due to special handling requirements)
 */
export const ALWAYS_EXCLUDED: readonly string[] = Object.freeze(["flow-meta.xml"]);

/**
 * Element cleanup rule configuration
 */
export interface ElementCleanupRule {
  elementName: string;
  removeValues: string[];
  conditions?: {
    elementName: string;
    values: string[];
  }[];
}

/**
 * Configuration for cleaning up metadata elements
 * Defines which elements should be removed based on their values and conditions for each metadata type
 */
export const ELEMENT_CLEANUP_RULES: {
  readonly [metadataType: string]: readonly ElementCleanupRule[];
} = {
  "field-meta.xml": [
    {
      elementName: "externalId",
      removeValues: ["false"],
      conditions: [
        {
          elementName: "type",
          values: ["Picklist"]
        }
      ]
    },
    {
      elementName: "description",
      removeValues: [""]
    }
  ]
};

/**
 * Active configuration (can be overridden via .swiftrc config file)
 */
let activeAllowedTypes: string[] = [...ALLOWED_METADATA_TYPES];
let activeDefaultExclusions: string[] = [...DEFAULT_EXCLUSIONS];
let activeAlwaysExcluded: string[] = [...ALWAYS_EXCLUDED];
let activeCleanupRules: { [metadataType: string]: ElementCleanupRule[] } = JSON.parse(
  JSON.stringify(ELEMENT_CLEANUP_RULES)
);

/**
 * Configuration input for setMetadataConfig
 */
export interface MetadataConfigInput {
  allowed?: string[];
  defaultExclusions?: string[];
  alwaysExcluded?: string[];
  cleanupRules?: { [metadataType: string]: ElementCleanupRule[] };
}

/**
 * Set active metadata configuration (called when loading config)
 */
export function setMetadataConfig(config: MetadataConfigInput): void {
  if (config.allowed) {
    activeAllowedTypes = config.allowed;
  }
  if (config.defaultExclusions) {
    activeDefaultExclusions = config.defaultExclusions;
  }
  if (config.alwaysExcluded) {
    activeAlwaysExcluded = config.alwaysExcluded;
  }
  if (config.cleanupRules) {
    activeCleanupRules = config.cleanupRules;
  }
}

/**
 * Reset metadata configuration to defaults
 */
export function resetMetadataConfig(): void {
  activeAllowedTypes = [...ALLOWED_METADATA_TYPES];
  activeDefaultExclusions = [...DEFAULT_EXCLUSIONS];
  activeAlwaysExcluded = [...ALWAYS_EXCLUDED];
  activeCleanupRules = JSON.parse(JSON.stringify(ELEMENT_CLEANUP_RULES));
}

/**
 * Get currently active allowed metadata types
 */
export function getAllowedMetadataTypes(): string[] {
  return activeAllowedTypes;
}

/**
 * Get currently active default exclusions
 */
export function getDefaultExclusions(): string[] {
  return activeDefaultExclusions;
}

/**
 * Get currently active always-excluded types
 */
export function getAlwaysExcluded(): string[] {
  return activeAlwaysExcluded;
}

/**
 * Get currently active cleanup rules
 */
export function getCleanupRules(): { [metadataType: string]: ElementCleanupRule[] } {
  return activeCleanupRules;
}
