/**
 * File: locatorOutputQuality.ts
 *
 * Purpose:
 * Decide whether a locator is useful enough for automation output.
 *
 * Responsibilities:
 * - Reject generic, non-unique, or duplicate-value locators.
 *
 * Does not:
 * - Generate candidates or access the DOM.
 */

import { isSuspiciousIdentifier } from './suspiciousDetector';

/** Bare tag or role-only selectors that never help automation. */
const GENERIC_LOCATOR_PATTERNS: RegExp[] = [
  /^a$/i,
  /^button$/i,
  /^input$/i,
  /^div$/i,
  /^span$/i,
  /^p$/i,
  /^label$/i,
  /^select$/i,
  /^textarea$/i,
  /^h[1-6]$/i,
  /^\[role="(link|button|textbox)"\]$/i,
  /^input\[type="(text|submit|button)"\]$/i,
];

const GENERIC_NAMES = new Set([
  'link',
  'a',
  'button',
  'input',
  'div',
  'span',
  'p',
  'label',
  'element',
  'select',
  'textarea',
  'clickable',
  'unknown',
]);

/**
 * Returns true when a locator string is too generic to be useful.
 */
export function isGenericLocator(locator: string): boolean {
  const normalized = locator.trim();
  return GENERIC_LOCATOR_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Returns true when a generated element name is too vague.
 */
export function isGenericName(name: string): boolean {
  return GENERIC_NAMES.has(name.toLowerCase());
}

/**
 * Returns true when a scored locator should appear in user output.
 */
export function isUsefulOutputLocator(locator: string, uniqueness: number): boolean {
  if (uniqueness < 1) {
    return false;
  }
  if (isGenericLocator(locator)) {
    return false;
  }
  if (isWeakLocator(locator)) {
    return false;
  }
  if (usesSuspiciousIdentifier(locator)) {
    return false;
  }
  return true;
}

/**
 * Returns true when a locator relies on a generated or unstable identifier.
 */
export function usesSuspiciousIdentifier(locator: string): boolean {
  const idMatch = locator.match(/[@#]id=["']([^"']+)["']|#([^\s.[\\]]+)/i);
  const idValue = idMatch?.[1] ?? idMatch?.[2] ?? '';
  if (idValue && isSuspiciousIdentifier(idValue)) {
    return true;
  }

  const classMatch = locator.match(/\.([^.\s[\]+]+)/);
  const classValue = classMatch?.[1] ?? '';
  if (classValue && isSuspiciousIdentifier(classValue)) {
    return true;
  }

  return false;
}

/**
 * Returns true when a tag+class locator is too vague to be useful.
 */
export function isWeakLocator(locator: string): boolean {
  const normalized = locator.trim();
  const tagClassMatch = normalized.match(/^([a-z]+)\.([a-z0-9_-]{1,8})$/i);
  if (!tagClassMatch) {
    return false;
  }
  const className = tagClassMatch[2];
  if (className.length <= 6 && !className.includes('-')) {
    return true;
  }
  return false;
}

/**
 * Returns true when a generated name/locator pair should be omitted from output.
 */
export function shouldSkipOutputEntry(name: string, locator: string): boolean {
  if (isGenericName(name) && (isGenericLocator(locator) || isWeakLocator(locator))) {
    return true;
  }
  if (isGenericName(name) && /^a\./i.test(locator)) {
    return true;
  }
  return false;
}

/**
 * Picks the better of two locators sharing the same selector string.
 */
export function preferLocator(
  current: { name: string; elementType: string },
  candidate: { name: string; elementType: string },
): boolean {
  if (isGenericName(current.name) && !isGenericName(candidate.name)) {
    return true;
  }
  if (current.name.length < candidate.name.length && !isGenericName(candidate.name)) {
    return true;
  }
  return false;
}
