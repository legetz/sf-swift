import * as path from "path";
import { SfCommand } from "@salesforce/sf-plugins-core";
import { Messages } from "@salesforce/core";
import { createDefaultSwiftrc } from "../../../common/config/swiftrc-config.js";

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages("sf-swift", "config.init");

export default class ConfigInit extends SfCommand<void> {
  public static readonly description = messages.getMessage("description");
  public static readonly examples = messages.getMessages("examples");

  public async run(): Promise<void> {
    const targetDir = process.cwd();

    try {
      const { configPath, backupPath } = createDefaultSwiftrc(targetDir);

      if (backupPath) {
        this.log(messages.getMessage("output.backup.created", [path.basename(backupPath)]));
      }

      this.log(messages.getMessage("output.created", [path.basename(configPath)]));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(message, { exit: 1 });
    }
  }
}
