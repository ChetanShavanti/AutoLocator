/**
 * File: safeLogger.ts
 *
 * Purpose:
 * Internal logging that avoids sensitive page data.
 *
 * Responsibilities:
 * - Log diagnostic messages without secrets or full page content.
 *
 * Does not:
 * - Log passwords, tokens, or sensitive field values.
 */

const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /cookie/i,
];

/**
 * Logs an internal error without page HTML or secrets.
 */
export function logInternalError(message: string, meta?: Record<string, unknown>): void {
  if (meta) {
    const safeMeta = redactMeta(meta);
    console.error(`[AutoLocator] ${message}`, safeMeta);
    return;
  }
  console.error(`[AutoLocator] ${message}`);
}

function redactMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))) {
      result[key] = '[redacted]';
      continue;
    }
    if (typeof value === 'string' && value.length > 120) {
      result[key] = `${value.slice(0, 120)}…`;
      continue;
    }
    result[key] = value;
  }
  return result;
}
