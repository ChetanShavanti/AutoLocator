/**
 * File: messageValidator.ts
 *
 * Purpose:
 * Validate extension messages at trust boundaries.
 *
 * Responsibilities:
 * - Reject unknown or malformed messages.
 * - Narrow unknown payloads to typed messages.
 *
 * Does not:
 * - Execute page logic or access DOM.
 */

import { MESSAGE, type ExtensionMessage } from '../shared/messages';
import type { LocatorPreference, OutputLanguage, UserSettings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';

const OUTPUT_LANGUAGES: OutputLanguage[] = ['java', 'python', 'typescript'];
const LOCATOR_PREFERENCES: LocatorPreference[] = ['css', 'xpath'];

/**
 * Validates and parses an unknown message payload.
 * Returns null when the message is invalid or unsupported.
 */
export function parseExtensionMessage(payload: unknown): ExtensionMessage | null {
  if (!isRecord(payload) || typeof payload.type !== 'string') {
    return null;
  }

  switch (payload.type) {
    case MESSAGE.ANALYZE_PAGE:
      return parseAnalyzePage(payload);
    case MESSAGE.GET_SETTINGS:
      return { type: MESSAGE.GET_SETTINGS };
    case MESSAGE.SAVE_SETTINGS:
      return parseSaveSettings(payload);
    default:
      return null;
  }
}

/**
 * Validates user settings object from storage or messages.
 */
export function parseUserSettings(value: unknown): UserSettings {
  if (!isRecord(value)) {
    return { ...DEFAULT_SETTINGS };
  }

  const language = OUTPUT_LANGUAGES.includes(value.language as OutputLanguage)
    ? (value.language as OutputLanguage)
    : DEFAULT_SETTINGS.language;

  const locatorPreference = LOCATOR_PREFERENCES.includes(
    value.locatorPreference as LocatorPreference,
  )
    ? (value.locatorPreference as LocatorPreference)
    : DEFAULT_SETTINGS.locatorPreference;

  return {
    language,
    locatorPreference,
    ocrEnabled: value.ocrEnabled === true,
    expandDropdowns: value.expandDropdowns !== false,
  };
}

function parseAnalyzePage(payload: Record<string, unknown>): ExtensionMessage | null {
  const settings = parseUserSettings(payload.settings);
  return { type: MESSAGE.ANALYZE_PAGE, settings };
}

function parseSaveSettings(payload: Record<string, unknown>): ExtensionMessage | null {
  const settings = parseUserSettings(payload.settings);
  return { type: MESSAGE.SAVE_SETTINGS, settings };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Returns true when analysis result payload has required safe shape.
 */
export function isValidAnalysisResult(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.pageTitle === 'string' &&
    typeof value.generatedCode === 'string' &&
    Array.isArray(value.elements) &&
    Array.isArray(value.sections)
  );
}
