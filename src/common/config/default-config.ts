/**
 * Default configuration values for SF Swift
 * These are used when creating a new .swiftrc file
 */

import { FormattingRule, DEFAULT_FORMATTING_RULES } from "../xml/sorting-rules.js";
import { ElementCleanupRule } from "../metadata/metadata-rules.js";
import {
  IntegrityReferenceSurface,
  METADATA_INTEGRITY_RULES,
  RemovedMetadataType
} from "../metadata/metadata-integrity-rules.js";

/**
 * Complete .swiftrc configuration structure
 */
export interface MetadataAdjustConfig {
  formatting: FormattingRule[];
  cleanup: { [metadataType: string]: ElementCleanupRule[] };
  alwaysExcluded: string[];
}

export interface MetadataIntegrityRuleConfig {
  removedType: RemovedMetadataType;
  surfaces: IntegrityReferenceSurface[];
}

export interface MetadataIntegrityConfig {
  removedTypes?: RemovedMetadataType[];
  rules?: MetadataIntegrityRuleConfig[];
}

export interface SwiftrcConfig {
  metadata: {
    adjust: MetadataAdjustConfig;
    integrity?: MetadataIntegrityConfig;
  };
}

/**
 * Always excluded types that cannot be included (due to special handling requirements)
 */
export const DEFAULT_ALWAYS_EXCLUDED: string[] = ["flow-meta.xml"];

/**
 * Default element cleanup rules for metadata
 */
export const DEFAULT_CLEANUP_RULES: { [metadataType: string]: ElementCleanupRule[] } = {
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

export const DEFAULT_INTEGRITY_RULES: MetadataIntegrityRuleConfig[] = METADATA_INTEGRITY_RULES.map((rule) => ({
  removedType: rule.removedType,
  surfaces: [...rule.surfaces]
}));

export const DEFAULT_INTEGRITY_REMOVED_TYPES: RemovedMetadataType[] = Array.from(
  new Set(DEFAULT_INTEGRITY_RULES.map((rule) => rule.removedType))
);

export function getDefaultIntegrityConfig(): MetadataIntegrityConfig {
  return {
    removedTypes: [...DEFAULT_INTEGRITY_REMOVED_TYPES],
    rules: DEFAULT_INTEGRITY_RULES.map((rule) => ({
      removedType: rule.removedType,
      surfaces: [...rule.surfaces]
    }))
  };
}

/**
 * Get the complete default configuration
 */
export function getDefaultConfig(): SwiftrcConfig {
  return {
    metadata: {
      adjust: {
        formatting: [...DEFAULT_FORMATTING_RULES],
        cleanup: JSON.parse(JSON.stringify(DEFAULT_CLEANUP_RULES)),
        alwaysExcluded: [...DEFAULT_ALWAYS_EXCLUDED]
      },
      integrity: getDefaultIntegrityConfig()
    }
  };
}
