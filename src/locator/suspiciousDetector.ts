/**
 * File: suspiciousDetector.ts
 *
 * Purpose:
 * Detect potentially generated or unstable identifiers.
 *
 * Responsibilities:
 * - Flag suspicious IDs, classes, and tokens using heuristics.
 *
 * Does not:
 * - Reject candidates outright; scoring uses these signals.
 */

const HASH_LIKE = /^[a-f0-9]{8,}$/i;
const RANDOM_SUFFIX = /[_-][a-z0-9]{5,}$/i;
const CSS_IN_JS = /^(css|sc|jsx|emotion)-[a-z0-9]+$/i;
const REACT_ARIA = /^:r\d+:$|^react-aria/i;
const NUMERIC_TAIL = /\d{3,}/;
const LONG_NUMERIC_RUN = /\d{8,}/;
const GENERATED_FIELD_PREFIX = /^(zp_|field_|outer_|ember|react-|mui-|ng-)/i;
const NUMERIC_SUFFIX = /[_-]\d{6,}$/;
const USER_VALUE_PATTERN = /^[A-Z]{0,3}\d+[_-].+[_-].+/i;

/**
 * Returns true when an identifier appears auto-generated or unstable.
 */
export function isSuspiciousIdentifier(value: string): boolean {
  if (!value || value.length < 2) {
    return false;
  }

  const normalized = value.trim();
  if (HASH_LIKE.test(normalized)) {
    return true;
  }
  if (CSS_IN_JS.test(normalized)) {
    return true;
  }
  if (REACT_ARIA.test(normalized)) {
    return true;
  }
  if (RANDOM_SUFFIX.test(normalized) && normalized.length > 8) {
    return true;
  }
  if (normalized.includes('ember') && NUMERIC_TAIL.test(normalized)) {
    return true;
  }
  if (/^mui-|^Mui|^chakra-|^ant-|^ng-/.test(normalized)) {
    return true;
  }
  if (LONG_NUMERIC_RUN.test(normalized)) {
    return true;
  }
  if (GENERATED_FIELD_PREFIX.test(normalized)) {
    return true;
  }
  if (NUMERIC_SUFFIX.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Returns true when text looks like a user-entered value, not a UI label.
 */
export function isUserEnteredValue(text: string): boolean {
  if (!text || text.length < 3) {
    return false;
  }
  const normalized = text.trim();
  if (USER_VALUE_PATTERN.test(normalized)) {
    return true;
  }
  if (isSuspiciousIdentifier(normalized)) {
    return true;
  }
  if (/\d{6,}/.test(normalized) && normalized.includes('_')) {
    return true;
  }
  return false;
}

/**
 * Returns true when a class list appears dominated by generated tokens.
 */
export function hasSuspiciousClasses(classes: string[]): boolean {
  if (classes.length === 0) {
    return false;
  }
  const suspiciousCount = classes.filter(isSuspiciousIdentifier).length;
  return suspiciousCount / classes.length >= 0.5;
}
