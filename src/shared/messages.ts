/**
 * File: messages.ts
 *
 * Purpose:
 * Typed message contracts between popup, background, and content script.
 *
 * Responsibilities:
 * - Define message type constants and payload shapes.
 *
 * Does not:
 * - Perform validation (see security/messageValidator.ts).
 */

import type { AnalysisResult, UserSettings } from './types';

export const MESSAGE = {
  ANALYZE_PAGE: 'ANALYZE_PAGE',
  ANALYSIS_COMPLETE: 'ANALYSIS_COMPLETE',
  ANALYSIS_ERROR: 'ANALYSIS_ERROR',
  GET_SETTINGS: 'GET_SETTINGS',
  SAVE_SETTINGS: 'SAVE_SETTINGS',
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
} as const;

export type MessageType = (typeof MESSAGE)[keyof typeof MESSAGE];

export interface AnalyzePageMessage {
  type: typeof MESSAGE.ANALYZE_PAGE;
  settings: UserSettings;
}

export interface AnalysisCompleteMessage {
  type: typeof MESSAGE.ANALYSIS_COMPLETE;
  result: AnalysisResult;
}

export interface AnalysisErrorMessage {
  type: typeof MESSAGE.ANALYSIS_ERROR;
  error: { code: string; message: string };
}

export interface GetSettingsMessage {
  type: typeof MESSAGE.GET_SETTINGS;
}

export interface SaveSettingsMessage {
  type: typeof MESSAGE.SAVE_SETTINGS;
  settings: UserSettings;
}

export interface SettingsUpdatedMessage {
  type: typeof MESSAGE.SETTINGS_UPDATED;
  settings: UserSettings;
}

export type ExtensionMessage =
  | AnalyzePageMessage
  | AnalysisCompleteMessage
  | AnalysisErrorMessage
  | GetSettingsMessage
  | SaveSettingsMessage
  | SettingsUpdatedMessage;

export type MessageResponse =
  | AnalysisResult
  | UserSettings
  | { success: boolean }
  | { error: string };
