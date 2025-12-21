/**
 * Configuration file (.swiftrc) support for SF Swift
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { SortingRule } from "../xml/sorting-rules.js";
import { ElementCleanupRule } from "../metadata/metadata-rules.js";
import {
  getDefaultConfig,
  MetadataTypesConfig,
  SwiftrcConfig
} from "./default-config.js";

// Re-export types and getDefaultConfig for backward compatibility
export { getDefaultConfig, MetadataTypesConfig, SwiftrcConfig } from "./default-config.js";

/**
 * Options for getConfig function
 */
export interface GetConfigOptions {
  autoGenerate?: boolean;
  silent?: boolean;
}

const CONFIG_FILENAME = ".swiftrc";

/**
 * Find project root by walking up directory tree
 * Checks for .swiftrc, .git, or package.json
 */
export function findProjectRoot(startPath: string): string {
  let current = path.resolve(startPath);

  while (current !== path.dirname(current)) {
    // Check for .swiftrc first (highest priority)
    if (fs.existsSync(path.join(current, CONFIG_FILENAME))) {
      return current;
    }
    // Check for .git (common project root indicator)
    if (fs.existsSync(path.join(current, ".git"))) {
      return current;
    }
    // Check for package.json (fallback for non-git projects)
    if (fs.existsSync(path.join(current, "package.json"))) {
      return current;
    }
    current = path.dirname(current);
  }

  // Fallback to start path if no project root found
  return path.resolve(startPath);
}


/**
 * Validate raw config object and return typed partial config
 */
