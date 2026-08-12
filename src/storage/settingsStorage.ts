/**
 * File: settingsStorage.ts
 *
 * Purpose:
 * Persist user settings via chrome.storage.local.
 *
 * Responsibilities:
 * - Load and save language, locator preference, and UI settings.
 *
 * Does not:
 * - Store page content or analysis results.
 */

import { SETTINGS_STORAGE_KEY } from '../shared/constants';
import { parseUserSettings } from '../security/messageValidator';
import { DEFAULT_SETTINGS, type UserSettings } from '../shared/types';

/**
 * Loads user settings from extension storage.
 */
export async function loadSettings(): Promise<UserSettings> {
  const result = await chrome.storage.local.get(SETTINGS_STORAGE_KEY);
  return parseUserSettings(result[SETTINGS_STORAGE_KEY]);
}

/**
 * Saves user settings to extension storage.
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settings });
}

/**
 * Returns default settings when storage is empty.
 */
export function getDefaultSettings(): UserSettings {
  return { ...DEFAULT_SETTINGS };
}
