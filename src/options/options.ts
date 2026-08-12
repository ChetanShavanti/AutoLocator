/**
 * File: options.ts
 *
 * Purpose:
 * Options page for persistent user preferences and permission documentation.
 *
 * Responsibilities:
 * - Load and save settings via chrome.storage.
 *
 * Does not:
 * - Analyze pages or access tab content.
 */

import { loadSettings, saveSettings } from '../storage/settingsStorage';
import type { UserSettings } from '../shared/types';

const languageSelect = document.getElementById('language') as HTMLSelectElement;
const locatorPreferenceSelect = document.getElementById('locatorPreference') as HTMLSelectElement;
const expandDropdownsInput = document.getElementById('expandDropdowns') as HTMLInputElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;

void init();

async function init(): Promise<void> {
  const settings = await loadSettings();
  languageSelect.value = settings.language;
  locatorPreferenceSelect.value = settings.locatorPreference;
  expandDropdownsInput.checked = settings.expandDropdowns;
  saveBtn.addEventListener('click', onSave);
}

async function onSave(): Promise<void> {
  const settings: UserSettings = {
    language: languageSelect.value as UserSettings['language'],
    locatorPreference: locatorPreferenceSelect.value as UserSettings['locatorPreference'],
    ocrEnabled: false,
    expandDropdowns: expandDropdownsInput.checked,
  };

  try {
    await saveSettings(settings);
    statusEl.textContent = 'Settings saved.';
    statusEl.className = 'status';
  } catch {
    statusEl.textContent = 'Could not save settings.';
    statusEl.className = 'status error';
  }
}

export {};
