import { expect } from "chai";
import {
  prefixXmlEntities,
  restoreXmlEntities,
  extractRootElementName,
  parseMetadataXml,
  buildMetadataXml,
  condenseElement
} from "../../../src/common/xml/xml-helpers.js";
import { setFormattingRules, resetFormattingRules } from "../../../src/common/xml/sorting-rules.js";

describe("common/xml/xml-helpers", () => {
  describe("prefixXmlEntities", () => {
    it("should replace XML entities with marker tokens", () => {
      const input = "Fish &amp; Chips &lt;Menu&gt; It&apos;s &quot;quoted&quot;";
      const result = prefixXmlEntities(input);

      expect(result).to.include("___ENTITY_MARKER___amp;");
      expect(result).to.include("___ENTITY_MARKER___lt;");
      expect(result).to.include("___ENTITY_MARKER___gt;");
      expect(result).to.include("___ENTITY_MARKER___apos;");
      expect(result).to.include("___ENTITY_MARKER___quot;");
    });

    it("should be reversible with restoreXmlEntities", () => {
      const input = "Lao People&apos;s Democratic Republic &amp; Friends";

      const prefixed = prefixXmlEntities(input);
      const restored = restoreXmlEntities(prefixed);

      expect(restored).to.equal(input);
    });
  });

  describe("restoreXmlEntities", () => {
    it("should leave strings without markers untouched", () => {
      const input = "Plain text without entities";
      const restored = restoreXmlEntities(input);

      expect(restored).to.equal(input);
    });
  });

  describe("extractRootElementName", () => {
    it("should extract the first element name ignoring XML declaration and whitespace", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n   <!-- comment -->\n   <SecuritySettings>`;
      const root = extractRootElementName(xml);

      expect(root).to.equal("SecuritySettings");
    });

    it('should fall back to "root" when no element is found', () => {
      const xml = "   <!-- only comments -->";
      const root = extractRootElementName(xml);

      expect(root).to.equal("root");
    });
  });

  describe("parseMetadataXml", () => {
    it("should parse XML and preserve array structures", async () => {
      const xml = "<Test><item>One</item><item>Two</item><single>Value</single></Test>";
      const prefixed = prefixXmlEntities(xml);

      const parsed = await parseMetadataXml(prefixed);

      expect(parsed.item).to.be.an("array").with.lengthOf(2);
      expect(parsed.item[0]).to.equal("One");
      expect(parsed.single).to.be.an("array").with.lengthOf(1);
      expect(parsed.single[0]).to.equal("Value");
    });

    it("should expose attributes under the $ key", async () => {
      const xml = '<Test xmlns="http://example.com"><child attr="1">value</child></Test>';
      const prefixed = prefixXmlEntities(xml);

      const parsed = await parseMetadataXml(prefixed);

      expect(parsed.$).to.deep.equal({ xmlns: "http://example.com" });
      expect(parsed.child).to.be.an("array").with.lengthOf(1);
      expect(parsed.child[0].attr).to.be.undefined;
      expect(parsed.child[0].$).to.deep.equal({ attr: "1" });
      expect(parsed.child[0]._).to.equal("value");
    });
  });

  describe("buildMetadataXml", () => {
    it("should rebuild XML using the original root element", async () => {
      const original = '<?xml version="1.0" encoding="UTF-8"?><Test><value>One</value><value>Two</value></Test>';
      const prefixed = prefixXmlEntities(original);
      const parsed = await parseMetadataXml(prefixed);

      const rebuilt = buildMetadataXml(parsed, original);

      expect(rebuilt).to.contain("<Test>");
      expect(rebuilt).to.contain("    <value>One</value>");
      expect(rebuilt).to.contain("    <value>Two</value>");
      expect(rebuilt.trim().endsWith("</Test>")).to.be.true;
      expect(rebuilt.endsWith("\n")).to.be.true;
    });

    it("should convert self-closing tags to explicit open/close tags", async () => {
      const original = "<Test><selfClosing/></Test>";
      const prefixed = prefixXmlEntities(original);
      const parsed = await parseMetadataXml(prefixed);

      const rebuilt = buildMetadataXml(parsed, original);

      expect(rebuilt).to.contain("<selfClosing></selfClosing>");
    });

    it("should preserve XML entities after round-trip", async () => {
      const original = "<Test><quote>It&apos;s great &amp; awesome</quote></Test>";
      const prefixed = prefixXmlEntities(original);
      const parsed = await parseMetadataXml(prefixed);

      const rebuilt = buildMetadataXml(parsed, original);

      expect(rebuilt).to.contain("&apos;");
      expect(rebuilt).to.contain("&amp;");
      expect(rebuilt).to.not.include("___ENTITY_MARKER___");
    });

    it("should apply condensed format for specified elements in permission sets", async () => {
      // Set up formatting rules with condensedElements
      setFormattingRules([
        {
          filePattern: "permissionset-meta.xml",
          condensedElements: ["fieldPermissions", "objectPermissions"]
        }
      ]);

      const original = `<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet>
    <fieldPermissions>
        <editable>true</editable>
        <field>Account.Name</field>
        <readable>true</readable>
    </fieldPermissions>
    <label>Test Permission Set</label>
</PermissionSet>`;

      const prefixed = prefixXmlEntities(original);
      const parsed = await parseMetadataXml(prefixed);

      const rebuilt = buildMetadataXml(parsed, original, "Test.permissionset-meta.xml");

      // Verify condensed format - fieldPermissions should be on a single line
      expect(rebuilt).to.contain("<fieldPermissions><editable>true</editable><field>Account.Name</field><readable>true</readable></fieldPermissions>");
      // Label should still be on its own line
      expect(rebuilt).to.contain("    <label>Test Permission Set</label>");

      // Reset formatting rules
      resetFormattingRules();
    });

    it("should not apply condensed format when filePath is not provided", async () => {
      const original = `<?xml version="1.0" encoding="UTF-8"?>
<PermissionSet>
    <fieldPermissions>
        <editable>true</editable>
        <field>Account.Name</field>
    </fieldPermissions>
</PermissionSet>`;

      const prefixed = prefixXmlEntities(original);
      const parsed = await parseMetadataXml(prefixed);

      const rebuilt = buildMetadataXml(parsed, original);

      // Without filePath, condensed format should not be applied
      expect(rebuilt).to.contain("    <fieldPermissions>");
      expect(rebuilt).to.contain("        <editable>true</editable>");
    });
  });

  describe("condenseElement", () => {
    it("should condense multi-line element to single line", () => {
      const input = `<root>
    <fieldPermissions>
        <editable>true</editable>
        <field>Account.Name</field>
        <readable>true</readable>
    </fieldPermissions>
</root>`;

      const result = condenseElement(input, "fieldPermissions");

      expect(result).to.contain("<fieldPermissions><editable>true</editable><field>Account.Name</field><readable>true</readable></fieldPermissions>");
    });

    it("should condense multiple elements of the same type", () => {
      const input = `<root>
    <fieldPermissions>
        <editable>true</editable>
        <field>Account.Name</field>
    </fieldPermissions>
    <fieldPermissions>
        <editable>false</editable>
        <field>Account.Description</field>
    </fieldPermissions>
</root>`;

      const result = condenseElement(input, "fieldPermissions");

      expect(result).to.contain("<fieldPermissions><editable>true</editable><field>Account.Name</field></fieldPermissions>");
      expect(result).to.contain("<fieldPermissions><editable>false</editable><field>Account.Description</field></fieldPermissions>");
    });

    it("should leave non-matching elements unchanged", () => {
      const input = `<root>
    <label>Test Label</label>
    <description>Test Description</description>
</root>`;

      const result = condenseElement(input, "fieldPermissions");

      expect(result).to.equal(input);
    });

    it("should handle objectPermissions condensation", () => {
      const input = `<root>
    <objectPermissions>
        <allowCreate>false</allowCreate>
        <allowDelete>false</allowDelete>
        <allowEdit>true</allowEdit>
        <allowRead>true</allowRead>
        <modifyAllRecords>false</modifyAllRecords>
        <object>Allocation_Authorization__c</object>
        <viewAllRecords>false</viewAllRecords>
    </objectPermissions>
</root>`;

      const result = condenseElement(input, "objectPermissions");

      expect(result).to.contain("<objectPermissions><allowCreate>false</allowCreate><allowDelete>false</allowDelete><allowEdit>true</allowEdit><allowRead>true</allowRead><modifyAllRecords>false</modifyAllRecords><object>Allocation_Authorization__c</object><viewAllRecords>false</viewAllRecords></objectPermissions>");
    });
  });
});
