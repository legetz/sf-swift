import { SfCommand, Flags } from "@salesforce/sf-plugins-core";
import { Messages } from "@salesforce/core";
import { Args } from "@oclif/core";
import * as path from "path";
import { ensureDirectory } from "../../../common/helper/filesystem.js";
import { findFilesBySuffixes } from "../../../common/helper/file-finder.js";

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages("sf-swift", "detect.file");

export type FileDetectionResult = {
  count: number;
  files: string[];
  types: string[];
};

export default class DetectFile extends SfCommand<FileDetectionResult> {
  public static readonly description = messages.getMessage("description");
  public static readonly examples = messages.getMessages("examples");

  public static readonly args = {
    path: Args.string({
      description: messages.getMessage("args.path.description"),
      required: false
    })
  };

  public static readonly flags = {
    "target-dir": Flags.string({
      char: "d",
      description: messages.getMessage("flags.target-dir.description"),
      default: "."
    }),
    type: Flags.string({
      char: "t",
      description: messages.getMessage("flags.type.description"),
      multiple: true,
      required: true
    }),
    max: Flags.integer({
      description: messages.getMessage("flags.max.description"),
      required: false
    })
  };

  public async run(): Promise<FileDetectionResult> {
    const startTime = Date.now();
    const { args, flags } = await this.parse(DetectFile);
    const targetDir = args.path || flags["target-dir"] || process.cwd();
    const maxMatches = flags.max;

    if (maxMatches !== undefined && maxMatches <= 0) {
      this.error(messages.getMessage("errors.max.outOfRange"));
    }

    ensureDirectory(targetDir, this.error.bind(this));

    const normalizedTypes = this.normalizeTypes(flags.type);

    this.log(`🔍 Scan files (${normalizedTypes.join(", ")}) in ${targetDir}`);

    const files = findFilesBySuffixes(targetDir, normalizedTypes, { maxMatches });
    const elapsedTime = Date.now() - startTime;

    const result: FileDetectionResult = {
      count: files.length,
      files,
      types: normalizedTypes
    };

    this.displaySummary(result, elapsedTime, targetDir, maxMatches);

    if (files.length > 0 && !flags.json) {
      this.error(messages.getMessage("errors.matches.found", [files.length]), {
        exit: 1
      });
    }

    return result;
  }

  private normalizeTypes(values: string[]): string[] {
    const trimmed = values
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value && value.length > 0));

    if (trimmed.length === 0) {
      this.error(messages.getMessage("errors.type.required"));
    }

    return [...new Set(trimmed.map((value) => (value.startsWith(".") ? value : `.${value}`)))];
  }

  private displaySummary(
    result: FileDetectionResult,
    elapsedTimeMs: number,
    targetDir: string,
    maxMatches?: number
  ): void {
    const elapsedSeconds = (elapsedTimeMs / 1000).toFixed(2);

    this.log("\n" + "=".repeat(60));
    this.log("🔍 SCAN SUMMARY");
    this.log("=".repeat(60));
    this.log(`📁 Directory scanned: ${targetDir}`);
    this.log(`⏱️ Processing time: ${elapsedSeconds}s`);
    this.log(`🎯 File types: ${result.types.join(", ")}`);
    this.log(`📊 Matching files found: ${result.count}`);

    if (result.count > 0) {
      this.log("❌ Matching files detected:");
      result.files.forEach((file, index) => {
        const relativePath = path.relative(targetDir, file);
        this.log(`  ${index + 1}. ${relativePath}`);
      });
    } else {
      this.log(`✅ No matching files found - directory is clean!`);
    }

    if (maxMatches !== undefined && result.count === maxMatches) {
      this.log(`⚠️ Scan stopped early after reaching --max=${maxMatches}`);
    }
  }
}
