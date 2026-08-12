/**
 * File: ratingPrompt.ts
 *
 * Purpose:
 * Show an optional Chrome Web Store rating prompt in extension UI surfaces.
 *
 * Responsibilities:
 * - Render a dismissible banner after successful usage.
 * - Open the store reviews page on user action.
 *
 * Does not:
 * - Verify whether a rating was submitted.
 */

import { openChromeWebStoreReviews } from '../shared/extensionMeta';
import {
  dismissRatingPromptPermanently,
  loadRatingPromptState,
  markRatedOnStore,
  recordSuccessfulAnalysis,
  shouldShowRatingPrompt,
  snoozeRatingPrompt,
} from '../storage/ratingPromptStorage';

/**
 * Increments usage and shows the rating prompt when eligible.
 */
export async function maybeShowRatingPrompt(container: HTMLElement | null): Promise<void> {
  if (!container) {
    return;
  }

  const state = await recordSuccessfulAnalysis();
  if (!shouldShowRatingPrompt(state)) {
    hideRatingPrompt(container);
    return;
  }

  renderRatingPrompt(container);
}

/**
 * Shows the rating prompt on panel open when already eligible.
 */
export async function refreshRatingPrompt(container: HTMLElement | null): Promise<void> {
  if (!container) {
    return;
  }

  const state = await loadRatingPromptState();
  if (!shouldShowRatingPrompt(state)) {
    hideRatingPrompt(container);
    return;
  }

  renderRatingPrompt(container);
}

function renderRatingPrompt(container: HTMLElement): void {
  container.hidden = false;
  container.className = 'rating-prompt';
  container.textContent = '';

  const title = document.createElement('strong');
  title.textContent = 'Enjoying AutoLocator?';

  const text = document.createElement('p');
  text.className = 'rating-prompt-text';
  text.textContent = 'A quick Chrome Web Store rating helps other QA engineers discover this tool.';

  const actions = document.createElement('div');
  actions.className = 'rating-prompt-actions';

  const rateBtn = document.createElement('button');
  rateBtn.type = 'button';
  rateBtn.className = 'primary rating-rate-btn';
  rateBtn.textContent = 'Rate on Chrome Web Store';
  rateBtn.addEventListener('click', () => {
    void openStoreReviews(container);
  });

  const laterBtn = document.createElement('button');
  laterBtn.type = 'button';
  laterBtn.className = 'secondary';
  laterBtn.textContent = 'Maybe later';
  laterBtn.addEventListener('click', () => {
    void snoozeRatingPrompt().then(() => hideRatingPrompt(container));
  });

  const dismissBtn = document.createElement('button');
  dismissBtn.type = 'button';
  dismissBtn.className = 'secondary rating-dismiss-btn';
  dismissBtn.textContent = "Don't ask again";
  dismissBtn.addEventListener('click', () => {
    void dismissRatingPromptPermanently().then(() => hideRatingPrompt(container));
  });

  actions.append(rateBtn, laterBtn, dismissBtn);
  container.append(title, text, actions);
}

async function openStoreReviews(container: HTMLElement): Promise<void> {
  await markRatedOnStore();
  hideRatingPrompt(container);
  await openChromeWebStoreReviews();
}

function hideRatingPrompt(container: HTMLElement): void {
  container.hidden = true;
  container.textContent = '';
}
