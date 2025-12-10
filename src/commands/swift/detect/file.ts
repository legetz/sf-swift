import { SfCommand, Flags } from "@salesforce/sf-plugins-core";
import { Messages } from "@salesforce/core";
import { Args } from "@oclif/core";
import { ensureDirectory } from "../../../common/helper/filesystem.js";
import { logFileScanSummary, scanForFiles } from "../../../common/detect/file-detector.js";

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

    const scanResult = scanForFiles({ targetDir, types: normalizedTypes, maxMatches });
    const elapsedTime = Date.now() - startTime;

    const result: FileDetectionResult = {
      count: scanResult.count,
      files: scanResult.files,
      types: scanResult.types
    };

    logFileScanSummary({
      log: this.log.bind(this),
      result: scanResult,
      targetDir,
      elapsedTimeMs: elapsedTime,
      matchLabel: "📊 Matching files found",
      listHeading: "❌ Matching files detected:",
      emptyMessage: "✅ No matching files found - directory is clean!",
      typesLabel: "🎯 File types"
    });

    if (result.count > 0 && !flags.json) {
      this.error(messages.getMessage("errors.matches.found", [result.count]), {
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
}
