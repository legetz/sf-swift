/**
 * Shared XML helper utilities for metadata processing
 */

import * as xml2js from "xml2js";
import { getFormattingRule } from "./sorting-rules.js";

export interface XmlObject {
  [key: string]: any;
}

const ENTITY_MARKER = "___ENTITY_MARKER___";
const EXPLICIT_CLOSE_ATTR = "__sfSwiftExplicitClose";

function splitPath(pathValue: string): string[] {
  return pathValue
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
}

function pathMatches(patternSegments: string[], actualSegments: string[]): boolean {
  if (patternSegments.length !== actualSegments.length) {
    return false;
  }

  for (let index = 0; index < patternSegments.length; index++) {
    const pattern = patternSegments[index];
    const actual = actualSegments[index];
    if (pattern !== "*" && pattern !== actual) {
      return false;
    }
  }

  return true;
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulValue(item));
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const textValue = obj._;
    if (typeof textValue === "string" && textValue.trim().length > 0) {
      return true;
    }

    const childKeys = Object.keys(obj).filter((key) => key !== "$" && key !== "_");
    return childKeys.some((key) => hasMeaningfulValue(obj[key]));
  }

  return true;
}

function markValueAsExplicitClosing(value: unknown): unknown {
  if (value === null || value === undefined || value === "") {
    return { $: { [EXPLICIT_CLOSE_ATTR]: "true" } };
  }

  if (Array.isArray(value)) {
    return value.map((item) => (hasMeaningfulValue(item) ? item : { $: { [EXPLICIT_CLOSE_ATTR]: "true" } }));
  }

  if (typeof value === "object") {
    if (hasMeaningfulValue(value)) {
      return value;
    }

    const obj = value as Record<string, unknown>;
    const attrs = typeof obj.$ === "object" && obj.$ !== null ? { ...(obj.$ as Record<string, string>) } : {};
    attrs[EXPLICIT_CLOSE_ATTR] = "true";
    return {
      ...obj,
      $: attrs
    };
  }

  return value;
}

function applyExplicitClosingElements(
  node: unknown,
  pathSegments: string[],
  explicitPathPatterns: string[][]
): unknown {
  if (node === null || node === undefined) {
    return node;
  }

  if (Array.isArray(node)) {
    const nextPath = node.length > 1 ? [...pathSegments, "*"] : pathSegments;
    return node.map((item) => applyExplicitClosingElements(item, nextPath, explicitPathPatterns));
  }

  if (typeof node !== "object") {
    return node;
  }

  const obj = node as Record<string, unknown>;
  const result: Record<string, unknown> = { ...obj };

  for (const [key, value] of Object.entries(obj)) {
    if (key === "$" || key === "_") {
      continue;
    }

    const currentPath = [...pathSegments, key];
    const shouldMarkExplicitClosing = explicitPathPatterns.some((pattern) => pathMatches(pattern, currentPath));
    const processedValue = applyExplicitClosingElements(value, currentPath, explicitPathPatterns);
    result[key] = shouldMarkExplicitClosing ? markValueAsExplicitClosing(processedValue) : processedValue;
  }

  return result;
}

