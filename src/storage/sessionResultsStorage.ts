/**
 * File: sessionResultsStorage.ts
 *
 * Purpose:
 * Temporary per-tab analysis results using chrome.storage.session.
 *
 * Responsibilities:
 * - Save, load, and clear locator results keyed by tab ID.
 *
 * Does not:
 * - Persist results across browser restarts (session storage clears on exit).
 * - Store page HTML or sensitive content beyond locator output.
 */

import type { AnalysisResult } from '../shared/types';

export const TAB_RESULTS_PREFIX = 'autolocator_tab_';

export interface CachedTabResults {
  result: AnalysisResult;
  url: string;
  savedAt: number;
}

/**
 * Builds the session storage key for a browser tab.
 */
export function tabResultsKey(tabId: number): string {
  return `${TAB_RESULTS_PREFIX}${tabId}`;
}

/**
 * Saves analysis results for the given tab.
 */
export async function saveTabResults(
  tabId: number,
  result: AnalysisResult,
  url: string,
): Promise<void> {
  const payload: CachedTabResults = {
    result,
    url,
    savedAt: Date.now(),
  };
  await chrome.storage.session.set({ [tabResultsKey(tabId)]: payload });
}

/**
 * Loads cached analysis results for the given tab, if any.
 */
export async function loadTabResults(tabId: number): Promise<CachedTabResults | null> {
  const key = tabResultsKey(tabId);
  const stored = await chrome.storage.session.get(key);
  const cached = stored[key];
  if (!cached || typeof cached !== 'object') {
    return null;
  }
  return cached as CachedTabResults;
}

/**
 * Removes cached analysis results for the given tab.
 */
export async function clearTabResults(tabId: number): Promise<void> {
  await chrome.storage.session.remove(tabResultsKey(tabId));
}
