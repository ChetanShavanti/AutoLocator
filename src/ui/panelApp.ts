/**
 * File: panelApp.ts
 *
 * Purpose:
 * Shared UI logic for popup and side panel surfaces.
 *
 * Responsibilities:
 * - Settings, analysis trigger, results display, and session restore.
 *
 * Does not:
 * - Perform DOM analysis directly.
 */

import { escapeHtml, sanitizeDisplayText, sanitizeLocatorForDisplay } from '../security/sanitize';
import type { AnalysisResult, NamedLocator, UserSettings } from '../shared/types';
import {
  clearTabResults,
  loadTabResults,
  saveTabResults,
} from '../storage/sessionResultsStorage';
import { loadSettings, saveSettings } from '../storage/settingsStorage';

export interface PanelAppOptions {
  showPinButton?: boolean;
}

/**
 * Initializes the AutoLocator panel UI in the current document.
 */
export async function initPanelApp(options: PanelAppOptions = {}): Promise<void> {
  const languageSelect = document.getElementById('language') as HTMLSelectElement;
  const locatorPreferenceSelect = document.getElementById('locatorPreference') as HTMLSelectElement;
  const analyzeBtn = document.getElementById('analyzeBtn') as HTMLButtonElement;
  const copyAllBtn = document.getElementById('copyAllBtn') as HTMLButtonElement;
  const clearBtn = document.getElementById('clearBtn') as HTMLButtonElement;
  const filterInput = document.getElementById('filterInput') as HTMLInputElement;
  const statusEl = document.getElementById('status') as HTMLDivElement;
  const resultsEl = document.getElementById('results') as HTMLDivElement;
  const optionsLink = document.getElementById('optionsLink') as HTMLAnchorElement;
  const pinBtn = document.getElementById('pinBtn') as HTMLButtonElement | null;
  const expandDropdownsInput = document.getElementById('expandDropdowns') as HTMLInputElement | null;

  let currentResult: AnalysisResult | null = null;
  let currentTabId: number | null = null;

  optionsLink.addEventListener('click', (event) => {
    event.preventDefault();
    void chrome.runtime.openOptionsPage();
  });

  const settings = await loadSettings();
  applySettingsToForm(settings, languageSelect, locatorPreferenceSelect, expandDropdownsInput);

  languageSelect.addEventListener('change', onSettingsChanged);
  locatorPreferenceSelect.addEventListener('change', onSettingsChanged);
  if (expandDropdownsInput) {
    expandDropdownsInput.addEventListener('change', onSettingsChanged);
  }
  analyzeBtn.addEventListener('click', onAnalyze);
  copyAllBtn.addEventListener('click', onCopyAll);
  clearBtn.addEventListener('click', onClear);
  filterInput.addEventListener('input', onFilter);

  if (options.showPinButton && pinBtn) {
    pinBtn.hidden = false;
    pinBtn.addEventListener('click', onPinPanel);
  } else if (pinBtn) {
    pinBtn.hidden = true;
  }

  await restoreResultsForActiveTab();

  async function restoreResultsForActiveTab(): Promise<void> {
    const tab = await getActiveTab();
    if (!tab?.id) {
      return;
    }

    currentTabId = tab.id;
    const cached = await loadTabResults(tab.id);
    if (!cached?.result) {
      showEmptyResults(resultsEl);
      setStatus(statusEl, 'Analyze the page to generate locators.', '');
      return;
    }

    currentResult = cached.result;
    renderResults(resultsEl, cached.result);
    copyAllBtn.disabled = !cached.result.generatedCode;
    clearBtn.disabled = false;
    setStatus(statusEl, `Restored ${cached.result.elements.length} locator(s) for this tab.`, 'success');
  }

  async function onSettingsChanged(): Promise<void> {
    await saveSettings(readSettingsFromForm(languageSelect, locatorPreferenceSelect, expandDropdownsInput));
  }

  async function onAnalyze(): Promise<void> {
    setStatus(statusEl, 'Analyzing visible UI (expanding dropdowns when enabled)...', 'loading');
    analyzeBtn.disabled = true;
    copyAllBtn.disabled = true;
    clearBtn.disabled = true;
    resultsEl.textContent = '';

    try {
      const settings = readSettingsFromForm(languageSelect, locatorPreferenceSelect, expandDropdownsInput);
      await saveSettings(settings);

      const tab = await getActiveTab();
      if (!tab?.id || !tab.url || isUnsupportedUrl(tab.url)) {
        throw new Error('This page cannot be analyzed. Open a regular web page and try again.');
      }

      currentTabId = tab.id;

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/pageAnalyzer.js'],
      });

      const [injection] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async (userSettings: UserSettings) => {
          const analyze = window.__autoLocatorAnalyze;
          if (!analyze) {
            throw new Error('Analyzer failed to load');
          }
          return analyze(userSettings);
        },
        args: [settings],
      });

      const result = injection?.result as AnalysisResult | undefined;
      if (!result) {
        throw new Error('Analysis did not return results');
      }

      currentResult = result;
      await saveTabResults(tab.id, result, tab.url);
      renderResults(resultsEl, result);
      copyAllBtn.disabled = !result.generatedCode;
      clearBtn.disabled = false;

      if (result.elements.length === 0) {
        setStatus(statusEl, 'No actionable elements found on this page.', 'success');
      } else {
        setStatus(statusEl, `Found ${result.elements.length} actionable elements.`, 'success');
      }
    } catch (error) {
      currentResult = null;
      resultsEl.innerHTML = `<div class="empty-state">${escapeHtml(getSafeErrorMessage(error))}</div>`;
      setStatus(statusEl, getSafeErrorMessage(error), 'error');
      copyAllBtn.disabled = true;
      clearBtn.disabled = true;
    } finally {
      analyzeBtn.disabled = false;
    }
  }

  async function onClear(): Promise<void> {
    const tabId = currentTabId ?? (await getActiveTab())?.id;
    if (tabId !== undefined && tabId !== null) {
      await clearTabResults(tabId);
    }

    currentResult = null;
    filterInput.value = '';
    showEmptyResults(resultsEl);
    copyAllBtn.disabled = true;
    clearBtn.disabled = true;
    setStatus(statusEl, 'Results cleared for this tab.', 'success');
  }

  async function onCopyAll(): Promise<void> {
    if (!currentResult?.generatedCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentResult.generatedCode);
      setStatus(statusEl, 'Copied all locators to clipboard.', 'success');
    } catch {
      setStatus(statusEl, 'Could not copy to clipboard.', 'error');
    }
  }

  async function onPinPanel(): Promise<void> {
    const tab = await getActiveTab();
    if (!tab?.windowId) {
      return;
    }

    await chrome.sidePanel.open({ windowId: tab.windowId });
    window.close();
  }

  function onFilter(): void {
    const query = filterInput.value.trim().toLowerCase();
    const items = resultsEl.querySelectorAll('.result-item, .section-title');

    if (!query) {
      items.forEach((el) => {
        (el as HTMLElement).style.display = '';
      });
      return;
    }

    items.forEach((el) => {
      if (el.classList.contains('section-title')) {
        (el as HTMLElement).style.display = '';
        return;
      }
      const htmlEl = el as HTMLElement;
      const visible =
        (htmlEl.dataset.name?.includes(query) ?? false) ||
        (htmlEl.dataset.section?.includes(query) ?? false) ||
        (htmlEl.dataset.type?.includes(query) ?? false);
      htmlEl.style.display = visible ? '' : 'none';
    });
  }
}

