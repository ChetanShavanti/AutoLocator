/**
 * File: ratingPromptStorage.ts
 *
 * Purpose:
 * Persist rating prompt state locally.
 *
 * Responsibilities:
 * - Track successful analyses and user dismissals.
 *
 * Does not:
 * - Verify store ratings or call external APIs.
 */

import {
  RATING_PROMPT_MIN_ANALYSES,
  RATING_PROMPT_SNOOZE_DAYS,
  RATING_PROMPT_STORAGE_KEY,
} from '../shared/constants';

export interface RatingPromptState {
  successfulAnalysisCount: number;
  dismissedPermanently: boolean;
  markedAsRated: boolean;
  snoozedUntil: number | null;
}

const DEFAULT_STATE: RatingPromptState = {
  successfulAnalysisCount: 0,
  dismissedPermanently: false,
  markedAsRated: false,
  snoozedUntil: null,
};

/**
 * Returns true when the rating prompt should be shown.
 */
export function shouldShowRatingPrompt(state: RatingPromptState): boolean {
  if (state.dismissedPermanently || state.markedAsRated) {
    return false;
  }
  if (state.successfulAnalysisCount < RATING_PROMPT_MIN_ANALYSES) {
    return false;
  }
  if (state.snoozedUntil !== null && Date.now() < state.snoozedUntil) {
    return false;
  }
  return true;
}

/**
 * Loads rating prompt state from extension storage.
 */
export async function loadRatingPromptState(): Promise<RatingPromptState> {
  const result = await chrome.storage.local.get(RATING_PROMPT_STORAGE_KEY);
  const value = result[RATING_PROMPT_STORAGE_KEY];
  if (!isRatingPromptState(value)) {
    return { ...DEFAULT_STATE };
  }
  return value;
}

/**
 * Records a successful analysis and returns updated state.
 */
export async function recordSuccessfulAnalysis(): Promise<RatingPromptState> {
  const current = await loadRatingPromptState();
  const next: RatingPromptState = {
    ...current,
    successfulAnalysisCount: current.successfulAnalysisCount + 1,
  };
  await chrome.storage.local.set({ [RATING_PROMPT_STORAGE_KEY]: next });
  return next;
}

/**
 * Marks the user as having rated on the Chrome Web Store.
 */
export async function markRatedOnStore(): Promise<void> {
  const current = await loadRatingPromptState();
  await chrome.storage.local.set({
    [RATING_PROMPT_STORAGE_KEY]: {
      ...current,
      markedAsRated: true,
    },
  });
}

/**
 * Snoozes the rating prompt for a configured number of days.
 */
export async function snoozeRatingPrompt(): Promise<void> {
  const current = await loadRatingPromptState();
  const snoozedUntil = Date.now() + RATING_PROMPT_SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  await chrome.storage.local.set({
    [RATING_PROMPT_STORAGE_KEY]: {
      ...current,
      snoozedUntil,
    },
  });
}

/**
 * Permanently dismisses the rating prompt.
 */
export async function dismissRatingPromptPermanently(): Promise<void> {
  const current = await loadRatingPromptState();
  await chrome.storage.local.set({
    [RATING_PROMPT_STORAGE_KEY]: {
      ...current,
      dismissedPermanently: true,
    },
  });
}

function isRatingPromptState(value: unknown): value is RatingPromptState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.successfulAnalysisCount === 'number' &&
    typeof record.dismissedPermanently === 'boolean' &&
    typeof record.markedAsRated === 'boolean' &&
    (record.snoozedUntil === null || typeof record.snoozedUntil === 'number')
  );
}