export function validateConfig(rawConfig: unknown): Partial<SwiftrcConfig> {
  if (rawConfig === null || rawConfig === undefined) {
    return {};
  }

  if (typeof rawConfig !== "object") {
    throw new Error(".swiftrc: Configuration must be a YAML object. See documentation for valid configuration format.");
  }

  const config = rawConfig as Record<string, unknown>;
  const result: Partial<SwiftrcConfig> = {};

  // Validate sortingRules
  if (config.sortingRules !== undefined) {
    if (!Array.isArray(config.sortingRules)) {
      throw new Error(".swiftrc: 'sortingRules' must be an array of sorting rule objects.");
    }
    const sortingRules: SortingRule[] = [];
    for (const [index, rule] of config.sortingRules.entries()) {
      if (!rule || typeof rule !== "object") {
        throw new Error(`.swiftrc: sortingRules[${index}] must be an object.`);
      }
      const ruleObj = rule as Record<string, unknown>;
      if (!ruleObj.filePattern || typeof ruleObj.filePattern !== "string") {
        throw new Error(`.swiftrc: sortingRules[${index}].filePattern is required and must be a string.`);
      }
      const sortingRule: SortingRule = {
        filePattern: ruleObj.filePattern
      };
      if (ruleObj.priorityKeys !== undefined) {
        if (!Array.isArray(ruleObj.priorityKeys)) {
          throw new Error(`.swiftrc: sortingRules[${index}].priorityKeys must be an array of strings.`);
        }
        sortingRule.priorityKeys = ruleObj.priorityKeys as string[];
      }
      if (ruleObj.unsortedArrays !== undefined) {
        if (!Array.isArray(ruleObj.unsortedArrays)) {
          throw new Error(`.swiftrc: sortingRules[${index}].unsortedArrays must be an array of strings.`);
        }
        sortingRule.unsortedArrays = ruleObj.unsortedArrays as string[];
      }
      if (ruleObj.condensedArrays !== undefined) {
        if (!Array.isArray(ruleObj.condensedArrays)) {
          throw new Error(`.swiftrc: sortingRules[${index}].condensedArrays must be an array of strings.`);
        }
        sortingRule.condensedArrays = ruleObj.condensedArrays as string[];
      }
      sortingRules.push(sortingRule);
    }
    result.sortingRules = sortingRules;
  }

  // Validate metadataTypes
  if (config.metadataTypes !== undefined) {
    if (typeof config.metadataTypes !== "object" || config.metadataTypes === null) {
      throw new Error(".swiftrc: 'metadataTypes' must be an object.");
    }
    const metaTypes = config.metadataTypes as Record<string, unknown>;
    const metadataTypesConfig: Partial<MetadataTypesConfig> = {};

    if (metaTypes.allowed !== undefined) {
      if (!Array.isArray(metaTypes.allowed)) {
        throw new Error(".swiftrc: metadataTypes.allowed must be an array of strings.");
      }
      metadataTypesConfig.allowed = metaTypes.allowed as string[];
    }
    if (metaTypes.defaultExclusions !== undefined) {
      if (!Array.isArray(metaTypes.defaultExclusions)) {
        throw new Error(".swiftrc: metadataTypes.defaultExclusions must be an array of strings.");
      }
      metadataTypesConfig.defaultExclusions = metaTypes.defaultExclusions as string[];
    }
    if (metaTypes.alwaysExcluded !== undefined) {
      if (!Array.isArray(metaTypes.alwaysExcluded)) {
        throw new Error(".swiftrc: metadataTypes.alwaysExcluded must be an array of strings.");
      }
      metadataTypesConfig.alwaysExcluded = metaTypes.alwaysExcluded as string[];
    }

    if (Object.keys(metadataTypesConfig).length > 0) {
      result.metadataTypes = metadataTypesConfig as MetadataTypesConfig;
    }
  }

  // Validate cleanupRules
  if (config.cleanupRules !== undefined) {
    if (typeof config.cleanupRules !== "object" || config.cleanupRules === null) {
      throw new Error(".swiftrc: 'cleanupRules' must be an object mapping metadata types to rule arrays.");
    }
    const cleanupRules: { [metadataType: string]: ElementCleanupRule[] } = {};
    const rawCleanup = config.cleanupRules as Record<string, unknown>;

    for (const [metaType, rules] of Object.entries(rawCleanup)) {
      if (!Array.isArray(rules)) {
        throw new Error(`.swiftrc: cleanupRules['${metaType}'] must be an array of cleanup rule objects.`);
      }
      const typedRules: ElementCleanupRule[] = [];
      for (const [ruleIndex, rule] of rules.entries()) {
        if (!rule || typeof rule !== "object") {
          throw new Error(`.swiftrc: cleanupRules['${metaType}'][${ruleIndex}] must be an object.`);
        }
        const ruleObj = rule as Record<string, unknown>;
        if (!ruleObj.elementName || typeof ruleObj.elementName !== "string") {
          throw new Error(
            `.swiftrc: cleanupRules['${metaType}'][${ruleIndex}].elementName is required and must be a string.`
          );
        }
        if (!Array.isArray(ruleObj.removeValues)) {
          throw new Error(
            `.swiftrc: cleanupRules['${metaType}'][${ruleIndex}].removeValues is required and must be an array.`
          );
        }
        const cleanupRule: ElementCleanupRule = {
          elementName: ruleObj.elementName,
          removeValues: ruleObj.removeValues as string[]
        };
        if (ruleObj.conditions !== undefined) {
          if (!Array.isArray(ruleObj.conditions)) {
            throw new Error(`.swiftrc: cleanupRules['${metaType}'][${ruleIndex}].conditions must be an array.`);
          }
          cleanupRule.conditions = ruleObj.conditions as { elementName: string; values: string[] }[];
        }
        typedRules.push(cleanupRule);
      }
      cleanupRules[metaType] = typedRules;
    }
    result.cleanupRules = cleanupRules;
  }

  return result;
}

/**
 * Merge user config with defaults
 * - Arrays (sortingRules, allowed, etc.): User config replaces defaults entirely
 * - Objects (cleanupRules): Deep merge - user-specified types override, others use defaults
 * - Missing sections: Use hardcoded defaults
 */
export function mergeWithDefaults(userConfig: Partial<SwiftrcConfig>): SwiftrcConfig {
  const defaults = getDefaultConfig();

  return {
    sortingRules: userConfig.sortingRules ?? defaults.sortingRules,
    metadataTypes: {
      allowed: userConfig.metadataTypes?.allowed ?? defaults.metadataTypes.allowed,
      defaultExclusions: userConfig.metadataTypes?.defaultExclusions ?? defaults.metadataTypes.defaultExclusions,
      alwaysExcluded: userConfig.metadataTypes?.alwaysExcluded ?? defaults.metadataTypes.alwaysExcluded
    },
    cleanupRules: userConfig.cleanupRules
      ? { ...defaults.cleanupRules, ...userConfig.cleanupRules }
      : defaults.cleanupRules
  };
}

/**
 * Generate default config YAML string with helpful comments
 */
