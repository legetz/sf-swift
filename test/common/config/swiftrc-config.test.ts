import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  findProjectRoot,
  getDefaultConfig,
  validateConfig,
  mergeWithDefaults,
  generateDefaultConfig,
  writeDefaultConfig,
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
      fs.writeFileSync(path.join(tempDir, ".swiftrc"), "sortingRules: []");

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
      fs.writeFileSync(path.join(nestedDir, ".swiftrc"), "sortingRules: []");

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

      expect(config).to.have.property("sortingRules").that.is.an("array");
      expect(config).to.have.property("metadataTypes").that.is.an("object");
      expect(config).to.have.property("cleanupRules").that.is.an("object");

      expect(config.metadataTypes).to.have.property("allowed").that.is.an("array");
      expect(config.metadataTypes).to.have.property("defaultExclusions").that.is.an("array");
      expect(config.metadataTypes).to.have.property("alwaysExcluded").that.is.an("array");
    });

    it("should include known metadata types", () => {
      const config = getDefaultConfig();

      expect(config.metadataTypes.allowed).to.include("cls-meta.xml");
      expect(config.metadataTypes.allowed).to.include("field-meta.xml");
      expect(config.metadataTypes.alwaysExcluded).to.include("flow-meta.xml");
    });

    it("should include known sorting rules", () => {
      const config = getDefaultConfig();
      const fieldRule = config.sortingRules.find((r) => r.filePattern === "field-meta.xml");

      expect(fieldRule).to.exist;
      expect(fieldRule?.priorityKeys).to.include("fullName");
    });
  });

  describe("validateConfig", () => {
    it("should return empty object for null or undefined", () => {
      expect(validateConfig(null)).to.deep.equal({});
      expect(validateConfig(undefined)).to.deep.equal({});
    });

    it("should throw for non-object config", () => {
      expect(() => validateConfig("string")).to.throw(/must be a YAML object/);
      expect(() => validateConfig(123)).to.throw(/must be a YAML object/);
    });

    it("should validate sortingRules structure", () => {
      expect(() =>
        validateConfig({
          sortingRules: "not-an-array"
        })
      ).to.throw(/sortingRules.*must be an array/);

      expect(() =>
        validateConfig({
          sortingRules: [{ noFilePattern: true }]
        })
      ).to.throw(/filePattern is required/);
    });

    it("should accept valid sortingRules", () => {
      const result = validateConfig({
        sortingRules: [
          { filePattern: "test-meta.xml", priorityKeys: ["fullName"] },
          { filePattern: "other-meta.xml", unsortedArrays: ["items"] }
        ]
      });

      expect(result.sortingRules).to.have.length(2);
      expect(result.sortingRules?.[0].filePattern).to.equal("test-meta.xml");
    });

    it("should validate metadataTypes structure", () => {
      expect(() =>
        validateConfig({
          metadataTypes: "not-an-object"
        })
      ).to.throw(/metadataTypes.*must be an object/);

      expect(() =>
        validateConfig({
          metadataTypes: { allowed: "not-an-array" }
        })
      ).to.throw(/allowed must be an array/);
    });

    it("should accept valid metadataTypes", () => {
      const result = validateConfig({
        metadataTypes: {
          allowed: ["test-meta.xml"],
          defaultExclusions: ["skip-meta.xml"],
          alwaysExcluded: ["never-meta.xml"]
        }
      });

      expect(result.metadataTypes?.allowed).to.deep.equal(["test-meta.xml"]);
    });

    it("should validate cleanupRules structure", () => {
      expect(() =>
        validateConfig({
          cleanupRules: "not-an-object"
        })
      ).to.throw(/cleanupRules.*must be an object/);

      expect(() =>
        validateConfig({
          cleanupRules: {
            "test-meta.xml": "not-an-array"
          }
        })
      ).to.throw(/must be an array of cleanup rule/);

      expect(() =>
        validateConfig({
          cleanupRules: {
            "test-meta.xml": [{ noElementName: true }]
          }
        })
      ).to.throw(/elementName is required/);
    });

    it("should accept valid cleanupRules", () => {
      const result = validateConfig({
        cleanupRules: {
          "test-meta.xml": [
            {
              elementName: "testElement",
              removeValues: ["false", ""],
              conditions: [{ elementName: "type", values: ["Test"] }]
            }
          ]
        }
      });

      expect(result.cleanupRules?.["test-meta.xml"]).to.have.length(1);
      expect(result.cleanupRules?.["test-meta.xml"][0].elementName).to.equal("testElement");
    });
  });

  describe("mergeWithDefaults", () => {
    it("should return defaults when user config is empty", () => {
      const defaults = getDefaultConfig();
      const result = mergeWithDefaults({});

      expect(result.sortingRules).to.deep.equal(defaults.sortingRules);
      expect(result.metadataTypes).to.deep.equal(defaults.metadataTypes);
    });

    it("should override sortingRules entirely when provided", () => {
      const userRules = [{ filePattern: "custom-meta.xml", priorityKeys: ["id"] }];
      const result = mergeWithDefaults({ sortingRules: userRules });

      expect(result.sortingRules).to.deep.equal(userRules);
    });

    it("should override metadataTypes.allowed when provided", () => {
      const result = mergeWithDefaults({
        metadataTypes: { allowed: ["custom-meta.xml"], defaultExclusions: [], alwaysExcluded: [] }
      });

      expect(result.metadataTypes.allowed).to.deep.equal(["custom-meta.xml"]);
    });

    it("should deep merge cleanupRules", () => {
      const result = mergeWithDefaults({
        cleanupRules: {
          "custom-meta.xml": [{ elementName: "test", removeValues: ["false"] }]
        }
      });

      // Should have both default rules and custom rules
      expect(result.cleanupRules).to.have.property("field-meta.xml");
      expect(result.cleanupRules).to.have.property("custom-meta.xml");
    });
  });

  describe("generateDefaultConfig", () => {
    it("should generate valid YAML content", () => {
      const yaml = generateDefaultConfig();

      expect(yaml).to.include("sortingRules:");
      expect(yaml).to.include("metadataTypes:");
      expect(yaml).to.include("cleanupRules:");
      expect(yaml).to.include("field-meta.xml");
    });

    it("should include helpful comments", () => {
      const yaml = generateDefaultConfig();

      expect(yaml).to.include("# .swiftrc");
      expect(yaml).to.include("# Sorting rules");
    });
  });

  describe("writeDefaultConfig", () => {
    it("should create .swiftrc file", () => {
      const configPath = writeDefaultConfig(tempDir);

      expect(fs.existsSync(configPath)).to.be.true;
      expect(configPath).to.equal(path.join(tempDir, ".swiftrc"));
    });

    it("should write parseable YAML content", () => {
      writeDefaultConfig(tempDir);
      const loaded = loadSwiftrcConfig(tempDir);

      expect(loaded).to.not.be.null;
      expect(loaded).to.have.property("sortingRules");
    });
  });

  describe("loadSwiftrcConfig", () => {
    it("should return null when .swiftrc does not exist", () => {
      const result = loadSwiftrcConfig(tempDir);
      expect(result).to.be.null;
    });

    it("should load and parse valid config", () => {
      const configContent = `
sortingRules:
  - filePattern: "test-meta.xml"
    priorityKeys:
      - id
`;
      fs.writeFileSync(path.join(tempDir, ".swiftrc"), configContent);

      const result = loadSwiftrcConfig(tempDir);
      expect(result?.sortingRules).to.have.length(1);
      expect(result?.sortingRules?.[0].filePattern).to.equal("test-meta.xml");
    });

    it("should throw for invalid YAML syntax", () => {
      fs.writeFileSync(path.join(tempDir, ".swiftrc"), "invalid: yaml: content: [");

      expect(() => loadSwiftrcConfig(tempDir)).to.throw(/Invalid YAML syntax/);
    });
  });

  describe("getConfig", () => {
    it("should return defaults when no config exists", () => {
      const result = getConfig(tempDir, { autoGenerate: false });
      const defaults = getDefaultConfig();

      expect(result.sortingRules).to.deep.equal(defaults.sortingRules);
    });

    it("should auto-generate config when autoGenerate is true", () => {
      getConfig(tempDir, { autoGenerate: true, silent: true });

      expect(fs.existsSync(path.join(tempDir, ".swiftrc"))).to.be.true;
    });

    it("should not auto-generate when autoGenerate is false", () => {
      getConfig(tempDir, { autoGenerate: false });

      expect(fs.existsSync(path.join(tempDir, ".swiftrc"))).to.be.false;
    });

    it("should merge user config with defaults", () => {
      const configContent = `
metadataTypes:
  allowed:
    - custom-meta.xml
`;
      fs.writeFileSync(path.join(tempDir, ".swiftrc"), configContent);

      const result = getConfig(tempDir);

      // User config should override allowed list
      expect(result.metadataTypes.allowed).to.deep.equal(["custom-meta.xml"]);
      // But defaults should still be used for other fields
      expect(result.metadataTypes.alwaysExcluded).to.include("flow-meta.xml");
    });

    it("should find config from nested directory", () => {
      const nestedDir = path.join(tempDir, "src", "components");
      fs.mkdirSync(nestedDir, { recursive: true });

      const configContent = `
sortingRules:
  - filePattern: "nested-meta.xml"
`;
      fs.writeFileSync(path.join(tempDir, ".swiftrc"), configContent);

      const result = getConfig(nestedDir);
      expect(result.sortingRules[0].filePattern).to.equal("nested-meta.xml");
    });
  });
});
