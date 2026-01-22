/**
 * Configuration file (.swiftrc) support for SF Swift
 */

import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { FormattingRule } from "../xml/sorting-rules.js";
import { ElementCleanupRule } from "../metadata/metadata-rules.js";
import { IntegrityReferenceSurface, RemovedMetadataType } from "../metadata/metadata-integrity-rules.js";
import {
  DEFAULT_INTEGRITY_REMOVED_TYPES,
  DEFAULT_INTEGRITY_RULES,
  getDefaultConfig,
  MetadataAdjustConfig,
  MetadataIntegrityConfig,
  MetadataIntegrityRuleConfig,
  SwiftrcConfig
} from "./default-config.js";

// Re-export types and getDefaultConfig for convenience
export {
  DEFAULT_INTEGRITY_REMOVED_TYPES,
  DEFAULT_INTEGRITY_RULES,
  getDefaultConfig,
  getDefaultIntegrityConfig,
  MetadataAdjustConfig,
  MetadataIntegrityConfig,
  MetadataIntegrityRuleConfig,
  SwiftrcConfig
} from "./default-config.js";

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
    metadata: {
      adjust: {
        formatting: [],
        cleanup: {},
        alwaysExcluded: []
      }
    }
  };

  if (!config.metadata || typeof config.metadata !== "object") {
    throw new Error(".swiftrc: 'metadata' section is required.");
  }

  const metadata = config.metadata as Record<string, unknown>;

  if (!metadata.adjust || typeof metadata.adjust !== "object") {
    throw new Error(".swiftrc: 'metadata.adjust' section is required.");
  }

  const adjust = metadata.adjust as Record<string, unknown>;
  const adjustConfig: MetadataAdjustConfig = {
    formatting: [],
    cleanup: {},
    alwaysExcluded: []
  };

  // Validate formatting array (required)
  if (adjust.formatting === undefined) {
    throw new Error(
      ".swiftrc: 'metadata.adjust.formatting' section is required. Add formatting rules for metadata types to process."
    );
  }

  if (!Array.isArray(adjust.formatting)) {
    throw new Error(".swiftrc: 'metadata.adjust.formatting' must be an array of formatting rule objects.");
  }

  const formattingRules: FormattingRule[] = [];
  for (const [index, rule] of adjust.formatting.entries()) {
    if (!rule || typeof rule !== "object") {
      throw new Error(`.swiftrc: metadata.adjust.formatting[${index}] must be an object.`);
    }
    const ruleObj = rule as Record<string, unknown>;
    if (!ruleObj.filePattern || typeof ruleObj.filePattern !== "string") {
      throw new Error(`.swiftrc: metadata.adjust.formatting[${index}].filePattern is required and must be a string.`);
    }

    const formattingRule: FormattingRule = {
      filePattern: ruleObj.filePattern
    };

    if (ruleObj.elementPriority !== undefined) {
      if (!Array.isArray(ruleObj.elementPriority)) {
        throw new Error(`.swiftrc: metadata.adjust.formatting[${index}].elementPriority must be an array of strings.`);
      }
      formattingRule.elementPriority = ruleObj.elementPriority as string[];
    }

    if (ruleObj.sortedByElements !== undefined) {
      if (!Array.isArray(ruleObj.sortedByElements)) {
        throw new Error(`.swiftrc: metadata.adjust.formatting[${index}].sortedByElements must be an array of strings.`);
      }
      formattingRule.sortedByElements = ruleObj.sortedByElements as string[];
    }

    if (ruleObj.unsortedArrays !== undefined) {
      if (!Array.isArray(ruleObj.unsortedArrays)) {
        throw new Error(`.swiftrc: metadata.adjust.formatting[${index}].unsortedArrays must be an array of strings.`);
      }
      formattingRule.unsortedArrays = ruleObj.unsortedArrays as string[];
    }

    if (ruleObj.condensedElements !== undefined) {
      if (!Array.isArray(ruleObj.condensedElements)) {
        throw new Error(
          `.swiftrc: metadata.adjust.formatting[${index}].condensedElements must be an array of strings.`
        );
      }
      formattingRule.condensedElements = ruleObj.condensedElements as string[];
    }

    formattingRules.push(formattingRule);
  }
  adjustConfig.formatting = formattingRules;

  // Validate cleanup rules (optional)
  if (adjust.cleanup !== undefined) {
    if (typeof adjust.cleanup !== "object" || adjust.cleanup === null) {
      throw new Error(".swiftrc: 'metadata.adjust.cleanup' must be an object mapping metadata types to rule arrays.");
    }
    const cleanupRules: { [metadataType: string]: ElementCleanupRule[] } = {};
    const rawCleanup = adjust.cleanup as Record<string, unknown>;

    for (const [metaType, rules] of Object.entries(rawCleanup)) {
      if (!Array.isArray(rules)) {
        throw new Error(`.swiftrc: metadata.adjust.cleanup['${metaType}'] must be an array of cleanup rule objects.`);
      }
      const typedRules: ElementCleanupRule[] = [];
      for (const [ruleIndex, rule] of rules.entries()) {
        if (!rule || typeof rule !== "object") {
          throw new Error(`.swiftrc: metadata.adjust.cleanup['${metaType}'][${ruleIndex}] must be an object.`);
        }
        const ruleObj = rule as Record<string, unknown>;
        if (!ruleObj.elementName || typeof ruleObj.elementName !== "string") {
          throw new Error(
            `.swiftrc: metadata.adjust.cleanup['${metaType}'][${ruleIndex}].elementName is required and must be a string.`
          );
        }
        if (!Array.isArray(ruleObj.removeValues)) {
          throw new Error(
            `.swiftrc: metadata.adjust.cleanup['${metaType}'][${ruleIndex}].removeValues is required and must be an array.`
          );
        }
        const cleanupRule: ElementCleanupRule = {
          elementName: ruleObj.elementName,
          removeValues: ruleObj.removeValues as string[]
        };
        if (ruleObj.conditions !== undefined) {
          if (!Array.isArray(ruleObj.conditions)) {
            throw new Error(
              `.swiftrc: metadata.adjust.cleanup['${metaType}'][${ruleIndex}].conditions must be an array.`
            );
          }
          cleanupRule.conditions = ruleObj.conditions as { elementName: string; values: string[] }[];
        }
        typedRules.push(cleanupRule);
      }
      cleanupRules[metaType] = typedRules;
    }
    adjustConfig.cleanup = cleanupRules;
  }

  // Validate alwaysExcluded (optional)
  if (adjust.alwaysExcluded !== undefined) {
    if (!Array.isArray(adjust.alwaysExcluded)) {
      throw new Error(".swiftrc: 'metadata.adjust.alwaysExcluded' must be an array of strings.");
    }
    adjustConfig.alwaysExcluded = adjust.alwaysExcluded as string[];
  }

  // Validate no conflicts between formatting patterns and alwaysExcluded
  validateNoPatternConflicts(adjustConfig.formatting, adjustConfig.alwaysExcluded);

  result.metadata.adjust = adjustConfig;

  if (metadata.integrity !== undefined) {
    if (metadata.integrity === null || typeof metadata.integrity !== "object") {
      throw new Error(".swiftrc: 'metadata.integrity' must be an object.");
    }

    const integrity = metadata.integrity as Record<string, unknown>;
    const integrityConfig: MetadataIntegrityConfig = {};

    if (integrity.removedTypes !== undefined) {
      if (!Array.isArray(integrity.removedTypes)) {
        throw new Error(".swiftrc: 'metadata.integrity.removedTypes' must be an array of strings.");
      }

      const removedTypes = integrity.removedTypes as unknown[];
      const allowedTypes = new Set<RemovedMetadataType>(DEFAULT_INTEGRITY_REMOVED_TYPES);
      const normalized: RemovedMetadataType[] = [];

      for (const value of removedTypes) {
        if (typeof value !== "string" || !allowedTypes.has(value as RemovedMetadataType)) {
          throw new Error(`.swiftrc: metadata.integrity.removedTypes contains unknown value '${value}'.`);
        }
        normalized.push(value as RemovedMetadataType);
      }

      integrityConfig.removedTypes = normalized;
    }

    if (integrity.rules !== undefined) {
      if (!Array.isArray(integrity.rules)) {
        throw new Error(".swiftrc: 'metadata.integrity.rules' must be an array of rule objects.");
      }

      const allowedTypes = new Set<RemovedMetadataType>(DEFAULT_INTEGRITY_REMOVED_TYPES);
      const allowedSurfaces = new Set<IntegrityReferenceSurface>(
        DEFAULT_INTEGRITY_RULES.flatMap((rule) => rule.surfaces)
      );

      const rules: MetadataIntegrityRuleConfig[] = [];
      for (const [index, rule] of integrity.rules.entries()) {
        if (!rule || typeof rule !== "object") {
          throw new Error(`.swiftrc: metadata.integrity.rules[${index}] must be an object.`);
        }

        const ruleObj = rule as Record<string, unknown>;
        const removedType = ruleObj.removedType;
        if (typeof removedType !== "string" || !allowedTypes.has(removedType as RemovedMetadataType)) {
          throw new Error(`.swiftrc: metadata.integrity.rules[${index}].removedType is invalid.`);
        }

        const surfaces = ruleObj.surfaces;
        if (!Array.isArray(surfaces) || surfaces.length === 0) {
          throw new Error(
            `.swiftrc: metadata.integrity.rules[${index}].surfaces must be a non-empty array of strings.`
          );
        }

        const normalizedSurfaces: IntegrityReferenceSurface[] = [];
        for (const surface of surfaces) {
          if (typeof surface !== "string" || !allowedSurfaces.has(surface as IntegrityReferenceSurface)) {
            throw new Error(
              `.swiftrc: metadata.integrity.rules[${index}].surfaces contains unknown value '${surface}'.`
            );
          }
          normalizedSurfaces.push(surface as IntegrityReferenceSurface);
        }

        rules.push({
          removedType: removedType as RemovedMetadataType,
          surfaces: normalizedSurfaces
        });
      }

      integrityConfig.rules = rules;
    }

    result.metadata.integrity = integrityConfig;
  }

  return result;
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

export function formatDateAsYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}${month}${day}`;
}

export function getSwiftrcBackupFilename(date: Date = new Date()): string {
  return `${CONFIG_FILENAME}.backup.${formatDateAsYYYYMMDD(date)}`;
}

export function serializeSwiftrcConfig(config: SwiftrcConfig): string {
  const content = yaml.dump(config, { lineWidth: -1, noRefs: true });
  return content.endsWith("\n") ? content : `${content}\n`;
}

export function createDefaultSwiftrc(
  targetDir: string,
  options: { date?: Date } = {}
): { configPath: string; backupPath?: string } {
  const configPath = path.join(targetDir, CONFIG_FILENAME);
  let backupPath: string | undefined;

  if (fs.existsSync(configPath)) {
    const backupName = getSwiftrcBackupFilename(options.date ?? new Date());
    backupPath = path.join(targetDir, backupName);

    if (fs.existsSync(backupPath)) {
      throw new Error(`Backup already exists: ${backupName}`);
    }

    fs.copyFileSync(configPath, backupPath);
  }

  const content = serializeSwiftrcConfig(getDefaultConfig());
  fs.writeFileSync(configPath, content, "utf8");

  return { configPath, backupPath };
}
