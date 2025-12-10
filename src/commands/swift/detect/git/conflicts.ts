import { SfCommand, Flags } from "@salesforce/sf-plugins-core";
import { Messages } from "@salesforce/core";
import { Args } from "@oclif/core";
import { ensureDirectory } from "../../../../common/helper/filesystem.js";
import { logFileScanSummary, scanForFiles } from "../../../../common/detect/file-detector.js";

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages("sf-swift", "detect.git.conflicts");

export type ConflictResult = {
  count: number;
  conflictFiles: string[];
};

export default class DetectGitConflicts extends SfCommand<ConflictResult> {
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
    })
  };

  public async run(): Promise<ConflictResult> {
    const startTime = Date.now();
    const { args, flags } = await this.parse(DetectGitConflicts);

    // Priority: path argument > targetDir flag > current directory
    const targetDir = args.path || flags["target-dir"] || process.cwd();

    ensureDirectory(targetDir, this.error.bind(this));

    this.log(`🔍 Scan GIT conflict (.rej) files in ${targetDir}`);

    const scanResult = scanForFiles({ targetDir, types: [".rej"] });
    const elapsedTime = Date.now() - startTime;

    const result: ConflictResult = {
      count: scanResult.count,
      conflictFiles: scanResult.files
    };

    logFileScanSummary({
      log: this.log.bind(this),
      result: scanResult,
      targetDir,
      elapsedTimeMs: elapsedTime,
      matchLabel: "📊 Conflict files found",
      listHeading: "❌ Conflict files detected:",
      emptyMessage: "✅ No conflict files found - repository is clean!"
    });

    if (result.count > 0 && !flags["json"]) {
      this.error(`❌ Found ${result.count} Git conflict (.rej) files. Please resolve conflicts before proceeding.`, {
        exit: 1
      });
    }

    return result;
  }
}
