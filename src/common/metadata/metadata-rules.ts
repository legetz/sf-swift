/**
 * Configuration rules and constants for metadata file processing
 */

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
let activeFormattingPatterns: string[] = [];
let activeAlwaysExcluded: string[] = [...ALWAYS_EXCLUDED];
let activeCleanupRules: { [metadataType: string]: ElementCleanupRule[] } = JSON.parse(
  JSON.stringify(ELEMENT_CLEANUP_RULES)
);

/**
 * Configuration input for setMetadataConfig
 */
export interface MetadataConfigInput {
  formattingPatterns?: string[];
  alwaysExcluded?: string[];
  cleanupRules?: { [metadataType: string]: ElementCleanupRule[] };
}

/**
 * Set active metadata configuration (called when loading config)
 */
export function setMetadataConfig(config: MetadataConfigInput): void {
  if (config.formattingPatterns) {
    activeFormattingPatterns = config.formattingPatterns;
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
  activeFormattingPatterns = [];
  activeAlwaysExcluded = [...ALWAYS_EXCLUDED];
  activeCleanupRules = JSON.parse(JSON.stringify(ELEMENT_CLEANUP_RULES));
}

/**
 * Get allowed file patterns (derived from formatting rules)
 * Files must match one of these patterns to be processed (unless --all is used)
 */
export function getAllowedFilePatterns(): string[] {
  return activeFormattingPatterns;
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