function applySettingsToForm(
  settings: UserSettings,
  languageSelect: HTMLSelectElement,
  locatorPreferenceSelect: HTMLSelectElement,
  expandDropdownsInput: HTMLInputElement | null,
): void {
  languageSelect.value = settings.language;
  locatorPreferenceSelect.value = settings.locatorPreference;
  if (expandDropdownsInput) {
    expandDropdownsInput.checked = settings.expandDropdowns;
  }
}

function readSettingsFromForm(
  languageSelect: HTMLSelectElement,
  locatorPreferenceSelect: HTMLSelectElement,
  expandDropdownsInput: HTMLInputElement | null,
): UserSettings {
  return {
    language: languageSelect.value as UserSettings['language'],
    locatorPreference: locatorPreferenceSelect.value as UserSettings['locatorPreference'],
    ocrEnabled: false,
    expandDropdowns: expandDropdownsInput?.checked ?? true,
  };
}

function showEmptyResults(resultsEl: HTMLElement): void {
  resultsEl.innerHTML =
    '<div class="empty-state">No locators yet. Click Analyze Page to generate locators.</div>';
}

function renderResults(resultsEl: HTMLElement, result: AnalysisResult): void {
  resultsEl.textContent = '';

  if (result.elements.length === 0) {
    resultsEl.innerHTML = '<div class="empty-state">No actionable elements found on this page.</div>';
    return;
  }

  for (const section of result.sections) {
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'section-title';
    sectionTitle.textContent = sanitizeDisplayText(section.title);
    sectionTitle.dataset.section = section.title.toLowerCase();
    resultsEl.appendChild(sectionTitle);

    for (const locator of section.locators) {
      resultsEl.appendChild(createResultItem(locator));
    }
  }
}

function createResultItem(locator: NamedLocator): HTMLElement {
  const item = document.createElement('article');
  item.className = 'result-item';
  item.dataset.name = locator.name.toLowerCase();
  item.dataset.section = locator.section.toLowerCase();
  item.dataset.type = locator.elementType.toLowerCase();

  const nameRow = document.createElement('div');
  nameRow.className = 'result-name';
  nameRow.textContent = sanitizeDisplayText(locator.name);
  if (locator.isRisky) {
    const badge = document.createElement('span');
    badge.className = 'risk-badge';
    badge.textContent = 'Risky';
    nameRow.appendChild(badge);
  }

  const meta = document.createElement('div');
  meta.className = 'result-meta';
  meta.textContent = sanitizeDisplayText(locator.elementType);

  const locatorEl = document.createElement('div');
  locatorEl.className = 'result-locator';
  locatorEl.textContent = sanitizeLocatorForDisplay(locator.locator);

  item.append(nameRow, meta, locatorEl);

  if (locator.alternative) {
    const alt = document.createElement('div');
    alt.className = 'result-alt';
    alt.textContent = `Alternative: ${sanitizeLocatorForDisplay(locator.alternative)}`;
    item.appendChild(alt);
  }

  return item;
}

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function setStatus(
  statusEl: HTMLElement,
  message: string,
  kind: 'loading' | 'success' | 'error' | '' = '',
): void {
  statusEl.textContent = sanitizeDisplayText(message);
  statusEl.className = `status${kind ? ` ${kind}` : ''}`;
}

function isUnsupportedUrl(url: string): boolean {
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('devtools://')
  );
}

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Cannot access')) {
      return 'Cannot access this page. Try a standard website.';
    }
    return sanitizeDisplayText(error.message, 200);
  }
  return 'Analysis failed. Please try again.';
}
