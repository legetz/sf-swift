/**
 * Formatting rules for different Salesforce metadata types
 */

export interface FormattingRule {
  /** Metadata file pattern to match (e.g., 'field-meta.xml') */
  filePattern: string;
  /** Element keys that should appear first within each object, in order (remaining keys sorted alphabetically) */
  elementPriority?: string[];
  /** Keys to use for sorting array elements (first match wins). Falls back to global defaults if not specified */
  sortedByElements?: string[];
  /** Array keys that should NOT be sorted (preserve original order) */
  unsortedArrays?: string[];
  /** Element keys that should be condensed to single-line format for better diff readability */
  condensedElements?: string[];
}

/** @deprecated Use elementPriority instead */
export type SortedElements = string[];

/** @deprecated Use FormattingRule instead */
export type SortingRule = FormattingRule;

/**
 * Configuration for how to sort array elements by their child keys
 */
export interface ArraySortConfig {
  /** Array element name (e.g., 'fieldPermissions') */
  arrayName: string;
  /** Key(s) to sort by, in order of preference (first match wins) */
  sortKeys: string[];
}

/**
 * Default formatting rules for Salesforce metadata files
 */
export const DEFAULT_FORMATTING_RULES: FormattingRule[] = Object.freeze([
  {
    filePattern: "field-meta.xml",
    elementPriority: ["fullName"]
  },
  {
    filePattern: "FileUploadAndDownloadSecurity.settings-meta.xml",
    unsortedArrays: ["dispositions"]
  },
  {
    filePattern: "validationRule-meta.xml",
    elementPriority: ["fullName"]
  },
  {
    filePattern: "listView-meta.xml",
    elementPriority: ["fullName"],
    unsortedArrays: ["filters"]
  },
  {
    filePattern: "labels-meta.xml",
    elementPriority: ["fullName"]
  },
  {
    filePattern: "recordType-meta.xml",
    elementPriority: ["fullName"]
  },
  {
    filePattern: "globalValueSet-meta.xml",
    elementPriority: ["fullName"],
    unsortedArrays: ["customValue"]
  },
  // Additional types that are allowed for processing (no special formatting rules)
  { filePattern: "permissionset-meta.xml" },
  { filePattern: "profile-meta.xml" },
  { filePattern: "cls-meta.xml" },
  { filePattern: "object-meta.xml" },
  { filePattern: "settings-meta.xml" },
  { filePattern: "trigger-meta.xml" },
  { filePattern: "customPermission-meta.xml" }
]) as FormattingRule[];

/** @deprecated Use DEFAULT_FORMATTING_RULES instead */
export const DEFAULT_SORTING_RULES = DEFAULT_FORMATTING_RULES;

/**
 * Default array sort configurations - defines which key to use for sorting array elements
 */
export const DEFAULT_ARRAY_SORT_KEYS: ArraySortConfig[] = Object.freeze([
  { arrayName: "fieldPermissions", sortKeys: ["field"] },
  { arrayName: "objectPermissions", sortKeys: ["object"] },
  { arrayName: "classAccesses", sortKeys: ["apexClass"] },
  { arrayName: "customPermissions", sortKeys: ["name"] },
  { arrayName: "customMetadataTypeAccesses", sortKeys: ["name"] },
  { arrayName: "externalCredentialPrincipalAccesses", sortKeys: ["name"] },
  { arrayName: "recordTypeVisibilities", sortKeys: ["recordType"] },
  { arrayName: "tabVisibilities", sortKeys: ["tab"] },
  { arrayName: "pageAccesses", sortKeys: ["apexPage"] },
  { arrayName: "userPermissions", sortKeys: ["name"] },
  { arrayName: "picklistValues", sortKeys: ["picklist"] },
  { arrayName: "packageVersions", sortKeys: ["namespace"] },
  { arrayName: "states", sortKeys: ["isoCode"] },
  // Generic fallbacks for common patterns
  { arrayName: "columns", sortKeys: ["_"] } // _ is the text content key
]) as ArraySortConfig[];

/**
 * Default arrays that should never be sorted (order has semantic meaning)
 */