function enforceExplicitClosingTags(xmlString: string): string {
  const explicitCloseAttrPattern = new RegExp(`\\s${EXPLICIT_CLOSE_ATTR}="true"`, "g");
  const selfClosingPattern = new RegExp(`<(\\w[\\w:-]*)([^>]*)\\/>`, "g");

  return xmlString.replace(selfClosingPattern, (match, tagName, attrs) => {
    if (!String(attrs).includes(`${EXPLICIT_CLOSE_ATTR}="true"`)) {
      return match;
    }

    const cleanedAttrs = String(attrs).replace(explicitCloseAttrPattern, "");
    return `<${tagName}${cleanedAttrs}></${tagName}>`;
  });
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Prefix XML entities with markers before parsing to preserve them
 */
export function prefixXmlEntities(xmlString: string): string {
  return xmlString
    .replace(/&apos;/g, `${ENTITY_MARKER}apos;`)
    .replace(/&quot;/g, `${ENTITY_MARKER}quot;`)
    .replace(/&amp;/g, `${ENTITY_MARKER}amp;`)
    .replace(/&lt;/g, `${ENTITY_MARKER}lt;`)
    .replace(/&gt;/g, `${ENTITY_MARKER}gt;`);
}

/**
 * Restore XML entity encoding for special characters
 */
export function restoreXmlEntities(xmlString: string): string {
  return xmlString
    .replace(new RegExp(`${ENTITY_MARKER}amp;`, "g"), "&amp;")
    .replace(new RegExp(`${ENTITY_MARKER}lt;`, "g"), "&lt;")
    .replace(new RegExp(`${ENTITY_MARKER}gt;`, "g"), "&gt;")
    .replace(new RegExp(`${ENTITY_MARKER}quot;`, "g"), "&quot;")
    .replace(new RegExp(`${ENTITY_MARKER}apos;`, "g"), "&apos;");
}

/**
 * Extract the root element name directly from the raw XML string
 */
export function extractRootElementName(xmlString: string): string {
  const rootElementMatch = xmlString.match(/<\s*([a-zA-Z_][\w\-.:]*)/);
  if (rootElementMatch && rootElementMatch[1]) {
    return rootElementMatch[1];
  }
  return "root";
}

/**
 * Parse XML string into an object with common metadata settings
 */
export async function parseMetadataXml(xmlString: string): Promise<XmlObject> {
  const parser = new xml2js.Parser({
    preserveChildrenOrder: false,
    explicitChildren: false,
    explicitArray: true,
    mergeAttrs: false,
    explicitRoot: false,
    trim: true,
    normalize: false,
    normalizeTags: false,
    attrkey: "$",
    charkey: "_",
    charsAsChildren: false
  });

  return parser.parseStringPromise(xmlString);
}

/**
 * Condense specified array elements to single-line format for better diff readability
 * Converts multi-line element blocks to single-line format
 * @param xmlString - The XML string to process
 * @param elementName - The element name to condense
 */
export function condenseElement(xmlString: string, elementName: string): string {
  // Match the element with its content, including newlines
  // Pattern: opening tag, content (with newlines), closing tag
  const pattern = new RegExp(`(<${elementName}>)([\\s\\S]*?)(<\\/${elementName}>)`, "g");

  return xmlString.replace(pattern, (match, openTag, content, closeTag) => {
    // Remove leading/trailing whitespace and collapse internal whitespace
    const condensedContent = content
      .replace(/>\s+</g, "><") // Remove whitespace between tags
      .replace(/^\s+|\s+$/g, ""); // Trim leading/trailing whitespace

    return `${openTag}${condensedContent}${closeTag}`;
  });
}

/**
 * Build XML output for metadata objects using the original structure as reference
 * @param obj - The XML object to build
 * @param originalXml - The original XML string for reference
 * @param filePath - Optional file path for applying condensed format rules
 */
export function buildMetadataXml(obj: XmlObject, originalXml: string, filePath?: string): string {
  let rootName = extractRootElementName(originalXml);

  if (rootName === "root") {
    const rootKeys = Object.keys(obj).filter((key) => key !== "$" && key !== "_");
    if (rootKeys.length > 0) {
      rootName = rootKeys[0];
    }
  }

  let outputObject = obj;
  if (filePath) {
    const formattingRule = getFormattingRule(filePath);
    const explicitClosingElements = formattingRule?.explicitClosingElements;
    if (explicitClosingElements && explicitClosingElements.length > 0) {
      const explicitPathPatterns = explicitClosingElements.map((pathValue) => splitPath(pathValue));
      outputObject = applyExplicitClosingElements(obj, [], explicitPathPatterns) as XmlObject;
    }
  }

  const builder = new xml2js.Builder({
    renderOpts: {
      pretty: true,
      indent: "    "
    },
    xmldec: {
      version: "1.0",
      encoding: "UTF-8",
      standalone: undefined
    },
    rootName,
    headless: false,
    attrkey: "$",
    charkey: "_",
    cdata: false,
    allowSurrogateChars: false
  });

  let xmlOutput = builder.buildObject(outputObject);
  xmlOutput = restoreXmlEntities(xmlOutput);
  xmlOutput = enforceExplicitClosingTags(xmlOutput);

  const escapedRootName = escapeRegExp(rootName);
  const selfClosingRootPattern = new RegExp(`^(<\\?xml[^>]*\\?>\\s*)<${escapedRootName}(\\b[^>]*)\\/>(\\s*)$`);
  xmlOutput = xmlOutput.replace(selfClosingRootPattern, `$1<${rootName}$2></${rootName}>$3`);

  if (filePath?.endsWith("object-meta.xml")) {
    xmlOutput = xmlOutput.replace(/<searchLayouts\s*\/>/g, "<searchLayouts></searchLayouts>");
  }

  // Apply condensed format for specified elements
  if (filePath) {
    const formattingRule = getFormattingRule(filePath);
    if (formattingRule?.condensedElements) {
      for (const elementName of formattingRule.condensedElements) {
        xmlOutput = condenseElement(xmlOutput, elementName);
      }
    }
  }

  if (!xmlOutput.endsWith("\n")) {
    xmlOutput += "\n";
  }

  return xmlOutput;
}
