/**
 * File: sanitize.ts
 *
 * Purpose:
 * Sanitize untrusted strings before rendering in extension UI.
 *
 * Responsibilities:
 * - Escape HTML entities for text display.
 * - Strip control characters from user-facing strings.
 *
 * Does not:
 * - Modify page DOM or persist data.
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes a string for safe text insertion into extension HTML.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * Removes control characters and truncates overly long strings.
 */
export function sanitizeDisplayText(value: string, maxLength = 500): string {
  const cleaned = value.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  return `${cleaned.slice(0, maxLength)}…`;
}

/**
 * Validates locator strings contain no script-like content for display.
 */
export function sanitizeLocatorForDisplay(locator: string): string {
  const trimmed = sanitizeDisplayText(locator, 1000);
  if (/javascript:/i.test(trimmed) || /<script/i.test(trimmed)) {
    return '[invalid locator]';
  }
  return trimmed;
}
