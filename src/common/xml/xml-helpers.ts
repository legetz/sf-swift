/**
 * Shared XML helper utilities for metadata processing
 */

import * as xml2js from "xml2js";
import { getFormattingRule } from "./sorting-rules.js";

export interface XmlObject {
  [key: string]: any;
}

const ENTITY_MARKER = "___ENTITY_MARKER___";

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

  let xmlOutput = builder.buildObject(obj);
  xmlOutput = restoreXmlEntities(xmlOutput);

  const escapedRootName = escapeRegExp(rootName);
  const selfClosingRootPattern = new RegExp(`^(<\\?xml[^>]*\\?>\\s*)<${escapedRootName}(\\b[^>]*)\\/>(\\s*)$`);
  xmlOutput = xmlOutput.replace(selfClosingRootPattern, `$1<${rootName}$2></${rootName}>$3`);

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
