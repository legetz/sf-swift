/**
 * Configuration file (.swiftrc) support for SF Swift
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { FormattingRule } from "../xml/sorting-rules.js";
import { ElementCleanupRule } from "../metadata/metadata-rules.js";
import { getDefaultConfig, SwiftrcConfig } from "./default-config.js";

// Re-export types and getDefaultConfig for convenience
export { getDefaultConfig, SwiftrcConfig } from "./default-config.js";

/**
 * Options for getConfig function
 */
export interface GetConfigOptions {
  silent?: boolean;
  /** Path to custom configuration file. If provided, this file is used instead of .swiftrc */
  configPath?: string;
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
 * Validate that formatting patterns don't conflict with alwaysExcluded
 */
function validateNoPatternConflicts(formatting: FormattingRule[], alwaysExcluded: string[]): void {
  const conflicts: string[] = [];

  for (const rule of formatting) {
    for (const excluded of alwaysExcluded) {
      // Check for exact match or suffix match
      if (rule.filePattern === excluded || rule.filePattern.endsWith(excluded) || excluded.endsWith(rule.filePattern)) {
        conflicts.push(rule.filePattern);
      }
    }
  }

  if (conflicts.length > 0) {
    throw new Error(
      `.swiftrc: Configuration conflict - the following formatting patterns are also in alwaysExcluded: ${conflicts.join(", ")}. ` +
        `Remove them from either 'formatting' or 'alwaysExcluded'.`
    );
  }
}

/**
 * Validate raw config object and return typed config
 */
export function validateConfig(rawConfig: unknown): SwiftrcConfig {
  if (rawConfig === null || rawConfig === undefined) {
    throw new Error(".swiftrc: Configuration file is empty. Please add configuration or delete the file.");
  }

  if (typeof rawConfig !== "object") {
    throw new Error(".swiftrc: Configuration must be a YAML object. See documentation for valid configuration format.");
  }

  const config = rawConfig as Record<string, unknown>;
  const result: SwiftrcConfig = {
    formatting: [],
    cleanup: {},
    alwaysExcluded: []
  };

  // Validate formatting array (required)
  if (config.formatting === undefined) {
    throw new Error(".swiftrc: 'formatting' section is required. Add formatting rules for metadata types to process.");
  }

  if (!Array.isArray(config.formatting)) {
    throw new Error(".swiftrc: 'formatting' must be an array of formatting rule objects.");
  }

  const formattingRules: FormattingRule[] = [];
  for (const [index, rule] of config.formatting.entries()) {
    if (!rule || typeof rule !== "object") {
      throw new Error(`.swiftrc: formatting[${index}] must be an object.`);
    }
    const ruleObj = rule as Record<string, unknown>;
    if (!ruleObj.filePattern || typeof ruleObj.filePattern !== "string") {
      throw new Error(`.swiftrc: formatting[${index}].filePattern is required and must be a string.`);
    }

    const formattingRule: FormattingRule = {
      filePattern: ruleObj.filePattern
    };

    if (ruleObj.elementPriority !== undefined) {
      if (!Array.isArray(ruleObj.elementPriority)) {
        throw new Error(`.swiftrc: formatting[${index}].elementPriority must be an array of strings.`);
      }
      formattingRule.elementPriority = ruleObj.elementPriority as string[];
    }

    if (ruleObj.sortedByElements !== undefined) {
      if (!Array.isArray(ruleObj.sortedByElements)) {
        throw new Error(`.swiftrc: formatting[${index}].sortedByElements must be an array of strings.`);
      }
      formattingRule.sortedByElements = ruleObj.sortedByElements as string[];
    }

    if (ruleObj.unsortedArrays !== undefined) {
      if (!Array.isArray(ruleObj.unsortedArrays)) {
        throw new Error(`.swiftrc: formatting[${index}].unsortedArrays must be an array of strings.`);
      }
      formattingRule.unsortedArrays = ruleObj.unsortedArrays as string[];
    }

    if (ruleObj.condensedElements !== undefined) {
      if (!Array.isArray(ruleObj.condensedElements)) {
        throw new Error(`.swiftrc: formatting[${index}].condensedElements must be an array of strings.`);
      }
      formattingRule.condensedElements = ruleObj.condensedElements as string[];
    }

    formattingRules.push(formattingRule);
  }
  result.formatting = formattingRules;

  // Validate cleanup rules (optional)
  if (config.cleanup !== undefined) {
    if (typeof config.cleanup !== "object" || config.cleanup === null) {
      throw new Error(".swiftrc: 'cleanup' must be an object mapping metadata types to rule arrays.");
    }
    const cleanupRules: { [metadataType: string]: ElementCleanupRule[] } = {};
    const rawCleanup = config.cleanup as Record<string, unknown>;

    for (const [metaType, rules] of Object.entries(rawCleanup)) {
      if (!Array.isArray(rules)) {
        throw new Error(`.swiftrc: cleanup['${metaType}'] must be an array of cleanup rule objects.`);
      }
      const typedRules: ElementCleanupRule[] = [];
      for (const [ruleIndex, rule] of rules.entries()) {
        if (!rule || typeof rule !== "object") {
          throw new Error(`.swiftrc: cleanup['${metaType}'][${ruleIndex}] must be an object.`);
        }
        const ruleObj = rule as Record<string, unknown>;
        if (!ruleObj.elementName || typeof ruleObj.elementName !== "string") {
          throw new Error(
            `.swiftrc: cleanup['${metaType}'][${ruleIndex}].elementName is required and must be a string.`
          );
        }
        if (!Array.isArray(ruleObj.removeValues)) {
          throw new Error(
            `.swiftrc: cleanup['${metaType}'][${ruleIndex}].removeValues is required and must be an array.`
          );
        }
        const cleanupRule: ElementCleanupRule = {
          elementName: ruleObj.elementName,
          removeValues: ruleObj.removeValues as string[]
        };
        if (ruleObj.conditions !== undefined) {
          if (!Array.isArray(ruleObj.conditions)) {
            throw new Error(`.swiftrc: cleanup['${metaType}'][${ruleIndex}].conditions must be an array.`);
          }
          cleanupRule.conditions = ruleObj.conditions as { elementName: string; values: string[] }[];
        }
        typedRules.push(cleanupRule);
      }
      cleanupRules[metaType] = typedRules;
    }
    result.cleanup = cleanupRules;
  }

  // Validate alwaysExcluded (optional)
  if (config.alwaysExcluded !== undefined) {
    if (!Array.isArray(config.alwaysExcluded)) {
      throw new Error(".swiftrc: 'alwaysExcluded' must be an array of strings.");
    }
    result.alwaysExcluded = config.alwaysExcluded as string[];
  }

  // Validate no conflicts between formatting patterns and alwaysExcluded
  validateNoPatternConflicts(result.formatting, result.alwaysExcluded);

  return result;
}

/**
 * Generate default config YAML string with helpful comments
 */
export function generateDefaultConfig(): string {
  const config = getDefaultConfig();

  const yamlContent = `# .swiftrc - SF Swift Configuration File
# This file configures the behavior of the 'sf swift metadata adjust' command.
# Documentation: https://github.com/legetz/sf-swift

# Formatting rules define how XML elements within specific file types should be sorted.
# Files are only processed if they match a filePattern here (implicit whitelist).
# - filePattern: Metadata file suffix to match (e.g., 'field-meta.xml')
# - elementPriority: Element keys that appear first within each object, in order
# - sortedByElements: Keys to use for sorting array elements (first match wins)
# - unsortedArrays: Array keys that preserve their original order (not sorted)
# - condensedElements: Element keys formatted on single lines for better diff readability
formatting:
${config.formatting
  .map((rule) => {
    let ruleYaml = `  - filePattern: "${rule.filePattern}"`;
    if (rule.elementPriority && rule.elementPriority.length > 0) {
      ruleYaml += `\n    elementPriority:\n${rule.elementPriority.map((k) => `      - ${k}`).join("\n")}`;
    }
    if (rule.sortedByElements && rule.sortedByElements.length > 0) {
      ruleYaml += `\n    sortedByElements:\n${rule.sortedByElements.map((k) => `      - ${k}`).join("\n")}`;
    }
    if (rule.unsortedArrays && rule.unsortedArrays.length > 0) {
      ruleYaml += `\n    unsortedArrays:\n${rule.unsortedArrays.map((a) => `      - ${a}`).join("\n")}`;
    }
    if (rule.condensedElements && rule.condensedElements.length > 0) {
      ruleYaml += `\n    condensedElements:\n${rule.condensedElements.map((a) => `      - ${a}`).join("\n")}`;
    }
    return ruleYaml;
  })
  .join("\n")}

# Element cleanup rules for removing default/empty values from metadata
# Each metadata type can have multiple rules with optional conditions
cleanup:
${Object.entries(config.cleanup)
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

# Always excluded types that cannot be processed (require special handling)
alwaysExcluded:
${config.alwaysExcluded.map((t) => `  - ${t}`).join("\n")}
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
 * Load .swiftrc config from specified directory (looks for .swiftrc file)
 */
export function loadSwiftrcConfig(projectRoot: string): SwiftrcConfig | null {
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
 * Load config from a specific file path
 */
export function loadConfigFromPath(configFilePath: string): SwiftrcConfig {
  const resolvedPath = path.resolve(configFilePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Configuration file not found: ${resolvedPath}`);
  }

  try {
    const content = fs.readFileSync(resolvedPath, "utf8");
    const rawConfig = yaml.load(content);
    return validateConfig(rawConfig);
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      throw new Error(`${configFilePath}: Invalid YAML syntax - ${(error as yaml.YAMLException).message}`);
    }
    throw error;
  }
}

/**
 * Main entry point - get configuration for a target directory
 * - If configPath option is provided, loads from that specific file
 * - Otherwise, looks for .swiftrc in project root
 * - Falls back to built-in defaults if no config file is found
 * Note: Config is used as-is, no merging with defaults
 */
export function getConfig(targetDir: string, options: GetConfigOptions = {}): SwiftrcConfig {
  // If a specific config path is provided, load from that file
  if (options.configPath) {
    return loadConfigFromPath(options.configPath);
  }

  // Find project root and look for .swiftrc
  const projectRoot = findProjectRoot(targetDir);

  // Try to load existing config
  const existingConfig = loadSwiftrcConfig(projectRoot);

  if (existingConfig !== null) {
    // Config exists, use it as-is (no merging)
    return existingConfig;
  }

  // No config exists - use built-in defaults (no file creation)
  return getDefaultConfig();
}
