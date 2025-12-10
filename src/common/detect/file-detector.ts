import * as path from "path";
import { findFilesBySuffixes } from "../helper/file-finder.js";

export interface FileScanOptions {
  targetDir: string;
  types: string[];
  maxMatches?: number;
}

export interface FileScanResult {
  count: number;
  files: string[];
  relativeFiles: string[];
  types: string[];
  maxMatches?: number;
  maxReached: boolean;
}

export interface FileScanSummaryOptions {
  log: (line: string) => void;
  result: FileScanResult;
  targetDir: string;
  elapsedTimeMs: number;
  matchLabel: string;
  listHeading: string;
  emptyMessage: string;
  typesLabel?: string;
}

export function scanForFiles(options: FileScanOptions): FileScanResult {
  const { targetDir, types, maxMatches } = options;
  const files = findFilesBySuffixes(targetDir, types, { maxMatches });
  const relativeFiles = files.map((file) => path.relative(targetDir, file));

  return {
    count: files.length,
    files,
    relativeFiles,
    types,
    maxMatches,
    maxReached: Boolean(maxMatches !== undefined && files.length === maxMatches)
  };
}

export function logFileScanSummary(options: FileScanSummaryOptions): void {
  const { log, result, targetDir, elapsedTimeMs, matchLabel, listHeading, emptyMessage, typesLabel } = options;
  const elapsedSeconds = (elapsedTimeMs / 1000).toFixed(2);

  log("\n" + "=".repeat(60));
  log("🔍 SCAN SUMMARY");
  log("=".repeat(60));
  log(`📁 Directory scanned: ${targetDir}`);
  log(`⏱️ Processing time: ${elapsedSeconds}s`);
  if (typesLabel) {
    log(`${typesLabel}: ${result.types.join(", ")}`);
  }
  log(`${matchLabel}: ${result.count}`);

  if (result.count > 0) {
    log(listHeading);
    result.relativeFiles.forEach((file, index) => {
      log(`  ${index + 1}. ${file}`);
    });
  } else {
    log(emptyMessage);
  }

  if (result.maxMatches !== undefined && result.maxReached) {
    log(`⚠️ Scan stopped early after reaching --max=${result.maxMatches}`);
  }
}
