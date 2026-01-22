import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  createDefaultSwiftrc,
  findProjectRoot,
  getDefaultConfig,
  getSwiftrcBackupFilename,
  validateConfig,
  loadSwiftrcConfig,
  getConfig
} from "../../../src/common/config/swiftrc-config.js";

describe("common/config/swiftrc-config", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "swiftrc-test-"));
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("findProjectRoot", () => {
    it("should find project root when .swiftrc exists", () => {
      const subDir = path.join(tempDir, "src", "nested");
      fs.mkdirSync(subDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, ".swiftrc"), "formatting: []");

      const result = findProjectRoot(subDir);
      expect(result).to.equal(tempDir);
    });

    it("should find project root when .git exists", () => {
      const subDir = path.join(tempDir, "src", "nested");
      fs.mkdirSync(subDir, { recursive: true });
      fs.mkdirSync(path.join(tempDir, ".git"));

      const result = findProjectRoot(subDir);
      expect(result).to.equal(tempDir);
    });

    it("should find project root when package.json exists", () => {
      const subDir = path.join(tempDir, "src", "nested");
      fs.mkdirSync(subDir, { recursive: true });
      fs.writeFileSync(path.join(tempDir, "package.json"), "{}");

      const result = findProjectRoot(subDir);
      expect(result).to.equal(tempDir);
    });

    it("should prioritize .swiftrc over .git", () => {
      const nestedDir = path.join(tempDir, "nested");
      fs.mkdirSync(nestedDir);
      fs.mkdirSync(path.join(tempDir, ".git"));
      fs.writeFileSync(path.join(nestedDir, ".swiftrc"), "formatting: []");

      const result = findProjectRoot(nestedDir);
      expect(result).to.equal(nestedDir);
    });

    it("should return start path if no project root indicators found", () => {
      const result = findProjectRoot(tempDir);
      expect(result).to.equal(tempDir);
    });
  });

  describe("getDefaultConfig", () => {
    it("should return a complete config object", () => {
      const config = getDefaultConfig();

      expect(config).to.have.property("formatting").that.is.an("array");
      expect(config).to.have.property("cleanup").that.is.an("object");
      expect(config).to.have.property("alwaysExcluded").that.is.an("array");
    });

    it("should include known formatting rules", () => {
      const config = getDefaultConfig();

      const fieldRule = config.formatting.find((r) => r.filePattern === "field-meta.xml");
      expect(fieldRule).to.exist;
      expect(fieldRule?.elementPriority).to.include("fullName");
    });

    it("should include alwaysExcluded types", () => {
      const config = getDefaultConfig();

      expect(config.alwaysExcluded).to.include("flow-meta.xml");
    });

    it("should include cleanup rules", () => {
      const config = getDefaultConfig();

      expect(config.cleanup).to.have.property("field-meta.xml");
      expect(config.cleanup["field-meta.xml"]).to.be.an("array");
    });
  });

  describe("validateConfig", () => {
    it("should throw for null config", () => {
      expect(() => validateConfig(null)).to.throw(/Configuration file is empty/);
    });

    it("should throw for undefined config", () => {
      expect(() => validateConfig(undefined)).to.throw(/Configuration file is empty/);
    });

    it("should throw for non-object config", () => {
      expect(() => validateConfig("string")).to.throw(/must be a YAML object/);
      expect(() => validateConfig(123)).to.throw(/must be a YAML object/);
    });

    it("should throw when formatting section is missing", () => {
      expect(() => validateConfig({})).to.throw(/'formatting' section is required/);
    });

    it("should validate formatting structure", () => {
      expect(() =>
        validateConfig({
          formatting: "not-an-array"
        })
      ).to.throw(/formatting.*must be an array/);

      expect(() =>
        validateConfig({
          formatting: [{ noFilePattern: true }]
        })
      ).to.throw(/filePattern is required/);
    });

    it("should accept valid formatting rules", () => {
      const result = validateConfig({
        formatting: [
          { filePattern: "test-meta.xml", elementPriority: ["fullName"] },
          { filePattern: "other-meta.xml", unsortedArrays: ["items"] }
        ]
      });

      expect(result.formatting).to.have.length(2);
      expect(result.formatting[0].filePattern).to.equal("test-meta.xml");
      expect(result.formatting[0].elementPriority).to.deep.equal(["fullName"]);
    });

    it("should accept sortedByElements in formatting rules", () => {
      const result = validateConfig({
        formatting: [{ filePattern: "test-meta.xml", sortedByElements: ["field", "name"] }]
      });

      expect(result.formatting[0].sortedByElements).to.deep.equal(["field", "name"]);
    });

    it("should accept condensedElements in formatting rules", () => {
      const result = validateConfig({
        formatting: [{ filePattern: "permissionset-meta.xml", condensedElements: ["fieldPermissions"] }]
      });

      expect(result.formatting[0].condensedElements).to.deep.equal(["fieldPermissions"]);
    });

    it("should validate cleanup structure", () => {
      expect(() =>
        validateConfig({
          formatting: [{ filePattern: "test-meta.xml" }],
          cleanup: "not-an-object"
        })
      ).to.throw(/cleanup.*must be an object/);

      expect(() =>
        validateConfig({
          formatting: [{ filePattern: "test-meta.xml" }],
          cleanup: {
            "test-meta.xml": "not-an-array"
          }
        })
      ).to.throw(/must be an array of cleanup rule/);

      expect(() =>
        validateConfig({
          formatting: [{ filePattern: "test-meta.xml" }],
          cleanup: {
            "test-meta.xml": [{ noElementName: true }]
          }
        })
      ).to.throw(/elementName is required/);
    });

    it("should accept valid cleanup rules", () => {
      const result = validateConfig({
        formatting: [{ filePattern: "test-meta.xml" }],
        cleanup: {
          "test-meta.xml": [
            {
              elementName: "testElement",
              removeValues: ["false", ""],
              conditions: [{ elementName: "type", values: ["Test"] }]
            }
          ]
        }
      });

      expect(result.cleanup["test-meta.xml"]).to.have.length(1);
      expect(result.cleanup["test-meta.xml"][0].elementName).to.equal("testElement");
    });

    it("should validate alwaysExcluded structure", () => {
      expect(() =>
        validateConfig({
          formatting: [{ filePattern: "test-meta.xml" }],
          alwaysExcluded: "not-an-array"
        })
      ).to.throw(/alwaysExcluded.*must be an array/);
    });

    it("should accept valid alwaysExcluded", () => {
      const result = validateConfig({
        formatting: [{ filePattern: "test-meta.xml" }],
        alwaysExcluded: ["flow-meta.xml", "custom-meta.xml"]
      });

      expect(result.alwaysExcluded).to.deep.equal(["flow-meta.xml", "custom-meta.xml"]);
    });

    it("should throw when formatting pattern conflicts with alwaysExcluded", () => {
      expect(() =>
        validateConfig({
          formatting: [{ filePattern: "flow-meta.xml" }],
          alwaysExcluded: ["flow-meta.xml"]
        })
      ).to.throw(/Configuration conflict.*formatting patterns are also in alwaysExcluded/);
    });
  });

  describe("loadSwiftrcConfig", () => {
    it("should return null when .swiftrc does not exist", () => {
      const result = loadSwiftrcConfig(tempDir);
      expect(result).to.be.null;
    });

    it("should load and parse valid config", () => {
      const configContent = `
formatting:
  - filePattern: "test-meta.xml"
    elementPriority:
      - id
`;
      fs.writeFileSync(path.join(tempDir, ".swiftrc"), configContent);

      const result = loadSwiftrcConfig(tempDir);
      expect(result?.formatting).to.have.length(1);
      expect(result?.formatting[0].filePattern).to.equal("test-meta.xml");
      expect(result?.formatting[0].elementPriority).to.deep.equal(["id"]);
    });

    it("should throw for invalid YAML syntax", () => {
      fs.writeFileSync(path.join(tempDir, ".swiftrc"), "invalid: yaml: content: [");

      expect(() => loadSwiftrcConfig(tempDir)).to.throw(/Invalid YAML syntax/);
    });
  });

  describe("createDefaultSwiftrc", () => {
    it("should create .swiftrc with default configuration", () => {
      const result = createDefaultSwiftrc(tempDir, { date: new Date(2026, 0, 22) });
      const configPath = path.join(tempDir, ".swiftrc");

      expect(result.configPath).to.equal(configPath);
      expect(fs.existsSync(configPath)).to.equal(true);

      const content = fs.readFileSync(configPath, "utf8");
      expect(content).to.include("formatting:");
      expect(content).to.include("alwaysExcluded:");
    });

    it("should backup existing .swiftrc before overwriting", () => {
      const originalContent = "formatting: []\n";
      fs.writeFileSync(path.join(tempDir, ".swiftrc"), originalContent);

      const date = new Date(2026, 0, 22);
      const result = createDefaultSwiftrc(tempDir, { date });
      const backupName = getSwiftrcBackupFilename(date);
      const backupPath = path.join(tempDir, backupName);

      expect(result.backupPath).to.equal(backupPath);
      expect(fs.existsSync(backupPath)).to.equal(true);
      expect(fs.readFileSync(backupPath, "utf8")).to.equal(originalContent);
    });

    it("should throw when backup already exists and leave .swiftrc unchanged", () => {
      const originalContent = "formatting: []\n";
      fs.writeFileSync(path.join(tempDir, ".swiftrc"), originalContent);

      const date = new Date(2026, 0, 22);
      const backupName = getSwiftrcBackupFilename(date);
      fs.writeFileSync(path.join(tempDir, backupName), "existing backup");

      expect(() => createDefaultSwiftrc(tempDir, { date })).to.throw(/Backup already exists/);
      expect(fs.readFileSync(path.join(tempDir, ".swiftrc"), "utf8")).to.equal(originalContent);
    });
  });

  describe("getConfig", () => {
    it("should use defaults when no config exists (without creating file)", () => {
      const result = getConfig(tempDir, { silent: true });

      // File should NOT be created
      expect(fs.existsSync(path.join(tempDir, ".swiftrc"))).to.be.false;
      expect(result).to.have.property("formatting");
    });

    it("should use config as-is without merging", () => {
      const configContent = `
formatting:
  - filePattern: "custom-meta.xml"
`;
      fs.writeFileSync(path.join(tempDir, ".swiftrc"), configContent);

      const result = getConfig(tempDir, { silent: true });

      // User config should be used exactly as-is
      expect(result.formatting).to.have.length(1);
      expect(result.formatting[0].filePattern).to.equal("custom-meta.xml");
      // cleanup and alwaysExcluded should be empty since not in user config
      expect(result.cleanup).to.deep.equal({});
      expect(result.alwaysExcluded).to.deep.equal([]);
    });

    it("should find config from nested directory", () => {
      const nestedDir = path.join(tempDir, "src", "components");
      fs.mkdirSync(nestedDir, { recursive: true });

      const configContent = `
formatting:
  - filePattern: "nested-meta.xml"
`;
      fs.writeFileSync(path.join(tempDir, ".swiftrc"), configContent);

      const result = getConfig(nestedDir, { silent: true });
      expect(result.formatting[0].filePattern).to.equal("nested-meta.xml");
    });

    it("should return defaults when no config exists", () => {
      const defaults = getDefaultConfig();
      const result = getConfig(tempDir, { silent: true });

      // File should NOT be created
      expect(fs.existsSync(path.join(tempDir, ".swiftrc"))).to.be.false;
      expect(result.formatting).to.deep.equal(defaults.formatting);
      expect(result.alwaysExcluded).to.deep.equal(defaults.alwaysExcluded);
    });

    it("should load config from configPath when specified", () => {
      const customConfigPath = path.join(tempDir, "custom-config.yaml");
      const configContent = `
formatting:
  - filePattern: "custom-meta.xml"
    elementPriority:
      - fullName
`;
      fs.writeFileSync(customConfigPath, configContent);

      const result = getConfig(tempDir, { configPath: customConfigPath });

      expect(result.formatting).to.have.length(1);
      expect(result.formatting[0].filePattern).to.equal("custom-meta.xml");
    });

    it("should throw when configPath file does not exist", () => {
      const nonExistentPath = path.join(tempDir, "non-existent.yaml");
      expect(() => getConfig(tempDir, { configPath: nonExistentPath })).to.throw(/Configuration file not found/);
    });
  });
});