export const DEFAULT_GLOBAL_UNSORTED_ARRAYS: string[] = Object.freeze(["filterItems", "valueSettings"]) as string[];

/**
 * Active formatting rules (can be overridden via config)
 */
let activeFormattingRules: FormattingRule[] = [...DEFAULT_FORMATTING_RULES];

/**
 * Active array sort configurations
 */
let activeArraySortKeys: ArraySortConfig[] = [...DEFAULT_ARRAY_SORT_KEYS];

/**
 * Active global unsorted arrays
 */
let activeGlobalUnsortedArrays: string[] = [...DEFAULT_GLOBAL_UNSORTED_ARRAYS];

/**
 * Set active formatting rules (called when loading config)
 */
export function setFormattingRules(rules: FormattingRule[]): void {
  activeFormattingRules = rules;
}

/** @deprecated Use setFormattingRules instead */
export const setSortingRules = setFormattingRules;

/**
 * Set active array sort configurations
 */
export function setArraySortKeys(configs: ArraySortConfig[]): void {
  activeArraySortKeys = configs;
}

/**
 * Set active global unsorted arrays
 */
export function setGlobalUnsortedArrays(arrays: string[]): void {
  activeGlobalUnsortedArrays = arrays;
}

/**
 * Reset formatting rules to defaults
 */
export function resetFormattingRules(): void {
  activeFormattingRules = [...DEFAULT_FORMATTING_RULES];
  activeArraySortKeys = [...DEFAULT_ARRAY_SORT_KEYS];
  activeGlobalUnsortedArrays = [...DEFAULT_GLOBAL_UNSORTED_ARRAYS];
}

/** @deprecated Use resetFormattingRules instead */
export const resetSortingRules = resetFormattingRules;

/**
 * Get currently active formatting rules
 */
export function getActiveFormattingRules(): FormattingRule[] {
  return activeFormattingRules;
}

/**
 * Get formatting rule for a given file path
 */
export function getFormattingRule(filePath?: string): FormattingRule | undefined {
  if (!filePath) {
    return undefined;
  }

  return activeFormattingRules.find((rule) => filePath.endsWith(rule.filePattern));
}

/** @deprecated Use getFormattingRule instead */
export const getSortingRule = getFormattingRule;

/**
 * Get array sort configuration for a specific array name
 */
export function getArraySortConfig(arrayName: string): ArraySortConfig | undefined {
  return activeArraySortKeys.find((config) => config.arrayName === arrayName);
}

/**
 * Get currently active array sort configurations
 */
export function getActiveArraySortKeys(): ArraySortConfig[] {
  return activeArraySortKeys;
}

/**
 * Get currently active global unsorted arrays
 */
export function getActiveGlobalUnsortedArrays(): string[] {
  return activeGlobalUnsortedArrays;
}

/**
 * Check if an array should never be sorted (globally)
 */
export function isGlobalUnsortedArray(arrayName: string): boolean {
  return activeGlobalUnsortedArrays.includes(arrayName);
}

/**
 * Sort object keys according to elementPriority rules
 * Priority keys come first in order, then remaining keys are sorted alphabetically
 */
export function sortKeysWithPriority(keys: string[], elementPriority?: string[]): string[] {
  if (!elementPriority || elementPriority.length === 0) {
    // No priority keys, just sort alphabetically (case-sensitive)
    return keys.sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
  }

  const prioritySet = new Set(elementPriority);
  const priorityFound: string[] = [];
  const remaining: string[] = [];

  // Separate priority keys from remaining keys
  for (const key of keys) {
    if (prioritySet.has(key)) {
      priorityFound.push(key);
    } else {
      remaining.push(key);
    }
  }

  // Sort priority keys according to their order in elementPriority array
  priorityFound.sort((a, b) => {
    const indexA = elementPriority.indexOf(a);
    const indexB = elementPriority.indexOf(b);
    return indexA - indexB;
  });

  // Sort remaining keys alphabetically (case-sensitive)
  remaining.sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  // Combine: priority keys first, then remaining keys alphabetically
  return [...priorityFound, ...remaining];
}
