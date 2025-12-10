/**
 * Recursive file finder utilities for metadata helpers
 */

import * as fs from "fs";
import * as path from "path";

const DEFAULT_SKIP_DIRECTORIES = [".git", "node_modules"];

type ErrorWithCode = NodeJS.ErrnoException & { code?: string };

export interface FindFilesOptions {
  /** Additional directory names to skip during traversal */
  skipDirectories?: string[];
}

export interface FindFilesBySuffixesOptions extends FindFilesOptions {
  /** Stop after collecting this many matches (optional) */
  maxMatches?: number;
}

function normalizeSuffix(value: string): string {
  return value.startsWith(".") ? value : `.${value}`;
}

/**
 * Find files recursively whose names end with the provided suffix.
 * @param dir - Directory to start scanning from.
 * @param suffix - File name suffix (with or without leading dot).
 * @param options - Optional configuration for skipped directories.
 */
export function findFilesBySuffixes(
  dir: string,
  suffixes: string[],
  options: FindFilesBySuffixesOptions = {}
): string[] {
  if (suffixes.length === 0) {
    return [];
  }

  const normalizedSuffixes = [...new Set(suffixes.map(normalizeSuffix))];
  const skipped = new Set([...DEFAULT_SKIP_DIRECTORIES, ...(options.skipDirectories ?? [])]);
  const maxMatches = options.maxMatches ?? Number.POSITIVE_INFINITY;
  if (maxMatches <= 0) {
    return [];
  }

  const matches: string[] = [];

  const visit = (currentDir: string): boolean => {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (matches.length >= maxMatches) {
          return true;
        }

        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (skipped.has(entry.name)) {
            continue;
          }
          const shouldStop = visit(fullPath);
          if (shouldStop) {
            return true;
          }
        } else if (entry.isFile()) {
          for (const suffix of normalizedSuffixes) {
            if (entry.name.endsWith(suffix)) {
              matches.push(fullPath);
              break;
            }
          }
        }
      }
    } catch (error) {
      const err = error as ErrorWithCode;
      if (err.code !== "EACCES" && err.code !== "EPERM") {
        throw error;
      }
    }

    return matches.length >= maxMatches;
  };

  visit(dir);
  return matches;
}

export function findFilesBySuffix(dir: string, suffix: string, options: FindFilesOptions = {}): string[] {
  return findFilesBySuffixes(dir, [suffix], options);
}
