/**
 * File: serviceWorker.ts
 *
 * Purpose:
 * MV3 service worker for extension lifecycle and session cleanup.
 *
 * Responsibilities:
 * - Configure side panel behavior on install.
 * - Clear per-tab session results when a tab is closed.
 *
 * Does not:
 * - Access page DOM or perform analysis directly.
 */

import { clearTabResults } from '../storage/sessionResultsStorage';

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void clearTabResults(tabId);
});

export {};
