/**
 * Default configuration values for SF Swift
 * These are used when no .swiftrc file is present
 */

import { SortingRule } from "../xml/sorting-rules.js";
import { ElementCleanupRule } from "../metadata/metadata-rules.js";

/**
 * Configuration for metadata type filtering
 */
export interface MetadataTypesConfig {
    allowed: string[];
    defaultExclusions: string[];
    alwaysExcluded: string[];
}

/**
 * Complete .swiftrc configuration structure
 */
export interface SwiftrcConfig {
    sortingRules: SortingRule[];
    metadataTypes: MetadataTypesConfig;
    cleanupRules: { [metadataType: string]: ElementCleanupRule[] };
}

/**
 * Default sorting rules for Salesforce metadata files
 */
export const DEFAULT_SORTING_RULES: SortingRule[] = [
    {
        filePattern: "field-meta.xml",
        priorityKeys: ["fullName"]
    },
    {
        filePattern: "FileUploadAndDownloadSecurity.settings-meta.xml",
        unsortedArrays: ["dispositions"]
    },
    {
        filePattern: "validationRule-meta.xml",
        priorityKeys: ["fullName"]
    },
    {
        filePattern: "listView-meta.xml",
        priorityKeys: ["fullName"],
        unsortedArrays: ["filters"]
    },
    {
        filePattern: "labels-meta.xml",
        priorityKeys: ["fullName"]
    },
    {
        filePattern: "globalValueSet-meta.xml",
        priorityKeys: ["fullName"],
        unsortedArrays: ["customValue"]
    },
    {
        filePattern: "permissionset-meta.xml",
        condensedArrays: ["fieldPermissions", "objectPermissions"]
    },
    {
        filePattern: "profile-meta.xml",
        condensedArrays: ["fieldPermissions", "objectPermissions"]
    }
];

/**
 * Whitelist of allowed metadata file types for safe processing
 * Only these types will be processed unless --all flag is used
 */
export const DEFAULT_ALLOWED_METADATA_TYPES: string[] = [
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
];

/**
 * Default exclusions (used when --exclude is not specified)
 */
export const DEFAULT_EXCLUSIONS: string[] = [
    "reportType-meta.xml",
    "flexipage-meta.xml",
    "layout-meta.xml"
];

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

/**
 * Default metadata types configuration
 */
export const DEFAULT_METADATA_TYPES: MetadataTypesConfig = {
    allowed: DEFAULT_ALLOWED_METADATA_TYPES,
    defaultExclusions: DEFAULT_EXCLUSIONS,
    alwaysExcluded: DEFAULT_ALWAYS_EXCLUDED
};

/**
 * Get the complete default configuration
 */
export function getDefaultConfig(): SwiftrcConfig {
    return {
        sortingRules: [...DEFAULT_SORTING_RULES],
        metadataTypes: {
            allowed: [...DEFAULT_ALLOWED_METADATA_TYPES],
            defaultExclusions: [...DEFAULT_EXCLUSIONS],
            alwaysExcluded: [...DEFAULT_ALWAYS_EXCLUDED]
        },
        cleanupRules: JSON.parse(JSON.stringify(DEFAULT_CLEANUP_RULES))
    };
}