export function generateDefaultConfig(): string {
  const config = getDefaultConfig();

  const yamlContent = `# .swiftrc - SF Swift Configuration File
# This file configures the behavior of the 'sf swift metadata adjust' command.
# Documentation: https://github.com/legetz/sf-swift

# Sorting rules define how XML elements within specific file types should be sorted.
# - filePattern: Metadata file suffix to match (e.g., 'field-meta.xml')
# - priorityKeys: Keys sorted to the top in the specified order
# - unsortedArrays: Array keys that preserve their original order (not sorted)
# - condensedArrays: Array keys that are formatted on single lines for better diff readability
sortingRules:
${config.sortingRules
  .map((rule) => {
    let ruleYaml = `  - filePattern: "${rule.filePattern}"`;
    if (rule.priorityKeys && rule.priorityKeys.length > 0) {
      ruleYaml += `\n    priorityKeys:\n${rule.priorityKeys.map((k) => `      - ${k}`).join("\n")}`;
    }
    if (rule.unsortedArrays && rule.unsortedArrays.length > 0) {
      ruleYaml += `\n    unsortedArrays:\n${rule.unsortedArrays.map((a) => `      - ${a}`).join("\n")}`;
    }
    if (rule.condensedArrays && rule.condensedArrays.length > 0) {
      ruleYaml += `\n    condensedArrays:\n${rule.condensedArrays.map((a) => `      - ${a}`).join("\n")}`;
    }
    return ruleYaml;
  })
  .join("\n")}

# Metadata type filtering configuration
metadataTypes:
  # Whitelist of allowed metadata types (processed by default unless --all is used)
  allowed:
${config.metadataTypes.allowed.map((t) => `    - ${t}`).join("\n")}

  # Default exclusions (skipped when --exclude is not specified)
  defaultExclusions:
${config.metadataTypes.defaultExclusions.map((t) => `    - ${t}`).join("\n")}

  # Always excluded types that cannot be included (require special handling)
  alwaysExcluded:
${config.metadataTypes.alwaysExcluded.map((t) => `    - ${t}`).join("\n")}

# Element cleanup rules for removing default/empty values from metadata
# Each metadata type can have multiple rules with optional conditions
cleanupRules:
${Object.entries(config.cleanupRules)
  .map(([metaType, rules]) => {
    let typeYaml = `  ${metaType}:`;
    for (const rule of rules) {
      typeYaml += `\n    - elementName: ${rule.elementName}`;
      typeYaml += `\n      removeValues:`;
      for (const val of rule.removeValues) {
        typeYaml += `\n        - "${val}"`;
      }
      if (rule.conditions && rule.conditions.length > 0) {
        typeYaml += `\n      conditions:`;
        for (const cond of rule.conditions) {
          typeYaml += `\n        - elementName: ${cond.elementName}`;
          typeYaml += `\n          values:`;
          for (const v of cond.values) {
            typeYaml += `\n            - ${v}`;
          }
        }
      }
    }
    return typeYaml;
  })
  .join("\n")}
`;

  return yamlContent;
}

/**
 * Write default config file to specified directory
 */
export function writeDefaultConfig(projectRoot: string): string {
  const configPath = path.join(projectRoot, CONFIG_FILENAME);
  const configContent = generateDefaultConfig();
  fs.writeFileSync(configPath, configContent, "utf8");
  return configPath;
}

/**
 * Load .swiftrc config from specified path
 */
export function loadSwiftrcConfig(projectRoot: string): Partial<SwiftrcConfig> | null {
  const configPath = path.join(projectRoot, CONFIG_FILENAME);

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, "utf8");
    const rawConfig = yaml.load(content);
    return validateConfig(rawConfig);
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      throw new Error(`.swiftrc: Invalid YAML syntax - ${(error as yaml.YAMLException).message}`);
    }
    throw error;
  }
}

/**
 * Main entry point - get configuration for a target directory
 * Finds project root, loads config if exists, optionally auto-generates, and merges with defaults
 */
export function getConfig(targetDir: string, options: GetConfigOptions = {}): SwiftrcConfig {
  const projectRoot = findProjectRoot(targetDir);
  const configPath = path.join(projectRoot, CONFIG_FILENAME);

  // Try to load existing config
  const userConfig = loadSwiftrcConfig(projectRoot);

  if (userConfig !== null) {
    // Config exists, merge with defaults
    return mergeWithDefaults(userConfig);
  }

  // No config exists
  if (options.autoGenerate) {
    writeDefaultConfig(projectRoot);
    if (!options.silent) {
      console.log(`Created ${CONFIG_FILENAME} configuration file at: ${configPath}`);
    }
  }

  // Return defaults
  return getDefaultConfig();
}
