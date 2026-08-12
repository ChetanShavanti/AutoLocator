/**
 * File: options.ts
 *
 * Purpose:
 * Options page for persistent user preferences and permission documentation.
 *
 * Responsibilities:
 * - Load and save settings via chrome.storage.
 * - Display developer attribution and privacy links.
 *
 * Does not:
 * - Analyze pages or access tab content.
 */

import { DEVELOPER, openChromeWebStoreReviews } from '../shared/extensionMeta';
import { markRatedOnStore } from '../storage/ratingPromptStorage';
import { loadSettings, saveSettings } from '../storage/settingsStorage';
import type { UserSettings } from '../shared/types';

const languageSelect = document.getElementById('language') as HTMLSelectElement;
const locatorPreferenceSelect = document.getElementById('locatorPreference') as HTMLSelectElement;
const expandDropdownsInput = document.getElementById('expandDropdowns') as HTMLInputElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;

void init();

async function init(): Promise<void> {
  renderDeveloperSection();
  const settings = await loadSettings();
  languageSelect.value = settings.language;
  locatorPreferenceSelect.value = settings.locatorPreference;
  expandDropdownsInput.checked = settings.expandDropdowns;
  saveBtn.addEventListener('click', onSave);

  const rateBtn = document.getElementById('rateExtensionBtn');
  rateBtn?.addEventListener('click', () => {
    void markRatedOnStore().then(() => openChromeWebStoreReviews());
  });
}

function renderDeveloperSection(): void {
  const titleEl = document.getElementById('developerTitle');
  const summaryEl = document.getElementById('developerSummary');
  const highlightsEl = document.getElementById('developerHighlights');
  const linkedInEl = document.getElementById('developerLinkedIn') as HTMLAnchorElement;
  const githubEl = document.getElementById('developerGitHub') as HTMLAnchorElement;
  const privacyEl = document.getElementById('privacyLink') as HTMLAnchorElement;

  if (titleEl) {
    titleEl.textContent = `${DEVELOPER.title} · ${DEVELOPER.company} · ${DEVELOPER.location}`;
  }
  if (summaryEl) {
    summaryEl.textContent = DEVELOPER.summary;
  }
  if (highlightsEl) {
    highlightsEl.textContent = '';
    for (const highlight of DEVELOPER.highlights) {
      const item = document.createElement('li');
      item.textContent = highlight;
      highlightsEl.appendChild(item);
    }
  }
  if (linkedInEl) {
    linkedInEl.href = DEVELOPER.linkedInUrl;
  }
  if (githubEl) {
    githubEl.href = DEVELOPER.githubUrl;
  }
  if (privacyEl) {
    privacyEl.href = DEVELOPER.privacyPolicyUrl;
  }
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
