import { expect } from "chai";
import { getFormattingRule, resetFormattingRules, setFormattingRules } from "../../../src/common/xml/sorting-rules.js";

describe("common/xml/sorting-rules", () => {
  afterEach(() => {
    resetFormattingRules();
  });

  describe("getFormattingRule", () => {
    it("matches patterns using *.PATTERN semantics", () => {
      const pageRule = getFormattingRule("force-app/main/default/pages/Home.page-meta.xml");

      expect(pageRule).to.not.be.undefined;
      expect(pageRule?.filePattern).to.equal("page-meta.xml");
    });

    it("does not match flexipage files for page-meta.xml pattern", () => {
      const rule = getFormattingRule("force-app/main/default/flexipages/Record.flexipage-meta.xml");

      expect(rule).to.be.undefined;
    });

    it("still matches exact metadata file names", () => {
      const rule = getFormattingRule("force-app/main/default/settings/FileUploadAndDownloadSecurity.settings-meta.xml");

      expect(rule).to.not.be.undefined;
      expect(rule?.filePattern).to.equal("FileUploadAndDownloadSecurity.settings-meta.xml");
    });

    it("uses default explicitClosingElements when config omits that field", () => {
      setFormattingRules([
        {
          filePattern: "listView-meta.xml",
          elementPriority: ["fullName"]
        }
      ]);

      const rule = getFormattingRule("force-app/main/default/objects/Test__c/listViews/Recent.listView-meta.xml");

      expect(rule?.explicitClosingElements).to.deep.equal(["sharedTo.allInternalUsers"]);
    });

    it("does not use default explicitClosingElements when config sets an empty array", () => {
      setFormattingRules([
        {
          filePattern: "listView-meta.xml",
          explicitClosingElements: []
        }
      ]);

      const rule = getFormattingRule("force-app/main/default/objects/Test__c/listViews/Recent.listView-meta.xml");

      expect(rule?.explicitClosingElements).to.deep.equal([]);
    });
  });
});
