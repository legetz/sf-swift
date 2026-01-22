/**
 * XML Sorting utilities for Salesforce metadata files
 */

import { getFormattingRule, sortKeysWithPriority, getArraySortConfig, isGlobalUnsortedArray } from "./sorting-rules.js";

interface XmlObject {
  [key: string]: any;
}

/**
 * Sort array elements by configured sort keys or auto-detected keys (case-sensitive)
 * @param arr - Array to sort
 * @param arrayKey - The parent key name of the array
 * @param sortedByElements - Optional keys to use for sorting (from file-specific sortedByElements config)
 */
export function sortArrayElements(arr: any[], arrayKey: string, sortedByElements?: string[]): any[] {
  // Get global array-specific sort configuration
  const arraySortConfig = getArraySortConfig(arrayKey);

  return arr.sort((a, b) => {
    let valueA = "";
    let valueB = "";

    // If file-specific sortedByElements is specified, use it first
    if (sortedByElements && sortedByElements.length > 0) {
      for (const sortKey of sortedByElements) {
        if (a[sortKey] !== undefined) {
          valueA = a[sortKey]?.[0] || "";
          valueB = b[sortKey]?.[0] || "";
          break;
        }
      }
    }
    // Use global array-specific sort configuration if available
    else if (arraySortConfig) {
      for (const sortKey of arraySortConfig.sortKeys) {
        if (a[sortKey] !== undefined) {
          valueA = a[sortKey]?.[0] || "";
          valueB = b[sortKey]?.[0] || "";
          break;
        }
      }
    }
    // For other arrays, try to find a suitable sorting key automatically
    else if (typeof a === "object" && a !== null) {
      const keys = Object.keys(a);
      if (keys.length > 0) {
        const sortKey =
          keys.find((k) => k === "name" || k === "fullName" || k === "field" || k.includes("Name")) || keys[0];
        valueA = a[sortKey]?.[0] || "";
        valueB = b[sortKey]?.[0] || "";
      }
    }

    // Case-sensitive comparison: uppercase before lowercase
    if (valueA < valueB) return -1;
    if (valueA > valueB) return 1;
    return 0;
  });
}

/**
 * Recursively sort XML object elements alphabetically with special handling for SF metadata
 * Uses case-sensitive sorting where uppercase letters sort before lowercase
 * @param obj - The object to sort
 * @param parentKey - The parent key for context-aware sorting
 * @param filePath - Optional file path to apply file-specific sorting rules
 * @param parentObj - Optional parent object to check for context (e.g., sorted flag)
 */
export function sortXmlElements(obj: any, parentKey?: string, filePath?: string, parentObj?: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    // Get formatting rule for this file if available
    const formattingRule = getFormattingRule(filePath);

    // Check if this array should remain unsorted (file-specific rule)
    if (parentKey && formattingRule?.unsortedArrays?.includes(parentKey)) {
      // Don't sort the array, but still recursively process each item
      return obj.map((item) => sortXmlElements(item, undefined, filePath, obj));
    }

    // Check if this array should remain unsorted (global rule)
    if (parentKey && isGlobalUnsortedArray(parentKey)) {
      // Don't sort the array, but still recursively process each item
      return obj.map((item) => sortXmlElements(item, undefined, filePath, obj));
    }

    // Skip sorting for 'value' elements inside valueSetDefinition when sorted flag exists
    if (parentKey === "value" && parentObj && parentObj.sorted && Array.isArray(parentObj.sorted)) {
      // Don't sort the array, but still recursively process each item
      return obj.map((item) => sortXmlElements(item, undefined, filePath, obj));
    }

    // Handle arrays with appropriate sorting
    if (parentKey && obj.length > 0 && typeof obj[0] === "object") {
      // Use sortedByElements from file-specific config if available
      const sortedByElements = formattingRule?.sortedByElements;
      const sorted = sortArrayElements(obj, parentKey, sortedByElements);
      return sorted.map((item) => sortXmlElements(item, undefined, filePath, obj));
    }

    // For other arrays, just recursively sort elements
    return obj.map((item) => sortXmlElements(item, undefined, filePath, obj));
  }

  if (typeof obj === "object") {
    const sortedObj: XmlObject = {};

    // Get formatting rule for this file if available
    const formattingRule = getFormattingRule(filePath);

    // Get all keys and sort them with priority rules if applicable
    const keys = Object.keys(obj);
    const sortedKeys = sortKeysWithPriority(keys, formattingRule?.elementPriority);

    // Rebuild object with sorted keys, passing current object as parent
    for (const key of sortedKeys) {
      sortedObj[key] = sortXmlElements(obj[key], key, filePath, obj);
    }

    return sortedObj;
  }

  return obj;
}
