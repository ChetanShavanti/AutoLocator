/**
 * File: serviceWorker.ts
 *
 * Purpose:
 * MV3 service worker for message routing, settings, and session cleanup.
 *
 * Responsibilities:
 * - Route validated messages.
 * - Clear per-tab session results when a tab is closed.
 *
 * Does not:
 * - Access page DOM or perform analysis directly.
 */

import { parseExtensionMessage } from '../security/messageValidator';
import { logInternalError } from '../security/safeLogger';
import { MESSAGE } from '../shared/messages';
import { clearTabResults } from '../storage/sessionResultsStorage';
import { loadSettings, saveSettings } from '../storage/settingsStorage';

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  void handleMessage(message, sendResponse);
  return true;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void clearTabResults(tabId);
});

async function handleMessage(
  payload: unknown,
  sendResponse: (response: unknown) => void,
): Promise<void> {
  const message = parseExtensionMessage(payload);
  if (!message) {
    sendResponse({ error: 'Invalid message' });
    return;
  }

  try {
    switch (message.type) {
      case MESSAGE.GET_SETTINGS: {
        const settings = await loadSettings();
        sendResponse(settings);
        return;
      }
      case MESSAGE.SAVE_SETTINGS: {
        await saveSettings(message.settings);
        sendResponse({ success: true });
        return;
      }
      default:
        sendResponse({ error: 'Unsupported message in service worker' });
    }
  } catch (error) {
    logInternalError('Service worker message handling failed', {
      type: message.type,
      error: error instanceof Error ? error.message : 'unknown',
    });
    sendResponse({ error: 'Internal error' });
  }
}

export {};
