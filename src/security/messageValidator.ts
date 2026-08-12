/**
 * File: messageValidator.ts
 *
 * Purpose:
 * Validate extension settings at trust boundaries.
 *
 * Responsibilities:
 * - Parse and sanitize user settings from storage.
 *
 * Does not:
 * - Execute page logic or access DOM.
 */

import type { LocatorPreference, OutputLanguage, UserSettings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';

const OUTPUT_LANGUAGES: OutputLanguage[] = ['java', 'python', 'typescript'];
const LOCATOR_PREFERENCES: LocatorPreference[] = ['css', 'xpath'];

/**
 * Validates user settings object from storage.
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
